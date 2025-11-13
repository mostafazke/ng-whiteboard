import { HistoryService } from '../history/history.service';
import { computed, inject, Injectable, signal } from '@angular/core';
import { EventBusService } from '../event-bus';
import { WhiteboardElement, WhiteboardEvent } from '../types';
import { getElementBounds } from '../utils';
import { LayerManagementService } from './layer-management.service';

export interface LockInfo {
  timestamp: number;
  reason?: string;
}

export interface ElementsSnapshot {
  elements: WhiteboardElement[];
  draftElements: WhiteboardElement[];
  maxZIndex: number;
  timestamp?: number;
}

export interface LockOperationResult {
  updated: string[];
  locked: string[];
}

export interface LockStats {
  total: number;
  locked: number;
  unlocked: number;
  lockPercentage: number;
  allLocked: boolean;
  noneLocked: boolean;
}

export interface ElementTransformation {
  translation?: { x: number; y: number };
  rotation?: number;
  scale?: { x: number; y: number };
  opacity?: number;
}

export interface ElementSearchCriteria {
  type?: string;
  layerId?: string;
  locked?: boolean;
  textContent?: string;
  zIndexRange?: { min: number; max: number };
  bounds?: { x: number; y: number; width: number; height: number };
}

@Injectable({ providedIn: 'root' })
export class ElementsService {
  private historyService = inject(HistoryService);
  private layerManagement = inject(LayerManagementService);

  // Signal-based state management
  private readonly _elements = signal<WhiteboardElement[]>([]);
  private readonly _draftElements = signal<WhiteboardElement[]>([]);
  private readonly _maxZIndex = signal(0);
  private readonly _locks = signal(new Map<string, LockInfo>());

  constructor(private eventBus: EventBusService) {}

  readonly elements = this._elements.asReadonly();

  /**
   * Signal containing all draft (temporary) elements
   */
  readonly draftElements = this._draftElements.asReadonly();

  /**
   * Computed signal containing all elements (persistent + draft)
   */
  readonly allElements = computed(() => [...this._elements(), ...this._draftElements()]);

  /**
   * Computed signal for elements count
   */
  readonly elementsCount = computed(() => this._elements().length);

  /**
   * Computed signal checking if elements exist
   */
  readonly hasElements = computed(() => this.elementsCount() > 0);

  /**
   * Computed signal for unique element types
   */
  readonly elementTypes = computed(() => {
    const types = this._elements().map((el) => el.type);
    return [...new Set(types)];
  });

  /**
   * Computed signal for elements by type
   */
  readonly elementsByType = computed(() => {
    const elements = this._elements();
    const byType = new Map<string, WhiteboardElement[]>();

    elements.forEach((element) => {
      const type = element.type;
      if (!byType.has(type)) {
        byType.set(type, []);
      }
      const typeArray = byType.get(type);
      if (typeArray) {
        typeArray.push(element);
      }
    });

    return byType;
  });

  /**
   * Computed signal for max z-index
   */
  readonly maxZIndex = computed(() => this._maxZIndex());

  /**
   * Computed signal for elements sorted by z-index
   */
  readonly elementsByZIndex = computed(() => {
    return [...this._elements()].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
  });

  /**
   * Computed signal for locked elements
   */
  readonly lockedElements = computed(() => {
    return this._elements().filter((element) => element.locked === true);
  });

  /**
   * Computed signal for unlocked elements
   */
  readonly unlockedElements = computed(() => {
    return this._elements().filter((element) => element.locked !== true);
  });

  /**
   * Computed signal for locked elements count
   */
  readonly lockedElementsCount = computed(() => this.lockedElements().length);

  /**
   * Computed signal checking if any elements are locked
   */
  readonly hasLockedElements = computed(() => this.lockedElementsCount() > 0);

  /**
   * Computed signal for lock statistics
   */
  readonly lockStats = computed(() => {
    const total = this.elementsCount();
    const locked = this.lockedElementsCount();
    const unlocked = total - locked;
    const lockPercentage = total > 0 ? Math.round((locked / total) * 100) : 0;

    return {
      total,
      locked,
      unlocked,
      lockPercentage,
      allLocked: total > 0 && locked === total,
      noneLocked: locked === 0,
    };
  });

  /**
   * Signal containing element locks
   */
  readonly locks = this._locks.asReadonly();

  /**
   * Get current persistent elements snapshot
   */
  getElements(): WhiteboardElement[] {
    return [...this._elements()];
  }

