import { computed, Injectable, signal, Signal } from '@angular/core';
import { EventBusService } from '../event-bus';
import { CanvasService } from '../canvas/canvas.service';
import { ClipboardService } from '../input/clipboard.service';
import { ToolsService } from '../tools/tools.service';
import { AlignmentType, BoundingBox, SelectionBox, ToolType, WhiteboardElement } from '../types';
import { WhiteboardEvent } from '../types/events';
import { getElementBounds } from '../utils/dom';
import { getCombinedScreenBounds } from '../utils/geometry/transform-utils';
import { ElementsService } from './elements.service';

@Injectable({ providedIn: 'root' })
export class SelectionService {
  private readonly OFFSET_INCREMENT = 20;

  // Selection state
  private readonly selectedElementIdsSignal = signal<Set<string>>(new Set());
  private readonly selectionBoxSignal = signal<SelectionBox>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    visible: false,
  });
  private readonly boundingBoxSignal = signal<BoundingBox | null>(null);

  // Derived signals
  readonly selectedIdsSignal = computed(() => Array.from(this.selectedElementIdsSignal()));
  readonly hasSelectionSignal = computed(() => this.selectedElementIdsSignal().size > 0);

  private getElementsFn?: () => WhiteboardElement[];
  private updateElementsFn?: (elements: (Partial<WhiteboardElement> & { id: string })[], history?: boolean) => void;
  private removeElementsFn?: (elements: WhiteboardElement[], history?: boolean) => void;

  constructor(
    private eventBus: EventBusService,
    private clipboardService: ClipboardService,
    private elementsService: ElementsService,
    private toolsService: ToolsService,
    private canvasService: CanvasService
  ) {
    this.initializeDataProviders();
  }

  private initializeDataProviders(): void {
    this.getElementsFn = () => this.elementsService.getElements();
    this.updateElementsFn = (updates) => this.elementsService.updateElements(updates);
    this.removeElementsFn = (elements, history) => this.elementsService.removeElements(elements, history);
  }

  cutElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) return;

    this.clipboardService.cut(selectedElements);
    this.deleteSelectedElements();
  }

  copyElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) return;

    this.clipboardService.copy(selectedElements);
  }

  pasteElements(): void {
    const pastedElements = this.clipboardService.paste();
    if (pastedElements.length > 0) {
      this.selectElements(pastedElements);
    }
  }

  duplicateElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) return;

    const duplicatedElements = this.clipboardService.duplicateElements(selectedElements);
    if (duplicatedElements.length > 0) {
      this.selectElements(duplicatedElements);
    }
  }

  deleteSelectedElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.removeElementsFn) return;

    this.removeElementsFn(selectedElements, true);
    this.clearSelection();

    // Emit granular event for elements removal
    this.eventBus.emit(WhiteboardEvent.ElementsRemoved, selectedElements);
    // Emit data change event
    this.eventBus.emit(WhiteboardEvent.DataChange, this.elementsService.getElements());
  }

  getSelectedIds(): string[] {
    return this.selectedIdsSignal();
  }

  /**
   * Get currently selected elements
   */
  getSelectedElements(): WhiteboardElement[] {
    if (!this.getElementsFn) {
      console.warn('Element data provider not set');
      return [];
    }

    const ids = this.getSelectedIds();
    return this.getElementsFn().filter((el) => ids.includes(el.id));
  }

  getSelectedElementsSignal(): Signal<WhiteboardElement[]> {
    return computed(() => this.getSelectedElements());
  }

  /**
   * Check if element is selected
   */
  isSelected(elementOrId: WhiteboardElement | string): boolean {
    const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
    return this.selectedElementIdsSignal().has(id);
  }

  /**
   * Get selection count
   */
  getSelectionCount(): number {
    return this.selectedElementIdsSignal().size;
  }

  /**
   * Check if any elements are selected
   */
  hasSelection(): boolean {
    return this.getSelectionCount() > 0;
  }

  // SELECTION OPERATIONS

  /**
   * Select elements by reference or ID, with option to append to existing selection
   */
  selectElements(elementsOrIds: WhiteboardElement | WhiteboardElement[] | string | string[], append = false): void {
    const incoming = Array.isArray(elementsOrIds) ? elementsOrIds : [elementsOrIds];
    const selectedIds = incoming.map((el) => (typeof el === 'string' ? el : el.id));

    // Expand selection to include all grouped elements
    const expandedIds = this.expandSelectionToIncludeGroups(selectedIds);

    const currentSelection = Array.from(this.selectedElementIdsSignal());
    const newSelection = append ? [...new Set([...currentSelection, ...expandedIds])] : expandedIds;

    this.selectedElementIdsSignal.set(new Set(newSelection));

    if (newSelection.length > 0) {
      this.toolsService.setActiveTool(ToolType.Select);
    }

    // Get the updated selection elements after group expansion
    const fullSelectionElements = this.getSelectedElements();

    this.updateBoundingBoxFromElements(fullSelectionElements);
    this.eventBus.emit(WhiteboardEvent.ElementsSelected, fullSelectionElements);
  }

  /**
   * Deselect specific element
   */
  deselectElement(elementOrId: WhiteboardElement | string): void {
    const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
    const current = new Set(this.selectedElementIdsSignal());

    if (current.has(id)) {
      // Expand deselection to include all grouped elements
      const expandedIds = this.expandSelectionToIncludeGroups([id]);

      expandedIds.forEach((expandedId) => {
        current.delete(expandedId);
      });

      this.selectedElementIdsSignal.set(current);
      this.updateBoundingBox();

      const selectedElements = this.getSelectedElements();
      this.eventBus.emit(WhiteboardEvent.ElementsSelected, selectedElements);
    }
  }

  /**
   * Toggle selection of element
   */
  toggleSelection(elementOrId: WhiteboardElement | string): void {
    const id = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
    const current = new Set(this.selectedElementIdsSignal());
    const wasSelected = current.has(id);

    // Expand to include all grouped elements
    const expandedIds = this.expandSelectionToIncludeGroups([id]);

    if (wasSelected) {
      // Deselect all elements in the group
      expandedIds.forEach((expandedId) => {
        current.delete(expandedId);
      });
    } else {
      // Select all elements in the group
      expandedIds.forEach((expandedId) => {
        current.add(expandedId);
      });
      // Automatically activate select tool when an element gets selected
      this.toolsService.setActiveTool(ToolType.Select);
    }

    this.selectedElementIdsSignal.set(current);
    this.updateBoundingBox();

    const selectedElements = this.getSelectedElements();
    this.eventBus.emit(WhiteboardEvent.ElementsSelected, selectedElements);
  }

  /**
   * Clear all selection
   */
  clearSelection(): void {
    this.selectedElementIdsSignal.set(new Set());
    this.clearBoundingBox();
    this.eventBus.emit(WhiteboardEvent.ElementsSelected, []);
  }

  /**
   * Select all elements
   */
  selectAll(): void {
    if (!this.getElementsFn) {
      console.warn('Element data provider not set');
      return;
    }

    const allElements = this.getElementsFn();
    const ids = new Set(allElements.map((el) => el.id));
    this.selectedElementIdsSignal.set(ids);

    // Automatically activate select tool when elements are selected
    if (allElements.length > 0) {
      this.toolsService.setActiveTool(ToolType.Select);
    }

    this.updateBoundingBox();

    this.eventBus.emit(WhiteboardEvent.ElementsSelected, allElements);
  }

  /**
   * Select elements within a rectangular area
   */
  selectElementsInArea(area: { x: number; y: number; width: number; height: number }): void {
    if (!this.getElementsFn) {
      console.warn('Element data provider not set');
      return;
    }

    const allElements = this.getElementsFn();
    const selectedIds: string[] = [];

    allElements.forEach((element) => {
      const bounds = getElementBounds(element);

      // Check if element intersects with selection area
      const intersects = !(
        bounds.maxX < area.x ||
        bounds.minX > area.x + area.width ||
        bounds.maxY < area.y ||
        bounds.minY > area.y + area.height
      );

      if (intersects) {
        selectedIds.push(element.id);
      }
    });

    if (selectedIds.length > 0) {
      // Expand to include grouped elements - this will be handled by selectElements
      this.selectElements(selectedIds);
    }
  }

  // SELECTION BOX (drag selection rectangle)

  /**
   * Set selection box state
   */
  setSelectionBox(box: SelectionBox): void {
    this.selectionBoxSignal.set(box);
  }

  /**
   * Get current selection box
   */
  getSelectionBox(): SelectionBox {
    return this.selectionBoxSignal();
  }

  /**
   * Get selection box signal
   */
  getSelectionBoxSignal(): Signal<SelectionBox> {
    return this.selectionBoxSignal.asReadonly();
  }

  /**
   * Clear selection box
   */
  clearSelectionBox(): void {
    this.selectionBoxSignal.set({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      visible: false,
    });
  }

  // BOUNDING BOX (transform handles around selection)

  /**
   * Update bounding box based on current selection
   */
  updateBoundingBox(): void {
    const selectedElements = this.getSelectedElements();
    this.updateBoundingBoxFromElements(selectedElements);
  }

  /**
   * Get current bounding box
   */
  getBoundingBox(): BoundingBox | null {
    return this.boundingBoxSignal();
  }

  /**
   * Get bounding box signal
   */
  getBoundingBoxSignal(): Signal<BoundingBox | null> {
    return this.boundingBoxSignal.asReadonly();
  }

  /**
   * Clear bounding box
   */
  clearBoundingBox(): void {
    this.boundingBoxSignal.set(null);
  }

  /**
   * Set bounding box directly (useful for dynamic updates during rotation)
   */
  setBoundingBox(bbox: BoundingBox | null): void {
    this.boundingBoxSignal.set(bbox);
  }

  // INTERNAL HELPERS

  /**
   * Get all elements that belong to the same groups as the provided elements
   */
  private expandSelectionToIncludeGroups(elementIds: string[]): string[] {
    if (!this.getElementsFn) return elementIds;

    const allElements = this.getElementsFn();
    const elementsToExpand = allElements.filter((el) => elementIds.includes(el.id));
    const groupIds = new Set(
      elementsToExpand
        .map((el) => el.groupId)
        .filter((groupId): groupId is string => groupId !== undefined && groupId !== null)
    );

    if (groupIds.size === 0) {
      return elementIds; // No groups, return original selection
    }

    // Find all elements that belong to any of these groups
    const expandedElements = allElements.filter((el) => {
      return (
        elementIds.includes(el.id) || // Original selection
        (el.groupId && groupIds.has(el.groupId)) // Elements in the same groups
      );
    });

    return expandedElements.map((el) => el.id);
  }

  private calculateBoundingBox(elements: WhiteboardElement[]): BoundingBox {
    let bounds;
    let rotation = 0;

    if (elements.length === 1) {
      // For single element, the bounding box should match the element's non-rotated bounds
      // The bounding box will rotate with the element via SVG transform
      const element = elements[0];
      rotation = element.rotation || 0;

      // Get bounds in local space (relative to element origin)
      // For rectangles, this returns {minX: element.x, minY: element.y, width, height}
      bounds = getElementBounds(element);
    } else {
      // For multiple elements, use screen-space bounds that account for rotation
      const combinedBounds = getCombinedScreenBounds(elements);
      if (!combinedBounds) {
        throw new Error('Cannot calculate bounding box for empty element list');
      }
      bounds = combinedBounds;
      rotation = 0; // No rotation for multi-selection
    }

    const { minX, minY, maxX, maxY, width, height } = bounds;
    const centerX = minX + width / 2;
    const handleOffset = 20;

    return {
      x: minX,
      y: minY,
      width,
      height,
      handles: {
        topLeft: { x: minX, y: minY },
        topRight: { x: maxX, y: minY },
        bottomLeft: { x: minX, y: maxY },
        bottomRight: { x: maxX, y: maxY },
        rotateHandle: { x: centerX, y: minY - handleOffset },
      },
      rotation,
    };
  }

  private updateBoundingBoxFromElements(elements: WhiteboardElement[]): void {
    if (!elements || elements.length === 0) {
      this.clearBoundingBox();
      return;
    }
    this.boundingBoxSignal.set(this.calculateBoundingBox(elements));
  }

  // SELECTION TRANSFORMATION HELPERS

  /**
   * Update all selected elements with partial data
   */
  updateSelectedElements(
    partial: Partial<WhiteboardElement>,
    updateElementsFn?: (elements: (Partial<WhiteboardElement> & { id: string })[], history?: boolean) => void
  ): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) return;

    // Prefer provided updater, otherwise use internal elementsService updater
    const updater = updateElementsFn || this.updateElementsFn;
    if (!updater) return; // Nothing to do if no updater available

    // Create update patches for all selected elements
    const updates = selectedElements.map((element) => ({
      ...partial,
      id: element.id,
    }));

    // Apply updates through the provided function
    updater(updates, true);

    // Update bounding box to reflect changes
    this.updateBoundingBox();

    // Emit selection event to update UI
    const updatedElements = this.getSelectedElements();
    this.eventBus.emit(WhiteboardEvent.ElementsSelected, updatedElements);
  }

  /**
   * Transform selected elements using a transformation function
   */
  transformSelectedElements(
    transformFn: (elements: WhiteboardElement[]) => WhiteboardElement[],
    updateElementsFn?: (elements: (Partial<WhiteboardElement> & { id: string })[], history?: boolean) => void
  ): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) return;

    const updater = updateElementsFn || this.updateElementsFn;
    if (!updater) return;

    const transformedElements = transformFn(selectedElements);

    // Apply updates through the provided function
    const updates = transformedElements.map((el) => ({ ...el, id: el.id }));
    updater(updates, true);

    // Update bounding box to reflect changes
    this.updateBoundingBox();

    // Emit selection event to update UI
    const updatedElements = this.getSelectedElements();
    this.eventBus.emit(WhiteboardEvent.ElementsSelected, updatedElements);
  }

  // SELECTION UTILITIES

  /**
   * Get selection bounds (combined bounds of all selected elements)
   */
  getSelectionBounds(): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const selectedElements = this.getSelectedElements();

    if (selectedElements.length === 0) {
      return null;
    }

    const allBounds = selectedElements.map(getElementBounds);

    return {
      minX: Math.min(...allBounds.map((b) => b.minX)),
      minY: Math.min(...allBounds.map((b) => b.minY)),
      maxX: Math.max(...allBounds.map((b) => b.maxX)),
      maxY: Math.max(...allBounds.map((b) => b.maxY)),
    };
  }

  /**
   * Check if selection contains specific element type
   */
  selectionContainsType(elementType: string): boolean {
    return this.getSelectedElements().some((el) => el.type === elementType);
  }

  /**
   * Get unique element types in current selection
   */
  getSelectedElementTypes(): string[] {
    const types = this.getSelectedElements().map((el) => el.type);
    return [...new Set(types)];
  }

  /**
   * Remove selected elements
   */
  removeSelectedElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) {
      return;
    }

    if (this.removeElementsFn) {
      this.removeElementsFn(selectedElements, true);
      this.clearSelection();
    }
  }

  // Z-INDEX OPERATIONS

  /**
   * Bring selected elements to front
   */
  bringToFront(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.getElementsFn || !this.updateElementsFn) return;

    const allElements = this.getElementsFn();
    const maxZIndex = Math.max(...allElements.map((el: WhiteboardElement) => el.zIndex || 0));

    const updates = selectedElements.map((element, index) => ({
      id: element.id,
      zIndex: maxZIndex + index + 1,
    }));

    this.updateElementsFn(updates);
  }

  /**
   * Bring selected elements forward by one level
   */
  bringForward(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.getElementsFn || !this.updateElementsFn) return;

    const allElements = this.getElementsFn();

    // Sort all elements by z-index
    const sortedElements = [...allElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const updates: (Partial<WhiteboardElement> & { id: string })[] = [];

    selectedElements.forEach((selectedElement) => {
      const currentIndex = sortedElements.findIndex((el) => el.id === selectedElement.id);

      // Find the next non-selected element ahead of this one
      let targetIndex = currentIndex + 1;
      while (
        targetIndex < sortedElements.length &&
        selectedElements.some((sel) => sel.id === sortedElements[targetIndex].id)
      ) {
        targetIndex++;
      }

      // If there's an element to swap with
      if (targetIndex < sortedElements.length) {
        const targetElement = sortedElements[targetIndex];
        updates.push({
          id: selectedElement.id,
          zIndex: targetElement.zIndex,
        });
        updates.push({
          id: targetElement.id,
          zIndex: selectedElement.zIndex,
        });
      }
    });

    if (updates.length > 0) {
      this.updateElementsFn(updates);
    }
  }

  /**
   * Send selected elements backward by one level
   */
  sendBackward(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.getElementsFn || !this.updateElementsFn) return;

    const allElements = this.getElementsFn();

    // Sort all elements by z-index
    const sortedElements = [...allElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const updates: (Partial<WhiteboardElement> & { id: string })[] = [];

    selectedElements.forEach((selectedElement) => {
      const currentIndex = sortedElements.findIndex((el) => el.id === selectedElement.id);

      // Find the previous non-selected element behind this one
      let targetIndex = currentIndex - 1;
      while (targetIndex >= 0 && selectedElements.some((sel) => sel.id === sortedElements[targetIndex].id)) {
        targetIndex--;
      }

      // If there's an element to swap with
      if (targetIndex >= 0) {
        const targetElement = sortedElements[targetIndex];
        updates.push({
          id: selectedElement.id,
          zIndex: targetElement.zIndex,
        });
        updates.push({
          id: targetElement.id,
          zIndex: selectedElement.zIndex,
        });
      }
    });

    if (updates.length > 0) {
      this.updateElementsFn(updates);
    }
  }

  /**
   * Send selected elements to back
   */
  sendToBack(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.getElementsFn || !this.updateElementsFn) return;

    // Start from z-index 1 and assign sequential values
    const updates = selectedElements.map((element, index) => ({
      id: element.id,
      zIndex: index + 1,
    }));

    this.updateElementsFn(updates);

    // Shift all other elements up to make room
    const allElements = this.getElementsFn();
    const otherElements = allElements.filter(
      (el: WhiteboardElement) => !selectedElements.some((selected) => selected.id === el.id)
    );

    const otherUpdates = otherElements.map((element: WhiteboardElement, index: number) => ({
      id: element.id,
      zIndex: selectedElements.length + index + 1,
    }));

    if (otherUpdates.length > 0) {
      this.updateElementsFn(otherUpdates);
    }
  }

  // GROUPING OPERATIONS

  /**
   * Group selected elements
   */
  groupSelectedElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length < 2 || !this.updateElementsFn) return;

    const groupId = `group_${Date.now()}`;
    const updates = selectedElements.map((element) => ({
      id: element.id,
      groupId: groupId,
    }));

    this.updateElementsFn(updates);
  }

  /**
   * Ungroup selected elements
   */
  ungroupSelectedElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.getElementsFn || !this.updateElementsFn) return;

    // Find elements that belong to the same group as selected elements
    const selectedElementsWithGroups = selectedElements.filter((el) => el.groupId !== undefined && el.groupId !== null);
    if (selectedElementsWithGroups.length === 0) return;

    // Get all group IDs from selected elements
    const groupIds = [...new Set(selectedElementsWithGroups.map((el) => el.groupId).filter(Boolean))];

    // Find all elements that belong to these groups
    const allElements = this.getElementsFn();
    const elementsToUngroup = allElements.filter((el: WhiteboardElement) => {
      return el.groupId !== undefined && el.groupId !== null && groupIds.includes(el.groupId);
    });

    // Remove group ID from all elements in the groups
    const updates = elementsToUngroup.map((element) => ({
      id: element.id,
      groupId: undefined,
    }));

    this.updateElementsFn(updates);
  }

  // LOCKING OPERATIONS

  /**
   * Lock selected elements
   */
  lockElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.updateElementsFn) return;

    const updates = selectedElements.map((element) => ({
      id: element.id,
      locked: true,
    }));

    this.updateElementsFn(updates);
  }

  /**
   * Unlock selected elements
   */
  unlockElements(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.updateElementsFn) return;

    const updates = selectedElements.map((element) => ({
      id: element.id,
      locked: false,
    }));

    this.updateElementsFn(updates);
  }

  // ALIGNMENT OPERATIONS

  /**
   * Align selected elements
   */
  alignElements(alignment: AlignmentType): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0) return;

    if (!this.updateElementsFn) {
      console.warn('Update elements function not available');
      return;
    }

    const updates = this.calculateAlignmentUpdates(selectedElements, alignment);
    if (updates.length > 0) {
      this.updateElementsFn(updates, true);
      this.updateBoundingBox();
    }
  }

  /**
   * Distribute selected elements horizontally with equal spacing
   */
  distributeHorizontally(): void {
    this.alignElements(AlignmentType.DistributeHorizontally);
  }

  /**
   * Distribute selected elements vertically with equal spacing
   */
  distributeVertically(): void {
    this.alignElements(AlignmentType.DistributeVertically);
  }

  /**
   * Calculate alignment updates for selected elements
   */
  private calculateAlignmentUpdates(
    elements: WhiteboardElement[],
    alignment: AlignmentType
  ): (Partial<WhiteboardElement> & { id: string })[] {
    if (elements.length === 0) return [];

    const updates: (Partial<WhiteboardElement> & { id: string })[] = [];
    const bounds = elements.map((element) => ({
      element,
      bounds: getElementBounds(element),
    }));

    // For single element, align to visible viewport
    if (elements.length === 1) {
      const visibleBounds = this.canvasService.getVisibleBounds();
      const elementBounds = bounds[0].bounds;
      const element = bounds[0].element;

      switch (alignment) {
        case AlignmentType.Left: {
          const offsetX = visibleBounds.left - elementBounds.minX;
          if (offsetX !== 0) {
            updates.push({
              id: element.id,
              x: element.x + offsetX,
            });
          }
          break;
        }

        case AlignmentType.Center: {
          const viewportCenterX = (visibleBounds.left + visibleBounds.right) / 2;
          const elementCenterX = elementBounds.minX + elementBounds.width / 2;
          const offsetX = viewportCenterX - elementCenterX;
          if (offsetX !== 0) {
            updates.push({
              id: element.id,
              x: element.x + offsetX,
            });
          }
          break;
        }

        case AlignmentType.Right: {
          const offsetX = visibleBounds.right - elementBounds.maxX;
          if (offsetX !== 0) {
            updates.push({
              id: element.id,
              x: element.x + offsetX,
            });
          }
          break;
        }

        case AlignmentType.Top: {
          const offsetY = visibleBounds.top - elementBounds.minY;
          if (offsetY !== 0) {
            updates.push({
              id: element.id,
              y: element.y + offsetY,
            });
          }
          break;
        }

        case AlignmentType.Middle: {
          const viewportCenterY = (visibleBounds.top + visibleBounds.bottom) / 2;
          const elementCenterY = elementBounds.minY + elementBounds.height / 2;
          const offsetY = viewportCenterY - elementCenterY;
          if (offsetY !== 0) {
            updates.push({
              id: element.id,
              y: element.y + offsetY,
            });
          }
          break;
        }

        case AlignmentType.Bottom: {
          const offsetY = visibleBounds.bottom - elementBounds.maxY;
          if (offsetY !== 0) {
            updates.push({
              id: element.id,
              y: element.y + offsetY,
            });
          }
          break;
        }

        default:
          console.warn('Unsupported alignment type for single element:', alignment);
          return [];
      }

      return updates;
    }

    // For multiple elements, align to each other
    switch (alignment) {
      case AlignmentType.Left: {
        const leftMost = Math.min(...bounds.map((b) => b.bounds.minX));
        bounds.forEach(({ element, bounds: elementBounds }) => {
          const offsetX = leftMost - elementBounds.minX;
          if (offsetX !== 0) {
            updates.push({
              id: element.id,
              x: element.x + offsetX,
            });
          }
        });
        break;
      }

      case AlignmentType.Center: {
        const centerX = bounds.reduce((acc, b) => acc + (b.bounds.minX + b.bounds.width / 2), 0) / bounds.length;
        bounds.forEach(({ element, bounds: elementBounds }) => {
          const elementCenterX = elementBounds.minX + elementBounds.width / 2;
          const offsetX = centerX - elementCenterX;
          if (offsetX !== 0) {
            updates.push({
              id: element.id,
              x: element.x + offsetX,
            });
          }
        });
        break;
      }

      case AlignmentType.Right: {
        const rightMost = Math.max(...bounds.map((b) => b.bounds.maxX));
        bounds.forEach(({ element, bounds: elementBounds }) => {
          const offsetX = rightMost - elementBounds.maxX;
          if (offsetX !== 0) {
            updates.push({
              id: element.id,
              x: element.x + offsetX,
            });
          }
        });
        break;
      }

      case AlignmentType.Top: {
        const topMost = Math.min(...bounds.map((b) => b.bounds.minY));
        bounds.forEach(({ element, bounds: elementBounds }) => {
          const offsetY = topMost - elementBounds.minY;
          if (offsetY !== 0) {
            updates.push({
              id: element.id,
              y: element.y + offsetY,
            });
          }
        });
        break;
      }

      case AlignmentType.Middle: {
        const centerY = bounds.reduce((acc, b) => acc + (b.bounds.minY + b.bounds.height / 2), 0) / bounds.length;
        bounds.forEach(({ element, bounds: elementBounds }) => {
          const elementCenterY = elementBounds.minY + elementBounds.height / 2;
          const offsetY = centerY - elementCenterY;
          if (offsetY !== 0) {
            updates.push({
              id: element.id,
              y: element.y + offsetY,
            });
          }
        });
        break;
      }

      case AlignmentType.Bottom: {
        const bottomMost = Math.max(...bounds.map((b) => b.bounds.maxY));
        bounds.forEach(({ element, bounds: elementBounds }) => {
          const offsetY = bottomMost - elementBounds.maxY;
          if (offsetY !== 0) {
            updates.push({
              id: element.id,
              y: element.y + offsetY,
            });
          }
        });
        break;
      }

      case AlignmentType.DistributeHorizontally: {
        if (elements.length < 3) return []; // Need at least 3 elements to distribute

        // Sort elements by their left position
        const sortedByX = bounds.sort((a, b) => a.bounds.minX - b.bounds.minX);
        const leftmostX = sortedByX[0].bounds.minX;
        const rightmostX = sortedByX[sortedByX.length - 1].bounds.maxX;
        const totalWidth = rightmostX - leftmostX;

        // Calculate total width of all elements
        const elementsWidth = sortedByX.reduce((acc, b) => acc + b.bounds.width, 0);
        const availableSpaceH = totalWidth - elementsWidth;
        const spacingH = availableSpaceH / (sortedByX.length - 1);

        let currentX = leftmostX;
        sortedByX.forEach(({ element, bounds: elementBounds }, index) => {
          if (index === 0) {
            // Keep the leftmost element in place
            currentX += elementBounds.width;
          } else if (index === sortedByX.length - 1) {
            // Keep the rightmost element in place
            return;
          } else {
            // Position middle elements with equal spacing
            currentX += spacingH;
            const offsetX = currentX - elementBounds.minX;
            if (offsetX !== 0) {
              updates.push({
                id: element.id,
                x: element.x + offsetX,
              });
            }
            currentX += elementBounds.width;
          }
        });
        break;
      }

      case AlignmentType.DistributeVertically: {
        if (elements.length < 3) return []; // Need at least 3 elements to distribute

        // Sort elements by their top position
        const sortedByY = bounds.sort((a, b) => a.bounds.minY - b.bounds.minY);
        const topmostY = sortedByY[0].bounds.minY;
        const bottommostY = sortedByY[sortedByY.length - 1].bounds.maxY;
        const totalHeight = bottommostY - topmostY;

        // Calculate total height of all elements
        const elementsHeight = sortedByY.reduce((acc, b) => acc + b.bounds.height, 0);
        const availableSpaceV = totalHeight - elementsHeight;
        const spacingV = availableSpaceV / (sortedByY.length - 1);

        let currentY = topmostY;
        sortedByY.forEach(({ element, bounds: elementBounds }, index) => {
          if (index === 0) {
            // Keep the topmost element in place
            currentY += elementBounds.height;
          } else if (index === sortedByY.length - 1) {
            // Keep the bottommost element in place
            return;
          } else {
            // Position middle elements with equal spacing
            currentY += spacingV;
            const offsetY = currentY - elementBounds.minY;
            if (offsetY !== 0) {
              updates.push({
                id: element.id,
                y: element.y + offsetY,
              });
            }
            currentY += elementBounds.height;
          }
        });
        break;
      }

      default:
        console.warn('Unsupported alignment type:', alignment);
        return [];
    }

    return updates;
  }

  // TRANSFORM OPERATIONS

  /**
   * Flip selected elements horizontally
   */
  flipHorizontal(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.updateElementsFn) return;

    const updates = selectedElements.map((element) => {
      // Toggle horizontal flip by inverting scaleX
      const currentScaleX = element.scaleX ?? 1;
      return {
        id: element.id,
        scaleX: -currentScaleX,
      };
    });

    this.updateElementsFn(updates, true);
    this.updateBoundingBox();
  }

  /**
   * Flip selected elements vertically
   */
  flipVertical(): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.updateElementsFn) return;

    const updates = selectedElements.map((element) => {
      // Toggle vertical flip by inverting scaleY
      const currentScaleY = element.scaleY ?? 1;
      return {
        id: element.id,
        scaleY: -currentScaleY,
      };
    });

    this.updateElementsFn(updates, true);
    this.updateBoundingBox();
  }

  /**
   * Move selected elements by a given offset
   */
  moveSelectedElements(dx: number, dy: number): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.updateElementsFn) return;

    const updates = selectedElements.map((element) => ({
      id: element.id,
      x: element.x + dx,
      y: element.y + dy,
    }));

    this.updateElementsFn(updates, true);
    this.updateBoundingBox();
  }

  /**
   * Rotate selected elements by a given angle (in degrees)
   */
  rotateSelectedElements(angle: number): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.updateElementsFn) return;

    const updates = selectedElements.map((element) => ({
      id: element.id,
      rotation: (element.rotation || 0) + angle,
    }));

    this.updateElementsFn(updates, true);
    this.updateBoundingBox();
  }

  /**
   * Scale selected elements by a given factor
   */
  scaleSelectedElements(factor: number): void {
    const selectedElements = this.getSelectedElements();
    if (selectedElements.length === 0 || !this.updateElementsFn) return;

    const updates = selectedElements
      .map((element) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const update: any = { id: element.id };

        // Scale width and height if they exist (use 'in' operator for type checking)
        if ('width' in element && element.width !== undefined) {
          update.width = element.width * factor;
        }
        if ('height' in element && element.height !== undefined) {
          update.height = element.height * factor;
        }

        // Scale stroke width if it exists
        if (element.style?.strokeWidth !== undefined) {
          update.style = {
            ...element.style,
            strokeWidth: element.style.strokeWidth * factor,
          };
        }

        // For rectangles and ellipses, also scale radii if they exist
        if ('rx' in element && element.rx !== undefined) {
          update.rx = element.rx * factor;
        }
        if ('ry' in element && element.ry !== undefined) {
          update.ry = element.ry * factor;
        }

        return update;
      })
      .filter((update) => Object.keys(update).length > 1); // Only include updates with more than just id

    if (updates.length > 0) {
      this.updateElementsFn(updates, true);
      this.updateBoundingBox();
    }
  }
}
