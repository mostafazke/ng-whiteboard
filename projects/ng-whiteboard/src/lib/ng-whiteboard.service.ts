import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { InstanceService } from './core/canvas/instance.service';
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
  CursorType,
  ClipboardInfo,
} from './core/types';

/**
 * Service providing a clean API for interacting with whiteboard instances.
 *
 * Key concepts:
 * - Each whiteboard component has a unique boardId
 * - Methods accept an optional boardId parameter to target a specific board
 * - Use signals(boardId) to get reactive signals for a specific board
 *
 * @example
 * ```typescript
 * class MyComponent {
 *   boardId = 'my-board';
 *   layers = this.whiteboardService.signals(this.boardId).layers;
 *   elements = this.whiteboardService.signals(this.boardId).elements;
 *
 *   clear() {
 *     this.whiteboardService.clear(this.boardId);
 *   }
 * }
 * ```
 */
@Injectable()
export class NgWhiteboardService {
  private readonly instanceService = inject(InstanceService);
  private activeBoardId = signal<string | null>(null);

  /**
   * Set the active board. Methods without boardId parameter will use this board.
   * @param boardId - The ID of the board to make active, or null to clear active board
   */
  setActiveBoard(boardId: string | null): void {
    this.activeBoardId.set(boardId);
  }

  /**
   * Get the currently active board ID
   */
  getActiveBoard(): string | null {
    return this.activeBoardId();
  }

  /**
   * Get the API instance for a specific board, or the active board if no boardId provided.
   * @param boardId - Optional board ID. If not provided, uses the active board.
   * @throws Error if boardId is not provided and no active board is set.
   * @throws Error if the specified board is not found.
   */
  private getApi(boardId?: string) {
    const targetBoardId = boardId || this.activeBoardId();
    if (!targetBoardId) {
      throw new Error(
        'NgWhiteboardService: No boardId provided and no active board set. Call setActiveBoard() first or pass boardId parameter.'
      );
    }
    const instance = this.instanceService.getInstance(targetBoardId);
    if (!instance) {
      throw new Error(
        `NgWhiteboardService: Board "${targetBoardId}" not found. Ensure the whiteboard component is initialized.`
      );
    }
    return instance;
  }