  /**
   * Get current draft elements snapshot
   */
  getDraftElements(): WhiteboardElement[] {
    return [...this._draftElements()];
  }

  /**
   * Get all elements (persistent + draft) snapshot
   */
  getAllElements(): WhiteboardElement[] {
    return this.allElements();
  }

  // ---------- Element Management ----------

  /**
   * Add elements to persistent storage
   */
  addElements(elements: WhiteboardElement[]): void {
    if (!elements?.length) return;

    const activeLayerId = this.layerManagement.getActiveLayerId();

    const elementsWithZIndex = elements.map((element) => ({
      ...element,
      zIndex: element.zIndex ?? this.getNextZIndex(),
      layerId: element.layerId ?? activeLayerId, // Auto-assign to active layer
    }));

    this.updateMaxZIndex(elementsWithZIndex);

    const currentElements = this._elements();
    const newElements = [...currentElements, ...elementsWithZIndex];

    this._elements.set(newElements);

    // Register elements with layer management
    elementsWithZIndex.forEach((element) => {
      if (element.layerId) {
        this.layerManagement.assignElementToLayer(element.id, element.layerId);
      }
    });

    this.historyService.recordElementCreation(currentElements, newElements);
    // Emit granular event for elements addition
    this.eventBus.emit(WhiteboardEvent.ElementsAdded, elementsWithZIndex);
    // Emit data change event
    this.eventBus.emit(WhiteboardEvent.DataChange, newElements);
  }

  /**
   * Update existing elements (respects lock status)
   */
  updateElements(updates: Partial<WhiteboardElement> & { id: string }[], ignoreLock = false): void {
    if (!updates?.length) return;

    const currentElements = this._elements();
    const updatesMap = new Map(updates.map((update) => [update.id, update]));
    const updatedElements: WhiteboardElement[] = [];

    const newElements = currentElements.map((element) => {
      const update = updatesMap.get(element.id);
      if (!update) return element;

      // Check if element is locked and operation doesn't ignore lock
      if (!ignoreLock && element.locked && !this.isLockOperation(update)) {
        console.warn(`Attempted to modify locked element: ${element.id}`);
        return element; // Return unchanged element
      }

      // Check if element's layer is locked
      if (!ignoreLock && element.layerId) {
        const elementLayer = this.layerManagement.getElementLayer(element.id);
        if (elementLayer?.locked) {
          console.warn(`Attempted to modify element on locked layer: ${elementLayer.name}`);
          return element; // Return unchanged element
        }
      }

      const updatedElement = { ...element, ...update };

      // Update max z-index if necessary
      if (updatedElement.zIndex != null) {
        this._maxZIndex.update((current) => Math.max(current, updatedElement.zIndex as number));
      }

      updatedElements.push(updatedElement);
      return updatedElement;
    });

    this._elements.set(newElements);

    if (updatedElements.length > 0) {
      this.historyService.recordElementUpdate(currentElements, newElements);
    }

    if (updatedElements.length > 0) {
      this.eventBus.emit(WhiteboardEvent.ElementsUpdated, updatedElements);
      // Emit data change event
      this.eventBus.emit(WhiteboardEvent.DataChange, newElements);
    }
  }

  /**
   * Remove elements by IDs (respects lock status)
   */
  removeElementsByIds(elementIds: string[], ignoreLock = false): void {
    if (!elementIds?.length) return;

    const idsToRemove = new Set(elementIds);
    const currentElements = this._elements();

    // Filter out locked elements unless ignoreLock is true
    const validElementsToRemove = currentElements.filter((element) => {
      if (!idsToRemove.has(element.id)) return false;

      if (!ignoreLock && element.locked) {
        console.warn(`Attempted to remove locked element: ${element.id}`);
        return false;
      }

      // Check if element's layer is locked
      if (!ignoreLock && element.layerId) {
        const elementLayer = this.layerManagement.getElementLayer(element.id);
        if (elementLayer?.locked) {
          console.warn(`Attempted to remove element from locked layer: ${elementLayer.name}`);
          return false;
        }
      }

      return true;
    });

    if (validElementsToRemove.length === 0) return;

    const removeIds = new Set(validElementsToRemove.map((el) => el.id));
    const newElements = currentElements.filter((element) => !removeIds.has(element.id));

    this._elements.set(newElements);

    // Remove elements from layers
    validElementsToRemove.forEach((element) => {
      this.layerManagement.removeElementFromAllLayers(element.id);
    });

    // Record history for undo/redo
    this.historyService.recordElementDeletion(currentElements, newElements);

    // Emit events
    this.eventBus.emit(WhiteboardEvent.ElementsRemoved, validElementsToRemove);
    this.eventBus.emit(WhiteboardEvent.DataChange, newElements);
  }

