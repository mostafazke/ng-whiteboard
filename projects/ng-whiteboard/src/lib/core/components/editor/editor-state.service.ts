import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, OnDestroy, Signal, signal } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { ConfigService } from '../../config/config.service';
import { ArrowElement, ArrowheadType } from '../../elements/arrow-element';
import { ElementsService } from '../../elements/elements.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { SelectionService } from '../../elements/selection.service';
import { IOService } from '../../input/io.service';
import { BatchHandle, HistoryService } from '../../history/history.service';
import { ToolsService } from '../../tools/tools.service';
import { boardFileKind } from '../../utils/files/board-data';
import {
  BoardFileHandle,
  isPickerAbort,
  pickBoardOpenFile,
  pickBoardSaveFile,
  supportsFileSystemAccess,
  writeBoardFile,
} from '../../utils/files/file-system';
import {
  ArrowHeadStyle,
  ArrowLineStyle,
  BlendMode,
  EditorConfig,
  ElementType,
  ExportOptions,
  FormatType,
  LineCap,
  PenType,
  ToolType,
  WhiteboardConfig,
  WhiteboardElement,
} from '../../types';
import { ZoomService } from '../../viewport/zoom.service';
import { PanService } from '../../viewport';
import { AlignmentType, computeAlignmentUpdates } from './utils/alignment';
import { isFlatCurve, toArrowPath } from './utils/arrow-path';
import { DEFAULT_BOARD_TITLE } from './utils/board-title';
import { buildDasharray, rescaleDasharray } from './utils/dasharray';
import { mergeSelectedProperties } from './utils/selected-properties';
import { arrowPathKind } from './utils/shape-capabilities';

export interface ExportSettings {
  format: 'png' | 'svg';
  scale: 1 | 2 | 3;
  background: boolean;
  /** Store the board inside the image so Open can load it back for editing. */
  embedBoardData: boolean;
}

/** `none`: the board was never saved or opened from a file in this session. */
export type SaveState = 'none' | 'saved' | 'unsaved';

export const EXPORT_PADDING = 16;
const STATUS_MS = 2500;

@Injectable()
export class EditorStateService implements OnDestroy {
  private ioService = inject(IOService);
  private elementsService = inject(ElementsService);
  private selectionService = inject(SelectionService);
  private configService = inject(ConfigService);
  private toolsService = inject(ToolsService);
  private historyService = inject(HistoryService);
  private zoomService = inject(ZoomService);
  private panService = inject(PanService);
  private layerManagementService = inject(LayerManagementService);
  private apiService = inject(ApiService);
  private win = inject(DOCUMENT).defaultView;
  private editBatch: BatchHandle | null = null;
  private editOwner: EventTarget | null = null;
  private readonly endEditOnRelease = () => this.endEdit();
  /** A new gesture or key elsewhere ends the edit before the canvas or a shortcut records its own history. */
  private readonly endEditOnInteraction = (event: Event) => {
    if (event.target === this.editOwner && !isModifiedKey(event)) return;
    this.endEdit();
  };

  /** The title the host passed on first render; Reset restores it. */
  readonly initialTitle = this.configService.getEditorConfig().title;
  private readonly status = signal<string | null>(null);
  private statusTimer: ReturnType<typeof setTimeout> | null = null;
  readonly statusMessage = this.status.asReadonly();
  readonly exportSettings = signal<ExportSettings>({ format: 'png', scale: 2, background: true, embedBoardData: true });

  /** Chromium can write back to a picked file; other browsers download a copy on every save. */
  readonly canSaveInPlace = supportsFileSystemAccess(this.win);
  private readonly fileHandle = signal<BoardFileHandle | null>(null);
  private readonly savedMarker = signal<{ stateId: number; title: string } | null>(null);
  private readonly historyStateId = this.historyService.getStateIdSignal();
  /** Name of the file Save writes to, when the board is linked to one. */
  readonly fileName = computed(() => this.fileHandle()?.name ?? null);
  readonly saveState = computed<SaveState>(() => {
    const marker = this.savedMarker();
    if (!marker) return 'none';
    const unchanged = marker.stateId === this.historyStateId() && marker.title === this.getEditorConfigSignal()().title;
    return unchanged ? 'saved' : 'unsaved';
  });

