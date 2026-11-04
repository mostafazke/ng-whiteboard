import { Injectable, Signal, computed, inject } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { CanvasService } from '../canvas/canvas.service';
import { ElementsService } from '../elements/elements.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { PanService } from '../viewport/pan.service';
import { SelectionService } from '../elements/selection.service';
import { ToolsService } from '../tools/tools.service';
import { BatchHandle, HistoryService } from '../history/history.service';
import { ZoomService } from '../viewport/zoom.service';
import {
  AddImage,
  AlignmentType,
  BoundingBox,
  FormatType,
  ExportOptions,
  SelectionBox,
  ToolType,
  WhiteboardConfig,
  WhiteboardElement,
  BlendMode,
} from '../types';
import { WhiteboardEvent } from '../types/events';
import { CursorType } from '../types/cursors';
import { ClipboardService, IOService } from '../input';
import { elementIdsByLayer } from '../utils';

@Injectable()
export class ApiService {
  private elementsService = inject(ElementsService);
  private canvasService = inject(CanvasService);
  private selectionService = inject(SelectionService);
  private toolsService = inject(ToolsService);
  private ioService = inject(IOService);
  private historyService = inject(HistoryService);
  private zoomService = inject(ZoomService);
  private panService = inject(PanService);
  private layerService = inject(LayerManagementService);
  private configService = inject(ConfigService);
  private clipboardService = inject(ClipboardService);
  private eventBusService = inject(EventBusService);
  private opacityBatch: BatchHandle | null = null;

  readonly elements: Signal<WhiteboardElement[]> = this.elementsService.elements;

  readonly draftElements: Signal<WhiteboardElement[]> = this.elementsService.draftElements;

  readonly allElements: Signal<WhiteboardElement[]> = this.elementsService.allElements;

  readonly selectedElements: Signal<WhiteboardElement[]> = this.selectionService.getSelectedElementsSignal();

  readonly config: Signal<WhiteboardConfig> = computed(() => this.configService.getConfig());

  readonly elementsCount: Signal<number> = this.elementsService.elementsCount;

  readonly hasElements: Signal<boolean> = this.elementsService.hasElements;

  readonly selectedTool: Signal<ToolType> = this.toolsService.selectedTool;

  readonly availableTools = this.toolsService.availableTools;

  readonly layers = this.layerService.layers;

  readonly activeLayerId = this.layerService.activeLayerId;

  readonly activeLayer = this.layerService.activeLayer;

  setElements(elements: WhiteboardElement[]): void {
    this.elementsService.setElements(elements);
  }

  getElements(): WhiteboardElement[] {
    return this.elementsService.getElements();
  }

  addElements(elements: WhiteboardElement[]): void {
    this.elementsService.addElements(elements);
  }

  updateElements(elements: Array<Partial<WhiteboardElement> & { id: string }>): void {
    const updates = elements.map((el) => ({ ...el, id: el.id }));
    this.elementsService.updateElements(updates);
  }

  removeElements(elements: WhiteboardElement[]): void {
    this.elementsService.removeElements(elements);
  }

  clear(): void {
    this.elementsService.clear();
  }

  resetBoard(): void {
    this.withLayerHistory('Reset canvas', () => {
      this.elementsService.clear();
      this.selectionService.clearSelection();
      this.layerService.reset();
    });
  }

  hasContent(): boolean {
    return this.elementsService.getElements().length > 0;
  }

  clearAll(): void {
    this.elementsService.clear();
    this.selectionService.clearSelection();
  }

  addElement(element: WhiteboardElement): void {
    this.addElements([element]);
  }

  updateElement(element: WhiteboardElement): void {
    this.updateElements([element]);
  }

  removeElementsByIds(elementIds: string[]): void {
    this.elementsService.removeElementsByIds(elementIds);
  }

  getElementById(id: string): WhiteboardElement | undefined {
    return this.elementsService.getElementById(id);
  }

  getElementsByIds(ids: string[]): WhiteboardElement[] {
    return this.elementsService.getElementsByIds(ids);
  }

  getNextZIndex(): number {
    return this.elementsService.getNextZIndex();
  }