  /**
   * Remove elements (simplified interface, respects lock status)
   */
  removeElements(elements: WhiteboardElement[], ignoreLock = false): void {
    const elementIds = elements.map((element) => element.id);
    this.removeElementsByIds(elementIds, ignoreLock);
  }

  /**
   * Clear all persistent elements
   */
  clear(): void {
    const currentElements = this._elements();
    this._elements.set([]);
    this._maxZIndex.set(0);

    // Clear all elements from layers
    currentElements.forEach((element) => {
      this.layerManagement.removeElementFromAllLayers(element.id);
    });

    // Record history for undo/redo
    this.historyService.recordClear(currentElements, []);
    // Emit data change event
    this.eventBus.emit(WhiteboardEvent.DataChange, []);
  }

  /**
   * Set all persistent elements (replaces current elements)
   */
  setElements(elements: WhiteboardElement[]): void {
    const elementsWithZIndex = elements.map((element) => ({
      ...element,
      zIndex: element.zIndex ?? this.getNextZIndex(),
    }));

    this.updateMaxZIndex(elementsWithZIndex);
    this._elements.set([...elementsWithZIndex]);
    // Emit data change event
    this.eventBus.emit(WhiteboardEvent.DataChange, elementsWithZIndex);
  }

  // ---------- Draft Element Management ----------

  /**
   * Add elements to draft storage (temporary elements)
   */
  addDraftElements(elements: WhiteboardElement[]): void {
    if (!elements?.length) return;

    // Check if active layer is locked
    const activeLayer = this.layerManagement.activeLayer();
    if (activeLayer?.locked) {
      console.warn(`Cannot draw on locked layer: ${activeLayer.name}`);
      return;
    }

    const elementsWithZIndex = elements.map((element) => ({
      ...element,
      zIndex: element.zIndex ?? this.getNextZIndex(),
    }));

    this.updateMaxZIndex(elementsWithZIndex);

    const currentDraftElements = this._draftElements();
    const newDraftElements = [...currentDraftElements, ...elementsWithZIndex];

    this._draftElements.set(newDraftElements);
  }

  /**
   * Update draft elements
   */
  updateDraftElements(updates: Partial<WhiteboardElement>[]): void {
    if (!updates?.length) return;

    const currentDraftElements = this._draftElements();
    const updatesMap = new Map(updates.map((update) => [update.id, update]));
    const updatedElements: WhiteboardElement[] = [];

    const newDraftElements = currentDraftElements.map((element) => {
      const update = updatesMap.get(element.id);
      if (update) {
        const updatedElement: WhiteboardElement = { ...element, ...update } as WhiteboardElement;
        updatedElements.push(updatedElement);
        return updatedElement;
      }
      return element;
    });

    this._draftElements.set(newDraftElements);
  }

  /**
   * Remove draft elements by IDs
   */
  removeDraftElements(elementIds: string[]): void {
    if (!elementIds?.length) return;

    const idsToRemove = new Set(elementIds);
    const currentDraftElements = this._draftElements();
    const newDraftElements = currentDraftElements.filter((element) => !idsToRemove.has(element.id));

    this._draftElements.set(newDraftElements);
  }

  /**
   * Clear all draft elements
   */
  clearDraftElements(): void {
    this._draftElements.set([]);
  }

  /**
   * Move elements from draft to persistent storage
   */
  commitDraftElements(elementIds?: string[]): WhiteboardElement[] {
    const draftElements = this._draftElements();
    const elementsToCommit = elementIds ? draftElements.filter((el) => elementIds.includes(el.id)) : draftElements;

    if (elementsToCommit.length === 0) return [];

    // Check if active layer is locked before committing
    const activeLayer = this.layerManagement.activeLayer();
    if (activeLayer?.locked) {
      console.warn(`Cannot commit elements to locked layer: ${activeLayer.name}`);
      // Clear draft elements since they can't be committed
      this._draftElements.set([]);
      return [];
    }

    // Add to persistent storage
    this.addElements(elementsToCommit);

    // Remove from draft storage
    const remainingDrafts = elementIds ? draftElements.filter((el) => !elementIds.includes(el.id)) : [];

    this._draftElements.set(remainingDrafts);

    // Return the committed elements for potential selection
    return elementsToCommit;
  }

  // ---------- Z-Index Management ----------