  themeSignal = computed(() => this.getConfigSignal()().theme ?? 'light');

  toggleTheme(): void {
    const current = this.themeSignal();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.configService.updateConfigValue('theme', newTheme);
  }

  selectedElementsSignal = this.selectionService.getSelectedElementsSignal();
  selectedToolSignal = this.toolsService.selectedTool;

  layersSignal = computed(() => this.layerManagementService.layersWithMembership(this.elementsService.elements()));
  activeLayerIdSignal = this.layerManagementService.activeLayerId;

  canUndoSignal = this.historyService.getCanUndoSignal();
  canRedoSignal = this.historyService.getCanRedoSignal();

  hasSelectionSignal = computed(() => this.selectedElementsSignal().length > 0);

  selectedPropertiesSignal = computed(() => mergeSelectedProperties(this.selectedElementsSignal()));

  getConfigSignal(): Signal<WhiteboardConfig> {
    return this.configService.getConfigSignal();
  }

  getEditorConfigSignal(): Signal<EditorConfig> {
    return this.configService.getEditorConfigSignal();
  }

  selectTool(tool: ToolType) {
    this.endEdit();
    this.toolsService.setActiveTool(tool);
    if (tool === ToolType.Image) this.apiService.pickImage();
  }

  toggleToolLock() {
    this.configService.toggleToolLock();
  }

  readonly toolLockedSignal = this.configService.toolLocked;

  alignElements(alignment: AlignmentType) {
    this.endEdit();
    const updates = computeAlignmentUpdates(this.selectedElementsSignal(), alignment);
    this.applyUpdates(updates);
  }

  /**
   * Send updates for the selection, skipping locked elements (own lock or locked layer) and updates
   * that would change nothing, so the edit neither warns nor records an empty history step.
   */
  private applyUpdates(updates: (Partial<WhiteboardElement> & { id: string })[]) {
    const byId = new Map(this.elementsService.getElements().map((element) => [element.id, element]));
    const effective = updates.filter((update) => {
      const element = byId.get(update.id);
      return !!element && !this.isLocked(element) && changes(element, update);
    });
    if (effective.length > 0) {
      this.elementsService.updateElements(effective);
    }
  }

  private isLocked(element: WhiteboardElement): boolean {
    if (element.locked) return true;
    return !!this.layerManagementService.getElementLayer(element)?.locked;
  }

  updateTitle(title: string) {
    this.configService.updateEditorConfigValue('title', title);
  }

  zoomIn() {
    this.zoomService.zoomIn();
  }

  zoomOut() {
    this.zoomService.zoomOut();
  }

  zoomToFit() {
    this.zoomService.zoomToFit();
  }

  zoomToSelection() {
    this.zoomService.zoomToSelection();
  }

  resetZoom() {
    this.zoomService.resetZoom();
  }

  centerView() {
    this.zoomService.resetZoom();
    this.panService.resetPan();
  }

  clear() {
    this.endEdit();
    this.elementsService.clear();
  }

  updateBackgroundColor(color: string) {
    this.configService.updateConfig({ backgroundColor: color });
  }

