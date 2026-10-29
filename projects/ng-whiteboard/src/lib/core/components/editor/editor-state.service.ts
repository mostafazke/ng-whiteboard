import { computed, inject, Injectable, Signal, signal, effect } from '@angular/core';
import { ConfigService } from '../../config/config.service';
import { ElementsService } from '../../elements/elements.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { SelectionService } from '../../elements/selection.service';
import { HistoryService } from '../../history/history.service';
import { ToolsService } from '../../tools/tools.service';
import { BlendMode, EditorConfig, FormatType, ToolType, WhiteboardConfig, WhiteboardElement } from '../../types';
import { ZoomService } from '../../viewport/zoom.service';
import { AlignmentType } from './ui/alignment-controls/alignment-controls.component';
import { PanService } from '../../viewport';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  elements: string[]; // Element IDs in this layer
  opacity?: number; // Layer opacity (0-100)
  blendMode?: string; // Layer blend mode
}

@Injectable()
export class EditorStateService {
  private elementsService = inject(ElementsService);
  private selectionService = inject(SelectionService);
  private configService = inject(ConfigService);
  private toolsService = inject(ToolsService);
  private historyService = inject(HistoryService);
  private zoomService = inject(ZoomService);
  private panService = inject(PanService);
  private layerManagementService = inject(LayerManagementService);

  // Theme handling - use WhiteboardConfig as the source of truth
  themeSignal = computed(() => this.getConfigSignal()().theme ?? 'light');

  constructor() {
    // Sync theme between WhiteboardConfig and EditorConfig
    effect(() => {
      const theme: 'light' | 'dark' = this.themeSignal();
      const editorConfigTheme = this.getEditorConfigSignal()().theme;
      // Keep EditorConfig in sync with WhiteboardConfig
      if (editorConfigTheme !== theme) {
        this.configService.updateEditorConfigValue('theme', theme);
      }
    });
  }

  toggleTheme(): void {
    const current = this.themeSignal();
    const newTheme = current === 'light' ? 'dark' : 'light';
    // Update WhiteboardConfig as the source of truth
    this.configService.updateConfigValue('theme', newTheme);
  }

  // Reactive signals for editor state
  selectedElementsSignal = this.selectionService.getSelectedElementsSignal();
  selectedToolSignal = this.toolsService.selectedTool;

