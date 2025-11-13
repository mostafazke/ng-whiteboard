import { TestBed } from '@angular/core/testing';
import { SelectionService } from './selection.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { ClipboardService } from '../input/clipboard.service';
import { ElementsService } from './elements.service';
import { ToolsService } from '../tools/tools.service';
import { CanvasService } from '../canvas/canvas.service';
import { WhiteboardElement, ElementType, WhiteboardEvent, AlignmentType, ToolType } from '../types';

describe('SelectionService', () => {
  let service: SelectionService;
  let eventBusService: EventBusService;
  let clipboardService: ClipboardService;
  let elementsService: ElementsService;
  let toolsService: ToolsService;
  let canvasService: CanvasService;

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
    const clipboardSpy = {
      cut: jest.fn(),
      copy: jest.fn(),
      paste: jest.fn().mockReturnValue([]),
      duplicateElements: jest.fn().mockReturnValue([]),
    };
    const elementsSpy = {
      getElements: jest.fn().mockReturnValue([]),
      updateElements: jest.fn(),
      removeElements: jest.fn(),
    };
    const toolsSpy = {
      setActiveTool: jest.fn(),
    };
    const canvasSpy = {
      getVisibleBounds: jest.fn().mockReturnValue({
        left: 0,
        top: 0,
        right: 1000,
        bottom: 800,
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        SelectionService,
        { provide: EventBusService, useValue: eventBusSpy },
        { provide: ClipboardService, useValue: clipboardSpy },
        { provide: ElementsService, useValue: elementsSpy },
        { provide: ToolsService, useValue: toolsSpy },
        { provide: CanvasService, useValue: canvasSpy },
      ],
    });

    service = TestBed.inject(SelectionService);
    eventBusService = TestBed.inject(EventBusService);
    clipboardService = TestBed.inject(ClipboardService);
    elementsService = TestBed.inject(ElementsService);
    toolsService = TestBed.inject(ToolsService);
    canvasService = TestBed.inject(CanvasService);
  });

  describe('Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with empty selection', () => {
      expect(service.getSelectedIds()).toEqual([]);
      expect(service.hasSelection()).toBe(false);
      expect(service.getSelectionCount()).toBe(0);
    });

    it('should initialize with empty selection box', () => {
      const selectionBox = service.getSelectionBox();
      expect(selectionBox.visible).toBe(false);
      expect(selectionBox.width).toBe(0);
      expect(selectionBox.height).toBe(0);
    });

    it('should initialize with null bounding box', () => {
      expect(service.getBoundingBox()).toBeNull();
    });
  });

  describe('Selection State Access', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { x: 0, y: 0 }),
        createMockElement('el-2', { x: 100, y: 100 }),
        createMockElement('el-3', { x: 200, y: 200 }),
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
    });

    describe('getSelectedIds()', () => {
      it('should return empty array initially', () => {
        expect(service.getSelectedIds()).toEqual([]);
      });

      it('should return selected element IDs', () => {
        service.selectElements(['el-1', 'el-2']);
        const ids = service.getSelectedIds();
        expect(ids.length).toBe(2);
        expect(ids).toContain('el-1');
        expect(ids).toContain('el-2');
      });
    });

    describe('getSelectedElements()', () => {
      it('should return empty array initially', () => {
        expect(service.getSelectedElements()).toEqual([]);
      });

      it('should return selected elements', () => {
        service.selectElements(['el-1', 'el-2']);
        const elements = service.getSelectedElements();
        expect(elements.length).toBe(2);
        expect(elements.map((el) => el.id)).toContain('el-1');
        expect(elements.map((el) => el.id)).toContain('el-2');
      });
    });

    describe('isSelected()', () => {
      beforeEach(() => {
        service.selectElements(['el-1']);
      });

      it('should return true for selected element ID', () => {
        expect(service.isSelected('el-1')).toBe(true);
      });

      it('should return false for non-selected element ID', () => {
        expect(service.isSelected('el-2')).toBe(false);
      });

      it('should work with element objects', () => {
        const element = createMockElement('el-1');
        expect(service.isSelected(element)).toBe(true);
      });
    });

    describe('getSelectionCount()', () => {
      it('should return 0 initially', () => {
        expect(service.getSelectionCount()).toBe(0);
      });

      it('should return correct count', () => {
        service.selectElements(['el-1', 'el-2']);
        expect(service.getSelectionCount()).toBe(2);
      });
    });

    describe('hasSelection()', () => {
      it('should return false initially', () => {
        expect(service.hasSelection()).toBe(false);
      });

      it('should return true when elements are selected', () => {
        service.selectElements(['el-1']);
        expect(service.hasSelection()).toBe(true);
      });
    });
  });

  describe('Selection Operations', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { x: 0, y: 0, zIndex: 1 }),
        createMockElement('el-2', { x: 100, y: 100, zIndex: 2 }),
        createMockElement('el-3', { x: 200, y: 200, zIndex: 3 }),
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
    });

    describe('selectElements()', () => {
      it('should select element by ID', () => {
        service.selectElements('el-1');
        expect(service.isSelected('el-1')).toBe(true);
        expect(service.getSelectionCount()).toBe(1);
      });

      it('should select multiple elements by ID array', () => {
        service.selectElements(['el-1', 'el-2']);
        expect(service.getSelectionCount()).toBe(2);
        expect(service.isSelected('el-1')).toBe(true);
        expect(service.isSelected('el-2')).toBe(true);
      });

      it('should select element by object', () => {
        const element = createMockElement('el-1');
        service.selectElements(element);
        expect(service.isSelected('el-1')).toBe(true);
      });

      it('should select multiple elements by object array', () => {
        const elements = [createMockElement('el-1'), createMockElement('el-2')];
        service.selectElements(elements);
        expect(service.getSelectionCount()).toBe(2);
      });

      it('should replace selection by default', () => {
        service.selectElements('el-1');
        service.selectElements('el-2');
        expect(service.getSelectionCount()).toBe(1);
        expect(service.isSelected('el-1')).toBe(false);
        expect(service.isSelected('el-2')).toBe(true);
      });

      it('should append to selection when append is true', () => {
        service.selectElements('el-1');
        service.selectElements('el-2', true);
        expect(service.getSelectionCount()).toBe(2);
        expect(service.isSelected('el-1')).toBe(true);
        expect(service.isSelected('el-2')).toBe(true);
      });

      it('should emit ElementsSelected event', () => {
        service.selectElements('el-1');
        expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsSelected, expect.any(Array));
      });

      it('should activate select tool when selecting elements', () => {
        service.selectElements('el-1');
        expect(toolsService.setActiveTool).toHaveBeenCalledWith(ToolType.Select);
      });

      it('should update bounding box', () => {
        service.selectElements('el-1');
        const boundingBox = service.getBoundingBox();
        expect(boundingBox).not.toBeNull();
      });
    });

    describe('deselectElement()', () => {
      beforeEach(() => {
        service.selectElements(['el-1', 'el-2']);
      });

      it('should deselect element by ID', () => {
        service.deselectElement('el-1');
        expect(service.isSelected('el-1')).toBe(false);
        expect(service.isSelected('el-2')).toBe(true);
      });

      it('should deselect element by object', () => {
        const element = createMockElement('el-1');
        service.deselectElement(element);
        expect(service.isSelected('el-1')).toBe(false);
      });

      it('should emit ElementsSelected event', () => {
        const emitSpy = eventBusService.emit as jest.Mock;
        emitSpy.mockClear();
        service.deselectElement('el-1');
        expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsSelected, expect.any(Array));
      });

      it('should update bounding box', () => {
        service.deselectElement('el-1');
        const boundingBox = service.getBoundingBox();
        expect(boundingBox).not.toBeNull();
      });

      it('should do nothing if element is not selected', () => {
        const initialCount = service.getSelectionCount();
        service.deselectElement('el-3');
        expect(service.getSelectionCount()).toBe(initialCount);
      });
    });

    describe('toggleSelection()', () => {
      it('should select element if not selected', () => {
        service.toggleSelection('el-1');
        expect(service.isSelected('el-1')).toBe(true);
      });

      it('should deselect element if selected', () => {
        service.selectElements('el-1');
        service.toggleSelection('el-1');
        expect(service.isSelected('el-1')).toBe(false);
      });

      it('should work with element objects', () => {
        const element = createMockElement('el-1');
        service.toggleSelection(element);
        expect(service.isSelected('el-1')).toBe(true);
      });

      it('should emit ElementsSelected event', () => {
        service.toggleSelection('el-1');
        expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsSelected, expect.any(Array));
      });

      it('should activate select tool when toggling on', () => {
        service.toggleSelection('el-1');
        expect(toolsService.setActiveTool).toHaveBeenCalledWith(ToolType.Select);
      });
    });

    describe('clearSelection()', () => {
      beforeEach(() => {
        service.selectElements(['el-1', 'el-2']);
      });

      it('should clear all selection', () => {
        service.clearSelection();
        expect(service.getSelectionCount()).toBe(0);
        expect(service.hasSelection()).toBe(false);
      });

      it('should clear bounding box', () => {
        service.clearSelection();
        expect(service.getBoundingBox()).toBeNull();
      });

      it('should emit ElementsSelected event with empty array', () => {
        const emitSpy = eventBusService.emit as jest.Mock;
        emitSpy.mockClear();
        service.clearSelection();
        expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsSelected, []);
      });
    });

    describe('selectAll()', () => {
      it('should select all elements', () => {
        service.selectAll();
        expect(service.getSelectionCount()).toBe(3);
      });

      it('should emit ElementsSelected event', () => {
        service.selectAll();
        expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsSelected, expect.any(Array));
      });

      it('should activate select tool when elements exist', () => {
        service.selectAll();
        expect(toolsService.setActiveTool).toHaveBeenCalledWith(ToolType.Select);
      });

      it('should not activate select tool when no elements exist', () => {
        (elementsService.getElements as jest.Mock).mockReturnValue([]);
        const spy = toolsService.setActiveTool as jest.Mock;
        spy.mockClear();
        service.selectAll();
        expect(toolsService.setActiveTool).not.toHaveBeenCalled();
      });

      it('should update bounding box', () => {
        service.selectAll();
        const boundingBox = service.getBoundingBox();
        expect(boundingBox).not.toBeNull();
      });
    });

    describe('selectElementsInArea()', () => {
      it('should select elements within area', () => {
        service.selectElementsInArea({ x: 0, y: 0, width: 150, height: 150 });
        expect(service.getSelectionCount()).toBeGreaterThan(0);
      });

      it('should not select elements outside area', () => {
        service.selectElementsInArea({ x: 1000, y: 1000, width: 10, height: 10 });
        expect(service.getSelectionCount()).toBe(0);
      });

      it('should select elements that intersect with area', () => {
        service.selectElementsInArea({ x: 50, y: 50, width: 100, height: 100 });
        // Should select el-1 and el-2 which intersect with this area
        expect(service.getSelectionCount()).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Grouped Elements', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { x: 0, y: 0, groupId: 'group-1' }),
        createMockElement('el-2', { x: 100, y: 100, groupId: 'group-1' }),
        createMockElement('el-3', { x: 200, y: 200 }), // No group
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
    });

    it('should select all grouped elements when one is selected', () => {
      service.selectElements('el-1');
      expect(service.getSelectionCount()).toBe(2);
      expect(service.isSelected('el-1')).toBe(true);
      expect(service.isSelected('el-2')).toBe(true);
    });

    it('should deselect all grouped elements when one is deselected', () => {
      service.selectElements(['el-1', 'el-2', 'el-3']);
      service.deselectElement('el-1');
      expect(service.isSelected('el-1')).toBe(false);
      expect(service.isSelected('el-2')).toBe(false);
      expect(service.isSelected('el-3')).toBe(true);
    });

    it('should toggle all grouped elements', () => {
      service.toggleSelection('el-1');
      expect(service.getSelectionCount()).toBe(2);
      service.toggleSelection('el-1');
      expect(service.getSelectionCount()).toBe(0);
    });
  });

  describe('Selection Box', () => {
    describe('setSelectionBox()', () => {
      it('should set selection box', () => {
        const box = { x: 10, y: 20, width: 100, height: 50, visible: true };
        service.setSelectionBox(box);
        expect(service.getSelectionBox()).toEqual(box);
      });
    });

    describe('getSelectionBox()', () => {
      it('should return current selection box', () => {
        const box = { x: 10, y: 20, width: 100, height: 50, visible: true };
        service.setSelectionBox(box);
        const result = service.getSelectionBox();
        expect(result).toEqual(box);
      });
    });

    describe('getSelectionBoxSignal()', () => {
      it('should return readonly signal', () => {
        const signal = service.getSelectionBoxSignal();
        expect(signal).toBeDefined();
        expect(signal()).toBeDefined();
      });
    });

    describe('clearSelectionBox()', () => {
      it('should clear selection box', () => {
        service.setSelectionBox({ x: 10, y: 20, width: 100, height: 50, visible: true });
        service.clearSelectionBox();
        const box = service.getSelectionBox();
        expect(box.visible).toBe(false);
        expect(box.width).toBe(0);
        expect(box.height).toBe(0);
      });
    });
  });

  describe('Bounding Box', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { x: 0, y: 0, width: 100, height: 100 }),
        createMockElement('el-2', { x: 200, y: 200, width: 100, height: 100 }),
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
    });

    describe('updateBoundingBox()', () => {
      it('should update bounding box based on selection', () => {
        service.selectElements('el-1');
        service.updateBoundingBox();
        const box = service.getBoundingBox();
        expect(box).not.toBeNull();
      });

      it('should clear bounding box when no selection', () => {
        service.clearSelection();
        service.updateBoundingBox();
        expect(service.getBoundingBox()).toBeNull();
      });
    });

    describe('getBoundingBox()', () => {
      it('should return null initially', () => {
        expect(service.getBoundingBox()).toBeNull();
      });

      it('should return bounding box after selection', () => {
        service.selectElements('el-1');
        const box = service.getBoundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.x).toBeDefined();
          expect(box.y).toBeDefined();
          expect(box.width).toBeDefined();
          expect(box.height).toBeDefined();
          expect(box.handles).toBeDefined();
        }
      });

      it('should calculate correct bounds for multiple elements', () => {
        service.selectElements(['el-1', 'el-2']);
        const box = service.getBoundingBox();
        expect(box).not.toBeNull();
        if (box) {
          expect(box.width).toBeGreaterThan(100);
          expect(box.height).toBeGreaterThan(100);
        }
      });

      it('should include rotation for single element', () => {
        const elements = [createMockElement('el-1', { x: 0, y: 0, rotation: 45 })];
        (elementsService.getElements as jest.Mock).mockReturnValue(elements);
        service.selectElements('el-1');
        const box = service.getBoundingBox();
        expect(box?.rotation).toBe(45);
      });
    });

    describe('getBoundingBoxSignal()', () => {
      it('should return readonly signal', () => {
        const signal = service.getBoundingBoxSignal();
        expect(signal).toBeDefined();
      });
    });

    describe('clearBoundingBox()', () => {
      it('should clear bounding box', () => {
        service.selectElements('el-1');
        service.clearBoundingBox();
        expect(service.getBoundingBox()).toBeNull();
      });
    });
  });

  describe('Clipboard Operations', () => {
    beforeEach(() => {
      const elements = [createMockElement('el-1'), createMockElement('el-2')];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
      service.selectElements(['el-1', 'el-2']);
    });

    describe('cutElements()', () => {
      it('should cut selected elements', () => {
        service.cutElements();
        expect(clipboardService.cut).toHaveBeenCalledWith(expect.any(Array));
        expect(elementsService.removeElements).toHaveBeenCalled();
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const cutSpy = clipboardService.cut as jest.Mock;
        cutSpy.mockClear();
        service.cutElements();
        expect(clipboardService.cut).not.toHaveBeenCalled();
      });
    });

    describe('copyElements()', () => {
      it('should copy selected elements', () => {
        service.copyElements();
        expect(clipboardService.copy).toHaveBeenCalledWith(expect.any(Array));
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const copySpy = clipboardService.copy as jest.Mock;
        copySpy.mockClear();
        service.copyElements();
        expect(clipboardService.copy).not.toHaveBeenCalled();
      });
    });

    describe('pasteElements()', () => {
      it('should paste elements from clipboard', () => {
        const pastedElements = [createMockElement('pasted-1')];
        (clipboardService.paste as jest.Mock).mockReturnValue(pastedElements);
        (elementsService.getElements as jest.Mock).mockReturnValue([
          ...elementsService.getElements(),
          ...pastedElements,
        ]);

        service.pasteElements();
        expect(clipboardService.paste).toHaveBeenCalled();
      });

      it('should select pasted elements', () => {
        const pastedElements = [createMockElement('pasted-1')];
        (clipboardService.paste as jest.Mock).mockReturnValue(pastedElements);
        (elementsService.getElements as jest.Mock).mockReturnValue(pastedElements);

        service.pasteElements();
        expect(service.isSelected('pasted-1')).toBe(true);
      });

      it('should do nothing when clipboard is empty', () => {
        (clipboardService.paste as jest.Mock).mockReturnValue([]);
        service.pasteElements();
        // Selection should remain unchanged
      });
    });

    describe('duplicateElements()', () => {
      it('should duplicate selected elements', () => {
        service.duplicateElements();
        expect(clipboardService.duplicateElements).toHaveBeenCalledWith(expect.any(Array));
      });

      it('should select duplicated elements', () => {
        const originalElements = [createMockElement('el-1'), createMockElement('el-2')];
        const duplicated = [createMockElement('dup-1')];
        (clipboardService.duplicateElements as jest.Mock).mockReturnValue(duplicated);
        (elementsService.getElements as jest.Mock).mockReturnValue([...originalElements, ...duplicated]);

        service.duplicateElements();
        expect(service.isSelected('dup-1')).toBe(true);
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const dupSpy = clipboardService.duplicateElements as jest.Mock;
        dupSpy.mockClear();
        service.duplicateElements();
        expect(clipboardService.duplicateElements).not.toHaveBeenCalled();
      });
    });

    describe('deleteSelectedElements()', () => {
      it('should delete selected elements', () => {
        service.deleteSelectedElements();
        expect(elementsService.removeElements).toHaveBeenCalledWith(expect.any(Array), true);
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const removeSpy = elementsService.removeElements as jest.Mock;
        removeSpy.mockClear();
        service.deleteSelectedElements();
        expect(elementsService.removeElements).not.toHaveBeenCalled();
      });
    });
  });

  describe('Selection Transformation', () => {
    beforeEach(() => {
      const elements = [createMockElement('el-1', { x: 0, y: 0 }), createMockElement('el-2', { x: 100, y: 100 })];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
      service.selectElements(['el-1', 'el-2']);
    });

    describe('updateSelectedElements()', () => {
      it('should update all selected elements', () => {
        service.updateSelectedElements({ opacity: 50 });
        expect(elementsService.updateElements).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'el-1', opacity: 50 }),
            expect.objectContaining({ id: 'el-2', opacity: 50 }),
          ])
        );
      });

      it('should emit ElementsSelected event', () => {
        const emitSpy = eventBusService.emit as jest.Mock;
        emitSpy.mockClear();
        service.updateSelectedElements({ opacity: 50 });
        expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsSelected, expect.any(Array));
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.updateSelectedElements({ opacity: 50 });
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });

      it('should use custom update function if provided', () => {
        const customUpdate = jest.fn();
        service.updateSelectedElements({ opacity: 50 }, customUpdate);
        expect(customUpdate).toHaveBeenCalled();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });

    describe('transformSelectedElements()', () => {
      it('should transform selected elements', () => {
        const transformFn = (elements: WhiteboardElement[]) => elements.map((el) => ({ ...el, x: el.x + 10 }));

        service.transformSelectedElements(transformFn);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        const transformFn = (elements: WhiteboardElement[]) => elements;
        service.transformSelectedElements(transformFn);
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });

      it('should use custom update function if provided', () => {
        const customUpdate = jest.fn();
        const transformFn = (elements: WhiteboardElement[]) => elements;
        service.transformSelectedElements(transformFn, customUpdate);
        expect(customUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Selection Utilities', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { x: 0, y: 0, width: 100, height: 100, type: ElementType.Rectangle }),
        {
          ...createMockElement('el-2', { x: 200, y: 200, type: ElementType.Ellipse }),
          rx: 50,
          ry: 50,
        } as WhiteboardElement,
        createMockElement('el-3', { x: 400, y: 400, width: 100, height: 100, type: ElementType.Rectangle }),
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
    });

    describe('getSelectionBounds()', () => {
      it('should return null when no selection', () => {
        expect(service.getSelectionBounds()).toBeNull();
      });

      it('should return bounds for selection', () => {
        service.selectElements(['el-1', 'el-2']);
        const bounds = service.getSelectionBounds();
        expect(bounds).not.toBeNull();
        if (bounds) {
          expect(bounds.minX).toBeDefined();
          expect(bounds.minY).toBeDefined();
          expect(bounds.maxX).toBeDefined();
          expect(bounds.maxY).toBeDefined();
        }
      });

      it('should calculate combined bounds correctly', () => {
        service.selectElements(['el-1', 'el-3']);
        const bounds = service.getSelectionBounds();
        expect(bounds).not.toBeNull();
        if (bounds) {
          expect(bounds.minX).toBe(0);
          expect(bounds.maxX).toBeGreaterThan(400);
        }
      });
    });

    describe('selectionContainsType()', () => {
      beforeEach(() => {
        service.selectElements(['el-1', 'el-2']);
      });

      it('should return true when selection contains type', () => {
        expect(service.selectionContainsType(ElementType.Rectangle)).toBe(true);
        expect(service.selectionContainsType(ElementType.Ellipse)).toBe(true);
      });

      it('should return false when selection does not contain type', () => {
        expect(service.selectionContainsType(ElementType.Line)).toBe(false);
      });
    });

    describe('getSelectedElementTypes()', () => {
      it('should return empty array when no selection', () => {
        expect(service.getSelectedElementTypes()).toEqual([]);
      });

      it('should return unique element types', () => {
        service.selectElements(['el-1', 'el-2', 'el-3']);
        const types = service.getSelectedElementTypes();
        expect(types.length).toBe(2);
        expect(types).toContain(ElementType.Rectangle);
        expect(types).toContain(ElementType.Ellipse);
      });
    });

    describe('removeSelectedElements()', () => {
      it('should remove selected elements', () => {
        service.selectElements(['el-1', 'el-2']);
        service.removeSelectedElements();
        expect(elementsService.removeElements).toHaveBeenCalled();
      });

      it('should clear selection after removal', () => {
        service.selectElements(['el-1']);
        service.removeSelectedElements();
        expect(service.hasSelection()).toBe(false);
      });

      it('should do nothing when no selection', () => {
        const removeSpy = elementsService.removeElements as jest.Mock;
        removeSpy.mockClear();
        service.removeSelectedElements();
        expect(elementsService.removeElements).not.toHaveBeenCalled();
      });
    });
  });

  describe('Z-Index Operations', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { zIndex: 1 }),
        createMockElement('el-2', { zIndex: 2 }),
        createMockElement('el-3', { zIndex: 3 }),
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
    });

    describe('bringToFront()', () => {
      it('should bring selected elements to front', () => {
        service.selectElements('el-1');
        service.bringToFront();
        expect(elementsService.updateElements).toHaveBeenCalledWith(
          expect.arrayContaining([expect.objectContaining({ id: 'el-1', zIndex: expect.any(Number) })])
        );
      });

      it('should do nothing when no selection', () => {
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.bringToFront();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });

    describe('bringForward()', () => {
      it('should bring selected elements forward', () => {
        service.selectElements('el-1');
        service.bringForward();
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should swap z-index with next element', () => {
        service.selectElements('el-1');
        service.bringForward();
        const calls = (elementsService.updateElements as jest.Mock).mock.calls;
        expect(calls.length).toBeGreaterThan(0);
      });

      it('should do nothing when no selection', () => {
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.bringForward();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });

    describe('sendBackward()', () => {
      it('should send selected elements backward', () => {
        service.selectElements('el-3');
        service.sendBackward();
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should do nothing when no selection', () => {
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.sendBackward();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });

    describe('sendToBack()', () => {
      it('should send selected elements to back', () => {
        service.selectElements('el-3');
        service.sendToBack();
        expect(elementsService.updateElements).toHaveBeenCalledTimes(2); // Once for selected, once for others
      });

      it('should assign low z-index to selected elements', () => {
        service.selectElements('el-3');
        service.sendToBack();
        const firstCall = (elementsService.updateElements as jest.Mock).mock.calls[0][0];
        expect(firstCall[0].zIndex).toBe(1);
      });

      it('should do nothing when no selection', () => {
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.sendToBack();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });
  });

  describe('Grouping Operations', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1'),
        createMockElement('el-2'),
        createMockElement('el-3', { groupId: 'existing-group' }),
        createMockElement('el-4', { groupId: 'existing-group' }),
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
    });

    describe('groupSelectedElements()', () => {
      it('should group selected elements', () => {
        service.selectElements(['el-1', 'el-2']);
        service.groupSelectedElements();
        expect(elementsService.updateElements).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'el-1', groupId: expect.any(String) }),
            expect.objectContaining({ id: 'el-2', groupId: expect.any(String) }),
          ])
        );
      });

      it('should assign same groupId to all elements', () => {
        service.selectElements(['el-1', 'el-2']);
        service.groupSelectedElements();
        const updates = (elementsService.updateElements as jest.Mock).mock.calls[0][0];
        const groupId = updates[0].groupId;
        expect(updates.every((u: { groupId: string }) => u.groupId === groupId)).toBe(true);
      });

      it('should do nothing when less than 2 elements selected', () => {
        service.selectElements('el-1');
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.groupSelectedElements();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });

    describe('ungroupSelectedElements()', () => {
      it('should ungroup selected elements', () => {
        service.selectElements(['el-3', 'el-4']);
        service.ungroupSelectedElements();
        expect(elementsService.updateElements).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'el-3', groupId: undefined }),
            expect.objectContaining({ id: 'el-4', groupId: undefined }),
          ])
        );
      });

      it('should do nothing when no grouped elements selected', () => {
        service.selectElements(['el-1', 'el-2']);
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.ungroupSelectedElements();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });

      it('should do nothing when no selection', () => {
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.ungroupSelectedElements();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });
  });

  describe('Locking Operations', () => {
    beforeEach(() => {
      const elements = [createMockElement('el-1'), createMockElement('el-2')];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
      service.selectElements(['el-1', 'el-2']);
    });

    describe('lockElements()', () => {
      it('should lock selected elements', () => {
        service.lockElements();
        expect(elementsService.updateElements).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'el-1', locked: true }),
            expect.objectContaining({ id: 'el-2', locked: true }),
          ])
        );
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.lockElements();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });

    describe('unlockElements()', () => {
      it('should unlock selected elements', () => {
        service.unlockElements();
        expect(elementsService.updateElements).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: 'el-1', locked: false }),
            expect.objectContaining({ id: 'el-2', locked: false }),
          ])
        );
      });

      it('should do nothing when no selection', () => {
        service.clearSelection();
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.unlockElements();
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });
    });
  });

  describe('Alignment Operations', () => {
    beforeEach(() => {
      const elements = [
        createMockElement('el-1', { x: 0, y: 0, width: 100, height: 100 }),
        createMockElement('el-2', { x: 150, y: 50, width: 100, height: 100 }),
        createMockElement('el-3', { x: 250, y: 150, width: 100, height: 100 }),
        createMockElement('el-4', { x: 600, y: 300, width: 100, height: 100 }),
      ];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);
      service.selectElements(['el-1', 'el-2', 'el-3', 'el-4']);
    });

    describe('alignElements()', () => {
      it('should align elements left', () => {
        service.alignElements(AlignmentType.Left);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should align elements center', () => {
        service.alignElements(AlignmentType.Center);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should align elements right', () => {
        service.alignElements(AlignmentType.Right);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should align elements top', () => {
        service.alignElements(AlignmentType.Top);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should align elements middle', () => {
        service.alignElements(AlignmentType.Middle);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should align elements bottom', () => {
        service.alignElements(AlignmentType.Bottom);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should distribute horizontally', () => {
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.alignElements(AlignmentType.DistributeHorizontally);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should distribute vertically', () => {
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.alignElements(AlignmentType.DistributeVertically);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should align single element to viewport', () => {
        service.clearSelection();
        service.selectElements('el-1');
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        // Element is at x:0, viewport left is 0, so aligning left won't change anything
        // Use Center alignment which should move element to center of viewport
        service.alignElements(AlignmentType.Center);
        expect(elementsService.updateElements).toHaveBeenCalled();
      });

      it('should not distribute with less than 3 elements', () => {
        service.clearSelection();
        service.selectElements(['el-1', 'el-2']);
        const updateSpy = elementsService.updateElements as jest.Mock;
        updateSpy.mockClear();
        service.alignElements(AlignmentType.DistributeHorizontally);
        expect(elementsService.updateElements).not.toHaveBeenCalled();
      });

      it('should update bounding box after alignment', () => {
        service.alignElements(AlignmentType.Left);
        expect(service.getBoundingBox()).not.toBeNull();
      });
    });
  });

  describe('Signals', () => {
    it('should provide selectedIdsSignal', () => {
      const signal = service.selectedIdsSignal;
      expect(signal()).toEqual([]);
    });

    it('should provide hasSelectionSignal', () => {
      const signal = service.hasSelectionSignal;
      expect(signal()).toBe(false);
    });

    it('should provide getSelectedElementsSignal', () => {
      const signal = service.getSelectedElementsSignal();
      expect(signal()).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle selection when elements function returns undefined', () => {
      // Mock to return empty array to simulate missing data
      (elementsService.getElements as jest.Mock).mockReturnValue([]);

      const elements = service.getSelectedElements();
      expect(elements).toEqual([]);
    });

    it('should handle rapid selection changes', () => {
      const elements = [createMockElement('el-1'), createMockElement('el-2'), createMockElement('el-3')];
      (elementsService.getElements as jest.Mock).mockReturnValue(elements);

      service.selectElements('el-1');
      service.selectElements('el-2');
      service.selectElements('el-3');
      expect(service.getSelectionCount()).toBe(1);
      expect(service.isSelected('el-3')).toBe(true);
    });

    it('should handle selection of non-existent elements gracefully', () => {
      (elementsService.getElements as jest.Mock).mockReturnValue([]);
      service.selectElements(['non-existent']);
      // Should not crash
      expect(service.getSelectionCount()).toBe(1); // ID is added but element doesn't exist
      expect(service.getSelectedElements()).toEqual([]);
    });
  });
});
