import { ApiService } from '../../api/api.service';
import { getElementUtil } from '../../elements/element.utils';
import { Direction, ElementType, ToolType, WhiteboardConfig, WhiteboardElement } from '../../types';
import { getMouseTarget } from '../../utils/dom';
import { calculateAngle, getRotatedDirection, getSnappedOffset, isElementInSelectionBox } from '../../utils/geometry';
import { SelectAction, SelectTool } from '../select-tool';
import { ITEM_PREFIX, SELECTOR_BOX, SELECTOR_GRIP_RESIZE, SELECTOR_GRIP_ROTATE } from './../../constants/index';
import { createMockWhiteboardConfig, createMockPointerInfo } from '../../testing';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/dom', () => ({
  getMouseTarget: jest.fn(),
}));

jest.mock('../../utils/geometry', () => ({
  getSnappedOffset: jest.fn(),
  calculateAngle: jest.fn(),
  findNearestSnapAngle: jest.fn(),
  normalizeAngle: jest.fn((angle: number) => ((angle % 360) + 360) % 360),
  isElementInSelectionBox: jest.fn(),
  getCanvasCoordinates: jest.fn(),
  getRotatedDirection: jest.fn(),
}));

jest.mock('../../utils/drawing/vector', () => ({
  rotAround: jest.fn(),
}));

