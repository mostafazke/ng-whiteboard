import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Signal,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SvgService } from '../../svg/svg.service';
import { BlendMode, FormatType, ToolType } from '../../types';
import { isEditableTarget } from '../../utils/dom/is-editable-target';
import { EditorLayout, layoutFor } from './editor-layout';
import { EditorStateService, Layer } from './editor-state.service';
import { IconComponent } from './icon/icon.component';
import { ControlsPanelComponent } from './panels/controls-panel/controls-panel.component';
import {
  HeaderPanelComponent,
  themeToggleLabel,
  toWhiteboardLayers,
} from './panels/header-panel/header-panel.component';
import { HistoryPanelComponent } from './panels/history-panel/history-panel.component';
import { LayerPanelComponent } from './panels/layer-panel/layer-panel.component';
import { PropertiesPanelComponent } from './panels/properties-panel/properties-panel.component';
import { ToolbarComponent } from './panels/toolbar/toolbar.component';
import { AlignmentType } from './ui/alignment-controls/alignment-controls.component';
import { BottomSheetComponent } from './ui/bottom-sheet/bottom-sheet.component';

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
  private root = viewChild.required<ElementRef<HTMLElement>>('root');

  private lastShortcutEvent: KeyboardEvent | null = null;
  /** `null` until the container is first measured, so neither the floating panel nor a sheet flashes in. */
  private layoutState = signal<EditorLayout | null>(null);
  readonly layout: Signal<EditorLayout | null> = this.layoutState.asReadonly();
  readonly isMeasured = computed(() => this.layout() !== null);
  readonly isCompact = computed(() => this.layout() === 'compact');

  // Reactive signals for better performance
  configSignal = this.editorStateService.getConfigSignal();
  editorConfigSignal = this.editorStateService.getEditorConfigSignal();
  themeSignal = this.editorStateService.themeSignal;
  // UI State signals
  isPanelOpenSignal = signal(true);
  isEditingTitleSignal = signal(false);
  showLayersDropdownSignal = signal(false);
  showLayerPanelSignal = signal(false);
  showZoomPopupSignal = signal(false);
  propertiesSheetOpenSignal = signal(false);
  menuSheetOpenSignal = signal(false);
  sheetOpenerSignal = signal<HTMLElement | null>(null);

  // Expose editor state signals
  selectedElementsSignal = this.editorStateService.selectedElementsSignal;
  selectedToolSignal = this.editorStateService.selectedToolSignal;
  layersSignal = this.editorStateService.layersSignal;
  activeLayerIdSignal = this.editorStateService.activeLayerIdSignal;
  hasSelectionSignal = this.editorStateService.hasSelectionSignal;
  canUndoSignal = this.editorStateService.canUndoSignal;
  canRedoSignal = this.editorStateService.canRedoSignal;
  selectedPropertiesSignal = this.editorStateService.selectedPropertiesSignal;
  whiteboardLayersSignal = computed(() => toWhiteboardLayers(this.layersSignal()));
  themeToggleLabelSignal = computed(() => themeToggleLabel(this.themeSignal()));

  constructor() {
    this.svgService.keyDown$.pipe(takeUntilDestroyed()).subscribe((event) => this.handleKeyboardShortcut(event));
    afterNextRender(() => this.observeSize());
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
  }

  private rememberOpener(opener?: HTMLElement | null) {
    this.sheetOpenerSignal.set(opener ?? null);
  }

  private closeSheets() {
    this.propertiesSheetOpenSignal.set(false);
    this.menuSheetOpenSignal.set(false);
    this.showLayersDropdownSignal.set(false);
    this.showZoomPopupSignal.set(false);
  }

  /**
   * Keys typed into editor controls must not reach the board's window-level shortcuts: text fields
   * keep every key, other controls keep the keys the canvas would act on (Space, Delete/Backspace,
   * unmodified printable keys). Modified chords such as Alt+P still pass through.
   */
  containKey(event: KeyboardEvent) {
    if (event.type === 'keydown') this.handleKeyboardShortcut(event);
    if (isEditableTarget(event.target) || isCanvasKey(event)) event.stopPropagation();
  }

  private targetsAnotherBoard(event: KeyboardEvent): boolean {
    const target = event.target;
    if (!(target instanceof Element)) return false;
    const board = target.closest('ng-whiteboard');
    return board !== null && board !== this.root().nativeElement.closest('ng-whiteboard');
  }

  private handleKeyboardShortcut(event: KeyboardEvent) {
    if (event === this.lastShortcutEvent) return;
    this.lastShortcutEvent = event;
    if (this.isEditingTitleSignal() || isEditableTarget(event.target) || this.targetsAnotherBoard(event)) return;

    if (event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyP') {
      event.preventDefault();
      this.togglePanel();
    }
  }

  // Header Panel Events
  onTitleChange(title: string) {
    this.editorStateService.updateTitle(title);
  }

  onTitleEditStart() {
    this.isEditingTitleSignal.set(true);
  }

  onTitleEditEnd() {
    this.isEditingTitleSignal.set(false);
  }

  toggleLayersDropdown(opener?: HTMLElement | null) {
    this.rememberOpener(opener);
    this.showLayersDropdownSignal.update((value) => !value);
  }

  onLayerVisibilityToggle(layer: Layer) {
    this.editorStateService.toggleLayerVisibility(layer.id);
  }

  onLayerLockToggle(layer: Layer) {
    this.editorStateService.toggleLayerLock(layer.id);
  }

  onLayerPanelVisibilityToggled(event: { layerId: string }) {
    this.editorStateService.toggleLayerVisibility(event.layerId);
  }

  onLayerPanelLockToggled(event: { layerId: string }) {
    this.editorStateService.toggleLayerLock(event.layerId);
  }

  onLayerAdd() {
    const layers = this.layersSignal();
    this.editorStateService.addLayer(`Layer ${layers.length + 1}`);
  }

  // Layer Panel Event Handlers (for header panel integration)
  onLayerPanelLayerSelected(layerId: string) {
    this.editorStateService.setActiveLayer(layerId);
  }

  onLayerPanelLayerDeleted(layerId: string) {
    this.editorStateService.removeLayer(layerId);
  }

  onLayerPanelLayerRenamed(event: { layerId: string; name: string }) {
    this.editorStateService.updateLayer(event.layerId, { name: event.name });
  }

  onLayerPanelOpacityChanged(event: { layerId: string; opacity: number }) {
    this.editorStateService.setLayerOpacity(event.layerId, event.opacity);
  }

  onLayerPanelLayerMoved(event: { layerId: string; direction: 'up' | 'down' }) {
    if (event.direction === 'up') {
      this.editorStateService.moveLayerUp(event.layerId);
    } else {
      this.editorStateService.moveLayerDown(event.layerId);
    }
  }

  onLayerPanelBlendModeChanged(event: { layerId: string; blendMode: string }) {
    this.editorStateService.setLayerBlendMode(event.layerId, event.blendMode as BlendMode);
  }

  clear() {
    this.editorStateService.clear();
  }

  save() {
    return this.editorStateService.save(FormatType.Svg, this.editorConfigSignal().title);
  }

  export() {
    return this.editorStateService.save(FormatType.Png, this.editorConfigSignal().title);
  }

  // Properties Panel Events
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

  toggleTheme() {
    this.editorStateService.toggleTheme();
  }

  onAlignmentChange(alignment: AlignmentType) {
    this.editorStateService.alignElements(alignment);
  }

  // Toolbar Events
  setSelectedTool(tool: ToolType) {
    this.editorStateService.selectTool(tool);
  }

  // Controls Panel Events
  zoomIn() {
    this.editorStateService.zoomIn();
  }

  zoomOut() {
    this.editorStateService.zoomOut();
  }

  onZoomTo(value: number) {
    this.editorStateService.setZoom(value);
    this.toggleZoomPopup();
  }

  zoomToFit() {
    this.editorStateService.zoomToFit();
    this.toggleZoomPopup();
  }

  zoomToSelection() {
    this.editorStateService.zoomToSelection();
    this.toggleZoomPopup();
  }

  resetZoom() {
    this.editorStateService.resetZoom();
    this.toggleZoomPopup();
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