  getAllElements(): WhiteboardElement[] {
    return this.elementsService.getElements();
  }

  getDraftElements(): WhiteboardElement[] {
    return this.elementsService.getDraftElements();
  }

  addDraftElements(elements: WhiteboardElement[]): void {
    this.elementsService.addDraftElements(elements);
  }

  updateDraftElements(elements: Partial<WhiteboardElement>[]): void {
    this.elementsService.updateDraftElements(elements);
  }

  removeDraftElements(elementIds: string[]): void {
    this.elementsService.removeDraftElements(elementIds);
  }

  commitDraftElements(): void {
    this.elementsService.commitDraftElements();
  }

  elementExists(elementId: string): boolean {
    return this.elementsService.elementExists(elementId);
  }

  selectElements(elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[], append = false): void {
    this.selectionService.selectElements(elementsOrIds, append);
  }

  /**
   * Apply the post-draw behaviour for a freshly drawn element: when `selectAfterDraw` resolves
   * true (config override or the element's own default), select it and activate the Select tool;
   * when false, leave it unselected so the drawing tool stays active. Called by the tools on
   * pointer-up — the single place the "select + switch to Select vs keep drawing" decision lives.
   */
  finalizeDraw(element: WhiteboardElement): void {
    const select = this.configService.resolveSelectAfterDraw(element.type, element.selectAfterDraw ?? false);
    if (select) {
      this.selectionService.selectElements([element.id]);
      this.toolsService.setActiveTool(ToolType.Select);
    }
  }

  deselectElement(elementOrId: WhiteboardElement | string): void {
    this.selectionService.deselectElement(elementOrId);
  }

  toggleSelection(elementOrId: WhiteboardElement | string): void {
    this.selectionService.toggleSelection(elementOrId);
  }

  clearSelection(): void {
    this.selectionService.clearSelection();
  }

  selectAll(): void {
    this.selectionService.selectAll();
  }

  getSelectedElements(): WhiteboardElement[] {
    return this.selectionService.getSelectedElements();
  }

  updateSelectedElements(partialElement: Partial<WhiteboardElement>): void {
    this.selectionService.updateSelectedElements(partialElement);
  }

  removeSelectedElements(): void {
    this.selectionService.removeSelectedElements();
  }

  isSelected(elementOrId: WhiteboardElement | string): boolean {
    return this.selectionService.isSelected(elementOrId);
  }

  clearSelectionBox(): void {
    this.selectionService.clearSelectionBox();
  }

  transformSelectedElements(transformFn: (elements: WhiteboardElement[]) => WhiteboardElement[]): void {
    this.selectionService.transformSelectedElements(transformFn);
  }

  setSelectionBox(selectionBox: SelectionBox): void {
    this.selectionService.setSelectionBox(selectionBox);
  }

  updateBoundingBox(): void {
    this.selectionService.updateBoundingBox();
  }

  getBoundingBox(): BoundingBox | null {
    return this.selectionService.getBoundingBox();
  }

  setBoundingBox(bbox: BoundingBox | null): void {
    this.selectionService.setBoundingBox(bbox);
  }

  getClipboardInfo() {
    return this.clipboardService.getClipboardInfo();
  }

  copyElements(): void {
    this.selectionService.copyElements();
  }

  cutElements(): void {
    this.selectionService.cutElements();
  }

  pasteElements(): void {
    this.selectionService.pasteElements();
  }

  duplicateElements(): void {
    this.selectionService.duplicateElements();
  }

  deleteSelectedElements(): void {
    this.selectionService.deleteSelectedElements();
  }

  bringToFront(): void {
    this.selectionService.bringToFront();
  }

  bringForward(): void {
    this.selectionService.bringForward();
  }

  sendBackward(): void {
    this.selectionService.sendBackward();
  }

  sendToBack(): void {
    this.selectionService.sendToBack();
  }

  groupSelectedElements(): void {
    this.selectionService.groupSelectedElements();
  }

  ungroupSelectedElements(): void {
    this.selectionService.ungroupSelectedElements();
  }

  lockElements(): void {
    this.selectionService.lockElements();
  }