describe('SelectTool', () => {
  let selectTool: SelectTool;
  let apiService: ApiService;
  let config: WhiteboardConfig;
  let rafCallbacks: Array<FrameRequestCallback> = [];
  let rafId = 0;

  // Helper to flush RAF queue
  const flushRAF = () => {
    const callbacks = [...rafCallbacks];
    rafCallbacks = [];
    callbacks.forEach((cb) => cb(0));
  };

  beforeEach(() => {
    // Mock requestAnimationFrame to execute immediately
    rafCallbacks = [];
    rafId = 0;
    global.requestAnimationFrame = jest.fn((callback: FrameRequestCallback) => {
      rafId++;
      rafCallbacks.push(callback);
      return rafId;
    });
    global.cancelAnimationFrame = jest.fn(() => {
      // Remove callback from queue
      rafCallbacks = [];
    });

    config = createMockWhiteboardConfig({
      strokeColor: '#000000',
      strokeWidth: 2,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
      zoom: 1,
      x: 0,
      y: 0,
    });

    apiService = {
      getConfig: jest.fn().mockReturnValue(config),
      getElements: jest.fn().mockReturnValue([]),
      clearSelection: jest.fn(),
      clearSelectionBox: jest.fn(),
      getSelectedElements: jest.fn().mockReturnValue([
        {
          id: '1',
          type: 'rectangle',
          width: 100,
          height: 100,
          x: 0,
          y: 0,
          rotate: 0,
        },
      ]),
      updateBoundingBox: jest.fn(),
      selectElements: jest.fn(),
      transformSelectedElements: jest.fn(),
      setSelectionBox: jest.fn(),
      getElementById: jest.fn().mockImplementation((id) => ({ id })),
      getBoundingBox: jest.fn(),
      getBoundingBoxSignal: jest.fn(() => () => null),
      toggleSelection: jest.fn(),
      getCanvasCoordinates: jest.fn().mockImplementation((x, y) => ({ x, y })),
      setCursor: jest.fn(),
      resetCursor: jest.fn(),
    } as unknown as ApiService;

    selectTool = new SelectTool(apiService);
    selectTool.activate();
  });

  describe('initialization', () => {
    it('should initialize with correct type and default state', () => {
      expect(selectTool.type).toBe(ToolType.Select);
      expect(selectTool.getCurrentAction()).toBe(SelectAction.None);
      expect(selectTool.getStartPoint()).toBeNull();
      expect(selectTool.getCurrentHandle()).toBeNull();
    });
  });

  describe('activation/deactivation', () => {
    it('should clear selection on deactivate', () => {
      selectTool.onDeactivate();
      expect(apiService.clearSelection).toHaveBeenCalled();
    });
  });

  describe('handlePointerDown', () => {
    it('should handle element selection without shift key', () => {
      const mockElement = {
        id: ITEM_PREFIX + '1',
        getAttribute: jest.fn().mockReturnValue('1'),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);
      apiService.getElements = jest.fn().mockReturnValue([{ id: '1' }]);

      const mockEvent = createMockPointerInfo({ x: 100, y: 200, shiftKey: false, eventType: 'pointerdown' });
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Move);
      expect(apiService.selectElements).toHaveBeenCalledWith([{ id: '1' }]);
      expect(apiService.toggleSelection).not.toHaveBeenCalled();
    });

    it('should handle element selection with shift key (multi-select)', () => {
      const mockElement = {
        id: ITEM_PREFIX + '1',
        getAttribute: jest.fn().mockReturnValue('1'),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);
      apiService.getElements = jest.fn().mockReturnValue([{ id: '1' }]);

      const mockEvent = createMockPointerInfo({ x: 100, y: 200, shiftKey: true, eventType: 'pointerdown' });
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Move);
      expect(apiService.toggleSelection).toHaveBeenCalledWith({ id: '1' });
    });

    it('should handle resize grip selection', () => {
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
      const mockElement = { id: SELECTOR_GRIP_RESIZE + '_n', getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);
      apiService.getSelectedElements = jest.fn().mockReturnValue([
        {
          type: ElementType.Rectangle,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      ]);
      const mockResize = jest.fn();
      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
        width: 100,
        height: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: mockGetBounds,
      });
      (getRotatedDirection as jest.Mock).mockReturnValue(Direction.N);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Resize);
      expect(selectTool.getCurrentHandle()).toBe(Direction.N);
    });

    it('should handle rotate grip selection', () => {
      const mockElement = { id: SELECTOR_GRIP_ROTATE, getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);

      const mockTarget = { id: SELECTOR_GRIP_ROTATE } as unknown as EventTarget;
      const event = createMockPointerInfo({ target: mockTarget, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Rotate);
    });

    it('should initialize box selection without shift key', () => {
      (getMouseTarget as jest.Mock).mockReturnValue(null);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const mockEvent = createMockPointerInfo({ x: 100, y: 200, shiftKey: false, eventType: 'pointerdown' });
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.BoxSelect);
      expect(apiService.clearSelection).toHaveBeenCalled();
      expect(apiService.setSelectionBox).toHaveBeenCalledWith({
        x: 100,
        y: 200,
        width: 0,
        height: 0,
        visible: true,
      });
    });
  });

  describe('handlePointerMove', () => {
    it('should not handle move without start point', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = null;

      const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointermove' });
      selectTool.handlePointerMove(mockEvent);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('should handle element move without shift key', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 50, y: 100 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      apiService.getSelectedElements = jest.fn().mockReturnValue([{ x: 100, y: 200 }]);
      apiService.transformSelectedElements = jest.fn();

      const event = createMockPointerInfo({ x: 150, y: 300, shiftKey: false, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();
      flushRAF(); // Execute RAF callbacks

      expect(apiService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
      expect(selectTool['startPoint']).toEqual({ x: 100, y: 200 });
    });

    it('should handle element move with shift key (snapping)', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 50, y: 100 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      apiService.getSelectedElements = jest.fn().mockReturnValue([{ x: 100, y: 200 }]);
      apiService.transformSelectedElements = jest.fn();

      const mockSnappedOffset = { x: 50, y: 50 };
      (getSnappedOffset as jest.Mock).mockReturnValue(mockSnappedOffset);

      const event = createMockPointerInfo({ x: 150, y: 300, shiftKey: true, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(getSnappedOffset).toHaveBeenCalledWith(50, 100);
      expect(apiService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
      expect(selectTool['startPoint']).toEqual({ x: 100, y: 200 });
    });

    it('should handle element resize without shift key', () => {
      const mockElement = {
        id: 'test-1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.N;
      selectTool['startPoint'] = { x: 50, y: 50 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      // Setup initial element states that handleResize expects
      selectTool['initialElementStates'].set(mockElement.id, mockElement as unknown as WhiteboardElement);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);
      apiService.transformSelectedElements = jest.fn();

      const mockResize = jest.fn().mockImplementation((el, dir, dx) => ({
        ...el,
        width: el.width + dx,
      }));
      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
        width: 100,
        height: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: mockGetBounds,
      });

      const event = createMockPointerInfo({ x: 100, y: 200, shiftKey: false, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).toHaveBeenCalled();
      // startPoint should remain constant during resize operation
      expect(selectTool['startPoint']).toEqual({ x: 50, y: 50 });
    });

    it('should handle element resize with shift key (snapping)', () => {
      const mockElement = {
        id: 'test-2',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.N;
      selectTool['startPoint'] = { x: 50, y: 50 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      // Setup initial element states that handleResize expects
      selectTool['initialElementStates'].set(mockElement.id, mockElement as unknown as WhiteboardElement);

      apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);
      apiService.transformSelectedElements = jest.fn();

      const mockResize = jest.fn().mockImplementation((el, dir, dx) => ({
        ...el,
        width: el.width + dx,
      }));
      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
        width: 100,
        height: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: mockGetBounds,
      });

      const mockSnappedOffset = { x: 50, y: 50 };
      (getSnappedOffset as jest.Mock).mockReturnValue(mockSnappedOffset);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const event = createMockPointerInfo({ x: 100, y: 200, shiftKey: true, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(getSnappedOffset).toHaveBeenCalledWith(50, 150);
      expect(apiService.transformSelectedElements).toHaveBeenCalled();
    });

    it('should handle element rotation without shift key', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 150, y: 150 };
      selectTool['rotateStartAngle'] = 0;
      apiService.getSelectedElements = jest.fn().mockReturnValue([{ id: 'test-1', rotation: 0 }]);
      apiService.transformSelectedElements = jest.fn();
      // Setup initial element states for rotation
      selectTool['initialElementStates'].set('test-1', { id: 'test-1', rotation: 0 } as WhiteboardElement);
      selectTool['initialElementRotations'].set('test-1', 0);
      (calculateAngle as jest.Mock).mockReturnValue(45);

      const mockEvent = createMockPointerInfo({ x: 200, y: 200, shiftKey: false, eventType: 'pointermove' });
      selectTool.handlePointerMove(mockEvent);
      flushRAF();

      expect(apiService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
      // rotateStartAngle should remain constant during rotation operation
      expect(selectTool['rotateStartAngle']).toBe(0);
    });

    it('should handle element rotation with ctrl key (angle snapping)', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 150, y: 150 };
      selectTool['rotateStartAngle'] = 0;
      apiService.getSelectedElements = jest.fn().mockReturnValue([{ id: 'test-1', rotation: 0 }]);
      apiService.transformSelectedElements = jest.fn();
      // Setup initial element states for rotation
      selectTool['initialElementStates'].set('test-1', { id: 'test-1', rotation: 0 } as WhiteboardElement);
      selectTool['initialElementRotations'].set('test-1', 0);
      (calculateAngle as jest.Mock).mockReturnValue(47);

      const mockEvent = createMockPointerInfo({ x: 200, y: 200, ctrlKey: true, eventType: 'pointermove' });
      selectTool.handlePointerMove(mockEvent);
      flushRAF();

      // With ctrl key, deltaAngle (47 - 0 = 47) should be snapped to nearest 15° increment (45°)
      expect(apiService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
      // Verify the transformation callback applies the snapped rotation
      const transformCallback = (apiService.transformSelectedElements as jest.Mock).mock.calls[0][0];
      const result = transformCallback([{ id: 'test-1', rotation: 0 }]);
      expect(result[0].rotation).toBe(45); // 0 + 45° snapped delta
    });

    it('should handle box selection', () => {
      selectTool['currentAction'] = SelectAction.BoxSelect;
      selectTool['startPoint'] = { x: 0, y: 0 };
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const mockElement = {
        id: '1',
        type: ElementType.Rectangle,
        x: 50,
        y: 50,
        width: 50,
        height: 50,
        rotation: 0,
      } as WhiteboardElement;

      apiService.getElements = jest.fn().mockReturnValue([mockElement]);
      (isElementInSelectionBox as jest.Mock).mockReturnValue(true);

      const mockBounds = {
        minX: 10,
        minY: 10,
        maxX: 200,
        maxY: 200,
        width: 150,
        height: 150,
      };

      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: jest.fn().mockReturnValue(mockBounds),
      });

      apiService.setSelectionBox = jest.fn();
      apiService.selectElements = jest.fn();

      const event = createMockPointerInfo({ x: 200, y: 200, shiftKey: false, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.setSelectionBox).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        width: 100,
        height: 200,
        visible: true,
      });

      expect(apiService.selectElements).toHaveBeenCalledWith([mockElement], false);
    });

    it('should handle box selection with shift key (multi-select)', () => {
      selectTool['currentAction'] = SelectAction.BoxSelect;
      selectTool['startPoint'] = { x: 100, y: 100 };
      apiService.setSelectionBox = jest.fn();
      apiService.selectElements = jest.fn();
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
      const mockBounds = { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };

      const mockElements = [
        {
          id: '1',
          type: ElementType.Rectangle,
          x: 150,
          y: 150,
          width: 50,
          height: 50,
          rotation: 0,
        } as WhiteboardElement,
      ];

      apiService.getElements = jest.fn().mockReturnValue(mockElements);
      (isElementInSelectionBox as jest.Mock).mockReturnValue(true);

      const mockElementUtil = {
        getBounds: jest.fn().mockReturnValue(mockBounds),
      };

      (getElementUtil as jest.Mock).mockReturnValue(mockElementUtil);

      const mockEvent = createMockPointerInfo({ x: 200, y: 200, shiftKey: true, eventType: 'pointermove' });
      selectTool.handlePointerMove(mockEvent);
      flushRAF();

      expect(apiService.selectElements).toHaveBeenCalledWith([mockElements[0]], true);
    });
  });

  describe('handlePointerMove', () => {
    it('should handle Move action', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const event = createMockPointerInfo({ x: 10, y: 20, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).toHaveBeenCalled();
    });

    it('should handle Resize action', () => {
      const mockElement = {
        id: '1',
        type: 'rectangle',
        width: 100,
        height: 100,
        x: 0,
        y: 0,
        rotate: 0,
      };

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['currentHandle'] = Direction.N;
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      // Setup initial element states that handleResize expects
      selectTool['initialElementStates'].set(mockElement.id, mockElement as unknown as WhiteboardElement);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      (apiService.getSelectedElements as jest.Mock).mockReturnValue([mockElement]);

      const mockResize = jest.fn().mockImplementation((el, dir, dx) => ({
        ...el,
        width: el.width + dx,
      }));
      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
        width: 100,
        height: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: mockGetBounds,
      });

      const event = createMockPointerInfo({ x: 10, y: 20, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).toHaveBeenCalled();
    });

    it('should handle Rotate action', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['selectionCenter'] = { x: 5, y: 5 };
      selectTool['rotateStartAngle'] = 0;

      (apiService.getSelectedElements as jest.Mock).mockReturnValue([
        {
          id: '1',
          type: 'rectangle',
          width: 100,
          height: 100,
          x: 0,
          y: 0,
          rotate: 0,
        },
      ]);

      const event = createMockPointerInfo({ x: 10, y: 20, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).toHaveBeenCalled();
    });
  });

  describe('handlePointerUp', () => {
    it('should reset state after pointer up', () => {
      selectTool['currentAction'] = SelectAction.BoxSelect;
      selectTool['startPoint'] = { x: 0, y: 0 };

      selectTool.handlePointerUp();

      expect(selectTool.getCurrentAction()).toBe(SelectAction.None);
      expect(selectTool.getStartPoint()).toBeNull();
      expect(apiService.clearSelectionBox).toHaveBeenCalled();
    });

    it('should update bounding box and reset rotation state after rotate action', () => {
      selectTool['currentAction'] = SelectAction.Rotate;

      selectTool.handlePointerUp();

      expect(apiService.updateBoundingBox).toHaveBeenCalled();
    });

    it('should reset all internal state variables', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 100, y: 200 };
      selectTool['currentHandle'] = Direction.N;
      selectTool['rotateStartAngle'] = 45;
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      selectTool.handlePointerUp();

      expect(selectTool['currentAction']).toBe(SelectAction.None);
      expect(selectTool['startPoint']).toBeNull();
      expect(selectTool['currentHandle']).toBeNull();
      expect(selectTool['rotateStartAngle']).toBeNull();
      expect(selectTool['selectionCenter']).toBeNull();
      expect(selectTool['initialBoundingBox']).toBeNull();
    });
  });

  describe('locked elements', () => {
    it('should skip locked element during selection', () => {
      const lockedElement = { id: '1', locked: true };
      const mockTarget = {
        id: ITEM_PREFIX + '1',
        getAttribute: jest.fn().mockReturnValue('1'),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      apiService.getElementById = jest.fn().mockReturnValue(lockedElement);

      const event = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(apiService.selectElements).not.toHaveBeenCalled();
      expect(apiService.toggleSelection).not.toHaveBeenCalled();
    });

    it('should not move locked elements', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };

      const lockedElement = { id: '1', x: 100, y: 100, locked: true };
      const unlockedElement = { id: '2', x: 200, y: 200, locked: false };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const transformCallback = jest.fn((callback) => {
        const result = callback([lockedElement, unlockedElement]);
        return result;
      });
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
      const callback = transformCallback.mock.calls[0][0];
      const transformedElements = callback([lockedElement, unlockedElement]);

      expect(transformedElements[0]).toEqual(lockedElement); // Locked element unchanged
      expect(transformedElements[1].x).toBe(250); // Unlocked element moved
    });

    it('should not resize locked elements', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.N;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const lockedElement = {
        id: '1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        locked: true,
      };

      // Setup initial element states that handleResize expects
      selectTool['initialElementStates'].set(lockedElement.id, lockedElement as unknown as WhiteboardElement);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([lockedElement]);

      const mockResize = jest.fn();
      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: mockGetBounds,
      });

      const transformCallback = jest.fn((callback) => callback([lockedElement]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([lockedElement]);
      expect(result[0]).toEqual(lockedElement); // Element unchanged
    });

    it('should not rotate locked elements', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 0;

      const lockedElement = { id: '1', rotation: 0, locked: true };
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([lockedElement]);
      (calculateAngle as jest.Mock).mockReturnValue(45);

      const transformCallback = jest.fn((callback) => callback([lockedElement]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([lockedElement]);
      expect(result[0]).toEqual(lockedElement); // Element unchanged
    });

    it('should filter out locked elements during box selection', () => {
      selectTool['currentAction'] = SelectAction.BoxSelect;
      selectTool['startPoint'] = { x: 0, y: 0 };
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const lockedElement = {
        id: '1',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        locked: true,
      } as WhiteboardElement;

      const unlockedElement = {
        id: '2',
        type: ElementType.Rectangle,
        x: 60,
        y: 60,
        width: 30,
        height: 30,
        locked: false,
      } as WhiteboardElement;

      apiService.getElements = jest.fn().mockReturnValue([lockedElement, unlockedElement]);
      (isElementInSelectionBox as jest.Mock).mockReturnValue(true);

      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: mockGetBounds,
      });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.selectElements).toHaveBeenCalledWith([unlockedElement], false);
    });
  });

  describe('multi-element resize', () => {
    it('should scale multiple elements as a group from SE corner', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const element1 = {
        id: '1',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
        style: { strokeWidth: 2 },
      } as WhiteboardElement;

      const element2 = {
        id: '2',
        type: ElementType.Rectangle, // Changed from Ellipse to avoid type mismatch
        x: 50,
        y: 50,
        width: 30,
        height: 30,
        style: { strokeWidth: 1 },
      } as WhiteboardElement;

      // Setup initial element states
      selectTool['initialElementStates'].set(element1.id, { ...element1 });
      selectTool['initialElementStates'].set(element2.id, { ...element2 });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([element1, element2]);

      const transformCallback = jest.fn((callback) => callback([element1, element2]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([element1, element2]);

      // Elements should be scaled by 1.5 (new size: 150x150, old size: 100x100)
      expect(result[0].width).toBe(60); // 40 * 1.5
      expect(result[0].height).toBe(60); // 40 * 1.5
      expect(result[1].width).toBe(45); // 30 * 1.5
      expect(result[1].height).toBe(45); // 30 * 1.5
    });

    it('should scale multiple elements uniformly with shift key', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const element = {
        id: '1',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      } as WhiteboardElement;

      // Setup initial element states
      selectTool['initialElementStates'].set(element.id, { ...element });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 130, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([element, element]);

      const transformCallback = jest.fn((callback) => callback([element, element]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 130, y: 150, shiftKey: true, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([element, element]);

      // With shift key, should use minimum scale (1.3 vs 1.5 -> 1.3)
      expect(result[0].width).toBe(52); // 40 * 1.3
    });

    it('should handle all resize directions for multiple elements', () => {
      const directions = [
        Direction.N,
        Direction.S,
        Direction.E,
        Direction.W,
        Direction.NE,
        Direction.NW,
        Direction.SE,
        Direction.SW,
      ];

      directions.forEach((direction) => {
        selectTool['currentAction'] = SelectAction.Resize;
        selectTool['currentHandle'] = direction;
        selectTool['startPoint'] = { x: 100, y: 100 };
        selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

        const element = {
          id: '1',
          type: ElementType.Rectangle,
          x: 10,
          y: 10,
          width: 40,
          height: 40,
        } as WhiteboardElement;

        jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 120, y: 120 });
        apiService.getSelectedElements = jest.fn().mockReturnValue([element, element]);

        const transformCallback = jest.fn((callback) => callback([element, element]));
        apiService.transformSelectedElements = transformCallback;

        const event = createMockPointerInfo({ x: 120, y: 120, eventType: 'pointermove' });
        selectTool.handlePointerMove(event);
        flushRAF();

        expect(transformCallback).toHaveBeenCalled();
      });
    });

    it('should prevent negative dimensions during resize', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const element = {
        id: '1',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      } as WhiteboardElement;

      // Move pointer to create negative dimensions
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: -50, y: -50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([element, element]);

      const transformCallback = jest.fn((callback) => callback([element, element]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: -50, y: -50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // Should not call transform if dimensions would be negative
      expect(transformCallback).not.toHaveBeenCalled();
    });

    it('should scale stroke width during multi-element resize', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const element1 = {
        id: '1',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
        style: { strokeWidth: 2 },
      } as WhiteboardElement;

      const element2 = {
        id: '2',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
        style: { strokeWidth: 2 },
      } as WhiteboardElement;

      // Setup initial element states
      selectTool['initialElementStates'].set(element1.id, { ...element1 });
      selectTool['initialElementStates'].set(element2.id, { ...element2 });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 200, y: 200 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([element1, element2]);

      const transformCallback = jest.fn((callback) => callback([element1, element2]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 200, y: 200, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([element1, element2]);

      // Stroke width should be scaled by average of scaleX and scaleY (2.0)
      expect(result[0].style?.strokeWidth).toBe(4); // 2 * 2
    });
  });

  describe('multi-element rotation', () => {
    it('should rotate multiple elements around selection center', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 0;

      const element = {
        id: '1',
        type: ElementType.Rectangle,
        x: 25,
        y: 25,
        width: 50,
        height: 50,
        rotation: 0,
      } as WhiteboardElement;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([element, element]);
      (calculateAngle as jest.Mock).mockReturnValue(90); // 90 degree rotation

      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 25,
        minY: 25,
        maxX: 75,
        maxY: 75,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: mockGetBounds,
      });

      const mockRotatedCenter = { x: 75, y: 25 }; // Rotated 90 degrees
      const { rotAround } = require('../../utils/drawing/vector');
      (rotAround as jest.Mock).mockReturnValue([mockRotatedCenter.x, mockRotatedCenter.y]);

      const transformCallback = jest.fn((callback) => callback([element, element]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
      const callback = transformCallback.mock.calls[0][0];
      const result = callback([element, element]);

      // Element should be rotated
      expect(result[0].rotation).toBeDefined();
    });

    it('should handle angle wrap-around during rotation (> 180)', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 10;

      const element = { id: '1', rotation: 0 } as WhiteboardElement;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([element]);
      (calculateAngle as jest.Mock).mockReturnValue(200); // Would result in delta > 180

      const transformCallback = jest.fn((callback) => callback([element]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
    });

    it('should handle angle wrap-around during rotation (< -180)', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 200;

      const element = { id: '1', rotation: 0 } as WhiteboardElement;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([element]);
      (calculateAngle as jest.Mock).mockReturnValue(10); // Would result in delta < -180

      const transformCallback = jest.fn((callback) => callback([element]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
    });

    it('should hide bounding box during rotation', () => {
      const mockBbox = { x: 50, y: 50, width: 100, height: 100 };
      apiService.getBoundingBoxSignal = jest.fn().mockReturnValue(() => mockBbox);
      apiService.setBoundingBox = jest.fn();
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });
      (calculateAngle as jest.Mock).mockReturnValue(0);

      const mockTarget = { id: SELECTOR_GRIP_ROTATE };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = createMockPointerInfo({ target: mockTarget as any, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(apiService.setBoundingBox).toHaveBeenCalledWith(null);
    });
  });

  describe('getResizeDirection', () => {
    it('should parse direction from handle ID', () => {
      const mockTarget = { id: `${SELECTOR_GRIP_RESIZE}_se`, getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      (getRotatedDirection as jest.Mock).mockReturnValue(Direction.SE);

      apiService.getSelectedElements = jest
        .fn()
        .mockReturnValue([{ id: '1', rotation: 0, type: ElementType.Rectangle, x: 0, y: 0, width: 100, height: 100 }]);

      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: mockGetBounds,
      });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentHandle()).toBe(Direction.SE);
    });

    it('should apply rotation to resize direction', () => {
      const mockTarget = { id: `${SELECTOR_GRIP_RESIZE}_n`, getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      (getRotatedDirection as jest.Mock).mockReturnValue(Direction.NE); // Rotated direction

      apiService.getSelectedElements = jest
        .fn()
        .mockReturnValue([{ id: '1', rotation: 45, type: ElementType.Rectangle, x: 0, y: 0, width: 100, height: 100 }]);

      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: mockGetBounds,
      });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(getRotatedDirection).toHaveBeenCalledWith(Direction.N, 45);
      expect(selectTool.getCurrentHandle()).toBe(Direction.NE);
    });

    it('should return default direction for invalid handle ID', () => {
      const mockTarget = { id: `${SELECTOR_GRIP_RESIZE}_invalid`, getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      (getRotatedDirection as jest.Mock).mockReturnValue(Direction.N);

      apiService.getSelectedElements = jest
        .fn()
        .mockReturnValue([{ id: '1', rotation: 0, type: ElementType.Rectangle, x: 0, y: 0, width: 100, height: 100 }]);

      const mockGetBounds = jest.fn().mockReturnValue({
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
      });
      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: mockGetBounds,
      });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      // Should default to Direction.N for invalid direction string
      expect(selectTool.getCurrentHandle()).toBe(Direction.N);
    });
  });

  describe('selector box selection', () => {
    it('should handle selector box click for move action', () => {
      const mockTarget = { id: SELECTOR_BOX, getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Move);
      expect(selectTool.getStartPoint()).toEqual({ x: 100, y: 100 });
    });
  });

  describe('edge cases', () => {
    it('should handle null element from getElementById', () => {
      const mockTarget = {
        id: ITEM_PREFIX + 'nonexistent',
        getAttribute: jest.fn().mockReturnValue('nonexistent'),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      apiService.getElementById = jest.fn().mockReturnValue(null);

      const event = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(apiService.selectElements).not.toHaveBeenCalled();
    });

    it('should handle resize with no selected elements', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.N;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('should handle rotation with no selected elements', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 0;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);
      (calculateAngle as jest.Mock).mockReturnValue(45);

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('should handle rotation when bounding box signal returns null', () => {
      apiService.getBoundingBoxSignal = jest.fn().mockReturnValue(() => null);

      const mockTarget = { id: SELECTOR_GRIP_ROTATE };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = createMockPointerInfo({ target: mockTarget as any, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      // Should not crash, selectionCenter should remain null
      expect(selectTool['selectionCenter']).toBeNull();
    });

    it('should handle rotation when bounding box signal returns object directly', () => {
      const mockBbox = { x: 50, y: 50, width: 100, height: 100 };
      // Return a function that returns the bbox (correct behavior)
      apiService.getBoundingBoxSignal = jest.fn().mockReturnValue(() => mockBbox);
      apiService.setBoundingBox = jest.fn();
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });
      (calculateAngle as jest.Mock).mockReturnValue(0);

      const mockTarget = { id: SELECTOR_GRIP_ROTATE };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const event = createMockPointerInfo({ target: mockTarget as any, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool['selectionCenter']).toEqual({ x: 100, y: 100 });
    });

    it('should handle elements without width/height during multi-resize', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const elementNoSize = {
        id: '1',
        type: ElementType.Line,
        x: 10,
        y: 10,
      } as WhiteboardElement;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([elementNoSize, elementNoSize]);

      const transformCallback = jest.fn((callback) => callback([elementNoSize, elementNoSize]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([elementNoSize, elementNoSize]);

      // Should not have width/height added if they didn't exist
      expect(result[0].width).toBeUndefined();
      expect(result[0].height).toBeUndefined();
    });

    it('should handle elements without style during multi-resize', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const elementNoStyle = {
        id: '1',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
      } as WhiteboardElement;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([elementNoStyle, elementNoStyle]);

      const transformCallback = jest.fn((callback) => callback([elementNoStyle, elementNoStyle]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([elementNoStyle, elementNoStyle]);

      // Should handle missing style gracefully
      expect(result[0]).toBeDefined();
    });
  });
});
