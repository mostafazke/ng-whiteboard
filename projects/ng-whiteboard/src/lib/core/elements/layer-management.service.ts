import { Injectable, signal, computed } from '@angular/core';
import { WhiteboardElement, WhiteboardLayer, LayerState, BlendMode, BLEND_MODES } from '../types';

@Injectable({
  providedIn: 'root',
})
export class LayerManagementService {
  // Core state signals
  private _layers = signal<WhiteboardLayer[]>([]);
  private _activeLayerId = signal<string>('');

  // Public readonly signals
  readonly layers = this._layers.asReadonly();
  readonly activeLayerId = this._activeLayerId.asReadonly();

  // Computed selectors
  readonly activeLayer = computed(() => {
    const layers = this._layers();
    const activeId = this._activeLayerId();
    return layers.find((layer) => layer.id === activeId) || layers[0];
  });

  readonly sortedLayers = computed(() => {
    return [...this._layers()].sort((a, b) => a.zIndex - b.zIndex);
  });

  readonly visibleLayers = computed(() => {
    return this._layers().filter((layer) => layer.visible);
  });

  readonly unlockedLayers = computed(() => {
    return this._layers().filter((layer) => !layer.locked);
  });

  constructor() {
    this.initializeDefaultLayer();
  }

  /**
   * Add a new layer
   */
  addLayer(name?: string): WhiteboardLayer {
    const layers = this._layers();
    const newZIndex = Math.max(...layers.map((l) => l.zIndex), 0) + 1;
    const layerCount = layers.length + 1;

    const newLayer: WhiteboardLayer = {
      id: this.generateLayerId(),
      name: name || `Layer ${layerCount}`,
      visible: true,
      locked: false,
      zIndex: newZIndex,
      elements: [],
      opacity: 1,
      blendMode: 'normal',
    };

    // Make all other layers invisible
    const updatedLayers = layers.map((layer) => ({
      ...layer,
      visible: false,
    }));

    this._layers.set([...updatedLayers, newLayer]);
    this.setActiveLayer(newLayer.id);

    return newLayer;
  }

  /**
   * Remove a layer (prevents deletion of last layer)
   */
  removeLayer(id: string): boolean {
    const layers = this._layers();

    // Prevent deletion of last remaining layer
    if (layers.length <= 1) {
      console.warn('Cannot delete the last remaining layer');
      return false;
    }

    const layerToRemove = layers.find((l) => l.id === id);
    if (!layerToRemove) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    // Remove layer
    const updatedLayers = layers.filter((l) => l.id !== id);
    this._layers.set(updatedLayers);

    // If active layer was removed, set new active layer
    if (this._activeLayerId() === id) {
      const newActiveLayer = updatedLayers[Math.max(0, updatedLayers.length - 1)];
      this.setActiveLayer(newActiveLayer.id);
    }

    return true;
  }

  /**
   * Duplicate a layer with all its properties and elements
   */
  duplicateLayer(
    id: string,
    elements: WhiteboardElement[]
  ): { layer: WhiteboardLayer | null; elementMap: Map<string, string> } {
    const layers = this._layers();
    const layerToDuplicate = layers.find((l) => l.id === id);

    if (!layerToDuplicate) {
      console.warn(`Layer with id ${id} not found`);
      return { layer: null, elementMap: new Map() };
    }

    // Create new layer with copied properties
    const newZIndex = Math.max(...layers.map((l) => l.zIndex), 0) + 1;
    const newLayer: WhiteboardLayer = {
      id: this.generateLayerId(),
      name: `${layerToDuplicate.name} Copy`,
      visible: true,
      locked: layerToDuplicate.locked,
      zIndex: newZIndex,
      elements: [], // Will be populated with duplicated element IDs
      opacity: layerToDuplicate.opacity,
      blendMode: layerToDuplicate.blendMode,
    };

    // Create a map of old element IDs to new element IDs
    const elementMap = new Map<string, string>();
    const layerElements = elements.filter((el) => layerToDuplicate.elements.includes(el.id));

    layerElements.forEach((element) => {
      const newElementId = crypto.randomUUID();
      elementMap.set(element.id, newElementId);
      newLayer.elements.push(newElementId);
    });

    // Add the new layer
    this._layers.set([...layers, newLayer]);
    this.setActiveLayer(newLayer.id);

    return { layer: newLayer, elementMap };
  }

