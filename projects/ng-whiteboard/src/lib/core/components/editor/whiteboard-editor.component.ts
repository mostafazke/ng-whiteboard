import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  Signal,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SvgService } from '../../svg/svg.service';
import { ToolType } from '../../types';
import { canCopyImage } from '../../utils/dom/clipboard';
import { isEditableTarget } from '../../utils/dom/is-editable-target';
import { EditorLayout, layoutFor } from './editor-layout';
import { EditorStateService } from './editor-state.service';
import { IconComponent } from './icon/icon.component';
import { ControlsPanelComponent } from './panels/controls-panel/controls-panel.component';
import { HeaderPanelComponent } from './panels/header-panel/header-panel.component';
import { HistoryPanelComponent } from './panels/history-panel/history-panel.component';
import { LayerPanelAction, LayerPanelComponent } from './panels/layer-panel/layer-panel.component';
import { PropertiesPanelComponent } from './panels/properties-panel/properties-panel.component';
import { ToolbarComponent } from './panels/toolbar/toolbar.component';
import { BottomSheetComponent } from './ui/bottom-sheet/bottom-sheet.component';
import { ConfirmDialogComponent } from './ui/confirm-dialog/confirm-dialog.component';
import { DialogComponent } from './ui/dialog/dialog.component';
import { ExportDialogComponent } from './ui/export-dialog/export-dialog.component';
import { MenuComponent } from './ui/menu/menu.component';
import { AlignmentType } from './utils/alignment';
import {
  buildMainMenu,
  CONFIRM_COPY,
  ConfirmKind,
  isMacPlatform,
  MainMenuActionId,
  ZOOM_ACTIONS,
  ZoomActionId,
} from './utils/editor-actions';
import { matchFileShortcut } from './utils/editor-shortcuts';
import { toWhiteboardLayers } from './utils/whiteboard-layers';