  /**
   * Get reactive signals for a specific board.
   * These signals are bound to the specified board and will update when that board's data changes.
   * Signals are lazy and won't throw errors until actually accessed.
   *
   * @param boardId - The unique identifier of the whiteboard
   * @returns Object containing all reactive signals for the board
   *
   * @example
   * ```typescript
   * class MyComponent {
   *   boardId = 'my-board';
   *   private signals = this.whiteboardService.signals(this.boardId);
   *   layers = this.signals.layers;
   *   elements = this.signals.elements;
   * }
   * ```
   */
  public signals(boardId: string) {
    return {
      elements: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.elements() : [];
      }),
      selectedElements: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.selectedElements() : [];
      }),
      config: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.config() : ({} as WhiteboardConfig);
      }),
      elementsCount: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.elementsCount() : 0;
      }),
      hasElements: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.hasElements() : false;
      }),
      selectedTool: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.selectedTool() : ToolType.Pen;
      }),
      availableTools: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.availableTools() : [];
      }),
      layers: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.layers() : [];
      }),
      activeLayerId: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.activeLayerId() : null;
      }),
      activeLayer: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.activeLayer() : null;
      }),
      canUndo: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.getCanUndoSignal()() : false;
      }),
      canRedo: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.getCanRedoSignal()() : false;
      }),
      selectionBox: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.getSelectionBoxSignal()() : { x: 0, y: 0, width: 0, height: 0 };
      }),
      boundingBox: computed(() => {
        this.instanceService.registryVersion();
        const api = this.instanceService.getInstance(boardId);
        return api ? api.getBoundingBoxSignal()() : null;
      }),
    };
  }

  /**
   * Get all registered whiteboard instance IDs.
   */
  public getAllBoards(): ReadonlyArray<string> {
    return this.instanceService.getAllInstanceIds();
  }

  /**
   * Get the total number of registered whiteboard instances.
   */
  public getBoardCount(): number {
    return this.instanceService.getInstanceCount();
  }

  /**
   * Check if a whiteboard with the given ID exists.
   */
  public hasBoard(boardId: string): boolean {
    return this.instanceService.hasInstance(boardId);
  }

  /**
   * Set elements for the whiteboard.
   */
  public setElements(elements: WhiteboardElement[]): void {
    const instance = this.getApi();
    instance.setElements(elements);
  }

  /**
   * Get all elements from the whiteboard.
   */
  public getElements(): WhiteboardElement[] {
    const instance = this.getApi();
    return instance.getElements();
  }

  /**
   * Add new elements to the whiteboard.
   */
  public addElements(elements: WhiteboardElement[]): void {
    const instance = this.getApi();
    instance.addElements(elements);
  }

  /**
   * Update multiple elements.
   */
  public updateElements(elements: Array<Partial<WhiteboardElement> & { id: string }>): void {
    const instance = this.getApi();
    instance.updateElements(elements);
  }

  /**
   * Remove elements from the whiteboard.
   */
  public removeElements(elements: WhiteboardElement[]): void {
    const instance = this.getApi();
    instance.removeElements(elements);
  }

  /**
   * Clear all elements from the whiteboard.
   */
  public clear(): void {
    const instance = this.getApi();
    instance.clear();
  }

  /**
   * Clear all elements and selection.
   */
  public clearAll(): void {
    const instance = this.getApi();
    instance.clearAll();
  }

  /**
   * Add a single element to the whiteboard.
   */
  public addElement(element: WhiteboardElement): void {
    const instance = this.getApi();
    instance.addElement(element);
  }

  /**
   * Update an existing element.
   */
  public updateElement(element: WhiteboardElement): void {
    const instance = this.getApi();
    instance.updateElement(element);
  }

  /**
   * Remove elements by their IDs.
   */
  public removeElementsByIds(elementIds: string[]): void {
    const instance = this.getApi();
    instance.removeElementsByIds(elementIds);
  }

  /**
   * Get element by ID.
   */
  public getElementById(id: string): WhiteboardElement | undefined {
    const instance = this.getApi();
    return instance.getElementById(id);
  }

  /**
   * Get multiple elements by their IDs.
   */
  public getElementsByIds(ids: string[]): WhiteboardElement[] {
    const instance = this.getApi();
    return instance.getElementsByIds(ids);
  }

  /**
   * Get next available Z-index.
   */
  public getNextZIndex(): number {
    const instance = this.getApi();
    return instance.getNextZIndex();
  }

  /**
   * Check if an element exists.
   */
  public elementExists(elementId: string): boolean {
    const instance = this.getApi();
    return instance.elementExists(elementId);
  }

  /**
   * Select elements on the whiteboard.
   */
  public selectElements(
    elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[],
    append = false
  ): void {
    const instance = this.getApi();
    instance.selectElements(elementsOrIds, append);
  }

  /**
   * Deselect an element.
   */
  public deselectElement(elementOrId: WhiteboardElement | string): void {
    const instance = this.getApi();
    instance.deselectElement(elementOrId);
  }

  /**
   * Toggle element selection.
   */
  public toggleSelection(elementOrId: WhiteboardElement | string): void {
    const instance = this.getApi();
    instance.toggleSelection(elementOrId);
  }

  /**
   * Clear the selection.
   */
  public clearSelection(): void {
    const instance = this.getApi();
    instance.clearSelection();
  }

  /**
   * Select all elements.
   */
  public selectAll(): void {
    const instance = this.getApi();
    instance.selectAll();
  }

  /**
   * Get currently selected elements.
   */
  public getSelectedElements(): WhiteboardElement[] {
    const instance = this.getApi();
    return instance.getSelectedElements();
  }

  /**
   * Update selected elements with partial properties.
   */
  public updateSelectedElements(partialElement: Partial<WhiteboardElement>): void {
    const instance = this.getApi();
    instance.updateSelectedElements(partialElement);
  }

  /**
   * Remove selected elements.
   */
  public removeSelectedElements(): void {
    const instance = this.getApi();
    instance.removeSelectedElements();
  }

  /**
   * Check if an element is selected.
   */
  public isSelected(elementOrId: WhiteboardElement | string): boolean {
    const instance = this.getApi();
    return instance.isSelected(elementOrId);
  }

  /**
   * Clear the selection box.
   */
  public clearSelectionBox(): void {
    const instance = this.getApi();
    instance.clearSelectionBox();
  }

  /**
   * Transform selected elements using a transformation function.
   */
  public transformSelectedElements(transformFn: (elements: WhiteboardElement[]) => WhiteboardElement[]): void {
    const instance = this.getApi();
    instance.transformSelectedElements(transformFn);
  }

  /**
   * Set the selection box.
   */
  public setSelectionBox(selectionBox: SelectionBox): void {
    const instance = this.getApi();
    instance.setSelectionBox(selectionBox);
  }

  /**
   * Update bounding box for selected elements.
   */
  public updateBoundingBox(): void {
    const instance = this.getApi();
    instance.updateBoundingBox();
  }

  /**
   * Get clipboard information.
   */
  public getClipboardInfo(): ClipboardInfo | null {
    const instance = this.getApi();
    return instance.getClipboardInfo();
  }

  /**
   * Copy selected elements to clipboard.
   */
  public copyElements(): void {
    const instance = this.getApi();
    instance.copyElements();
  }

  /**
   * Cut selected elements.
   */
  public cutElements(): void {
    const instance = this.getApi();
    instance.cutElements();
  }

  /**
   * Paste elements from clipboard.
   */
  public pasteElements(): void {
    const instance = this.getApi();
    instance.pasteElements();
  }

  /**
   * Duplicate selected elements.
   */
  public duplicateElements(): void {
    const instance = this.getApi();
    instance.duplicateElements();
  }

  /**
   * Delete selected elements.
   */
  public deleteSelectedElements(): void {
    const instance = this.getApi();
    instance.deleteSelectedElements();
  }

  /**
   * Bring selected elements to front.
   */
  public bringToFront(): void {
    const instance = this.getApi();
    instance.bringToFront();
  }

  /**
   * Bring selected elements forward by one level.
   */
  public bringForward(): void {
    const instance = this.getApi();
    instance.bringForward();
  }

  /**
   * Send selected elements backward by one level.
   */
  public sendBackward(): void {
    const instance = this.getApi();
    instance.sendBackward();
  }

  /**
   * Send selected elements to back.
   */
  public sendToBack(): void {
    const instance = this.getApi();
    instance.sendToBack();
  }

  /**
   * Group selected elements.
   */
  public groupSelectedElements(): void {
    const instance = this.getApi();
    instance.groupSelectedElements();
  }

  /**
   * Ungroup selected elements.
   */
  public ungroupSelectedElements(): void {
    const instance = this.getApi();
    instance.ungroupSelectedElements();
  }

  /**
   * Lock selected elements.
   */
  public lockElements(): void {
    const instance = this.getApi();
    instance.lockElements();
  }

  /**
   * Unlock selected elements.
   */
  public unlockElements(): void {
    const instance = this.getApi();
    instance.unlockElements();
  }

  /**
   * Align selected elements.
   */
  public alignElements(alignment: AlignmentType): void {
    const instance = this.getApi();
    instance.alignElements(alignment);
  }

  /**
   * Get the canvas SVG element.
   */
  public getCanvas(): SVGSVGElement {
    const instance = this.getApi();
    return instance.getCanvas();
  }

  /**
   * Set canvas dimensions.
   */
  public setCanvasDimensions(width: number, height: number): void {
    const instance = this.getApi();
    instance.setCanvasDimensions(width, height);
  }

  /**
   * Center the canvas.
   */
  public centerCanvas(): void {
    const instance = this.getApi();
    instance.centerCanvas();
  }

  /**
   * Toggle fullscreen mode.
   */
  public fullScreen(): void {
    const instance = this.getApi();
    instance.fullScreen();
  }

  /**
   * Exit fullscreen mode.
   */
  public exitFullScreen(defaultWidth?: number, defaultHeight?: number): void {
    const instance = this.getApi();
    instance.exitFullScreen(defaultWidth, defaultHeight);
  }

  /**
   * Reset canvas to default state.
   */
  public resetCanvas(): void {
    const instance = this.getApi();
    instance.resetCanvas();
  }

  /**
   * Set zoom level.
   */
  public setZoom(zoom: number): void {
    const instance = this.getApi();
    instance.setZoom(zoom);
  }

  /**
   * Zoom in.
   */
  public zoomIn(): void {
    const instance = this.getApi();
    instance.zoomIn();
  }

  /**
   * Zoom out.
   */
  public zoomOut(): void {
    const instance = this.getApi();
    instance.zoomOut();
  }

  /**
   * Reset zoom to default.
   */
  public resetZoom(): void {
    const instance = this.getApi();
    instance.resetZoom();
  }

  /**
   * Zoom to fit all elements.
   */
  public zoomToFit(): void {
    const instance = this.getApi();
    instance.zoomToFit();
  }

  /**
   * Zoom to fit selected elements.
   */
  public zoomToSelection(): void {
    const instance = this.getApi();
    instance.zoomToSelection();
  }

  /**
   * Pan the canvas by delta values.
   */
  public pan(dx: number, dy: number): void {
    const instance = this.getApi();
    instance.pan(dx, dy);
  }

  /**
   * Pan to a specific position.
   */
  public panTo(x: number, y: number): void {
    const instance = this.getApi();
    instance.panTo(x, y);
  }

  /**
   * Reset pan to default.
   */
  public resetPan(): void {
    const instance = this.getApi();
    instance.resetPan();
  }

  /**
   * Save the whiteboard in the specified format.
   */
  public async save(format: FormatType = FormatType.Base64, name = 'whiteboard'): Promise<string> {
    const instance = this.getApi();
    return instance.save(format, name);
  }

  /**
   * Add an image to the whiteboard.
   */
  public addImage(imageInfo: AddImage): void {
    const instance = this.getApi();
    instance.addImage(imageInfo);
  }

  /**
   * Import an image from a file.
   */
  public async importImageFile(file: File, x?: number, y?: number): Promise<void> {
    const instance = this.getApi();
    return instance.importImageFile(file, x, y);
  }

  /**
   * Export whiteboard data as JSON.
   */
  public exportData(): string {
    const instance = this.getApi();
    return instance.exportData();
  }

  /**
   * Import whiteboard data from JSON.
   */
  public importData(jsonData: string): void {
    const instance = this.getApi();
    instance.importData(jsonData);
  }

  /**
   * Undo the last action.
   */
  public undo(): boolean {
    const instance = this.getApi();
    return instance.undo();
  }

  /**
   * Redo the last undone action.
   */
  public redo(): boolean {
    const instance = this.getApi();
    return instance.redo();
  }

  /**
   * Get signal for undo availability.
   */
  public getCanUndoSignal(): Signal<boolean> {
    const instance = this.getApi();
    return instance.getCanUndoSignal();
  }

  /**
   * Get signal for redo availability.
   */
  public getCanRedoSignal(): Signal<boolean> {
    const instance = this.getApi();
    return instance.getCanRedoSignal();
  }

  /**
   * Clear undo/redo history.
   */
  public clearHistory(): void {
    const instance = this.getApi();
    instance.clearHistory();
  }

  /**
   * Get current whiteboard configuration.
   */
  public getConfig(): WhiteboardConfig {
    const instance = this.getApi();
    return instance.getConfig();
  }

  /**
   * Update whiteboard configuration.
   */
  public updateConfig(config: Partial<WhiteboardConfig>): void {
    const instance = this.getApi();
    instance.updateConfig(config);
  }

  /**
   * Update a single configuration value.
   */
  public updateConfigValue<K extends keyof WhiteboardConfig>(key: K, value: WhiteboardConfig[K]): void {
    const instance = this.getApi();
    instance.updateConfigValue(key, value);
  }

  /**
   * Add a new layer.
   */
  public addLayer(name?: string): void {
    const instance = this.getApi();
    instance.addLayer(name);
  }

  /**
   * Remove a layer by ID.
   */
  public removeLayer(id: string): boolean {
    const instance = this.getApi();
    return instance.removeLayer(id);
  }

  /**
   * Set the active layer.
   */
  public setActiveLayer(id: string): boolean {
    const instance = this.getApi();
    return instance.setActiveLayer(id);
  }

  /**
   * Get the active layer ID.
   */
  public getActiveLayerId(): string {
    const instance = this.getApi();
    return instance.getActiveLayerId();
  }

  /**
   * Toggle layer visibility.
   */
  public toggleLayerVisibility(id: string): boolean {
    const instance = this.getApi();
    return instance.toggleLayerVisibility(id);
  }

  /**
   * Toggle layer lock state.
   */
  public toggleLayerLock(id: string): boolean {
    const instance = this.getApi();
    return instance.toggleLayerLock(id);
  }

  /**
   * Rename a layer.
   */
  public renameLayer(id: string, name: string): boolean {
    const instance = this.getApi();
    return instance.renameLayer(id, name);
  }

  /**
   * Set layer opacity (0-1).
   */
  public setLayerOpacity(id: string, opacity: number): boolean {
    const instance = this.getApi();
    return instance.setLayerOpacity(id, opacity);
  }

  /**
   * Set layer blend mode.
   */
  public setLayerBlendMode(id: string, blendMode: BlendMode): boolean {
    const instance = this.getApi();
    return instance.setLayerBlendMode(id, blendMode);
  }

  /**
   * Move layer up in z-order.
   */
  public moveLayerUp(id: string): boolean {
    const instance = this.getApi();
    return instance.moveLayerUp(id);
  }

  /**
   * Move layer down in z-order.
   */
  public moveLayerDown(id: string): boolean {
    const instance = this.getApi();
    return instance.moveLayerDown(id);
  }

  /**
   * Reorder layers by index position.
   *
   * @example
   * ```typescript
   * this.whiteboardService.reorderLayersByIndex(2, 0);
   * ```
   */
  public reorderLayersByIndex(previousIndex: number, currentIndex: number): boolean {
    const instance = this.getApi();
    return instance.reorderLayersByIndex(previousIndex, currentIndex);
  }

  /**
   * Toggle grid visibility.
   */
  public toggleGrid(): void {
    const instance = this.getApi();
    instance.toggleGrid();
  }

  /**
   * Toggle snap to grid.
   */
  public toggleSnapToGrid(): void {
    const instance = this.getApi();
    instance.toggleSnapToGrid();
  }

  /**
   * Set grid size.
   */
  public setGridSize(size: number): void {
    const instance = this.getApi();
    instance.setGridSize(size);
  }

  /**
   * Set the active drawing tool.
   */
  public setActiveTool(tool: ToolType): void {
    const instance = this.getApi();
    instance.setActiveTool(tool);
  }

  /**
   * Get the currently active tool.
   */
  public getActiveTool(): ToolType {
    const instance = this.getApi();
    return instance.getActiveTool();
  }

  /**
   * Enable or disable a specific tool.
   */
  public setToolEnabled(toolType: ToolType, enabled: boolean): boolean {
    const instance = this.getApi();
    return instance.setToolEnabled(toolType, enabled);
  }

  /**
   * Set which tools should be enabled.
   */
  public setEnabledTools(toolTypes: ToolType[]): void {
    const instance = this.getApi();
    instance.setEnabledTools(toolTypes);
  }

  /**
   * Set cursor explicitly.
   */
  public setCursor(cursor: CursorType): void {
    const instance = this.getApi();
    instance.setCursor(cursor);
  }

  /**
   * Reset cursor to default.
   */
  public resetCursor(): void {
    const instance = this.getApi();
    instance.resetCursor();
  }

  /**
   * Convert screen coordinates to canvas coordinates.
   */
  public screenToCanvas(screenX: number, screenY: number): { x: number; y: number } {
    const instance = this.getApi();
    return instance.screenToCanvas(screenX, screenY);
  }

  /**
   * Convert canvas coordinates to screen coordinates.
   */
  public canvasToScreen(canvasX: number, canvasY: number): { x: number; y: number } {
    const instance = this.getApi();
    return instance.canvasToScreen(canvasX, canvasY);
  }

  /**
   * Get selection box signal.
   */
  public getSelectionBoxSignal(): Signal<SelectionBox> {
    const instance = this.getApi();
    return instance.getSelectionBoxSignal();
  }

  /**
   * Get bounding box signal.
   */
  public getBoundingBoxSignal(): Signal<BoundingBox | null> {
    const instance = this.getApi();
    return instance.getBoundingBoxSignal();
  }
}