  /**
   * Rename a layer
   */
  renameLayer(id: string, name: string): boolean {
    const layers = this._layers();
    const layerIndex = layers.findIndex((l) => l.id === id);

    if (layerIndex === -1) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    // Prevent renaming locked layers
    if (layers[layerIndex].locked) {
      console.warn(`Cannot rename locked layer: ${layers[layerIndex].name}`);
      return false;
    }

    const updatedLayers = [...layers];
    updatedLayers[layerIndex] = {
      ...updatedLayers[layerIndex],
      name: name.trim() || `Layer ${layerIndex + 1}`,
    };

    this._layers.set(updatedLayers);
    return true;
  }

  /**
   * Reorder layer by changing zIndex
   */
  reorderLayer(id: string, newZIndex: number): boolean {
    const layers = this._layers();
    const layerIndex = layers.findIndex((l) => l.id === id);

    if (layerIndex === -1) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    // Prevent reordering locked layers
    if (layers[layerIndex].locked) {
      console.warn(`Cannot reorder locked layer: ${layers[layerIndex].name}`);
      return false;
    }

    const updatedLayers = [...layers];
    updatedLayers[layerIndex] = {
      ...updatedLayers[layerIndex],
      zIndex: newZIndex,
    };

    this._layers.set(updatedLayers);
    return true;
  }

  /**
   * Move layer up in z-order
   */
  moveLayerUp(id: string): boolean {
    const layers = this.sortedLayers();
    const currentIndex = layers.findIndex((l) => l.id === id);

    if (currentIndex === -1 || currentIndex === layers.length - 1) {
      return false; // Layer not found or already at top
    }

    const currentLayer = layers[currentIndex];

    // Prevent moving locked layers
    if (currentLayer.locked) {
      console.warn(`Cannot move locked layer: ${currentLayer.name}`);
      return false;
    }

    const nextLayer = layers[currentIndex + 1];

    // Swap z-indices
    return this.reorderLayer(currentLayer.id, nextLayer.zIndex) && this.reorderLayer(nextLayer.id, currentLayer.zIndex);
  }

  /**
   * Move layer down in z-order
   */
  moveLayerDown(id: string): boolean {
    const layers = this.sortedLayers();
    const currentIndex = layers.findIndex((l) => l.id === id);

    if (currentIndex === -1 || currentIndex === 0) {
      return false; // Layer not found or already at bottom
    }

    const currentLayer = layers[currentIndex];

    // Prevent moving locked layers
    if (currentLayer.locked) {
      console.warn(`Cannot move locked layer: ${currentLayer.name}`);
      return false;
    }

    const prevLayer = layers[currentIndex - 1];

    // Swap z-indices
    return this.reorderLayer(currentLayer.id, prevLayer.zIndex) && this.reorderLayer(prevLayer.id, currentLayer.zIndex);
  }

  /**
   * Reorder layers by moving a layer from one position to another
   * This properly reassigns zIndex values based on the new order
   *
   * @param previousIndex - Current index in the layers array
   * @param currentIndex - Target index in the layers array
   * @returns true if successful, false otherwise
   */
  reorderLayersByIndex(previousIndex: number, currentIndex: number): boolean {
    const layers = this._layers();

    if (previousIndex === currentIndex) {
      return false; // No change needed
    }

    if (previousIndex < 0 || previousIndex >= layers.length || currentIndex < 0 || currentIndex >= layers.length) {
      console.warn('Invalid layer indices for reordering');
      return false;
    }

    const layerToMove = layers[previousIndex];

    // Prevent moving locked layers
    if (layerToMove.locked) {
      console.warn(`Cannot reorder locked layer: ${layerToMove.name}`);
      return false;
    }

    // Create new array with the layer moved to its new position
    const reorderedLayers = [...layers];
    reorderedLayers.splice(previousIndex, 1); // Remove from old position
    reorderedLayers.splice(currentIndex, 0, layerToMove); // Insert at new position

    // Reassign zIndex values based on new array order
    // Lower index = higher zIndex (renders on top)
    const updatedLayers = reorderedLayers.map((layer, index) => ({
      ...layer,
      zIndex: reorderedLayers.length - 1 - index, // Reverse: first item gets highest zIndex
    }));

    this._layers.set(updatedLayers);
    return true;
  }

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(id: string): boolean {
    return this.updateLayerProperty(id, 'visible', (current) => !current);
  }