  /**
   * Get the next available z-index
   */
  getNextZIndex(): number {
    this._maxZIndex.update((current) => current + 1);
    return this._maxZIndex();
  }

  /**
   * Bring elements to front (respects lock status)
   */
  bringToFront(elementIds: string[], ignoreLock = false): void {
    if (!elementIds?.length) return;

    const newZIndex = this.getNextZIndex();
    const updates = elementIds.map((id) => ({ id, zIndex: newZIndex }));

    this.updateElements(updates, ignoreLock);
  }

  /**
   * Send elements to back (respects lock status)
   */
  sendToBack(elementIds: string[], ignoreLock = false): void {
    if (!elementIds?.length) return;

    const updates = elementIds.map((id) => ({ id, zIndex: 0 }));
    this.updateElements(updates, ignoreLock);
  }

  // ---------- Lock Management ----------

  /**
   * Lock elements to prevent modifications
   */
  lockElements(elementIds: string[]): void {
    if (!elementIds?.length) return;

    const lockInfo: LockInfo = {
      timestamp: Date.now(),
      reason: 'User locked',
    };

    const locks = this._locks();
    const newLocks = new Map(locks);

    const updates = elementIds.map((id) => {
      newLocks.set(id, lockInfo);
      return { id, locked: true as const };
    });

    this._locks.set(newLocks);
    this.updateElements(updates, true); // Ignore lock status for locking operation
  }

  /**
   * Unlock elements to allow modifications
   */
  unlockElements(elementIds: string[]): void {
    if (!elementIds?.length) return;

    const locks = this._locks();
    const newLocks = new Map(locks);

    const updates = elementIds.map((id) => {
      newLocks.delete(id);
      return { id, locked: false as const };
    });

    this._locks.set(newLocks);
    this.updateElements(updates, true); // Ignore lock status for unlocking operation
  }

  /**
   * Toggle lock status of elements
   */
  toggleElementsLock(elementIds: string[]): void {
    if (!elementIds?.length) return;

    const elementsToLock: string[] = [];
    const elementsToUnlock: string[] = [];

    elementIds.forEach((id) => {
      const element = this.getElementById(id);
      if (element) {
        if (element.locked) {
          elementsToUnlock.push(id);
        } else {
          elementsToLock.push(id);
        }
      }
    });

    if (elementsToLock.length > 0) {
      this.lockElements(elementsToLock);
    }
    if (elementsToUnlock.length > 0) {
      this.unlockElements(elementsToUnlock);
    }
  }

  /**
   * Lock all elements
   */
  lockAllElements(): void {
    const allIds = this._elements().map((el) => el.id);
    this.lockElements(allIds);
  }

  /**
   * Unlock all elements
   */
  unlockAllElements(): void {
    const allIds = this._elements().map((el) => el.id);
    this.unlockElements(allIds);
  }

  /**
   * Check if an element is locked
   */
  isElementLocked(elementId: string): boolean {
    const element = this.getElementById(elementId);
    return Boolean(element?.locked);
  }

  /**
   * Get locked element IDs
   */
  getLockedElementIds(): string[] {
    return this.lockedElements().map((el) => el.id);
  }

  /**
   * Get unlocked element IDs
   */
  getUnlockedElementIds(): string[] {
    return this.unlockedElements().map((el) => el.id);
  }

  // ---------- Layer Management ----------

  /**
   * Move elements to a specific layer (respects lock status)
   */
  moveToLayer(elementIds: string[], layerId: string, ignoreLock = false): void {
    if (!elementIds?.length) return;

    const updates = elementIds.map((id) => ({ id, layerId }));
    this.updateElements(updates, ignoreLock);
  }

  /**
   * Get elements by layer
   */
  getElementsByLayer(layerId: string): WhiteboardElement[] {
    return this._elements().filter((el) => el.layerId === layerId);
  }

  // ---------- Search and Query ----------

  /**
   * Find element by ID in both persistent and draft elements
   */
  getElementById(id: string): WhiteboardElement | undefined {
    // Search in persistent elements first
    const persistentElement = this._elements().find((el) => el.id === id);
    if (persistentElement) return persistentElement;

    // Search in draft elements
    return this._draftElements().find((el) => el.id === id);
  }

  /**
   * Find elements by IDs
   */
  getElementsByIds(ids: string[]): WhiteboardElement[] {
    const idsSet = new Set(ids);
    const allElements = this.allElements();
    return allElements.filter((el) => idsSet.has(el.id));
  }