  unlockElements(): void {
    this.selectionService.unlockElements();
  }

  alignElements(alignment: AlignmentType): void {
    this.selectionService.alignElements(alignment);
  }

  distributeHorizontally(): void {
    this.selectionService.distributeHorizontally();
  }

  distributeVertically(): void {
    this.selectionService.distributeVertically();
  }

  flipHorizontal(): void {
    this.selectionService.flipHorizontal();
  }

  flipVertical(): void {
    this.selectionService.flipVertical();
  }

  moveSelectedElements(dx: number, dy: number): void {
    this.selectionService.moveSelectedElements(dx, dy);
  }

  rotateSelectedElements(angle: number): void {
    this.selectionService.rotateSelectedElements(angle);
  }

  scaleSelectedElements(factor: number): void {
    this.selectionService.scaleSelectedElements(factor);
  }

  initializeWhiteboard(svgContainer: SVGSVGElement): void {
    this.canvasService.initializeCanvas(svgContainer);
    this.toolsService.setApiService(this);
  }

  getCanvas(): SVGSVGElement {
    return this.canvasService.getCanvas();
  }

  setCanvasDimensions(width: number, height: number): void {
    this.canvasService.setCanvasDimensions(width, height);
  }

  centerCanvas(): void {
    this.canvasService.centerCanvas();
  }

  fullScreen(): void {
    this.canvasService.fullScreen();
  }

  exitFullScreen(defaultWidth?: number, defaultHeight?: number): void {
    this.canvasService.exitFullScreen(defaultWidth, defaultHeight);
  }

  resetCanvas(): void {
    this.canvasService.resetCanvas();
  }

  setZoom(zoom: number): void {
    this.zoomService.zoom(zoom);
  }

  zoomIn(): void {
    this.zoomService.zoomIn();
  }

  zoomOut(): void {
    this.zoomService.zoomOut();
  }

  resetZoom(): void {
    this.zoomService.resetZoom();
  }

  zoomToFit(): void {
    this.zoomService.zoomToFit();
  }

  zoomToSelection(): void {
    this.zoomService.zoomToSelection();
  }

  zoomToRegion(x: number, y: number, width: number, height: number): void {
    this.zoomService.zoomToRegion(x, y, width, height);
  }

  pan(dx: number, dy: number): void {
    this.panService.pan(dx, dy);
  }

  panTo(x: number, y: number): void {
    this.panService.panTo(x, y);
  }

  resetPan(): void {
    this.panService.resetPan();
  }

  async save(format: FormatType = FormatType.Base64, name = 'whiteboard', options?: ExportOptions): Promise<string> {
    return this.ioService.save(format, name, options);
  }

  async copyToClipboard(format: FormatType.Png | FormatType.Svg, options?: ExportOptions): Promise<void> {
    return this.ioService.copyToClipboard(format, options);
  }

  addImage(imageInfo: AddImage): void {
    this.ioService.addImage(imageInfo);
  }

  async importImageFile(file: File, x?: number, y?: number): Promise<void> {
    return this.ioService.importImageFile(file, x, y);
  }

  exportData(): string {
    return this.ioService.exportData();
  }

  importData(jsonData: string): void {
    this.ioService.importData(jsonData);
  }

  async exportAsPNG(name = 'whiteboard'): Promise<string> {
    return this.ioService.exportAsPng(name);
  }

  async exportAsSVG(name = 'whiteboard'): Promise<string> {
    return this.ioService.exportAsSvg(name);
  }

