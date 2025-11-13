import { Injectable, Signal, computed, inject } from '@angular/core';
import { ConfigService } from '../config/config.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { CanvasService } from '../canvas/canvas.service';
import { ElementsService } from '../elements/elements.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { PanService } from '../viewport/pan.service';
import { SelectionService } from '../elements/selection.service';
import { ToolsService } from '../tools/tools.service';
import { HistoryService } from '../history/history.service';
import { ZoomService } from '../viewport/zoom.service';
import {
  AddImage,
  AlignmentType,
  BoundingBox,
  FormatType,
  SelectionBox,
  ToolType,
  WhiteboardConfig,
  WhiteboardElement,
  BlendMode,
} from '../types';
import { WhiteboardEvent } from '../types/events';
import { CursorType } from '../types/cursors';
import { ClipboardService, IOService } from '../input';

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

  pan(dx: number, dy: number): void {
    this.panService.pan(dx, dy);
  }

  panTo(x: number, y: number): void {
    this.panService.panTo(x, y);
  }

  resetPan(): void {
    this.panService.resetPan();
  }

  async save(format: FormatType = FormatType.Base64, name = 'whiteboard'): Promise<string> {
    return this.ioService.save(format, name);
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
    const elements = this.historyService.undo();
    if (elements) {
      this.elementsService.setElements(elements);
      this.selectionService.clearSelection();
      this.eventBusService.emit(WhiteboardEvent.Undo, undefined);
      return true;
    }
    return false;
  }

  redo(): boolean {
    const elements = this.historyService.redo();
    if (elements) {
      this.elementsService.setElements(elements);
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
    return this.layerService.addLayer(name);
  }

  removeLayer(id: string): boolean {
    return this.layerService.removeLayer(id);
  }

  setActiveLayer(id: string): boolean {
    return this.layerService.setActiveLayer(id);
  }

  getActiveLayerId(): string {
    return this.layerService.getActiveLayerId();
  }

  toggleLayerVisibility(id: string): boolean {
    return this.layerService.toggleLayerVisibility(id);
  }

  toggleLayerLock(id: string): boolean {
    return this.layerService.toggleLayerLock(id);
  }

  renameLayer(id: string, name: string): boolean {
    return this.layerService.renameLayer(id, name);
  }

  setLayerOpacity(id: string, opacity: number): boolean {
    return this.layerService.setLayerOpacity(id, opacity);
  }

  setLayerBlendMode(id: string, blendMode: BlendMode): boolean {
    return this.layerService.setLayerBlendMode(id, blendMode);
  }

  moveLayerUp(id: string): boolean {
    return this.layerService.moveLayerUp(id);
  }

  moveLayerDown(id: string): boolean {
    return this.layerService.moveLayerDown(id);
  }

  reorderLayersByIndex(previousIndex: number, currentIndex: number): boolean {
    return this.layerService.reorderLayersByIndex(previousIndex, currentIndex);
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