  /**
   * Get elements by type
   */
  getElementsByType(type: string): WhiteboardElement[] {
    return this._elements().filter((el) => el.type === type);
  }

  /**
   * Search elements with multiple criteria
   */
  searchElements(criteria: ElementSearchCriteria): WhiteboardElement[] {
    let results = this._elements();

    if (criteria.type) {
      results = results.filter((el) => el.type === criteria.type);
    }

    if (criteria.layerId) {
      results = results.filter((el) => el.layerId === criteria.layerId);
    }

    if (criteria.locked !== undefined) {
      results = results.filter((el) => Boolean(el.locked) === criteria.locked);
    }

    if (criteria.textContent) {
      const searchText = criteria.textContent.toLowerCase();
      results = results.filter((el) => {
        const textElement = el as WhiteboardElement & { text?: string; content?: string };
        const text = (textElement.text || textElement.content || '').toLowerCase();
        return text.includes(searchText);
      });
    }

    if (criteria.zIndexRange) {
      const { min, max } = criteria.zIndexRange;
      results = results.filter((el) => {
        const zIndex = el.zIndex || 0;
        return zIndex >= min && zIndex <= max;
      });
    }

    if (criteria.bounds) {
      results = this.findElementsInBounds(criteria.bounds).filter((el) => results.some((r) => r.id === el.id));
    }

    return results;
  }

  /**
   * Find elements by text content
   */
  findElementsByText(searchText: string): WhiteboardElement[] {
    return this.searchElements({ textContent: searchText });
  }

  /**
   * Get elements within a radius of a point
   */
  getElementsInRadius(centerX: number, centerY: number, radius: number): WhiteboardElement[] {
    return this._elements().filter((element) => {
      const dx = element.x - centerX;
      const dy = element.y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    });
  }

  /**
   * Get nearest element to a point
   */
  getNearestElement(x: number, y: number): WhiteboardElement | undefined {
    const elements = this._elements();
    if (elements.length === 0) return undefined;

    let nearestElement = elements[0];
    let minDistance = this.getDistanceToElement(x, y, nearestElement);

    for (let i = 1; i < elements.length; i++) {
      const distance = this.getDistanceToElement(x, y, elements[i]);
      if (distance < minDistance) {
        minDistance = distance;
        nearestElement = elements[i];
      }
    }

    return nearestElement;
  }

  // ---------- State Management ----------

  /**
   * Create a snapshot of current state
   */
  createSnapshot(): ElementsSnapshot {
    return {
      elements: [...this._elements()],
      draftElements: [...this._draftElements()],
      maxZIndex: this._maxZIndex(),
      timestamp: Date.now(),
    };
  }

  /**
   * Restore state from snapshot
   */
  restoreSnapshot(snapshot: ElementsSnapshot): void {
    this._elements.set([...snapshot.elements]);
    this._draftElements.set([...snapshot.draftElements]);
    this._maxZIndex.set(snapshot.maxZIndex);
  }

  // ---------- Utility Methods ----------

  /**
   * Find elements intersecting with a boundary
   */
  findElementsInBounds(bounds: { x: number; y: number; width: number; height: number }): WhiteboardElement[] {
    return this._elements().filter((element) => {
      const elementWidth = (element as WhiteboardElement & { width?: number }).width || 50;
      const elementHeight = (element as WhiteboardElement & { height?: number }).height || 50;

      return (
        element.x < bounds.x + bounds.width &&
        element.x + elementWidth > bounds.x &&
        element.y < bounds.y + bounds.height &&
        element.y + elementHeight > bounds.y
      );
    });
  }

  /**
   * Calculate combined bounds of multiple elements
   */
  calculateElementsBounds(elements: WhiteboardElement[]): {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  } | null {
    if (elements.length === 0) {
      return null;
    }

    const allBounds = elements.map(getElementBounds);

    const minX = Math.min(...allBounds.map((b) => b.minX));
    const minY = Math.min(...allBounds.map((b) => b.minY));
    const maxX = Math.max(...allBounds.map((b) => b.maxX));
    const maxY = Math.max(...allBounds.map((b) => b.maxY));

    const width = maxX - minX;
    const height = maxY - minY;

    return {
      x: minX,
      y: minY,
      width,
      height,
      centerX: minX + width / 2,
      centerY: minY + height / 2,
    };
  }

  /**
   * Get elements count (use computed signal for reactivity)
   */
  getElementsCount(): number {
    return this.elementsCount();
  }

  /**
   * Get unique element types (use computed signal for reactivity)
   */
  getElementTypes(): string[] {
    return this.elementTypes();
  }