  exportAsJSON(name = 'whiteboard'): void {
    const jsonData = this.ioService.exportData();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  undo(): boolean {
    const snapshot = this.historyService.undoSnapshot();
    if (snapshot) {
      if (snapshot.layers) this.layerService.importLayerState(snapshot.layers);
      this.elementsService.setElements(snapshot.elements);
      this.selectionService.clearSelection();
      this.eventBusService.emit(WhiteboardEvent.Undo, undefined);
      return true;
    }
    return false;
  }

  redo(): boolean {
    const snapshot = this.historyService.redoSnapshot();
    if (snapshot) {
      if (snapshot.layers) this.layerService.importLayerState(snapshot.layers);
      this.elementsService.setElements(snapshot.elements);
      this.selectionService.clearSelection();
      this.eventBusService.emit(WhiteboardEvent.Redo, undefined);
      return true;
    }
    return false;
  }

  getCanUndoSignal(): Signal<boolean> {
    return this.historyService.getCanUndoSignal();
  }

  getCanRedoSignal(): Signal<boolean> {
    return this.historyService.getCanRedoSignal();
  }

  clearHistory(): void {
    this.historyService.clearHistory();
  }

  recordElementCreation(before: WhiteboardElement[], after: WhiteboardElement[]): void {
    this.historyService.recordElementCreation(before, after);
  }

  /**
   * Begin a history batch: while active, element-change recordings are coalesced
   * so a multi-step gesture (e.g. a drag, resize or rotate spanning many frames)
   * is committed as a single undo entry. Pair every call with the returned
   * handle's execute()/clear().
   */
  startBatch(description: string, before: WhiteboardElement[]): BatchHandle {
    return this.historyService.startBatch(description, before);
  }

  /**
   * Record the final state of an in-progress history batch. Call before the
   * handle's execute().
   */
  completeBatch(after: WhiteboardElement[]): void {
    this.historyService.completeBatch(after);
  }

  recordElementUpdate(before: WhiteboardElement[], after: WhiteboardElement[]): void {
    this.historyService.recordElementUpdate(before, after);
  }

  recordElementDeletion(before: WhiteboardElement[], after: WhiteboardElement[]): void {
    this.historyService.recordElementDeletion(before, after);
  }

  recordClear(before: WhiteboardElement[], after: WhiteboardElement[]): void {
    this.historyService.recordClear(before, after);
  }

  recordChange(before: WhiteboardElement[], after: WhiteboardElement[], description: string): void {
    this.historyService.recordChange(before, after, description);
  }

  getConfig(): WhiteboardConfig {
    return this.configService.getConfig();
  }

  updateConfig(config: Partial<WhiteboardConfig>): void {
    this.configService.updateConfig(config);
  }

  updateConfigValue<K extends keyof WhiteboardConfig>(key: K, value: WhiteboardConfig[K]): void {
    this.configService.updateConfigValue(key, value);
  }

  addLayer(name?: string) {
    return this.withLayerHistory('Add layer', () => this.layerService.addLayer(name));
  }

  removeLayer(id: string, mode: 'delete-elements' | 'move-elements' = 'delete-elements'): boolean {
    const sorted = this.layerService.sortedLayers();
    const index = sorted.findIndex((l) => l.id === id);
    if (sorted.length <= 1 || index === -1) return false;
    const target = sorted[index - 1] ?? sorted[index + 1];
    return this.withLayerHistory('Delete layer', () => {
      this.releaseMembers(id, mode === 'move-elements' ? target.id : null);
      return this.layerService.removeLayer(id);
    });
  }

  mergeLayerDown(id: string): boolean {
    const sorted = this.layerService.sortedLayers();
    const index = sorted.findIndex((l) => l.id === id);
    if (index <= 0) return false;
    return this.withLayerHistory('Merge layer down', () => {
      this.releaseMembers(id, sorted[index - 1].id);
      return this.layerService.removeLayer(id);
    });
  }

  duplicateLayer(id: string): void {
    this.withLayerHistory('Duplicate layer', () => {
      const currentElements = this.elementsService.elements();
      const result = this.layerService.duplicateLayer(id, currentElements);
      const layer = result.layer;
      if (!layer || result.elementMap.size === 0) return;

      const copies: WhiteboardElement[] = [];
      result.elementMap.forEach((newElementId, oldElementId) => {
        const original = currentElements.find((el: WhiteboardElement) => el.id === oldElementId);
        if (original) copies.push({ ...original, id: newElementId, layerId: layer.id });
      });
      this.elementsService.addElements(copies);
    });
  }

  setActiveLayer(id: string): boolean {
    return this.layerService.setActiveLayer(id);
  }

  getActiveLayerId(): string {
    return this.layerService.getActiveLayerId();
  }

  toggleLayerVisibility(id: string): boolean {
    return this.withLayerHistory('Toggle layer visibility', () => this.layerService.toggleLayerVisibility(id));
  }

  toggleLayerLock(id: string): boolean {
    return this.withLayerHistory('Toggle layer lock', () => this.layerService.toggleLayerLock(id));
  }

  renameLayer(id: string, name: string): boolean {
    return this.withLayerHistory('Rename layer', () => this.layerService.renameLayer(id, name));
  }

  setLayerOpacity(id: string, opacity: number): boolean {
    return this.withLayerHistory('Change layer opacity', () => this.layerService.setLayerOpacity(id, opacity));
  }

  setLayerBlendMode(id: string, blendMode: BlendMode): boolean {
    return this.withLayerHistory('Change layer blend mode', () => this.layerService.setLayerBlendMode(id, blendMode));
  }

  moveLayerUp(id: string): boolean {
    return this.withLayerHistory('Move layer up', () => this.layerService.moveLayerUp(id));
  }

  moveLayerDown(id: string): boolean {
    return this.withLayerHistory('Move layer down', () => this.layerService.moveLayerDown(id));
  }

  reorderLayersByIndex(previousIndex: number, currentIndex: number): boolean {
    return this.withLayerHistory('Reorder layers', () =>
      this.layerService.reorderLayersByIndex(previousIndex, currentIndex)
    );
  }

  /** Groups the opacity changes of a slider drag into one undo step; close with `endLayerOpacityEdit`. */
  beginLayerOpacityEdit(id: string): void {
    if (this.opacityBatch || !this.layerService.layers().some((l) => l.id === id)) return;
    const elements = this.elementsService.getElements();
    this.opacityBatch = this.historyService.startBatch(
      'Change layer opacity',
      elements,
      this.layerService.exportLayerState(elements)
    );
  }

  endLayerOpacityEdit(): void {
    const batch = this.opacityBatch;
    if (!batch) return;
    this.opacityBatch = null;
    const elements = this.elementsService.getElements();
    batch.execute(elements, this.layerService.exportLayerState(elements));
  }

  private withLayerHistory<T>(description: string, mutate: () => T): T {
    const before = this.elementsService.getElements();
    const batch = this.historyService.startBatch(description, before, this.layerService.exportLayerState(before));
    try {
      return mutate();
    } finally {
      const after = this.elementsService.getElements();
      batch.execute(after, this.layerService.exportLayerState(after));
    }
  }

  private releaseMembers(layerId: string, moveTo: string | null): void {
    const ids = elementIdsByLayer(this.elementsService.getElements(), this.layerService.layers()).get(layerId) ?? [];
    if (!ids.length) return;
    if (moveTo) this.elementsService.moveToLayer(ids, moveTo, true);
    else this.elementsService.removeElementsByIds(ids, true);
  }

  toggleGrid(): void {
    this.canvasService.toggleGrid();
  }

  toggleSnapToGrid(): void {
    this.canvasService.toggleSnapToGrid();
  }

  setGridSize(size: number): void {
    this.canvasService.setGridSize(size);
  }

  setActiveTool(tool: ToolType): void {
    this.toolsService.setActiveTool(tool);
  }

  getActiveTool(): ToolType {
    return this.toolsService.getActiveToolType();
  }

  setToolEnabled(toolType: ToolType, enabled: boolean): boolean {
    return this.toolsService.setToolEnabledByType(toolType, enabled);
  }

  setEnabledTools(toolTypes: ToolType[]): void {
    this.toolsService.setEnabledTools(toolTypes);
  }

  setCursor(cursor: CursorType): void {
    this.toolsService.setCursor(cursor);
  }

  resetCursor(): void {
    this.toolsService.resetCursor();
  }

  screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    return this.canvasService.screenToCanvas(screenX, screenY);
  }

  canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
    return this.canvasService.canvasToScreen(canvasX, canvasY);
  }

  getSelectionBoxSignal(): Signal<SelectionBox> {
    return this.selectionService.getSelectionBoxSignal();
  }

  getBoundingBoxSignal(): Signal<BoundingBox | null> {
    return this.selectionService.getBoundingBoxSignal();
  }
}