function isCanvasKey(event: KeyboardEvent): boolean {
  if (event.code === 'Space' || event.key === 'Delete' || event.key === 'Backspace') return true;
  if (event.key.startsWith('Arrow')) return true;
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

@Component({
  selector: 'ng-whiteboard-editor',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    HeaderPanelComponent,
    HistoryPanelComponent,
    PropertiesPanelComponent,
    ToolbarComponent,
    ControlsPanelComponent,
    BottomSheetComponent,
    LayerPanelComponent,
    MenuComponent,
    DialogComponent,
    ExportDialogComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './whiteboard-editor.component.html',
  styleUrl: './whiteboard-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [EditorStateService],
})
export class WhiteboardEditorComponent {
  public editorStateService = inject(EditorStateService);
  private svgService = inject(SvgService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private root = viewChild.required<ElementRef<HTMLElement>>('root');
  private fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  /** A shortcut can reach both the root keydown binding and the board's keyDown$; act on each event once. */
  private readonly handledPanelShortcuts = new WeakSet<KeyboardEvent>();
  /** `null` until the container is first measured, so neither the floating panel nor a sheet flashes in. */
  private layoutState = signal<EditorLayout | null>(null);
  readonly layout: Signal<EditorLayout | null> = this.layoutState.asReadonly();
  readonly isMeasured = computed(() => this.layout() !== null);
  readonly isCompact = computed(() => this.layout() === 'compact');

  configSignal = this.editorStateService.getConfigSignal();
  editorConfigSignal = this.editorStateService.getEditorConfigSignal();
  themeSignal = this.editorStateService.themeSignal;
  toolLockedSignal = this.editorStateService.toolLockedSignal;
  readonly toolbarPosition = computed(() =>
    this.configSignal().toolbarPosition === 'left' && !this.isCompact() ? 'left' : 'bottom'
  );
  isPanelOpenSignal = signal(true);
  showLayersDropdownSignal = signal(false);
  showZoomPopupSignal = signal(false);
  propertiesSheetOpenSignal = signal(false);
  menuSheetOpenSignal = signal(false);
  sheetOpenerSignal = signal<HTMLElement | null>(null);
  exportDialogOpen = signal(false);
  confirmKind = signal<ConfirmKind | null>(null);
  readonly confirmCopy = CONFIRM_COPY;
  readonly zoomActions = ZOOM_ACTIONS;

  selectedElementsSignal = this.editorStateService.selectedElementsSignal;
  selectedToolSignal = this.editorStateService.selectedToolSignal;
  statusMessageSignal = this.editorStateService.statusMessage;
  saveStateSignal = this.editorStateService.saveState;
  fileNameSignal = this.editorStateService.fileName;
  layersSignal = this.editorStateService.layersSignal;
  activeLayerIdSignal = this.editorStateService.activeLayerIdSignal;
  hasSelectionSignal = this.editorStateService.hasSelectionSignal;
  canUndoSignal = this.editorStateService.canUndoSignal;
  canRedoSignal = this.editorStateService.canRedoSignal;
  selectedPropertiesSignal = this.editorStateService.selectedPropertiesSignal;
  whiteboardLayersSignal = computed(() => toWhiteboardLayers(this.layersSignal()));
  mainMenuItems = computed(() =>
    buildMainMenu({
      theme: this.themeSignal(),
      canCopyImage: canCopyImage(),
      mac: isMacPlatform(),
      canSaveInPlace: this.editorStateService.canSaveInPlace,
    })
  );

  constructor() {
    this.svgService.keyDown$.pipe(takeUntilDestroyed()).subscribe((event) => this.handleShortcut(event));
    afterNextRender(() => this.observeSize());
    effect(() => {
      if (!this.showLayersDropdownSignal()) untracked(() => this.editorStateService.endLayerOpacityEdit());
    });
  }

  private observeSize() {
    const el = this.root().nativeElement;
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) this.setLayout(rect.width, rect.height);
    if (typeof ResizeObserver === 'undefined') {
      if (!this.isMeasured()) this.layoutState.set('wide');
      return;
    }
    const observer = new ResizeObserver(([entry]) => this.setLayout(entry.contentRect.width, entry.contentRect.height));
    observer.observe(el);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private setLayout(width: number, height: number) {
    const next = layoutFor(width, height);
    if (next === this.layoutState()) return;
    this.layoutState.set(next);
    this.closeSheets();
    this.keepFocusInEditor();
  }

  /**
   * A layout switch removes the focused control (a sheet, its opener, the floating panel); keep focus in the
   * editor when it fell to the body, but never take it back from wherever the host page moved it.
   */
  private keepFocusInEditor() {
    const root = this.root().nativeElement;
    const doc = root.ownerDocument;
    if (!root.contains(doc.activeElement)) return;
    afterNextRender(
      () => {
        if (!doc.activeElement || doc.activeElement === doc.body) root.focus({ preventScroll: true });
      },
      { injector: this.injector }
    );
  }

  private rememberOpener(opener?: HTMLElement | null) {
    this.sheetOpenerSignal.set(opener ?? null);
  }

  private closeSheets() {
    this.editorStateService.endLayerOpacityEdit();
    this.propertiesSheetOpenSignal.set(false);
    this.menuSheetOpenSignal.set(false);
    this.showLayersDropdownSignal.set(false);
    this.showZoomPopupSignal.set(false);
  }

  /**
   * Keys typed into editor controls must not reach the board's window-level shortcuts: text fields
   * keep every key, other controls keep the keys the canvas would act on (Space, Delete/Backspace,
   * arrows, unmodified printable keys). Modified chords such as Alt+P still pass through, and so does
   * every key on the root itself, which only holds focus as a fallback.
   */
  containKey(event: KeyboardEvent) {
    if (event.target === event.currentTarget) return;
    if (isEditableTarget(event.target) || isCanvasKey(event)) event.stopPropagation();
  }

  private targetsAnotherBoard(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    const board = target.closest('ng-whiteboard');
    return board !== null && board !== this.root().nativeElement.closest('ng-whiteboard');
  }

  /** Alt+P toggles the properties panel; Ctrl/Cmd+O, S, Shift+S, Shift+E and Shift+C run the file actions of the focused board. */
  handleShortcut(event: KeyboardEvent) {
    if (this.handledPanelShortcuts.has(event)) return;
    this.handledPanelShortcuts.add(event);
    if (isEditableTarget(event.target) || this.targetsAnotherBoard(event)) return;

    if (event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyP') {
      event.preventDefault();
      this.togglePanel();
      return;
    }
    const action = matchFileShortcut(event);
    if (!action) return;
    event.preventDefault();
    if (this.exportDialogOpen() || this.confirmKind()) return;
    if (action === 'copy-png' && !canCopyImage()) return;
    this.rememberOpener(null);
    this.runMenuAction(action);
  }

  onTitleChange(title: string) {
    this.editorStateService.updateTitle(title);
  }

  toggleLayersDropdown(opener?: HTMLElement | null) {
    this.rememberOpener(opener);
    this.showLayersDropdownSignal.update((value) => !value);
  }

  onLayerAction(action: LayerPanelAction) {
    const state = this.editorStateService;
    switch (action.type) {
      case 'select':
        if (action.id) state.setActiveLayer(action.id);
        break;
      case 'add':
        state.addLayer(`Layer ${this.layersSignal().length + 1}`);
        break;
      case 'toggle-visible':
        if (action.id) state.toggleLayerVisibility(action.id);
        break;
      case 'toggle-lock':
        if (action.id) state.toggleLayerLock(action.id);
        break;
      case 'duplicate':
        if (action.id) state.duplicateLayer(action.id);
        break;
      case 'merge-down':
        if (action.id) state.mergeLayerDown(action.id);
        break;
      case 'rename':
        state.updateLayer(action.id, { name: action.name });
        break;
      case 'reorder':
        state.reorderLayersByIndex(action.from, action.to);
        break;
      case 'opacity':
        if (action.phase === 'start') state.beginLayerOpacityEdit(action.id);
        else if (action.phase === 'end') state.endLayerOpacityEdit();
        else state.setLayerOpacity(action.id, action.opacity);
        break;
      case 'blend':
        state.setLayerBlendMode(action.id, action.blendMode);
        break;
      case 'delete':
        state.removeLayer(action.id, action.mode);
        break;
    }
  }

  onHeaderMenuAction(event: { id: MainMenuActionId; opener: HTMLElement | null }) {
    this.rememberOpener(event.opener);
    this.runMenuAction(event.id);
  }

  runMenuAction(id: MainMenuActionId) {
    const state = this.editorStateService;
    this.menuSheetOpenSignal.set(false);
    switch (id) {
      case 'open':
        if (state.hasContent()) this.confirmKind.set('open');
        else this.openFilePicker();
        break;
      case 'save':
        void state.saveBoard();
        break;
      case 'save-as':
        void state.saveBoardAs();
        break;
      case 'export':
        this.exportDialogOpen.set(true);
        break;
      case 'copy-png':
        void state.copyAsPng();
        break;
      case 'theme':
        state.toggleTheme();
        break;
      case 'reset':
        this.confirmKind.set('reset');
        break;
    }
  }

  onConfirmed() {
    const kind = this.confirmKind();
    this.confirmKind.set(null);
    if (kind === 'reset') this.editorStateService.resetBoard();
    else if (kind === 'open') this.openFilePicker();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) void this.editorStateService.openBoard(file);
  }

  private openFilePicker() {
    if (this.editorStateService.canSaveInPlace) void this.editorStateService.pickAndOpenBoard();
    else this.fileInput()?.nativeElement.click();
  }

  onColorChange(event: { property: string; value: string }) {
    switch (event.property) {
      case 'backgroundColor':
        this.editorStateService.updateBackgroundColor(event.value);
        break;
      case 'strokeColor':
        this.editorStateService.updateStrokeColor(event.value);
        break;
      case 'fillColor':
        this.editorStateService.updateFillColor(event.value);
        break;
    }
  }

  onPropertyChange(event: { property: string; value: string | number | boolean }) {
    this.editorStateService.updateElementProperty(event.property, event.value);
  }

  onEditStart(owner: EventTarget | null) {
    this.editorStateService.beginEdit(owner);
  }

  onEditEnd(owner?: EventTarget | null) {
    this.editorStateService.endEdit(owner);
  }

  toggleGrid() {
    this.editorStateService.toggleGrid();
  }

  toggleSnapToGrid() {
    this.editorStateService.toggleSnapToGrid();
  }

  deleteElement() {
    this.editorStateService.removeSelectedElements();
  }

  togglePanel() {
    if (this.isCompact()) this.togglePropertiesSheet();
    else this.isPanelOpenSignal.update((value) => !value);
  }

  togglePropertiesSheet(opener?: HTMLElement | null) {
    this.rememberOpener(opener);
    this.propertiesSheetOpenSignal.update((value) => !value);
  }

  toggleMenuSheet(opener?: HTMLElement | null) {
    this.rememberOpener(opener);
    this.menuSheetOpenSignal.update((value) => !value);
  }

  onAlignmentChange(alignment: AlignmentType) {
    this.editorStateService.alignElements(alignment);
  }

  setSelectedTool(tool: ToolType) {
    this.editorStateService.selectTool(tool);
  }

  toggleToolLock() {
    this.editorStateService.toggleToolLock();
  }

  zoomIn() {
    this.editorStateService.zoomIn();
  }

  zoomOut() {
    this.editorStateService.zoomOut();
  }

  zoomToFit() {
    this.editorStateService.zoomToFit();
    this.showZoomPopupSignal.set(false);
  }

  zoomToSelection() {
    this.editorStateService.zoomToSelection();
    this.showZoomPopupSignal.set(false);
  }

  resetZoom() {
    this.editorStateService.resetZoom();
    this.showZoomPopupSignal.set(false);
  }

  private readonly zoomActionHandlers: Record<ZoomActionId, () => void> = {
    fit: () => this.zoomToFit(),
    selection: () => this.zoomToSelection(),
    reset: () => this.resetZoom(),
  };

  runZoomAction(id: ZoomActionId) {
    this.zoomActionHandlers[id]();
  }

  toggleZoomPopup(opener?: HTMLElement | null) {
    this.rememberOpener(opener);
    this.showZoomPopupSignal.update((value) => !value);
  }

  undo() {
    this.editorStateService.undo();
  }

  redo() {
    this.editorStateService.redo();
  }

  onCenterView() {
    this.editorStateService.centerView();
  }
}