  /**
   * Toggle layer lock state
   *
   * Behavior:
   * - Allows locking/unlocking any layer including the active layer
   * - When active layer is locked, drawing will be disabled but layer remains active
   */
  toggleLayerLock(id: string): boolean {
    const layers = this._layers();
    const layer = layers.find((l) => l.id === id);

    if (!layer) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    return this.updateLayerProperty(id, 'locked', (current) => !current);
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(id: string, opacity: number): boolean {
    const layers = this._layers();
    const layer = layers.find((l) => l.id === id);

    if (!layer) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    // Prevent changing opacity of locked layers
    if (layer.locked) {
      console.warn(`Cannot change opacity of locked layer: ${layer.name}`);
      return false;
    }

    const clampedOpacity = Math.max(0, Math.min(1, opacity));
    return this.updateLayerProperty(id, 'opacity', () => clampedOpacity);
  }

  /**
   * Set layer blend mode
   */
  setLayerBlendMode(id: string, blendMode: BlendMode): boolean {
    const layers = this._layers();
    const layer = layers.find((l) => l.id === id);

    if (!layer) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    // Prevent changing blend mode of locked layers
    if (layer.locked) {
      console.warn(`Cannot change blend mode of locked layer: ${layer.name}`);
      return false;
    }

    // Validate blend mode
    const validBlendModes = BLEND_MODES.map((mode) => mode.value);
    if (!validBlendModes.includes(blendMode)) {
      console.warn(`Invalid blend mode: ${blendMode}. Using 'normal' instead.`);
      return this.updateLayerProperty(id, 'blendMode', () => 'normal');
    }

    return this.updateLayerProperty(id, 'blendMode', () => blendMode);
  }

  /**
   * Set the active layer
   *
   * Behavior:
   * - Allows activating any layer including locked layers
   * - When a locked layer is active, drawing will be disabled
   * - Makes all other layers invisible when a layer is activated
   * - This ensures only the active layer is visible
   */
  setActiveLayer(id: string): boolean {
    const layers = this._layers();
    const layer = layers.find((l) => l.id === id);

    if (!layer) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    // Make all layers invisible except the one being activated
    const updatedLayers = layers.map((l) => ({
      ...l,
      visible: l.id === id,
    }));

    this._layers.set(updatedLayers);

    this._activeLayerId.set(id);
    return true;
  }

  /**
   * Get the active layer ID
   */
  getActiveLayerId(): string {
    return this._activeLayerId();
  }

  /**
   * Check if the active layer is in a valid drawing state
   * Valid means: exists, visible, and unlocked
   */
  isActiveLayerValid(): boolean {
    const active = this.activeLayer();
    return !!active && active.visible && !active.locked;
  }

  /**
   * Get any issues with the current active layer
   * Returns empty array if no issues
   */
  getActiveLayerIssues(): string[] {
    const active = this.activeLayer();
    if (!active) return ['No active layer'];

    const issues: string[] = [];
    if (!active.visible) issues.push('Active layer is hidden');
    if (active.locked) issues.push('Active layer is locked');
    return issues;
  }

  // ELEMENT ASSOCIATION

  /**
   * Assign element to active layer
   */
  assignElementToActiveLayer(elementId: string): boolean {
    const activeLayerId = this._activeLayerId();
    return this.assignElementToLayer(elementId, activeLayerId);
  }

  /**
   * Assign element to specific layer
   */
  assignElementToLayer(elementId: string, layerId: string): boolean {
    const layers = this._layers();
    const layerIndex = layers.findIndex((l) => l.id === layerId);

    if (layerIndex === -1) {
      console.warn(`Layer with id ${layerId} not found`);
      return false;
    }

    // Prevent assigning elements to locked layers
    if (layers[layerIndex].locked) {
      console.warn(`Cannot assign elements to locked layer: ${layers[layerIndex].name}`);
      return false;
    }

    // Remove element from all other layers first
    this.removeElementFromAllLayers(elementId);

    // Add to target layer - get fresh layers after removal
    const freshLayers = this._layers();
    const freshLayerIndex = freshLayers.findIndex((l) => l.id === layerId);
    const updatedLayers = [...freshLayers];
    const updatedElements = [...updatedLayers[freshLayerIndex].elements];

    if (!updatedElements.includes(elementId)) {
      updatedElements.push(elementId);
      updatedLayers[freshLayerIndex] = {
        ...updatedLayers[freshLayerIndex],
        elements: updatedElements,
      };
      this._layers.set(updatedLayers);
    }

    return true;
  }

  /**
   * Remove element from all layers
   */
  removeElementFromAllLayers(elementId: string): void {
    const layers = this._layers();
    const updatedLayers = layers.map((layer) => ({
      ...layer,
      elements: layer.elements.filter((id) => id !== elementId),
    }));
    this._layers.set(updatedLayers);
  }

  /**
   * Get layer containing element
   */
  getElementLayer(elementId: string): WhiteboardLayer | null {
    const layers = this._layers();
    return layers.find((layer) => layer.elements.includes(elementId)) || null;
  }

  // RENDERING HELPERS

  /**
   * Get elements from visible layers only
   */
  getVisibleElements(allElements: WhiteboardElement[]): WhiteboardElement[] {
    const visibleLayers = this.visibleLayers();
    const visibleElementIds = new Set(visibleLayers.flatMap((layer) => layer.elements));

    return allElements.filter((element) => visibleElementIds.has(element.id));
  }

  /**
   * Get elements from unlocked layers only (for editing)
   */
  getEditableElements(allElements: WhiteboardElement[]): WhiteboardElement[] {
    const unlockedLayers = this.unlockedLayers();
    const editableElementIds = new Set(unlockedLayers.flatMap((layer) => layer.elements));

    return allElements.filter((element) => editableElementIds.has(element.id));
  }

  /**
   * Get elements sorted by layer z-index
   */
  getSortedElements(allElements: WhiteboardElement[]): WhiteboardElement[] {
    const sortedLayers = this.sortedLayers();
    const elementLayerMap = new Map<string, number>();

    // Map each element to its layer's z-index
    sortedLayers.forEach((layer) => {
      layer.elements.forEach((elementId) => {
        elementLayerMap.set(elementId, layer.zIndex);
      });
    });

    return allElements.sort((a, b) => {
      const aZIndex = elementLayerMap.get(a.id) ?? 0;
      const bZIndex = elementLayerMap.get(b.id) ?? 0;
      return aZIndex - bZIndex;
    });
  }

  // EXPORT/IMPORT SUPPORT

  /**
   * Serialize layer state for saving
   */
  exportLayerState(): LayerState {
    return {
      layers: this._layers(),
      activeLayerId: this._activeLayerId(),
    };
  }

  /**
   * Restore layer state from saved data
   */
  importLayerState(state: LayerState): void {
    if (!state.layers || state.layers.length === 0) {
      console.warn('Invalid layer state provided');
      this.initializeDefaultLayer();
      return;
    }

    this._layers.set(state.layers);

    // Validate active layer
    const activeLayer = state.layers.find((l) => l.id === state.activeLayerId);
    this._activeLayerId.set(activeLayer ? state.activeLayerId : state.layers[0].id);
  }

  /**
   * Reset to default state
   */
  reset(): void {
    this.initializeDefaultLayer();
  }

  // PRIVATE HELPERS

  private initializeDefaultLayer(): void {
    const defaultLayer: WhiteboardLayer = {
      id: 'default',
      name: 'Layer 1',
      visible: true,
      locked: false,
      zIndex: 0,
      elements: [],
      opacity: 1,
      blendMode: 'normal',
    };

    this._layers.set([defaultLayer]);
    this._activeLayerId.set(defaultLayer.id);
  }

  private generateLayerId(): string {
    return `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateLayerProperty<K extends keyof WhiteboardLayer>(
    id: string,
    property: K,
    updater: (current: WhiteboardLayer[K]) => WhiteboardLayer[K]
  ): boolean {
    const layers = this._layers();
    const layerIndex = layers.findIndex((l) => l.id === id);

    if (layerIndex === -1) {
      console.warn(`Layer with id ${id} not found`);
      return false;
    }

    const updatedLayers = [...layers];
    const currentValue = updatedLayers[layerIndex][property];
    updatedLayers[layerIndex] = {
      ...updatedLayers[layerIndex],
      [property]: updater(currentValue),
    };

    this._layers.set(updatedLayers);
    return true;
  }
}
