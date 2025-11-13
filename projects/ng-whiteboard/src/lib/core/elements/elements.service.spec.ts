import { TestBed } from '@angular/core/testing';
import { ElementsService } from './elements.service';
import { EventBusService } from '../event-bus';
import { HistoryService } from '../history/history.service';
import { LayerManagementService } from './layer-management.service';
import { WhiteboardElement, ElementType, WhiteboardEvent } from '../types';

describe('ElementsService', () => {
  let service: ElementsService;
  let eventBus: EventBusService;
  let historyService: HistoryService;
  let layerManagement: LayerManagementService;

  const createMockElement = (id: string, overrides: Partial<WhiteboardElement> = {}): WhiteboardElement => {
    const base: WhiteboardElement = {
      id,
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rx: 5,
      rotation: 0,
      opacity: 100,
      zIndex: 1,
      selectAfterDraw: false,
      style: {},
    };

    return { ...base, ...overrides } as WhiteboardElement;
  };

  beforeEach(() => {
    const eventBusSpy = {
      emit: jest.fn(),
    };
    const historySpy = {
      recordElementCreation: jest.fn(),
      recordElementUpdate: jest.fn(),
      recordElementDeletion: jest.fn(),
      recordClear: jest.fn(),
    };
    const layerSpy = {
      getActiveLayerId: jest.fn().mockReturnValue('default-layer'),
      activeLayer: jest.fn().mockReturnValue({
        id: 'default-layer',
        name: 'Default Layer',
        visible: true,
        locked: false,
        zIndex: 0,
        elementIds: [],
      }),
      assignElementToLayer: jest.fn().mockReturnValue(true),
      removeElementFromAllLayers: jest.fn(),
      getElementLayer: jest.fn().mockReturnValue(null),
    };

    TestBed.configureTestingModule({
      providers: [
        ElementsService,
        { provide: EventBusService, useValue: eventBusSpy },
        { provide: HistoryService, useValue: historySpy },
        { provide: LayerManagementService, useValue: layerSpy },
      ],
    });

    service = TestBed.inject(ElementsService);
    eventBus = TestBed.inject(EventBusService);
    historyService = TestBed.inject(HistoryService);
    layerManagement = TestBed.inject(LayerManagementService);
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty elements', () => {
      expect(service.elements()).toEqual([]);
      expect(service.elementsCount()).toBe(0);
      expect(service.hasElements()).toBe(false);
    });

    it('should initialize with empty draft elements', () => {
      expect(service.draftElements()).toEqual([]);
    });

    it('should initialize maxZIndex to 0', () => {
      expect(service.maxZIndex()).toBe(0);
    });

    it('should initialize with empty locks', () => {
      expect(service.locks().size).toBe(0);
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { type: ElementType.Rectangle, zIndex: 1 }),
        createMockElement('el-2', { type: ElementType.Ellipse, zIndex: 2, locked: true }),
        createMockElement('el-3', { type: ElementType.Rectangle, zIndex: 3 }),
      ];
      service.setElements(elements);
    });

    it('should compute elementsCount', () => {
      expect(service.elementsCount()).toBe(3);
    });

    it('should compute hasElements', () => {
      expect(service.hasElements()).toBe(true);
      service.clear();
      expect(service.hasElements()).toBe(false);
    });

    it('should compute elementTypes', () => {
      const types = service.elementTypes();
      expect(types.length).toBe(2);
      expect(types).toContain(ElementType.Rectangle);
      expect(types).toContain(ElementType.Ellipse);
    });

    it('should compute elementsByType', () => {
      const byType = service.elementsByType();
      expect(byType.get(ElementType.Rectangle)?.length).toBe(2);
      expect(byType.get(ElementType.Ellipse)?.length).toBe(1);
    });

    it('should compute elementsByZIndex sorted', () => {
      const sorted = service.elementsByZIndex();
      expect(sorted[0].zIndex).toBe(1);
      expect(sorted[1].zIndex).toBe(2);
      expect(sorted[2].zIndex).toBe(3);
    });

    it('should compute lockedElements', () => {
      const locked = service.lockedElements();
      expect(locked.length).toBe(1);
      expect(locked[0].id).toBe('el-2');
    });

    it('should compute unlockedElements', () => {
      const unlocked = service.unlockedElements();
      expect(unlocked.length).toBe(2);
      expect(unlocked.map((e) => e.id)).toEqual(['el-1', 'el-3']);
    });

    it('should compute lockedElementsCount', () => {
      expect(service.lockedElementsCount()).toBe(1);
    });

    it('should compute hasLockedElements', () => {
      expect(service.hasLockedElements()).toBe(true);
      service.clear();
      expect(service.hasLockedElements()).toBe(false);
    });

    it('should compute lockStats', () => {
      const stats = service.lockStats();
      expect(stats.total).toBe(3);
      expect(stats.locked).toBe(1);
      expect(stats.unlocked).toBe(2);
      expect(stats.lockPercentage).toBe(33);
      expect(stats.allLocked).toBe(false);
      expect(stats.noneLocked).toBe(false);
    });

    it('should compute lockStats for all locked', () => {
      service.lockAllElements();
      const stats = service.lockStats();
      expect(stats.allLocked).toBe(true);
      expect(stats.noneLocked).toBe(false);
    });

    it('should compute lockStats for none locked', () => {
      service.unlockAllElements();
      const stats = service.lockStats();
      expect(stats.allLocked).toBe(false);
      expect(stats.noneLocked).toBe(true);
    });

    it('should compute allElements combining persistent and draft', () => {
      const draft = [createMockElement('draft-1')];
      service.addDraftElements(draft);
      const all = service.allElements();
      expect(all.length).toBe(4); // 3 persistent + 1 draft
    });
  });

  describe('Element CRUD Operations', () => {
    describe('addElements()', () => {
      it('should add elements', () => {
        const elements = [createMockElement('el-1'), createMockElement('el-2')];
        service.addElements(elements);

        expect(service.elementsCount()).toBe(2);
        expect(service.elements()[0].id).toBe('el-1');
        expect(service.elements()[1].id).toBe('el-2');
      });

      it('should assign zIndex to elements without one', () => {
        const element = createMockElement('el-1', { zIndex: undefined });
        service.addElements([element]);

        expect(service.elements()[0].zIndex).toBeDefined();
        expect(service.elements()[0].zIndex).toBeGreaterThan(0);
      });

      it('should preserve zIndex if provided', () => {
        const element = createMockElement('el-1', { zIndex: 10 });
        service.addElements([element]);

        expect(service.elements()[0].zIndex).toBe(10);
      });

      it('should update maxZIndex', () => {
        service.addElements([createMockElement('el-1', { zIndex: 5 })]);
        expect(service.maxZIndex()).toBeGreaterThanOrEqual(5);
      });

      it('should assign to active layer if no layerId', () => {
        service.addElements([createMockElement('el-1')]);
        expect(layerManagement.assignElementToLayer).toHaveBeenCalledWith('el-1', 'default-layer');
      });

      it('should preserve layerId if provided', () => {
        service.addElements([createMockElement('el-1', { layerId: 'custom-layer' })]);
        expect(layerManagement.assignElementToLayer).toHaveBeenCalledWith('el-1', 'custom-layer');
      });

      it('should record history', () => {
        service.addElements([createMockElement('el-1')]);
        expect(historyService.recordElementCreation).toHaveBeenCalled();
      });

      it('should emit events', () => {
        const elements = [createMockElement('el-1')];
        service.addElements(elements);

        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsAdded, expect.any(Array));
        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.DataChange, expect.any(Array));
      });

      it('should handle empty array', () => {
        service.addElements([]);
        expect(service.elementsCount()).toBe(0);
        expect(eventBus.emit).not.toHaveBeenCalled();
      });

      it('should handle null/undefined', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service.addElements(null as any);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        service.addElements(undefined as any);
        expect(service.elementsCount()).toBe(0);
      });
    });

    describe('addElement()', () => {
      it('should add single element', () => {
        service.addElement(createMockElement('el-1'));
        expect(service.elementsCount()).toBe(1);
      });
    });

    describe('updateElements()', () => {
      beforeEach(() => {
        service.setElements([
          createMockElement('el-1', { x: 0, y: 0 }),
          createMockElement('el-2', { x: 10, y: 10 }),
          createMockElement('el-3', { x: 20, y: 20, locked: true }),
        ]);
        // Reset spy call counts
        const emitSpy = eventBus.emit as jest.Mock;
        const updateSpy = historyService.recordElementUpdate as jest.Mock;
        emitSpy.mockClear();
        updateSpy.mockClear();
      });

      it('should update elements', () => {
        service.updateElements([{ id: 'el-1', x: 100, y: 200 } as Partial<WhiteboardElement> & { id: string }]);

        const updated = service.getElementById('el-1');
        expect(updated?.x).toBe(100);
        expect(updated?.y).toBe(200);
      });

      it('should update multiple elements', () => {
        service.updateElements([
          { id: 'el-1', x: 100 } as Partial<WhiteboardElement> & { id: string },
          { id: 'el-2', y: 200 } as Partial<WhiteboardElement> & { id: string },
        ]);

        expect(service.getElementById('el-1')?.x).toBe(100);
        expect(service.getElementById('el-2')?.y).toBe(200);
      });

      it('should not update locked elements', () => {
        service.updateElements([{ id: 'el-3', x: 999 } as Partial<WhiteboardElement> & { id: string }]);

        const element = service.getElementById('el-3');
        expect(element?.x).toBe(20); // Unchanged
      });

      it('should update locked elements when ignoreLock is true', () => {
        service.updateElements([{ id: 'el-3', x: 999 } as Partial<WhiteboardElement> & { id: string }], true);

        const element = service.getElementById('el-3');
        expect(element?.x).toBe(999);
      });

      it('should not update elements on locked layers', () => {
        // Add an element with a layerId
        service.setElements([createMockElement('el-1', { x: 0, y: 0, layerId: 'layer-1' })]);

        (layerManagement.getElementLayer as jest.Mock).mockReturnValue({
          id: 'layer-1',
          locked: true,
          name: 'Layer 1',
          visible: true,
          zIndex: 0,
          elements: [],
        });

        service.updateElements([{ id: 'el-1', x: 999 } as Partial<WhiteboardElement> & { id: string }]);

        const element = service.getElementById('el-1');
        expect(element?.x).toBe(0); // Unchanged
      });

      it('should update zIndex and maxZIndex', () => {
        service.updateElements([{ id: 'el-1', zIndex: 100 } as Partial<WhiteboardElement> & { id: string }]);

        expect(service.getElementById('el-1')?.zIndex).toBe(100);
        expect(service.maxZIndex()).toBeGreaterThanOrEqual(100);
      });

      it('should record history', () => {
        service.updateElements([{ id: 'el-1', x: 100 } as Partial<WhiteboardElement> & { id: string }]);
        expect(historyService.recordElementUpdate).toHaveBeenCalled();
      });

      it('should emit events', () => {
        service.updateElements([{ id: 'el-1', x: 100 } as Partial<WhiteboardElement> & { id: string }]);

        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsUpdated, expect.any(Array));
        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.DataChange, expect.any(Array));
      });

      it('should handle empty updates', () => {
        service.updateElements([]);
        expect(historyService.recordElementUpdate).not.toHaveBeenCalled();
      });

      it('should ignore non-existent elements', () => {
        service.updateElements([{ id: 'non-existent', x: 100 } as Partial<WhiteboardElement> & { id: string }]);
        expect(service.getElementById('non-existent')).toBeUndefined();
      });
    });

    describe('updateElement()', () => {
      beforeEach(() => {
        service.setElements([createMockElement('el-1')]);
        const emitSpy = eventBus.emit as jest.Mock;
        emitSpy.mockClear();
      });

      it('should update single element', () => {
        service.updateElement({ id: 'el-1', x: 50 } as Partial<WhiteboardElement> & { id: string });
        expect(service.getElementById('el-1')?.x).toBe(50);
      });
    });

    describe('removeElementsByIds()', () => {
      beforeEach(() => {
        service.setElements([
          createMockElement('el-1'),
          createMockElement('el-2', { locked: true }),
          createMockElement('el-3'),
        ]);
        const emitSpy = eventBus.emit as jest.Mock;
        const deletionSpy = historyService.recordElementDeletion as jest.Mock;
        emitSpy.mockClear();
        deletionSpy.mockClear();
      });

      it('should remove elements by IDs', () => {
        service.removeElementsByIds(['el-1', 'el-3']);

        expect(service.elementsCount()).toBe(1);
        expect(service.getElementById('el-1')).toBeUndefined();
        expect(service.getElementById('el-2')).toBeDefined();
        expect(service.getElementById('el-3')).toBeUndefined();
      });

      it('should not remove locked elements', () => {
        service.removeElementsByIds(['el-2']);

        expect(service.elementsCount()).toBe(3);
        expect(service.getElementById('el-2')).toBeDefined();
      });

      it('should remove locked elements when ignoreLock is true', () => {
        service.removeElementsByIds(['el-2'], true);

        expect(service.elementsCount()).toBe(2);
        expect(service.getElementById('el-2')).toBeUndefined();
      });

      it('should not remove elements on locked layers', () => {
        // Add an element with a layerId
        service.setElements([
          createMockElement('el-1', { layerId: 'layer-1' }),
          createMockElement('el-2', { locked: true }),
          createMockElement('el-3'),
        ]);

        (layerManagement.getElementLayer as jest.Mock).mockReturnValue({
          id: 'layer-1',
          locked: true,
          name: 'Layer 1',
          visible: true,
          zIndex: 0,
          elements: [],
        });

        service.removeElementsByIds(['el-1']);

        expect(service.elementsCount()).toBe(3);
        expect(service.getElementById('el-1')).toBeDefined();
      });

      it('should remove from layer management', () => {
        service.removeElementsByIds(['el-1']);
        expect(layerManagement.removeElementFromAllLayers).toHaveBeenCalledWith('el-1');
      });

      it('should record history', () => {
        service.removeElementsByIds(['el-1']);
        expect(historyService.recordElementDeletion).toHaveBeenCalled();
      });

      it('should emit events', () => {
        service.removeElementsByIds(['el-1']);

        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsRemoved, expect.any(Array));
        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.DataChange, expect.any(Array));
      });

      it('should handle empty array', () => {
        service.removeElementsByIds([]);
        expect(historyService.recordElementDeletion).not.toHaveBeenCalled();
      });

      it('should handle non-existent IDs', () => {
        service.removeElementsByIds(['non-existent']);
        expect(service.elementsCount()).toBe(3);
      });
    });

    describe('removeElements()', () => {
      it('should remove elements by objects', () => {
        const elements = [createMockElement('el-1'), createMockElement('el-2')];
        service.setElements(elements);

        service.removeElements([elements[0]]);
        expect(service.elementsCount()).toBe(1);
        expect(service.getElementById('el-1')).toBeUndefined();
      });
    });

    describe('removeElement()', () => {
      it('should remove single element', () => {
        const element = createMockElement('el-1');
        service.setElements([element]);

        service.removeElement(element);
        expect(service.elementsCount()).toBe(0);
      });
    });

    describe('clear()', () => {
      beforeEach(() => {
        service.setElements([createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')]);
        const emitSpy = eventBus.emit as jest.Mock;
        emitSpy.mockClear();
      });

      it('should clear all elements', () => {
        service.clear();

        expect(service.elementsCount()).toBe(0);
        expect(service.elements()).toEqual([]);
      });

      it('should reset maxZIndex', () => {
        service.clear();
        expect(service.maxZIndex()).toBe(0);
      });

      it('should remove all elements from layers', () => {
        service.clear();
        expect(layerManagement.removeElementFromAllLayers).toHaveBeenCalledTimes(3);
      });

      it('should record history', () => {
        service.clear();
        expect(historyService.recordClear).toHaveBeenCalled();
      });

      it('should emit events', () => {
        service.clear();
        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.DataChange, []);
      });
    });

    describe('setElements()', () => {
      it('should replace all elements', () => {
        service.setElements([createMockElement('el-1')]);
        service.setElements([createMockElement('el-2'), createMockElement('el-3')]);

        expect(service.elementsCount()).toBe(2);
        expect(service.getElementById('el-1')).toBeUndefined();
        expect(service.getElementById('el-2')).toBeDefined();
        expect(service.getElementById('el-3')).toBeDefined();
      });

      it('should assign zIndex to elements without one', () => {
        service.setElements([createMockElement('el-1', { zIndex: undefined })]);
        expect(service.elements()[0].zIndex).toBeDefined();
      });

      it('should emit events', () => {
        const emitSpy = eventBus.emit as jest.Mock;
        emitSpy.mockClear();
        service.setElements([createMockElement('el-1')]);
        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.DataChange, expect.any(Array));
      });
    });
  });

  describe('Draft Elements', () => {
    describe('addDraftElements()', () => {
      it('should add draft elements', () => {
        const drafts = [createMockElement('draft-1'), createMockElement('draft-2')];
        service.addDraftElements(drafts);

        expect(service.draftElements().length).toBe(2);
        expect(service.draftElements()[0].id).toBe('draft-1');
      });

      it('should assign zIndex to draft elements', () => {
        service.addDraftElements([createMockElement('draft-1', { zIndex: undefined })]);
        expect(service.draftElements()[0].zIndex).toBeDefined();
      });

      it('should update maxZIndex', () => {
        service.addDraftElements([createMockElement('draft-1', { zIndex: 100 })]);
        expect(service.maxZIndex()).toBeGreaterThanOrEqual(100);
      });

      it('should handle empty array', () => {
        service.addDraftElements([]);
        expect(service.draftElements().length).toBe(0);
      });
    });

    describe('updateDraftElements()', () => {
      beforeEach(() => {
        service.addDraftElements([createMockElement('draft-1', { x: 0 }), createMockElement('draft-2', { y: 0 })]);
      });

      it('should update draft elements', () => {
        service.updateDraftElements([{ id: 'draft-1', x: 100 }]);

        const draft = service.draftElements().find((d) => d.id === 'draft-1');
        expect(draft?.x).toBe(100);
      });

      it('should update multiple draft elements', () => {
        service.updateDraftElements([
          { id: 'draft-1', x: 100 },
          { id: 'draft-2', y: 200 },
        ]);

        const draft1 = service.draftElements().find((d) => d.id === 'draft-1');
        const draft2 = service.draftElements().find((d) => d.id === 'draft-2');

        expect(draft1?.x).toBe(100);
        expect(draft2?.y).toBe(200);
      });

      it('should handle empty updates', () => {
        service.updateDraftElements([]);
        expect(service.draftElements().length).toBe(2);
      });
    });

    describe('removeDraftElements()', () => {
      beforeEach(() => {
        service.addDraftElements([
          createMockElement('draft-1'),
          createMockElement('draft-2'),
          createMockElement('draft-3'),
        ]);
      });

      it('should remove draft elements by IDs', () => {
        service.removeDraftElements(['draft-1', 'draft-3']);

        expect(service.draftElements().length).toBe(1);
        expect(service.draftElements()[0].id).toBe('draft-2');
      });

      it('should handle non-existent IDs', () => {
        service.removeDraftElements(['non-existent']);
        expect(service.draftElements().length).toBe(3);
      });

      it('should handle empty array', () => {
        service.removeDraftElements([]);
        expect(service.draftElements().length).toBe(3);
      });
    });

    describe('clearDraftElements()', () => {
      it('should clear all draft elements', () => {
        service.addDraftElements([createMockElement('draft-1'), createMockElement('draft-2')]);
        service.clearDraftElements();

        expect(service.draftElements().length).toBe(0);
      });
    });

    describe('commitDraftElements()', () => {
      beforeEach(() => {
        service.addDraftElements([
          createMockElement('draft-1'),
          createMockElement('draft-2'),
          createMockElement('draft-3'),
        ]);
        const emitSpy = eventBus.emit as jest.Mock;
        emitSpy.mockClear();
      });

      it('should commit all draft elements when no IDs provided', () => {
        const committed = service.commitDraftElements();

        expect(committed.length).toBe(3);
        expect(service.draftElements().length).toBe(0);
        expect(service.elementsCount()).toBe(3);
      });

      it('should commit specific draft elements', () => {
        const committed = service.commitDraftElements(['draft-1', 'draft-3']);

        expect(committed.length).toBe(2);
        expect(service.draftElements().length).toBe(1);
        expect(service.elementsCount()).toBe(2);
      });

      it('should emit events', () => {
        service.commitDraftElements();
        expect(eventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsAdded, expect.any(Array));
      });

      it('should handle empty drafts', () => {
        service.clearDraftElements();
        const committed = service.commitDraftElements();
        expect(committed.length).toBe(0);
      });

      it('should handle non-existent IDs', () => {
        const committed = service.commitDraftElements(['non-existent']);
        expect(committed.length).toBe(0);
      });
    });
  });

  describe('Z-Index Management', () => {
    beforeEach(() => {
      service.setElements([
        createMockElement('el-1', { zIndex: 1 }),
        createMockElement('el-2', { zIndex: 2, locked: true }),
        createMockElement('el-3', { zIndex: 3 }),
      ]);
      const emitSpy = eventBus.emit as jest.Mock;
      emitSpy.mockClear();
    });
    describe('getNextZIndex()', () => {
      it('should return next available z-index', () => {
        const next = service.getNextZIndex();
        expect(next).toBeGreaterThan(3);
      });
    });

    describe('bringToFront()', () => {
      it('should bring elements to front', () => {
        service.bringToFront(['el-1']);

        const element = service.getElementById('el-1');
        expect(element?.zIndex).toBeGreaterThan(3);
      });

      it('should not bring locked elements to front', () => {
        service.bringToFront(['el-2']);

        const element = service.getElementById('el-2');
        expect(element?.zIndex).toBe(2);
      });

      it('should bring locked elements when ignoreLock is true', () => {
        service.bringToFront(['el-2'], true);

        const element = service.getElementById('el-2');
        expect(element?.zIndex).toBeGreaterThan(3);
      });

      it('should handle multiple elements', () => {
        service.bringToFront(['el-1', 'el-3']);

        const el1 = service.getElementById('el-1');
        const el3 = service.getElementById('el-3');

        expect(el1?.zIndex).toBeGreaterThan(3);
        expect(el3?.zIndex).toBeGreaterThan(3);
      });
    });

    describe('sendToBack()', () => {
      it('should send elements to back', () => {
        service.sendToBack(['el-3']);

        const element = service.getElementById('el-3');
        expect(element?.zIndex).toBe(0);
      });

      it('should not send locked elements to back', () => {
        service.sendToBack(['el-2']);

        const element = service.getElementById('el-2');
        expect(element?.zIndex).toBe(2);
      });

      it('should send locked elements when ignoreLock is true', () => {
        service.sendToBack(['el-2'], true);

        const element = service.getElementById('el-2');
        expect(element?.zIndex).toBe(0);
      });
    });

    describe('normalizeZIndices()', () => {
      it('should normalize z-indices to sequential values', () => {
        service.setElements([
          createMockElement('el-1', { zIndex: 10 }),
          createMockElement('el-2', { zIndex: 50 }),
          createMockElement('el-3', { zIndex: 100 }),
        ]);

        service.normalizeZIndices();

        const elements = service.elementsByZIndex();
        expect(elements[0].zIndex).toBe(1);
        expect(elements[1].zIndex).toBe(2);
        expect(elements[2].zIndex).toBe(3);
      });
    });

    describe('getElementsByZIndexRange()', () => {
      it('should return elements within z-index range', () => {
        const elements = service.getElementsByZIndexRange(1, 2);

        expect(elements.length).toBe(2);
        expect(elements.map((e) => e.id)).toContain('el-1');
        expect(elements.map((e) => e.id)).toContain('el-2');
      });

      it('should handle inclusive range', () => {
        const elements = service.getElementsByZIndexRange(2, 2);
        expect(elements.length).toBe(1);
        expect(elements[0].id).toBe('el-2');
      });
    });
  });

  describe('Lock Operations', () => {
    beforeEach(() => {
      service.setElements([
        createMockElement('el-1'),
        createMockElement('el-2'),
        createMockElement('el-3', { locked: true }),
      ]);
    });

    describe('lockElements()', () => {
      it('should lock elements', () => {
        service.lockElements(['el-1', 'el-2']);

        expect(service.getElementById('el-1')?.locked).toBe(true);
        expect(service.getElementById('el-2')?.locked).toBe(true);
      });

      it('should handle already locked elements', () => {
        service.lockElements(['el-3']);
        expect(service.getElementById('el-3')?.locked).toBe(true);
      });
    });

    describe('unlockElements()', () => {
      it('should unlock elements', () => {
        service.unlockElements(['el-3']);
        expect(service.getElementById('el-3')?.locked).toBe(false);
      });

      it('should handle already unlocked elements', () => {
        service.unlockElements(['el-1']);
        expect(service.getElementById('el-1')?.locked).toBe(false);
      });
    });

    describe('toggleElementsLock()', () => {
      it('should toggle lock state', () => {
        service.toggleElementsLock(['el-1', 'el-3']);

        expect(service.getElementById('el-1')?.locked).toBe(true);
        expect(service.getElementById('el-3')?.locked).toBe(false);
      });
    });

    describe('lockElement()', () => {
      it('should lock single element', () => {
        service.lockElement('el-1');
        expect(service.getElementById('el-1')?.locked).toBe(true);
      });
    });

    describe('unlockElement()', () => {
      it('should unlock single element', () => {
        service.unlockElement('el-3');
        expect(service.getElementById('el-3')?.locked).toBe(false);
      });
    });

    describe('toggleElementLock()', () => {
      it('should toggle single element lock', () => {
        service.toggleElementLock('el-1');
        expect(service.getElementById('el-1')?.locked).toBe(true);

        service.toggleElementLock('el-1');
        expect(service.getElementById('el-1')?.locked).toBe(false);
      });
    });

    describe('lockAllElements()', () => {
      it('should lock all elements', () => {
        service.lockAllElements();

        expect(service.lockedElementsCount()).toBe(3);
        expect(service.lockStats().allLocked).toBe(true);
      });
    });

    describe('unlockAllElements()', () => {
      it('should unlock all elements', () => {
        service.lockAllElements();
        service.unlockAllElements();

        expect(service.lockedElementsCount()).toBe(0);
        expect(service.lockStats().noneLocked).toBe(true);
      });
    });

    describe('isElementLocked()', () => {
      it('should return true for locked elements', () => {
        expect(service.isElementLocked('el-3')).toBe(true);
      });

      it('should return false for unlocked elements', () => {
        expect(service.isElementLocked('el-1')).toBe(false);
      });

      it('should return false for non-existent elements', () => {
        expect(service.isElementLocked('non-existent')).toBe(false);
      });
    });

    describe('getLockedElementIds()', () => {
      it('should return locked element IDs', () => {
        const locked = service.getLockedElementIds();
        expect(locked).toEqual(['el-3']);
      });
    });

    describe('getUnlockedElementIds()', () => {
      it('should return unlocked element IDs', () => {
        const unlocked = service.getUnlockedElementIds();
        expect(unlocked.length).toBe(2);
        expect(unlocked).toContain('el-1');
        expect(unlocked).toContain('el-2');
      });
    });

    describe('getModifiableElements()', () => {
      it('should return unlocked elements', () => {
        const modifiable = service.getModifiableElements();
        expect(modifiable.length).toBe(2);
        expect(modifiable.map((e) => e.id)).toEqual(['el-1', 'el-2']);
      });
    });
  });

  describe('Layer Integration', () => {
    beforeEach(() => {
      service.setElements([
        createMockElement('el-1', { layerId: 'layer-1' }),
        createMockElement('el-2', { layerId: 'layer-2' }),
        createMockElement('el-3', { layerId: 'layer-1' }),
      ]);
    });

    describe('moveToLayer()', () => {
      it('should move elements to layer', () => {
        service.moveToLayer(['el-1'], 'layer-2');

        // Should update the element's layerId
        expect(service.getElementById('el-1')?.layerId).toBe('layer-2');
      });

      it('should not move locked elements', () => {
        service.lockElement('el-1');
        service.moveToLayer(['el-1'], 'layer-2');

        // Should not update the element's layerId
        expect(service.getElementById('el-1')?.layerId).toBe('layer-1');
      });

      it('should move locked elements when ignoreLock is true', () => {
        service.lockElement('el-1');
        service.moveToLayer(['el-1'], 'layer-2', true);

        expect(service.getElementById('el-1')?.layerId).toBe('layer-2');
      });
    });

    describe('getElementsByLayer()', () => {
      it('should return elements from specific layer', () => {
        const elements = service.getElementsByLayer('layer-1');

        expect(elements.length).toBe(2);
        expect(elements.map((e) => e.id)).toContain('el-1');
        expect(elements.map((e) => e.id)).toContain('el-3');
      });

      it('should return empty array for non-existent layer', () => {
        const elements = service.getElementsByLayer('non-existent');
        expect(elements).toEqual([]);
      });
    });
  });

  describe('Element Queries', () => {
    beforeEach(() => {
      service.setElements([
        createMockElement('el-1', { type: ElementType.Rectangle, x: 0, y: 0, width: 50, height: 50 }),
        createMockElement('el-2', { type: ElementType.Ellipse, x: 100, y: 100, cx: 115, cy: 115, rx: 15, ry: 15 }),
        createMockElement('el-3', { type: ElementType.Line, x: 200, y: 200 }),
      ]);
    });
    describe('getElementById()', () => {
      it('should return element by ID', () => {
        const element = service.getElementById('el-1');
        expect(element?.id).toBe('el-1');
      });

      it('should return undefined for non-existent ID', () => {
        const element = service.getElementById('non-existent');
        expect(element).toBeUndefined();
      });
    });

    describe('getElementsByIds()', () => {
      it('should return elements by IDs', () => {
        const elements = service.getElementsByIds(['el-1', 'el-3']);

        expect(elements.length).toBe(2);
        expect(elements.map((e) => e.id)).toContain('el-1');
        expect(elements.map((e) => e.id)).toContain('el-3');
      });

      it('should filter out non-existent IDs', () => {
        const elements = service.getElementsByIds(['el-1', 'non-existent']);
        expect(elements.length).toBe(1);
      });
    });

    describe('getElementsByType()', () => {
      it('should return elements by type', () => {
        const elements = service.getElementsByType(ElementType.Rectangle);

        expect(elements.length).toBe(1);
        expect(elements[0].id).toBe('el-1');
      });

      it('should return empty array for non-existent type', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const elements = service.getElementsByType('NonExistent' as any);
        expect(elements).toEqual([]);
      });
    });

    describe('elementExists()', () => {
      it('should return true for existing element', () => {
        expect(service.elementExists('el-1')).toBe(true);
      });

      it('should return false for non-existent element', () => {
        expect(service.elementExists('non-existent')).toBe(false);
      });
    });

    describe('getElementsCount()', () => {
      it('should return elements count', () => {
        expect(service.getElementsCount()).toBe(3);
      });
    });

    describe('getElementTypes()', () => {
      it('should return unique element types', () => {
        const types = service.getElementTypes();

        expect(types.length).toBe(3);
        expect(types).toContain(ElementType.Rectangle);
        expect(types).toContain(ElementType.Ellipse);
        expect(types).toContain(ElementType.Line);
      });
    });
  });

  describe('Snapshot Operations', () => {
    beforeEach(() => {
      service.setElements([createMockElement('el-1'), createMockElement('el-2')]);
      service.addDraftElements([createMockElement('draft-1')]);
    });

    describe('createSnapshot()', () => {
      it('should create snapshot of current state', () => {
        const snapshot = service.createSnapshot();

        expect(snapshot.elements.length).toBe(2);
        expect(snapshot.draftElements.length).toBe(1);
        expect(snapshot.maxZIndex).toBeGreaterThan(0);
        expect(snapshot.timestamp).toBeDefined();
      });
    });

    describe('restoreSnapshot()', () => {
      it('should restore state from snapshot', () => {
        const snapshot = service.createSnapshot();

        service.setElements([createMockElement('el-3')]);
        service.clearDraftElements();

        service.restoreSnapshot(snapshot);

        expect(service.elementsCount()).toBe(2);
        expect(service.draftElements().length).toBe(1);
      });
    });
  });

  describe('Getter Methods', () => {
    beforeEach(() => {
      service.setElements([createMockElement('el-1'), createMockElement('el-2')]);
      service.addDraftElements([createMockElement('draft-1')]);
    });

    describe('getElements()', () => {
      it('should return copy of elements', () => {
        const elements = service.getElements();
        expect(elements.length).toBe(2);

        // Verify it's a copy
        elements.push(createMockElement('el-3'));
        expect(service.elementsCount()).toBe(2);
      });
    });

    describe('getDraftElements()', () => {
      it('should return copy of draft elements', () => {
        const drafts = service.getDraftElements();
        expect(drafts.length).toBe(1);

        // Verify it's a copy
        drafts.push(createMockElement('draft-2'));
        expect(service.draftElements().length).toBe(1);
      });
    });

    describe('getAllElements()', () => {
      it('should return all elements (persistent + draft)', () => {
        const all = service.getAllElements();
        expect(all.length).toBe(3); // 2 persistent + 1 draft
      });
    });
  });

  describe('Advanced Search and Query', () => {
    beforeEach(() => {
      service.setElements([
        createMockElement('el-1', {
          type: ElementType.Rectangle,
          x: 10,
          y: 10,
          width: 50,
          height: 50,
          zIndex: 1,
          layerId: 'layer-1',
        }),
        createMockElement('el-2', {
          type: ElementType.Ellipse,
          x: 100,
          y: 100,
          cx: 115,
          cy: 115,
          rx: 15,
          ry: 15,
          zIndex: 5,
          layerId: 'layer-2',
          locked: true,
        }),
        createMockElement('el-3', {
          type: ElementType.Rectangle,
          x: 200,
          y: 200,
          width: 30,
          height: 30,
          zIndex: 10,
        }),
      ]);
    });

    describe('searchElements()', () => {
      it('should search by type', () => {
        const results = service.searchElements({ type: ElementType.Rectangle });
        expect(results.length).toBe(2);
        expect(results.every((el) => el.type === ElementType.Rectangle)).toBe(true);
      });

      it('should search by layerId', () => {
        const results = service.searchElements({ layerId: 'layer-1' });
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('el-1');
      });

      it('should search by locked status', () => {
        const locked = service.searchElements({ locked: true });
        expect(locked.length).toBe(1);
        expect(locked[0].id).toBe('el-2');

        const unlocked = service.searchElements({ locked: false });
        expect(unlocked.length).toBe(2);
      });

      it('should search by zIndex range', () => {
        const results = service.searchElements({ zIndexRange: { min: 1, max: 5 } });
        expect(results.length).toBe(2);
        expect(results.map((el) => el.id)).toContain('el-1');
        expect(results.map((el) => el.id)).toContain('el-2');
      });

      it('should search by bounds', () => {
        const results = service.searchElements({
          bounds: { x: 0, y: 0, width: 70, height: 70 },
        });
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results.some((el) => el.id === 'el-1')).toBe(true);
      });

      it('should combine multiple criteria', () => {
        const results = service.searchElements({
          type: ElementType.Rectangle,
          locked: false,
        });
        expect(results.length).toBe(2);
        expect(results.every((el) => el.type === ElementType.Rectangle && !el.locked)).toBe(true);
      });

      it('should return all elements when no criteria provided', () => {
        const results = service.searchElements({});
        expect(results.length).toBe(3);
      });
    });

    describe('findElementsByText()', () => {
      it('should find elements by text content', () => {
        // Add text elements
        service.setElements([
          { ...createMockElement('text-1'), text: 'Hello World' } as unknown as WhiteboardElement,
          { ...createMockElement('text-2'), text: 'Goodbye' } as unknown as WhiteboardElement,
          { ...createMockElement('text-3'), content: 'Hello Again' } as unknown as WhiteboardElement,
        ]);

        const results = service.findElementsByText('Hello');
        expect(results.length).toBe(2);
        expect(results.map((el) => el.id)).toContain('text-1');
        expect(results.map((el) => el.id)).toContain('text-3');
      });

      it('should be case insensitive', () => {
        service.setElements([{ ...createMockElement('text-1'), text: 'HELLO' } as unknown as WhiteboardElement]);

        const results = service.findElementsByText('hello');
        expect(results.length).toBe(1);
      });

      it('should return empty array when no matches', () => {
        const results = service.findElementsByText('nonexistent');
        expect(results).toEqual([]);
      });
    });

    describe('getElementsInRadius()', () => {
      it('should return elements within radius', () => {
        const results = service.getElementsInRadius(10, 10, 10);
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('el-1');
      });

      it('should return empty array when no elements in radius', () => {
        const results = service.getElementsInRadius(1000, 1000, 10);
        expect(results).toEqual([]);
      });

      it('should calculate distance from element position', () => {
        const results = service.getElementsInRadius(100, 100, 20);
        expect(results.some((el) => el.id === 'el-2')).toBe(true);
      });
    });

    describe('getNearestElement()', () => {
      it('should return nearest element to point', () => {
        const nearest = service.getNearestElement(15, 15);
        expect(nearest?.id).toBe('el-1');
      });

      it('should return undefined when no elements exist', () => {
        service.clear();
        const nearest = service.getNearestElement(10, 10);
        expect(nearest).toBeUndefined();
      });

      it('should calculate distance correctly', () => {
        const nearest = service.getNearestElement(95, 95);
        expect(nearest?.id).toBe('el-2');
      });
    });

    describe('findElementsInBounds()', () => {
      it('should find elements intersecting with bounds', () => {
        const results = service.findElementsInBounds({ x: 0, y: 0, width: 70, height: 70 });
        expect(results.length).toBeGreaterThanOrEqual(1);
        expect(results.some((el) => el.id === 'el-1')).toBe(true);
      });

      it('should return empty array when no intersection', () => {
        const results = service.findElementsInBounds({ x: 1000, y: 1000, width: 10, height: 10 });
        expect(results).toEqual([]);
      });

      it('should detect partial overlaps', () => {
        const results = service.findElementsInBounds({ x: 50, y: 50, width: 100, height: 100 });
        expect(results.length).toBeGreaterThan(0);
      });
    });

    describe('calculateElementsBounds()', () => {
      it('should calculate combined bounds of multiple elements', () => {
        const el1 = service.getElementById('el-1');
        const el3 = service.getElementById('el-3');
        const elements = [el1, el3].filter((el): el is WhiteboardElement => el !== undefined);
        const bounds = service.calculateElementsBounds(elements);

        expect(bounds).not.toBeNull();
        if (bounds) {
          expect(bounds.x).toBeLessThanOrEqual(10);
          expect(bounds.y).toBeLessThanOrEqual(10);
          expect(bounds.width).toBeGreaterThan(0);
          expect(bounds.height).toBeGreaterThan(0);
          expect(bounds.centerX).toBeDefined();
          expect(bounds.centerY).toBeDefined();
        }
      });

      it('should return null for empty array', () => {
        const bounds = service.calculateElementsBounds([]);
        expect(bounds).toBeNull();
      });

      it('should handle single element', () => {
        const el1 = service.getElementById('el-1');
        const elements = el1 ? [el1] : [];
        const bounds = service.calculateElementsBounds(elements);

        expect(bounds).not.toBeNull();
        if (bounds) {
          expect(bounds.width).toBeGreaterThan(0);
          expect(bounds.height).toBeGreaterThan(0);
        }
      });
    });

    describe('getElementsByProperty()', () => {
      it('should get elements by specific property value', () => {
        const results = service.getElementsByProperty('type', ElementType.Rectangle);
        expect(results.length).toBe(2);
        expect(results.every((el) => el.type === ElementType.Rectangle)).toBe(true);
      });

      it('should get elements by zIndex', () => {
        const results = service.getElementsByProperty('zIndex', 5);
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('el-2');
      });

      it('should return empty array when no matches', () => {
        const results = service.getElementsByProperty('zIndex', 999);
        expect(results).toEqual([]);
      });
    });
  });

  describe('Lock Helper Methods', () => {
    beforeEach(() => {
      service.setElements([
        createMockElement('el-1'),
        createMockElement('el-2', { locked: true }),
        createMockElement('el-3'),
        createMockElement('el-4', { locked: true }),
      ]);
    });

    describe('hasLockedElementsInSelection()', () => {
      it('should return true when selection contains locked elements', () => {
        const hasLocked = service.hasLockedElementsInSelection(['el-1', 'el-2']);
        expect(hasLocked).toBe(true);
      });

      it('should return false when selection contains no locked elements', () => {
        const hasLocked = service.hasLockedElementsInSelection(['el-1', 'el-3']);
        expect(hasLocked).toBe(false);
      });

      it('should return false for empty selection', () => {
        const hasLocked = service.hasLockedElementsInSelection([]);
        expect(hasLocked).toBe(false);
      });
    });

    describe('filterUnlockedElements()', () => {
      it('should filter out locked elements', () => {
        const unlocked = service.filterUnlockedElements(['el-1', 'el-2', 'el-3', 'el-4']);
        expect(unlocked.length).toBe(2);
        expect(unlocked).toContain('el-1');
        expect(unlocked).toContain('el-3');
      });

      it('should return all IDs when none are locked', () => {
        const unlocked = service.filterUnlockedElements(['el-1', 'el-3']);
        expect(unlocked.length).toBe(2);
      });

      it('should return empty array when all are locked', () => {
        const unlocked = service.filterUnlockedElements(['el-2', 'el-4']);
        expect(unlocked).toEqual([]);
      });
    });

    describe('getModifiableElementsFromIds()', () => {
      it('should return unlocked elements from IDs', () => {
        const modifiable = service.getModifiableElementsFromIds(['el-1', 'el-2', 'el-3']);
        expect(modifiable.length).toBe(2);
        expect(modifiable.map((el) => el.id)).toContain('el-1');
        expect(modifiable.map((el) => el.id)).toContain('el-3');
      });

      it('should return empty array when all elements are locked', () => {
        const modifiable = service.getModifiableElementsFromIds(['el-2', 'el-4']);
        expect(modifiable).toEqual([]);
      });
    });

    describe('safeUpdateElements()', () => {
      it('should update only unlocked elements', () => {
        const result = service.safeUpdateElements([
          { id: 'el-1', x: 100 } as Partial<WhiteboardElement> & { id: string },
          { id: 'el-2', x: 200 } as Partial<WhiteboardElement> & { id: string },
          { id: 'el-3', x: 300 } as Partial<WhiteboardElement> & { id: string },
        ]);

        expect(result.updated).toContain('el-1');
        expect(result.updated).toContain('el-3');
        expect(result.locked).toContain('el-2');

        expect(service.getElementById('el-1')?.x).toBe(100);
        expect(service.getElementById('el-2')?.x).not.toBe(200);
        expect(service.getElementById('el-3')?.x).toBe(300);
      });

      it('should return all as updated when none are locked', () => {
        const result = service.safeUpdateElements([
          { id: 'el-1', x: 100 } as Partial<WhiteboardElement> & { id: string },
          { id: 'el-3', x: 300 } as Partial<WhiteboardElement> & { id: string },
        ]);

        expect(result.updated.length).toBe(2);
        expect(result.locked.length).toBe(0);
      });

      it('should return all as locked when all are locked', () => {
        const result = service.safeUpdateElements([
          { id: 'el-2', x: 200 } as Partial<WhiteboardElement> & { id: string },
          { id: 'el-4', x: 400 } as Partial<WhiteboardElement> & { id: string },
        ]);

        expect(result.updated.length).toBe(0);
        expect(result.locked.length).toBe(2);
      });
    });
  });

  describe('Draft Elements with Locked Layer', () => {
    beforeEach(() => {
      // Mock activeLayer to return a locked layer
      (layerManagement.activeLayer as unknown as jest.Mock).mockReturnValue({
        id: 'locked-layer',
        name: 'Locked Layer',
        visible: true,
        locked: true,
        zIndex: 0,
        elementIds: [],
      });
    });

    it('should not add draft elements when active layer is locked', () => {
      service.addDraftElements([createMockElement('draft-1')]);
      expect(service.draftElements().length).toBe(0);
    });

    it('should not commit draft elements when active layer is locked', () => {
      // First add drafts with unlocked layer
      (layerManagement.activeLayer as unknown as jest.Mock).mockReturnValue({
        id: 'unlocked-layer',
        name: 'Unlocked Layer',
        visible: true,
        locked: false,
        zIndex: 0,
        elementIds: [],
      });

      service.addDraftElements([createMockElement('draft-1'), createMockElement('draft-2')]);
      expect(service.draftElements().length).toBe(2);

      // Now lock the layer and try to commit
      (layerManagement.activeLayer as unknown as jest.Mock).mockReturnValue({
        id: 'locked-layer',
        name: 'Locked Layer',
        visible: true,
        locked: true,
        zIndex: 0,
        elementIds: [],
      });

      const committed = service.commitDraftElements();
      expect(committed).toEqual([]);
      expect(service.draftElements().length).toBe(0); // Drafts are cleared even though not committed
      expect(service.elementsCount()).toBe(0); // No elements added
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid element additions', () => {
      for (let i = 0; i < 100; i++) {
        service.addElement(createMockElement(`el-${i}`));
      }

      expect(service.elementsCount()).toBe(100);
    });

    it('should handle complex update chains', () => {
      service.addElement(createMockElement('el-1', { x: 0 }));

      service.updateElement({ id: 'el-1', x: 10 });
      service.updateElement({ id: 'el-1', x: 20 });
      service.updateElement({ id: 'el-1', x: 30 });

      expect(service.getElementById('el-1')?.x).toBe(30);
    });

    it('should maintain consistency during lock/unlock cycles', () => {
      service.addElement(createMockElement('el-1'));

      service.lockElement('el-1');
      service.unlockElement('el-1');
      service.lockElement('el-1');

      expect(service.isElementLocked('el-1')).toBe(true);
    });

    it('should handle draft commit with partial elements', () => {
      service.addDraftElements([
        createMockElement('draft-1'),
        createMockElement('draft-2'),
        createMockElement('draft-3'),
      ]);

      service.commitDraftElements(['draft-1', 'draft-3']);

      expect(service.elementsCount()).toBe(2);
      expect(service.draftElements().length).toBe(1);
    });
  });
});
