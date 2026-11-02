import { computed, inject, Injectable, OnDestroy, Signal, signal } from '@angular/core';
import { ConfigService } from '../../config/config.service';
import { ElementsService } from '../../elements/elements.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { SelectionService } from '../../elements/selection.service';
import { IOService } from '../../input/io.service';
import { BatchHandle, HistoryService } from '../../history/history.service';
import { ToolsService } from '../../tools/tools.service';
import { BlendMode, EditorConfig, FormatType, ToolType, WhiteboardConfig, WhiteboardElement } from '../../types';
import { ZoomService } from '../../viewport/zoom.service';
import { AlignmentType } from './ui/alignment-controls/alignment-controls.component';
import { PanService } from '../../viewport';
import { computeAlignmentUpdates } from './utils/alignment';
import { mergeSelectedProperties } from './utils/selected-properties';

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
  private editBatch: BatchHandle | null = null;

  // Theme handling - use WhiteboardConfig as the source of truth
  themeSignal = computed(() => this.getConfigSignal()().theme ?? 'light');

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

  selectedPropertiesSignal = computed(() => mergeSelectedProperties(this.selectedElementsSignal()));

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

  alignElements(alignment: AlignmentType) {
    const updates = computeAlignmentUpdates(this.selectedElementsSignal(), alignment);
    if (updates.length > 0) {
      this.elementsService.updateElements(updates);
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

  /** Group the updates of a continuous edit (slider drag, native color picker) into one undo step. */
  beginEdit() {
    if (this.editBatch) return;
    this.editBatch = this.historyService.startBatch('Update properties', this.elementsService.getElements());
  }

  endEdit() {
    if (!this.editBatch) return;
    this.historyService.completeBatch(this.elementsService.getElements());
    this.editBatch.execute();
    this.editBatch = null;
  }

  ngOnDestroy() {
    this.endEdit();
  }

  // Remove currently selected elements
  removeSelectedElements() {
    this.selectionService.removeSelectedElements();
  }

  // Save/export current board
  async save(format: FormatType, title?: string): Promise<void> {
    try {
      await this.ioService.save(format, title || 'Whiteboard');
    } catch {
      // IOService already logs the failure
    }
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