  updateStrokeColor(color: string) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('strokeColor', color);
      return;
    }

    const updates = selectedElements.map((element) => ({
      id: element.id,
      style: {
        ...element.style,
        strokeColor: color,
        ...(element.type === 'text' ? { color } : {}),
      },
    }));

    this.applyUpdates(updates);
  }

  updateFillColor(color: string) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('fill', color);
      return;
    }

    const updates = selectedElements.map((element) => ({
      id: element.id,
      style: {
        ...element.style,
        fill: color,
      },
    }));

    this.applyUpdates(updates);
  }

  updateStrokeWidth(width: number) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      const dasharray = rescaleDasharray(this.configService.getConfig().dasharray, width);
      this.configService.updateConfigValue('strokeWidth', width);
      if (dasharray !== undefined) this.configService.updateConfigValue('dasharray', dasharray);
      return;
    }

    const updates = selectedElements.map((element) => ({
      id: element.id,
      style: {
        ...element.style,
        strokeWidth: width,
        dasharray: rescaleDasharray(element.style?.dasharray, width),
      },
    }));

    this.applyUpdates(updates);
  }

  /**
   * Update opacity for selected elements only (not available in global config)
   */
  updateOpacity(opacity: number) {
    const selectedElements = this.selectedElementsSignal();
    if (selectedElements.length === 0) return;

    const updates = selectedElements.map((element) => {
      if (element.style?.opacity === undefined) return { id: element.id, opacity };
      const style = { ...element.style };
      delete style.opacity;
      return { id: element.id, opacity, style };
    });

    this.applyUpdates(updates);
  }

  updateFontSize(fontSize: number) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('fontSize', fontSize);
      return;
    }

    const updates = selectedElements
      .filter((element) => element.type === 'text')
      .map((element) => ({
        id: element.id,
        style: {
          ...element.style,
          fontSize,
        },
      }));

    this.applyUpdates(updates);
  }

  updateFontFamily(fontFamily: string) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('fontFamily', fontFamily);
      return;
    }

    const updates = selectedElements
      .filter((element) => element.type === 'text')
      .map((element) => ({
        id: element.id,
        style: {
          ...element.style,
          fontFamily,
        },
      }));

    this.applyUpdates(updates);
  }

  updateFontWeight(fontWeight: 'normal' | 'bold') {
    const selectedElements = this.selectedElementsSignal();
    if (selectedElements.length === 0) return;

    const updates = selectedElements
      .filter((element) => element.type === 'text')
      .map((element) => ({
        id: element.id,
        style: {
          ...element.style,
          fontWeight,
        },
      }));

    this.applyUpdates(updates);
  }

  updateFontStyle(fontStyle: 'normal' | 'italic') {
    const selectedElements = this.selectedElementsSignal();
    if (selectedElements.length === 0) return;

    const updates = selectedElements
      .filter((element) => element.type === 'text')
      .map((element) => ({
        id: element.id,
        style: {
          ...element.style,
          fontStyle,
        },
      }));

    this.applyUpdates(updates);
  }

  /**
   * Apply a line style, scaling the pattern to each element's own stroke width
   */
  updateLineStyle(lineStyle: string) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.configService.updateConfigValue(
        'dasharray',
        buildDasharray(lineStyle, this.configService.getConfig().strokeWidth)
      );
      return;
    }

    const updates = selectedElements.map((element) => ({
      id: element.id,
      style: {
        ...element.style,
        dasharray: buildDasharray(lineStyle, element.style?.strokeWidth || 1),
      },
    }));

    this.applyUpdates(updates);
  }

  updateLineCap(cap: LineCap) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('lineCap', cap);
      return;
    }

    const updates = selectedElements
      .filter((element) => element.type === ElementType.Line || element.type === ElementType.Arrow)
      .map((element) => ({ id: element.id, style: { ...element.style, lineCap: cap } }));

    this.applyUpdates(updates);
  }

  updateCornerRadius(radius: number) {
    const rx = Math.round(Math.min(50, Math.max(0, radius)));
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('cornerRadius', rx);
      return;
    }

    const updates = selectedElements
      .filter((element) => element.type === ElementType.Rectangle)
      .map((element) => ({ id: element.id, rx }));

    this.applyUpdates(updates);
  }

  updateArrowHead(end: 'start' | 'end', type: ArrowheadType) {
    const selectedElements = this.selectedElementsSignal();

    if (selectedElements.length === 0) {
      this.updateArrowConfig(end === 'start' ? 'startHeadStyle' : 'endHeadStyle', type as ArrowHeadStyle);
      return;
    }

    const key = end === 'start' ? 'startHead' : 'endHead';
    const updates = this.selectedArrows()
      .filter((arrow) => arrow[key].type !== type)
      .map((arrow) => ({ id: arrow.id, [key]: { ...arrow[key], type } }));

    this.applyUpdates(updates);
  }

  swapArrowHeads() {
    if (this.selectedElementsSignal().length === 0) {
      const arrowConfig = this.configService.getConfig().arrowConfig;
      this.configService.updateConfigValue('arrowConfig', {
        ...arrowConfig,
        startHeadStyle: arrowConfig.endHeadStyle,
        endHeadStyle: arrowConfig.startHeadStyle,
      });
      return;
    }

    const updates = this.selectedArrows()
      .filter((arrow) => arrow.startHead.type !== arrow.endHead.type)
      .map((arrow) => ({
        id: arrow.id,
        startHead: arrow.endHead,
        endHead: arrow.startHead,
      }));

    this.applyUpdates(updates);
  }

  updateArrowPath(kind: ArrowLineStyle) {
    if (this.selectedElementsSignal().length === 0) {
      this.updateArrowConfig('lineStyle', kind);
      return;
    }

    const updates = this.selectedArrows()
      .filter((arrow) => arrowPathKind(arrow.pathType) !== kind || (kind === 'curve' && isFlatCurve(arrow)))
      .map((arrow) => ({ id: arrow.id, pathType: toArrowPath(kind, arrow) }));

    this.applyUpdates(updates);
  }

  updatePenType(type: PenType) {
    this.configService.updateConfigValue('penType', type);
  }

  private selectedArrows(): ArrowElement[] {
    return this.selectedElementsSignal().filter(
      (element): element is ArrowElement => element.type === ElementType.Arrow
    );
  }

  private updateArrowConfig<K extends keyof WhiteboardConfig['arrowConfig']>(
    key: K,
    value: WhiteboardConfig['arrowConfig'][K]
  ) {
    this.configService.updateConfigValue('arrowConfig', {
      ...this.configService.getConfig().arrowConfig,
      [key]: value,
    });
  }

  updateElementProperty(property: string, value: string | number | boolean) {
    switch (property) {
      case 'strokeWidth':
        this.updateStrokeWidth(value as number);
        break;
      case 'opacity':
        this.updateOpacity(value as number);
        break;
      case 'fontSize':
        this.updateFontSize(value as number);
        break;
      case 'fontFamily':
        this.updateFontFamily(value as string);
        break;
      case 'fontWeight':
        this.updateFontWeight(value as 'normal' | 'bold');
        break;
      case 'fontStyle':
        this.updateFontStyle(value as 'normal' | 'italic');
        break;
      case 'lineStyle':
        this.updateLineStyle(value as string);
        break;
      case 'lineCap':
        this.updateLineCap(value as LineCap);
        break;
      case 'cornerRadius':
        this.updateCornerRadius(value as number);
        break;
      case 'startHead':
        this.updateArrowHead('start', value as ArrowheadType);
        break;
      case 'endHead':
        this.updateArrowHead('end', value as ArrowheadType);
        break;
      case 'swapArrowHeads':
        this.swapArrowHeads();
        break;
      case 'arrowPath':
        this.updateArrowPath(value as ArrowLineStyle);
        break;
      case 'penType':
        this.updatePenType(value as PenType);
        break;
    }
  }

  /**
   * Group the updates of a continuous edit (slider drag, native color picker) into one undo step.
   * The batch closes on `endEdit`, the next pointer release, or a pointerdown/keydown outside `owner`
   * (the control driving the edit). Listeners run in the capture phase so they precede the canvas.
   */
  beginEdit(owner: EventTarget | null = null) {
    if (this.editBatch) return;
    this.editBatch = this.historyService.startBatch('Update properties', this.elementsService.getElements());
    this.editOwner = owner;
    this.toggleEditListeners(true);
  }

  /** With `owner`, closes the batch only if that control opened it. */
  endEdit(owner?: EventTarget | null) {
    if (!this.editBatch) return;
    if (owner !== undefined && owner !== this.editOwner) return;
    const batch = this.editBatch;
    this.editBatch = null;
    this.editOwner = null;
    this.toggleEditListeners(false);
    batch.execute(this.elementsService.getElements());
  }

  private toggleEditListeners(on: boolean) {
    const win = this.win;
    if (!win) return;
    const toggle = on ? win.addEventListener.bind(win) : win.removeEventListener.bind(win);
    toggle('pointerup', this.endEditOnRelease, true);
    toggle('pointercancel', this.endEditOnRelease, true);
    toggle('pointerdown', this.endEditOnInteraction, true);
    toggle('keydown', this.endEditOnInteraction, true);
  }

  ngOnDestroy() {
    this.endEdit();
    if (this.statusTimer) clearTimeout(this.statusTimer);
  }

  notify(message: string): void {
    if (this.statusTimer) clearTimeout(this.statusTimer);
    this.status.set(message);
    this.statusTimer = setTimeout(() => {
      this.statusTimer = null;
      this.status.set(null);
    }, STATUS_MS);
  }

  removeSelectedElements() {
    this.endEdit();
    this.selectionService.removeSelectedElements();
  }

  renderExport(format: FormatType.Png | FormatType.Svg, options: ExportOptions) {
    return this.ioService.renderExport(format, options);
  }

  async exportImage(format: FormatType.Png | FormatType.Svg, name: string, options: ExportOptions): Promise<boolean> {
    try {
      await this.ioService.save(format, name, options);
      return true;
    } catch (error) {
      console.error('Failed to export image:', error);
      return false;
    }
  }

  async copyImage(format: FormatType.Png | FormatType.Svg, options: ExportOptions): Promise<boolean> {
    try {
      await this.ioService.copyToClipboard(format, options);
      return true;
    } catch (error) {
      console.error('Failed to copy image:', error);
      return false;
    }
  }

  hasContent(): boolean {
    return this.apiService.hasContent();
  }

  /** Ctrl+S: writes to the linked file, or asks where to save the first time. */
  async saveBoard(): Promise<void> {
    const handle = this.fileHandle();
    if (handle) await this.writeBoard(handle);
    else await this.saveBoardAs();
  }

  async saveBoardAs(): Promise<void> {
    this.endEdit();
    const name = this.getEditorConfigSignal()().title || DEFAULT_BOARD_TITLE;
    if (!this.canSaveInPlace) {
      const marker = this.currentMarker();
      this.ioService.exportDataAsFile(name);
      this.savedMarker.set(marker);
      this.notify(`Downloaded ${name}.json`);
      return;
    }
    let handle: BoardFileHandle;
    try {
      handle = await pickBoardSaveFile(this.win, name);
    } catch (error) {
      if (isPickerAbort(error)) return;
      console.error('Failed to pick a file to save to:', error);
      this.notify("Couldn't save");
      return;
    }
    await this.writeBoard(handle);
  }

  /** Opens through the browser's file picker so the opened board file can be saved back in place. */
  async pickAndOpenBoard(): Promise<void> {
    let handle: BoardFileHandle;
    let file: File;
    try {
      handle = await pickBoardOpenFile(this.win);
      file = await handle.getFile();
    } catch (error) {
      if (isPickerAbort(error)) return;
      console.error('Failed to pick a board file:', error);
      this.notify("Couldn't open that file");
      return;
    }
    await this.openBoard(file, boardFileKind(file) === 'json' ? handle : null);
  }

  /** `handle` links the board to its file for Save; images are never overwritten with board JSON. */
  async openBoard(file: File, handle: BoardFileHandle | null = null): Promise<void> {
    this.endEdit();
    try {
      await this.ioService.importDataFromFile(file);
    } catch (error) {
      console.error('Failed to open board file:', error);
      const noData = error instanceof Error && error.message.includes('no board data');
      this.notify(noData ? 'This image has no board data' : "Couldn't open that file");
      return;
    }
    this.fileHandle.set(handle);
    this.savedMarker.set(this.currentMarker());
  }

  private async writeBoard(handle: BoardFileHandle): Promise<void> {
    this.endEdit();
    const marker = this.currentMarker();
    try {
      await writeBoardFile(handle, this.ioService.exportData());
    } catch (error) {
      console.error('Failed to save board file:', error);
      this.notify("Couldn't save");
      return;
    }
    this.fileHandle.set(handle);
    this.savedMarker.set(marker);
    this.notify(`Saved to ${handle.name}`);
  }

  private currentMarker() {
    return { stateId: this.historyStateId(), title: this.getEditorConfigSignal()().title };
  }

  async copyAsPng(): Promise<void> {
    const { scale, background } = this.exportSettings();
    try {
      await this.ioService.copyToClipboard(FormatType.Png, {
        scale,
        background,
        padding: EXPORT_PADDING,
        onlySelected: this.hasSelectionSignal(),
      });
      this.notify('Copied to clipboard');
    } catch (error) {
      console.error('Failed to copy image:', error);
      this.notify("Couldn't copy");
    }
  }

  resetBoard(): void {
    this.endEdit();
    this.apiService.resetBoard();
    this.updateTitle(this.initialTitle);
    this.centerView();
    this.fileHandle.set(null);
    this.savedMarker.set(null);
  }

  undo() {
    this.endEdit();
    this.apiService.undo();
  }

  redo() {
    this.endEdit();
    this.apiService.redo();
  }

  toggleGrid() {
    this.configService.updateConfig({ enableGrid: !this.configService.getConfig().enableGrid });
  }

  toggleSnapToGrid() {
    this.configService.updateConfig({ snapToGrid: !this.configService.getConfig().snapToGrid });
  }

  addLayer(name?: string): void {
    this.apiService.addLayer(name);
  }

  removeLayer(layerId: string, mode: 'delete-elements' | 'move-elements'): boolean {
    return this.apiService.removeLayer(layerId, mode);
  }

  /** Indices are positions in the top-first list shown by the layers panel. */
  reorderLayersByIndex(previousIndex: number, currentIndex: number): boolean {
    return this.apiService.reorderLayersByIndex(previousIndex, currentIndex);
  }

  mergeLayerDown(layerId: string): boolean {
    return this.apiService.mergeLayerDown(layerId);
  }

  duplicateLayer(layerId: string): void {
    this.apiService.duplicateLayer(layerId);
  }

  beginLayerOpacityEdit(layerId: string): void {
    this.apiService.beginLayerOpacityEdit(layerId);
  }

  endLayerOpacityEdit(): void {
    this.apiService.endLayerOpacityEdit();
  }

  renameLayer(layerId: string, name: string): boolean {
    return this.apiService.renameLayer(layerId, name);
  }

  setActiveLayer(layerId: string): boolean {
    return this.layerManagementService.setActiveLayer(layerId);
  }

  toggleLayerVisibility(layerId: string): boolean {
    return this.apiService.toggleLayerVisibility(layerId);
  }

  toggleLayerLock(layerId: string): boolean {
    return this.apiService.toggleLayerLock(layerId);
  }

  setLayerOpacity(layerId: string, opacity: number): boolean {
    return this.apiService.setLayerOpacity(layerId, opacity);
  }

  setLayerBlendMode(layerId: string, blendMode: BlendMode): boolean {
    return this.apiService.setLayerBlendMode(layerId, blendMode);
  }
}

function isModifiedKey(event: Event): boolean {
  return event instanceof KeyboardEvent && (event.ctrlKey || event.metaKey || event.altKey);
}

function changes(element: WhiteboardElement, update: Partial<WhiteboardElement>): boolean {
  return Object.entries(update).some(([key, value]) => {
    if (key === 'style') {
      const style = (element.style ?? {}) as Record<string, unknown>;
      return Object.entries(value as Record<string, unknown>).some(([styleKey, v]) => style[styleKey] !== v);
    }
    return (element as unknown as Record<string, unknown>)[key] !== value;
  });
}