  /**
   * Normalize z-indices to sequential integers
   */
  normalizeZIndices(): void {
    const elements = [...this._elements()].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    const updates = elements.map((element, index) => ({
      id: element.id,
      zIndex: index + 1,
    }));

    this._maxZIndex.set(elements.length);
    this.updateElements(updates, true);
  }

  // ---------- Convenience Methods ----------

  /**
   * Add a single element (convenience method)
   */
  addElement(element: WhiteboardElement): void {
    this.addElements([element]);
  }

  /**
   * Update a single element (convenience method, respects lock status)
   */
  updateElement(update: Partial<WhiteboardElement> & { id: string }, ignoreLock = false): void {
    this.updateElements([update], ignoreLock);
  }

  /**
   * Remove a single element (convenience method, respects lock status)
   */
  removeElement(element: WhiteboardElement, ignoreLock = false): void {
    this.removeElementsByIds([element.id], ignoreLock);
  }

  /**
   * Check if a specific element exists
   */
  elementExists(id: string): boolean {
    return this.getElementById(id) !== undefined;
  }

  /**
   * Get elements within a specific z-index range
   */
  getElementsByZIndexRange(min: number, max: number): WhiteboardElement[] {
    return this._elements().filter((el) => {
      const zIndex = el.zIndex || 0;
      return zIndex >= min && zIndex <= max;
    });
  }

  /**
   * Get elements with specific properties
   */
  getElementsByProperty<K extends keyof WhiteboardElement>(
    property: K,
    value: WhiteboardElement[K]
  ): WhiteboardElement[] {
    return this._elements().filter((el) => el[property] === value);
  }

  /**
   * Lock a single element
   */
  lockElement(elementId: string): void {
    this.lockElements([elementId]);
  }

  /**
   * Unlock a single element
   */
  unlockElement(elementId: string): void {
    this.unlockElements([elementId]);
  }

  /**
   * Toggle lock status of a single element
   */
  toggleElementLock(elementId: string): void {
    this.toggleElementsLock([elementId]);
  }

  /**
   * Get modifiable elements (unlocked elements)
   */
  getModifiableElements(): WhiteboardElement[] {
    return this.unlockedElements();
  }

  /**
   * Check if any of the given elements are locked
   */
  hasLockedElementsInSelection(elementIds: string[]): boolean {
    return elementIds.some((id) => this.isElementLocked(id));
  }

  /**
   * Filter out locked elements from a selection
   */
  filterUnlockedElements(elementIds: string[]): string[] {
    return elementIds.filter((id) => !this.isElementLocked(id));
  }

  /**
   * Get elements that can be safely modified (respects lock status)
   */
  getModifiableElementsFromIds(elementIds: string[]): WhiteboardElement[] {
    const unlocked = this.filterUnlockedElements(elementIds);
    return this.getElementsByIds(unlocked);
  }

  /**
   * Safely update multiple elements (warns about locked elements)
   */
  safeUpdateElements(updates: Partial<WhiteboardElement> & { id: string }[]): LockOperationResult {
    const locked: string[] = [];
    const updated: string[] = [];

    const safeUpdates = updates.filter((update) => {
      if (this.isElementLocked(update.id)) {
        locked.push(update.id);
        return false;
      } else {
        updated.push(update.id);
        return true;
      }
    });

    if (safeUpdates.length > 0) {
      this.updateElements(safeUpdates, false);
    }

    return { updated, locked };
  }

  // ---------- Private Helper Methods ----------

  /**
   * Check if an update operation is a lock-related operation
   */
  private isLockOperation(update: Partial<WhiteboardElement>): boolean {
    return 'locked' in update;
  }

  /**
   * Update the maximum z-index based on elements
   */
  private updateMaxZIndex(elements: WhiteboardElement[]): void {
    const maxZ = Math.max(...elements.map((el) => el.zIndex || 0));
    this._maxZIndex.update((current) => Math.max(current, maxZ));
  }

  /**
   * Get distance from point to element
   */
  private getDistanceToElement(x: number, y: number, element: WhiteboardElement): number {
    const elementWidth = (element as WhiteboardElement & { width?: number }).width || 50;
    const elementHeight = (element as WhiteboardElement & { height?: number }).height || 50;

    const centerX = element.x + elementWidth / 2;
    const centerY = element.y + elementHeight / 2;

    const dx = x - centerX;
    const dy = y - centerY;

    return Math.sqrt(dx * dx + dy * dy);
  }
}