  // Layer signals - delegate to LayerManagementService
  layersSignal = computed(() => {
    // Convert WhiteboardLayer to legacy Layer interface for compatibility
    return this.layerManagementService.layers().map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      zIndex: layer.zIndex,
      elements: layer.elements,
      opacity: layer.opacity,
      blendMode: layer.blendMode,
    }));
  });
  activeLayerIdSignal = computed(() => this.layerManagementService.activeLayerId());

  canUndoSignal = this.historyService.getCanUndoSignal();
  canRedoSignal = this.historyService.getCanRedoSignal();
  isFullscreenSignal = signal<boolean>(false);
  gridVisibleSignal = signal<boolean>(false);
  snapToGridSignal = signal<boolean>(false);
  isEditorVisibleSignal = signal<boolean>(true);

  // Computed properties
  hasSelectionSignal = computed(() => this.selectedElementsSignal().length > 0);
  activeLayerSignal = computed(() => {
    const layers = this.layersSignal();
    const activeId = this.activeLayerIdSignal();
    return layers.find((layer) => layer.id === activeId) || layers[0];
  });

  selectedPropertiesSignal = computed(() => {
    const elements = this.selectedElementsSignal();
    if (elements.length === 0) return {};

    // If single element, return its properties
    if (elements.length === 1) {
      const element = elements[0];
      return {
        fillColor: element.style?.fill || '#000000',
        strokeColor: element.style?.strokeColor || '#000000',
        strokeWidth: element.style?.strokeWidth || 1,
        opacity: element.opacity || 100,
        fontSize: element.style?.fontSize || 16,
        fontFamily: element.style?.fontFamily || 'Arial',
        bold: element.style?.fontWeight === 'bold',
        italic: element.style?.fontStyle === 'italic',
        dasharray: element.style?.dasharray || '',
      };
    }

    // If multiple elements, return empty for now (simplified)
    return {};
  });

  private updateLayersFromElements(elements: WhiteboardElement[]) {
    // Group elements by their layer IDs
    const elementsByLayer = elements.reduce((acc, element) => {
      const layerId = element.layerId || 'default';
      if (!acc[layerId]) {
        acc[layerId] = [];
      }
      acc[layerId].push(element.id);
      return acc;
    }, {} as Record<string, string[]>);

    // Update layers with their elements using LayerManagementService
    const layers = this.layersSignal();
    layers.forEach((layer) => {
      // TODO: Update LayerManagementService to handle bulk element assignment
      // For now, we'll skip this update to avoid breaking the computed signal
      console.debug(`Layer ${layer.id} has ${elementsByLayer[layer.id]?.length || 0} elements`);
    });
  }

  // Public API methods
  getConfigSignal(): Signal<WhiteboardConfig> {
    return this.configService.getConfigSignal();
  }

  getEditorConfigSignal(): Signal<EditorConfig> {
    return this.configService.getEditorConfigSignal();
  }

  selectTool(tool: ToolType) {
    this.toolsService.setActiveTool(tool);
  }

  /**
   * Align selected elements
   */
  alignElements(alignment: AlignmentType) {
    const selectedElements = this.selectedElementsSignal();
    if (selectedElements.length < 2) return; // Need at least 2 elements to align

    console.log('Aligning elements:', alignment, selectedElements.length);

    // Create element data with positions and dimensions
    const elementData = selectedElements.map((element) => {
      // For now, use element's x, y and assume basic dimensions
      // In a real implementation, you'd use proper bounds calculation
      let width = 50; // Default width
      let height = 50; // Default height

      // Try to get actual dimensions from element properties
      if (element.type === 'rectangle' || element.type === 'ellipse') {
        const shapedElement = element as WhiteboardElement & { width?: number; height?: number };
        width = shapedElement.width || 50;
        height = shapedElement.height || 50;
      } else if (element.type === 'text') {
        // Estimate text dimensions
        const textElement = element as WhiteboardElement & { text?: string };
        width = Math.max((textElement.text?.length || 5) * 10, 50);
        height = (element.style?.fontSize || 16) + 10;
      }

      return {
        element,
        x: element.x,
        y: element.y,
        width,
        height,
        centerX: element.x + width / 2,
        centerY: element.y + height / 2,
        right: element.x + width,
        bottom: element.y + height,
      };
    });

    console.log('Element data:', elementData);

    const updates: (Partial<WhiteboardElement> & { id: string })[] = [];

    switch (alignment) {
      case 'align-left': {
        // Align all elements to the leftmost element's left edge
        const leftmostX = Math.min(...elementData.map((ed) => ed.x));
        elementData.forEach(({ element }) => {
          updates.push({
            id: element.id,
            x: leftmostX,
          });
        });
        break;
      }

      case 'align-center': {
        // Align all elements to the average center X position
        const avgCenterX = elementData.reduce((sum, ed) => sum + ed.centerX, 0) / elementData.length;
        elementData.forEach(({ element, width }) => {
          updates.push({
            id: element.id,
            x: avgCenterX - width / 2,
          });
        });
        break;
      }

      case 'align-right': {
        // Align all elements to the rightmost element's right edge
        const rightmostX = Math.max(...elementData.map((ed) => ed.right));
        elementData.forEach(({ element, width }) => {
          updates.push({
            id: element.id,
            x: rightmostX - width,
          });
        });
        break;
      }

      case 'align-top': {
        // Align all elements to the topmost element's top edge
        const topmostY = Math.min(...elementData.map((ed) => ed.y));
        elementData.forEach(({ element }) => {
          updates.push({
            id: element.id,
            y: topmostY,
          });
        });
        break;
      }

      case 'align-middle': {
        // Align all elements to the average center Y position
        const avgCenterY = elementData.reduce((sum, ed) => sum + ed.centerY, 0) / elementData.length;
        elementData.forEach(({ element, height }) => {
          updates.push({
            id: element.id,
            y: avgCenterY - height / 2,
          });
        });
        break;
      }

      case 'align-bottom': {
        // Align all elements to the bottommost element's bottom edge
        const bottommostY = Math.max(...elementData.map((ed) => ed.bottom));
        elementData.forEach(({ element, height }) => {
          updates.push({
            id: element.id,
            y: bottommostY - height,
          });
        });
        break;
      }

      case 'distribute-horizontal': {
        if (selectedElements.length >= 3) {
          this.distributeElementsHorizontally(elementData);
          return;
        }
        break;
      }

      case 'distribute-vertical': {
        if (selectedElements.length >= 3) {
          this.distributeElementsVertically(elementData);
          return;
        }
        break;
      }
    }

    console.log('Alignment updates:', updates);

    // Apply updates
    if (updates.length > 0) {
      // TODO: Implement proper element updates through DataService API
      // this.dataService.updateElements(updates as WhiteboardElement[]);
      // Update selected elements signal to reflect changes
    }
  }

  /**
   * Distribute elements horizontally with equal spacing
   */
  private distributeElementsHorizontally(
    elementData: Array<{
      element: WhiteboardElement;
      x: number;
      y: number;
      width: number;
      height: number;
      centerX: number;
      centerY: number;
      right: number;
      bottom: number;
    }>
  ) {
    // Sort elements by X position (left to right)
    const sortedElements = [...elementData].sort((a, b) => a.x - b.x);

    if (sortedElements.length < 3) return;

    // Keep first and last elements in place, distribute middle elements
    const firstElement = sortedElements[0];
    const lastElement = sortedElements[sortedElements.length - 1];

    const totalSpaceAvailable = lastElement.x - (firstElement.x + firstElement.width);
    const middleElements = sortedElements.slice(1, -1);
    const totalMiddleWidths = middleElements.reduce((sum, ed) => sum + ed.width, 0);
    const spacing = (totalSpaceAvailable - totalMiddleWidths) / (middleElements.length + 1);

    const updates: (Partial<WhiteboardElement> & { id: string })[] = [];
    let currentX = firstElement.x + firstElement.width + spacing;

    middleElements.forEach(({ element, width }) => {
      updates.push({
        id: element.id,
        x: currentX,
      });
      currentX += width + spacing;
    });

    if (updates.length > 0) {
      // TODO: Implement proper element updates through DataService API
      // this.dataService.updateElements(updates as WhiteboardElement[]);
    }
  }

  /**
   * Distribute elements vertically with equal spacing
   */
  private distributeElementsVertically(
    elementData: Array<{
      element: WhiteboardElement;
      x: number;
      y: number;
      width: number;
      height: number;
      centerX: number;
      centerY: number;
      right: number;
      bottom: number;
    }>
  ) {
    // Sort elements by Y position (top to bottom)
    const sortedElements = [...elementData].sort((a, b) => a.y - b.y);

    if (sortedElements.length < 3) return;

    // Keep first and last elements in place, distribute middle elements
    const firstElement = sortedElements[0];
    const lastElement = sortedElements[sortedElements.length - 1];

    const totalSpaceAvailable = lastElement.y - (firstElement.y + firstElement.height);
    const middleElements = sortedElements.slice(1, -1);
    const totalMiddleHeights = middleElements.reduce((sum, ed) => sum + ed.height, 0);
    const spacing = (totalSpaceAvailable - totalMiddleHeights) / (middleElements.length + 1);

    const updates: (Partial<WhiteboardElement> & { id: string })[] = [];
    let currentY = firstElement.y + firstElement.height + spacing;

    middleElements.forEach(({ element, height }) => {
      updates.push({
        id: element.id,
        y: currentY,
      });
      currentY += height + spacing;
    });

    if (updates.length > 0) {
      // TODO: Implement proper element updates through DataService API
      // this.dataService.updateElements(updates as WhiteboardElement[]);
      // Update selected elements signal
    }
  }

  updateTitle(title: string) {
    this.configService.updateEditorConfigValue('title', title);
  }

  // Zoom management
  setZoom(zoom: number) {
    this.zoomService.zoom(zoom);
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

  // Clear all elements
  clear() {
    this.elementsService.clear();
  }

  /**
   * Update background color of the canvas
   */
  updateBackgroundColor(color: string) {
    const config = this.configService.getConfig();
    this.configService.updateConfig({ ...config, backgroundColor: color });
  }

  /**
   * Update stroke color for selected elements or global config
   */
  updateStrokeColor(color: string) {
    const selectedElements = this.selectedElementsSignal();

    // If no selection, update global config
    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('strokeColor', color);
      return;
    }

    const updates = selectedElements.map((element) => ({
      id: element.id,
      style: {
        ...element.style,
        strokeColor: color,
        // For text elements, update color instead of strokeColor
        ...(element.type === 'text' ? { color } : {}),
      },
    }));

    this.elementsService.updateElements(updates);
  }

  /**
   * Update fill color for selected elements or global config
   */
  updateFillColor(color: string) {
    const selectedElements = this.selectedElementsSignal();

    // If no selection, update global config
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

    this.elementsService.updateElements(updates);
  }

  /**
   * Update stroke width for selected elements or global config
   */
  updateStrokeWidth(width: number) {
    const selectedElements = this.selectedElementsSignal();

    // If no selection, update global config
    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('strokeWidth', width);
      return;
    }

    const updates = selectedElements.map((element) => ({
      id: element.id,
      style: {
        ...element.style,
        strokeWidth: width,
      },
    }));

    this.elementsService.updateElements(updates);
  }

  /**
   * Update opacity for selected elements only (not available in global config)
   */
  updateOpacity(opacity: number) {
    const selectedElements = this.selectedElementsSignal();
    if (selectedElements.length === 0) return;

    const updates = selectedElements.map((element) => ({
      id: element.id,
      opacity,
    }));

    this.elementsService.updateElements(updates);
  }

  /**
   * Update font size for selected text elements or global config
   */
  updateFontSize(fontSize: number) {
    const selectedElements = this.selectedElementsSignal();

    // If no selection, update global config
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

    if (updates.length > 0) {
      this.elementsService.updateElements(updates);
    }
  }

  /**
   * Update font family for selected text elements or global config
   */
  updateFontFamily(fontFamily: string) {
    const selectedElements = this.selectedElementsSignal();

    // If no selection, update global config
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

    if (updates.length > 0) {
      this.elementsService.updateElements(updates);
    }
  }

  /**
   * Update font weight (bold/normal) for selected text elements only
   */
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

    if (updates.length > 0) {
      this.elementsService.updateElements(updates);
    }
  }

  /**
   * Update font style (italic/normal) for selected text elements only
   */
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

    if (updates.length > 0) {
      this.elementsService.updateElements(updates);
    }
  }

  /**
   * Update dash array (line style) for selected elements or global config
   */
  updateDashArray(dasharray: string) {
    const selectedElements = this.selectedElementsSignal();

    // If no selection, update global config
    if (selectedElements.length === 0) {
      this.configService.updateConfigValue('dasharray', dasharray);
      return;
    }

    const updates = selectedElements.map((element) => ({
      id: element.id,
      style: {
        ...element.style,
        dasharray,
      },
    }));

    this.elementsService.updateElements(updates);
  }

  /**
   * Generic method to update any property for selected elements or global config
   */
  updateElementProperty(property: string, value: string | number | boolean) {
    // Handle different property types - each method handles selection vs config internally
    switch (property) {
      case 'backgroundColor':
        this.updateBackgroundColor(value as string);
        break;
      case 'strokeColor':
        this.updateStrokeColor(value as string);
        break;
      case 'fillColor':
        this.updateFillColor(value as string);
        break;
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
      case 'dasharray':
        this.updateDashArray(value as string);
        break;
      default: {
        // Generic property update for style properties (element-only)
        const selectedElements = this.selectedElementsSignal();
        if (selectedElements.length === 0) return;

        const updates = selectedElements.map((element) => ({
          id: element.id,
          style: {
            ...element.style,
            [property]: value,
          },
        }));
        this.elementsService.updateElements(updates);
      }
    }
  }

  // Remove currently selected elements
  removeSelectedElements() {
    this.selectionService.removeSelectedElements();
  }

  // Save/export current board
  save(format: FormatType, title?: string) {
    // Get data from elementsService
    const data = this.elementsService.getElements();
    // For now simply emit serialized data; format hint included in title suffix
    console.log('Saving whiteboard:', { format, title: title || 'Whiteboard', elementCount: data.length });
  }

  undo() {
    const elements = this.historyService.undo();
    if (elements) {
      this.elementsService.setElements(elements);
      this.selectionService.clearSelection();
    }
  }

  redo() {
    const elements = this.historyService.redo();
    if (elements) {
      this.elementsService.setElements(elements);
      this.selectionService.clearSelection();
    }
  }

  // Grid management
  toggleGrid() {
    this.gridVisibleSignal.update((visible) => !visible);
    const config = this.configService.getConfig();
    this.configService.updateConfig({ ...config, enableGrid: this.gridVisibleSignal() });
  }

  toggleSnapToGrid() {
    this.snapToGridSignal.update((snap) => !snap);
    const config = this.configService.getConfig();
    this.configService.updateConfig({ ...config, snapToGrid: this.snapToGridSignal() });
  }

  // Fullscreen management
  toggleFullscreen() {
    this.isFullscreenSignal.update((fs) => !fs);
  }

  // Editor visibility
  toggleEditorVisibility() {
    this.isEditorVisibleSignal.update((visible) => !visible);
  }

  getActiveLayerId(): string {
    return this.activeLayerIdSignal();
  }

  getVisibleElements(elements: WhiteboardElement[]): WhiteboardElement[] {
    const layers = this.layersSignal();
    const visibleLayerIds = layers.filter((layer) => layer.visible).map((layer) => layer.id);

    return elements.filter((element) => {
      const layerId = element.layerId || 'default';
      return visibleLayerIds.includes(layerId);
    });
  }

  // ============================================================================
  // ============================================================================
  // LAYER MANAGEMENT METHODS - Delegate to LayerManagementService
  // ============================================================================

  /**
   * Add a new layer
   */
  addLayer(name?: string): Layer {
    const whiteboardLayer = this.layerManagementService.addLayer(name);
    // Convert WhiteboardLayer to legacy Layer interface
    return {
      id: whiteboardLayer.id,
      name: whiteboardLayer.name,
      visible: whiteboardLayer.visible,
      locked: whiteboardLayer.locked,
      zIndex: whiteboardLayer.zIndex,
      elements: whiteboardLayer.elements,
    };
  }

  /**
   * Remove a layer
   */
  removeLayer(layerId: string): boolean {
    return this.layerManagementService.removeLayer(layerId);
  }

  /**
   * Update layer properties
   */
  updateLayer(layerId: string, updates: Partial<Layer>): boolean {
    let success = true;

    if (updates.name !== undefined) {
      success = this.layerManagementService.renameLayer(layerId, updates.name) && success;
    }

    if (updates.visible !== undefined) {
      const layer = this.layerManagementService.layers().find((l) => l.id === layerId);
      if (layer && layer.visible !== updates.visible) {
        success = this.layerManagementService.toggleLayerVisibility(layerId) && success;
      }
    }

    if (updates.locked !== undefined) {
      const layer = this.layerManagementService.layers().find((l) => l.id === layerId);
      if (layer && layer.locked !== updates.locked) {
        success = this.layerManagementService.toggleLayerLock(layerId) && success;
      }
    }

    if (updates.zIndex !== undefined) {
      success = this.layerManagementService.reorderLayer(layerId, updates.zIndex) && success;
    }

    return success;
  }

  /**
   * Set active layer
   */
  setActiveLayer(layerId: string): boolean {
    return this.layerManagementService.setActiveLayer(layerId);
  }

  /**
   * Move layer up in z-order
   */
  moveLayerUp(layerId: string): boolean {
    return this.layerManagementService.moveLayerUp(layerId);
  }

  /**
   * Move layer down in z-order
   */
  moveLayerDown(layerId: string): boolean {
    return this.layerManagementService.moveLayerDown(layerId);
  }

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(layerId: string): boolean {
    return this.layerManagementService.toggleLayerVisibility(layerId);
  }

  /**
   * Toggle layer lock
   */
  toggleLayerLock(layerId: string): boolean {
    return this.layerManagementService.toggleLayerLock(layerId);
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(layerId: string, opacity: number): boolean {
    return this.layerManagementService.setLayerOpacity(layerId, opacity);
  }

  /**
   * Set layer blend mode
   */
  setLayerBlendMode(layerId: string, blendMode: BlendMode): boolean {
    return this.layerManagementService.setLayerBlendMode(layerId, blendMode);
  }
}
