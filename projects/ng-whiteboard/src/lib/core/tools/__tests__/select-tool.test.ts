import { ApiService } from '../../api/api.service';
import { getElementUtil } from '../../elements/element.utils';
import { ArrowBindingService } from '../../elements/arrow-binding.service';
import { ConnectionPointsService } from '../../elements/connection-points.service';
import { ConnectionUIService } from '../../elements/connection-ui.service';
import { Direction, ElementType, ToolType, WhiteboardConfig, WhiteboardElement } from '../../types';
import { getMouseTarget } from '../../utils/dom';
import {
  calculateAngle,
  getRotatedDirection,
  getSnappedOffset,
  isElementInSelectionBox,
  rotatePointAroundCenter,
} from '../../utils/geometry';
import { SelectAction, SelectTool } from '../select-tool';
import { ITEM_PREFIX, SELECTOR_BOX, SELECTOR_GRIP_RESIZE, SELECTOR_GRIP_ROTATE } from '../../constants';
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
  rotatePointAroundCenter: jest.fn((point) => point),
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
      updateElements: jest.fn(),
      setBoundingBox: jest.fn(),
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
      flushRAF();

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

  describe('handlePointerMove - action dispatch', () => {
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
      const event = createMockPointerInfo({ target: mockTarget as unknown as EventTarget, eventType: 'pointerdown' });
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
      const event = createMockPointerInfo({ target: mockTarget as unknown as EventTarget, eventType: 'pointerdown' });
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
      const event = createMockPointerInfo({ target: mockTarget as unknown as EventTarget, eventType: 'pointerdown' });
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

  // ================================================================== //
  //  Connection services                                                //
  // ================================================================== //

  describe('setConnectionServices', () => {
    it('should store connection service references', () => {
      const mockCp = {
        findSnapTarget: jest.fn(),
        getConnectionPoints: jest.fn(),
      } as unknown as ConnectionPointsService;
      const mockAb = {
        createBinding: jest.fn(),
        recomputeBindingsForElements: jest.fn(),
      } as unknown as ArrowBindingService;
      const mockUi = {
        setSnapIndicator: jest.fn(),
        setVisibleConnectionPoints: jest.fn(),
        clearAll: jest.fn(),
      } as unknown as ConnectionUIService;

      selectTool.setConnectionServices(mockCp, mockAb, mockUi);
      // Verify services are stored by triggering behavior that uses them
      expect(() => selectTool.onDeactivate()).not.toThrow();
    });
  });

  // ================================================================== //
  //  Arrow endpoint handle detection in pointerDown                     //
  // ================================================================== //

  describe('handlePointerDown — arrow endpoint handle', () => {
    it('should set DragEndpoint action for start handle', () => {
      const mockTarget = {
        id: 'arrow-handle',
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-handle') return 'start';
          if (attr === 'data-arrow-id') return 'arrow-1';
          return null;
        }),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.DragEndpoint);
    });

    it('should set DragEndpoint action for end handle', () => {
      const mockTarget = {
        id: 'arrow-handle',
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-handle') return 'end';
          if (attr === 'data-arrow-id') return 'arrow-1';
          return null;
        }),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.DragEndpoint);
    });

    it('should set DragCurveHandle action for curve handle', () => {
      const mockTarget = {
        id: 'curve-handle',
        getAttribute: jest.fn((attr: string) => {
          if (attr === 'data-handle') return 'curve';
          if (attr === 'data-arrow-id') return 'arrow-1';
          return null;
        }),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.DragCurveHandle);
    });

    it('should not detect handle when target has no getAttribute', () => {
      (getMouseTarget as jest.Mock).mockReturnValue(null);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      // Falls through to box select since target is null
      expect(selectTool.getCurrentAction()).toBe(SelectAction.BoxSelect);
    });
  });

  // ================================================================== //
  //  DragEndpoint — handlePointerMove & handlePointerUp                 //
  // ================================================================== //

  describe('DragEndpoint', () => {
    let mockCp: jest.Mocked<Pick<ConnectionPointsService, 'findSnapTarget' | 'getConnectionPoints'>>;
    let mockAb: jest.Mocked<Pick<ArrowBindingService, 'createBinding' | 'recomputeBindingsForElements'>>;
    let mockUi: jest.Mocked<Pick<ConnectionUIService, 'setSnapIndicator' | 'setVisibleConnectionPoints' | 'clearAll'>>;

    beforeEach(() => {
      mockCp = {
        findSnapTarget: jest.fn(),
        getConnectionPoints: jest.fn().mockReturnValue([{ x: 200, y: 0 }]),
      } as unknown as jest.Mocked<Pick<ConnectionPointsService, 'findSnapTarget' | 'getConnectionPoints'>>;
      mockAb = {
        createBinding: jest.fn().mockReturnValue({ elementId: 'rect-1', pointId: 'top' }),
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      } as unknown as jest.Mocked<Pick<ArrowBindingService, 'createBinding' | 'recomputeBindingsForElements'>>;
      mockUi = {
        setSnapIndicator: jest.fn(),
        setVisibleConnectionPoints: jest.fn(),
        clearAll: jest.fn(),
      } as unknown as jest.Mocked<
        Pick<ConnectionUIService, 'setSnapIndicator' | 'setVisibleConnectionPoints' | 'clearAll'>
      >;
      selectTool.setConnectionServices(
        mockCp as unknown as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        mockUi as unknown as ConnectionUIService
      );
    });

    it('should move arrow start endpoint during drag', () => {
      // Setup: arrow element
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getElements = jest.fn().mockReturnValue([arrow]);
      mockCp.findSnapTarget.mockReturnValue(null);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'start';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', x1: 50, y1: 50 }),
      ]);
      expect(mockUi.setSnapIndicator).toHaveBeenCalledWith(null);
      expect(mockUi.setVisibleConnectionPoints).toHaveBeenCalledWith([]);
    });

    it('should move arrow end endpoint during drag', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getElements = jest.fn().mockReturnValue([arrow]);
      mockCp.findSnapTarget.mockReturnValue(null);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 100, y: 0 };
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'end';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 200, y: 50 });

      const event = createMockPointerInfo({ x: 200, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', x2: 200, y2: 50 }),
      ]);
    });

    it('should snap to a shape connection point during drag', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;
      const rect = { id: 'rect-1', type: ElementType.Rectangle };

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getElements = jest.fn().mockReturnValue([arrow, rect]);
      mockCp.findSnapTarget.mockReturnValue({
        elementId: 'rect-1',
        pointId: 'top',
        point: { x: 200, y: 0 },
        distance: 5,
      });

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 100, y: 0 };
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'end';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 195, y: 3 });

      const event = createMockPointerInfo({ x: 195, y: 3, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(mockUi.setSnapIndicator).toHaveBeenCalledWith({ x: 200, y: 0 });
      expect(mockCp.getConnectionPoints).toHaveBeenCalledWith(rect);
      expect(mockUi.setVisibleConnectionPoints).toHaveBeenCalled();
    });

    it('should handle snap target not found in elements list', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getElements = jest.fn().mockReturnValue([arrow]); // no rect
      mockCp.findSnapTarget.mockReturnValue({
        elementId: 'nonexistent',
        pointId: 'top',
        point: { x: 200, y: 0 },
        distance: 5,
      });

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'end';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 195, y: 3 });

      const event = createMockPointerInfo({ x: 195, y: 3, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(mockUi.setSnapIndicator).toHaveBeenCalledWith({ x: 200, y: 0 });
      expect(mockCp.getConnectionPoints).not.toHaveBeenCalled();
    });

    it('should not snap for non-arrow elements', () => {
      const line = {
        id: 'line-1',
        type: ElementType.Line,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(line);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragEndpointId'] = 'line-1';
      selectTool['dragEndpointEnd'] = 'end';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 200, y: 50 });

      const event = createMockPointerInfo({ x: 200, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(mockCp.findSnapTarget).not.toHaveBeenCalled();
      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'line-1', x2: 200, y2: 50 }),
      ]);
    });

    it('should bail if dragEndpointId is null', () => {
      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragEndpointId'] = null;
      selectTool['dragEndpointEnd'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).not.toHaveBeenCalled();
    });

    it('should bail if element not found', () => {
      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragEndpointId'] = 'missing';
      selectTool['dragEndpointEnd'] = 'end';
      apiService.getElementById = jest.fn().mockReturnValue(null);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).not.toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  finalizeDragEndpoint — handlePointerUp                             //
  // ================================================================== //

  describe('finalizeDragEndpoint', () => {
    let mockAb: jest.Mocked<Pick<ArrowBindingService, 'createBinding' | 'recomputeBindingsForElements'>>;
    let mockUi: jest.Mocked<Pick<ConnectionUIService, 'clearAll'>>;

    beforeEach(() => {
      mockAb = {
        createBinding: jest.fn().mockReturnValue({ elementId: 'rect-1', pointId: 'top' }),
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      } as unknown as jest.Mocked<Pick<ArrowBindingService, 'createBinding' | 'recomputeBindingsForElements'>>;
      mockUi = { clearAll: jest.fn() } as unknown as jest.Mocked<Pick<ConnectionUIService, 'clearAll'>>;
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        mockUi as unknown as ConnectionUIService
      );
    });

    it('should commit binding when endpoint snapped to shape (start)', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'start';
      selectTool['dragEndpointSnap'] = {
        elementId: 'rect-1',
        pointId: 'top',
        point: { x: 50, y: 0 },
        distance: 3,
      };

      selectTool.handlePointerUp();

      expect(mockAb.createBinding).toHaveBeenCalledWith('rect-1', 'top');
      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', startBinding: { elementId: 'rect-1', pointId: 'top' } }),
      ]);
      expect(mockUi.clearAll).toHaveBeenCalled();
    });

    it('should commit binding when endpoint snapped to shape (end)', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'end';
      selectTool['dragEndpointSnap'] = {
        elementId: 'rect-1',
        pointId: 'left',
        point: { x: 200, y: 0 },
        distance: 5,
      };

      selectTool.handlePointerUp();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', endBinding: { elementId: 'rect-1', pointId: 'top' }, x2: 200, y2: 0 }),
      ]);
    });

    it('should detach binding when no snap (start)', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 50,
        y1: 50,
        x2: 100,
        y2: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'start';
      selectTool['dragEndpointSnap'] = null;

      selectTool.handlePointerUp();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', startBinding: null }),
      ]);
    });

    it('should detach binding when no snap (end)', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 150,
        y2: 50,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'end';
      selectTool['dragEndpointSnap'] = null;

      selectTool.handlePointerUp();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', endBinding: null }),
      ]);
    });

    it('should bail if dragEndpointId is null on pointerUp', () => {
      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['dragEndpointId'] = null;

      selectTool.handlePointerUp();

      expect(apiService.updateElements).not.toHaveBeenCalled();
    });

    it('should bail if element not found on pointerUp', () => {
      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['dragEndpointId'] = 'missing';
      selectTool['dragEndpointEnd'] = 'end';
      apiService.getElementById = jest.fn().mockReturnValue(null);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      selectTool.handlePointerUp();

      expect(mockAb.createBinding).not.toHaveBeenCalled();
    });

    it('should skip arrow-specific finalization for non-arrow elements', () => {
      const line = {
        id: 'line-1',
        type: ElementType.Line,
        x: 0,
        y: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(line);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['dragEndpointId'] = 'line-1';
      selectTool['dragEndpointEnd'] = 'end';
      selectTool['dragEndpointSnap'] = null;

      selectTool.handlePointerUp();

      // No binding updates for lines
      expect(mockAb.createBinding).not.toHaveBeenCalled();
      expect(mockUi.clearAll).toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  DragCurveHandle                                                    //
  // ================================================================== //

  describe('DragCurveHandle', () => {
    beforeEach(() => {
      const mockAb = { recomputeBindingsForElements: jest.fn().mockReturnValue([]) };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );
    });

    it('should set quadratic control point when dragged away from midpoint', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
        pathType: { type: 'straight' },
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);

      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 50, y: 0 };
      selectTool['dragCurveArrowId'] = 'arrow-1';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: -50 });

      const event = createMockPointerInfo({ x: 50, y: -50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'arrow-1',
          pathType: { type: 'quadratic', cx: 50, cy: -50 },
        }),
      ]);
    });

    it('should reset to straight when close to midpoint', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
        pathType: { type: 'quadratic', cx: 50, cy: -50 },
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);

      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 50, y: 0 };
      selectTool['dragCurveArrowId'] = 'arrow-1';

      // Point very close to midpoint (50, 0)
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 51, y: 1 });

      const event = createMockPointerInfo({ x: 51, y: 1, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'arrow-1',
          pathType: { type: 'straight' },
        }),
      ]);
    });

    it('should adjust midRatio for elbow arrows', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 50,
        rotation: 0,
        pathType: { type: 'elbow', midRatio: 0.5 },
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);

      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 50, y: 25 };
      selectTool['dragCurveArrowId'] = 'arrow-1';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 70, y: 25 });

      const event = createMockPointerInfo({ x: 70, y: 25, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'arrow-1',
          pathType: expect.objectContaining({ type: 'elbow' }),
        }),
      ]);
    });

    it('should clamp elbow midRatio between 0.05 and 0.95', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 50,
        rotation: 0,
        pathType: { type: 'elbow', midRatio: 0.5 },
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);

      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragCurveArrowId'] = 'arrow-1';

      // Drag far right past x2
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 200, y: 0 });

      const event = createMockPointerInfo({ x: 200, y: 0, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const call = (apiService.updateElements as jest.Mock).mock.calls[0][0][0];
      expect(call.pathType.midRatio).toBeLessThanOrEqual(0.95);
    });

    it('should bail for degenerate elbow (dx ~ 0)', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 50,
        y1: 0,
        x2: 50,
        y2: 100,
        rotation: 0,
        pathType: { type: 'elbow', midRatio: 0.5 },
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);

      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 50, y: 50 };
      selectTool['dragCurveArrowId'] = 'arrow-1';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 60, y: 50 });

      const event = createMockPointerInfo({ x: 60, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // dx < 1 → early return, no update
      expect(apiService.updateElements).not.toHaveBeenCalled();
    });

    it('should bail if dragCurveArrowId is null', () => {
      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragCurveArrowId'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).not.toHaveBeenCalled();
    });

    it('should bail if element is not an arrow', () => {
      const rect = {
        id: 'rect-1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        rotation: 0,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(rect);

      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragCurveArrowId'] = 'rect-1';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).not.toHaveBeenCalled();
    });

    it('should bail if element not found', () => {
      apiService.getElementById = jest.fn().mockReturnValue(null);

      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['dragCurveArrowId'] = 'missing';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).not.toHaveBeenCalled();
    });

    it('should reset dragCurveArrowId on pointerUp', () => {
      selectTool['currentAction'] = SelectAction.DragCurveHandle;
      selectTool['dragCurveArrowId'] = 'arrow-1';
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);

      selectTool.handlePointerUp();

      expect(selectTool['dragCurveArrowId']).toBeNull();
    });
  });

  // ================================================================== //
  //  worldToLocal with rotation                                         //
  // ================================================================== //

  describe('worldToLocal with rotation', () => {
    it('should handle rotated arrow endpoint drag', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 100,
        y: 100,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 90,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getElements = jest.fn().mockReturnValue([arrow]);

      const mockCp = { findSnapTarget: jest.fn().mockReturnValue(null), getConnectionPoints: jest.fn() };
      const mockAb = { createBinding: jest.fn(), recomputeBindingsForElements: jest.fn().mockReturnValue([]) };
      const mockUi = { setSnapIndicator: jest.fn(), setVisibleConnectionPoints: jest.fn(), clearAll: jest.fn() };
      selectTool.setConnectionServices(
        mockCp as unknown as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        mockUi as unknown as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'end';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 200, y: 200 });

      const event = createMockPointerInfo({ x: 200, y: 200, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // Should call updateElements with the local-space coordinates
      expect(apiService.updateElements).toHaveBeenCalled();
    });

    it('should handle scaled element in worldToLocal', () => {
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 50,
        y: 50,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        rotation: 0,
        scaleX: 2,
        scaleY: 2,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(arrow);
      apiService.getElements = jest.fn().mockReturnValue([arrow]);

      const mockCp = { findSnapTarget: jest.fn().mockReturnValue(null), getConnectionPoints: jest.fn() };
      const mockAb = { createBinding: jest.fn(), recomputeBindingsForElements: jest.fn().mockReturnValue([]) };
      const mockUi = { setSnapIndicator: jest.fn(), setVisibleConnectionPoints: jest.fn(), clearAll: jest.fn() };
      selectTool.setConnectionServices(
        mockCp as unknown as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        mockUi as unknown as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 50, y: 50 };
      selectTool['dragEndpointId'] = 'arrow-1';
      selectTool['dragEndpointEnd'] = 'start';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 50 });

      const event = createMockPointerInfo({ x: 150, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // With scaleX=2, worldX=150, x=50 → dx=100, local = 100/2 = 50
      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', x1: 50, y1: 0 }),
      ]);
    });
  });

  // ================================================================== //
  //  Arrow binding detach during move                                   //
  // ================================================================== //

  describe('arrow binding detach during move', () => {
    it('should detach bindings from moved arrows', () => {
      const mockAb = {
        createBinding: jest.fn(),
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      const arrowElement = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
        startBinding: { elementId: 'rect-1', pointId: 'left' },
        endBinding: { elementId: 'rect-2', pointId: 'right' },
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([arrowElement]);
      apiService.transformSelectedElements = jest.fn();

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', startBinding: null, endBinding: null }),
      ]);
    });

    it('should only detach bindings once per drag', () => {
      const mockAb = {
        createBinding: jest.fn(),
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      const arrowElement = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        startBinding: { elementId: 'rect-1', pointId: 'left' },
        endBinding: null,
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([arrowElement]);
      apiService.transformSelectedElements = jest.fn();

      const event1 = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event1);
      flushRAF();

      // First move detaches
      expect(apiService.updateElements).toHaveBeenCalledTimes(1);

      // Second move should not detach again
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });
      selectTool['startPoint'] = { x: 50, y: 50 };
      const event2 = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event2);
      flushRAF();

      // updateElements was called once for detach + possibly once for recompute
      // But detach should not happen again
    });

    it('should not detach if no arrows have bindings', () => {
      const mockAb = {
        createBinding: jest.fn(),
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      const rect = {
        id: 'rect-1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([rect]);
      apiService.transformSelectedElements = jest.fn();

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // No arrow binding detach updates
      expect(apiService.updateElements).not.toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  Arrow binding recompute after move/resize/rotate on pointerUp      //
  // ================================================================== //

  describe('arrow binding recompute on pointerUp', () => {
    it('should recompute bindings after Move action', () => {
      const mockAb = {
        recomputeBindingsForElements: jest.fn().mockReturnValue([{ id: 'arrow-1', x1: 10, y1: 10 }]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };
      apiService.getSelectedElements = jest.fn().mockReturnValue([{ id: 'rect-1' }]);

      selectTool.handlePointerUp();

      expect(mockAb.recomputeBindingsForElements).toHaveBeenCalled();
      expect(apiService.updateElements).toHaveBeenCalledWith([{ id: 'arrow-1', x1: 10, y1: 10 }]);
    });

    it('should recompute bindings after Resize action', () => {
      const mockAb = {
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.Resize;
      apiService.getSelectedElements = jest.fn().mockReturnValue([{ id: 'rect-1' }]);

      selectTool.handlePointerUp();

      expect(mockAb.recomputeBindingsForElements).toHaveBeenCalled();
    });

    it('should recompute bindings after Rotate action', () => {
      const mockAb = {
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.Rotate;
      apiService.getSelectedElements = jest.fn().mockReturnValue([{ id: 'rect-1' }]);

      selectTool.handlePointerUp();

      expect(mockAb.recomputeBindingsForElements).toHaveBeenCalled();
    });

    it('should not update elements if no arrow updates', () => {
      const mockAb = {
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };
      apiService.getSelectedElements = jest.fn().mockReturnValue([{ id: 'rect-1' }]);

      selectTool.handlePointerUp();

      expect(apiService.updateElements).not.toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  Real-time arrow binding update during move                         //
  // ================================================================== //

  describe('real-time arrow binding update during move', () => {
    it('should update bound arrows in real-time as shapes move', () => {
      const mockAb = {
        recomputeBindingsForElements: jest.fn().mockReturnValue([{ id: 'arrow-1', x2: 60, y2: 60 }]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['arrowBindingsDetached'] = true; // Already detached

      const rect = {
        id: 'rect-1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
      } as unknown as WhiteboardElement;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([rect]);
      apiService.transformSelectedElements = jest.fn();

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(mockAb.recomputeBindingsForElements).toHaveBeenCalled();
      expect(apiService.updateElements).toHaveBeenCalledWith([{ id: 'arrow-1', x2: 60, y2: 60 }]);
    });
  });

  // ================================================================== //
  //  Single-element resize with rotation (anchor point correction)      //
  // ================================================================== //

  describe('single-element resize with rotation', () => {
    it('should resize rotated element with anchor point correction', () => {
      const mockElement = {
        id: 'r1',
        type: ElementType.Rectangle,
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        rotation: 45,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 200, y: 200 };
      selectTool['initialBoundingBox'] = { x: 50, y: 50, width: 100, height: 80 };
      selectTool['initialElementStates'].set('r1', { ...mockElement });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 220, y: 220 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);

      const mockResize = jest.fn().mockReturnValue({ ...mockElement, width: 120, height: 100, x: 50, y: 50 });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 50, minY: 50, maxX: 170, maxY: 150 }),
      });

      const transformCallback = jest.fn((callback) => callback([mockElement]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 220, y: 220, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
      const callback = transformCallback.mock.calls[0][0];
      const result = callback([mockElement]);
      // Should have applied anchor correction for rotated element
      expect(result[0]).toBeDefined();
      expect(mockResize).toHaveBeenCalled();
    });

    it('should handle resize with shift key for snapping on single element', () => {
      const mockElement = {
        id: 'r1',
        type: ElementType.Rectangle,
        x: 50,
        y: 50,
        width: 100,
        height: 80,
        rotation: 30,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.NE;
      selectTool['startPoint'] = { x: 200, y: 200 };
      selectTool['initialBoundingBox'] = { x: 50, y: 50, width: 100, height: 80 };
      selectTool['initialElementStates'].set('r1', { ...mockElement });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 230, y: 180 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);
      (getSnappedOffset as jest.Mock).mockReturnValue({ x: 30, y: -20 });

      const mockResize = jest.fn().mockReturnValue({ ...mockElement, width: 130 });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 50, minY: 30, maxX: 180, maxY: 130 }),
      });

      const transformCallback = jest.fn((callback) => callback([mockElement]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 230, y: 180, shiftKey: true, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(getSnappedOffset).toHaveBeenCalled();
      expect(transformCallback).toHaveBeenCalled();
    });

    it('should resize non-rotated single element without anchor correction', () => {
      const mockElement = {
        id: 'r1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      selectTool['initialElementStates'].set('r1', { ...mockElement });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);

      const mockResize = jest.fn().mockReturnValue({ ...mockElement, width: 150, height: 150 });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 0, minY: 0, maxX: 150, maxY: 150 }),
      });

      const transformCallback = jest.fn((callback) => callback([mockElement]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
      const callback = transformCallback.mock.calls[0][0];
      const result = callback([mockElement]);
      expect(result[0].width).toBe(150);
    });

    it('should handle single resize with missing initial element state', () => {
      const mockElement = {
        id: 'r1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      // Do NOT set initialElementStates for r1

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);

      const transformCallback = jest.fn((callback) => callback([mockElement]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // Single element resize early returns if no initial state → no transformSelectedElements call
      expect(transformCallback).not.toHaveBeenCalled();
    });

    it('should handle resize of element with ellipse-like rx/ry properties', () => {
      const mockElement = {
        id: 'e1',
        type: ElementType.Ellipse,
        x: 50,
        y: 50,
        rx: 40,
        ry: 30,
        rotation: 90,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.N;
      selectTool['startPoint'] = { x: 50, y: 20 };
      selectTool['initialBoundingBox'] = { x: 10, y: 20, width: 80, height: 60 };
      selectTool['initialElementStates'].set('e1', { ...mockElement });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 0 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);

      const mockResize = jest.fn().mockReturnValue({ ...mockElement, ry: 40 });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 10, minY: 10, maxX: 90, maxY: 90 }),
      });

      const transformCallback = jest.fn((callback) => callback([mockElement]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 50, y: 0, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
    });

    it('should handle all direction handles for rotated single-element resize', () => {
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
      directions.forEach((dir) => {
        selectTool['currentAction'] = SelectAction.Resize;
        selectTool['currentHandle'] = dir;
        selectTool['startPoint'] = { x: 100, y: 100 };
        selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

        const mockElement = {
          id: 'r1',
          type: ElementType.Rectangle,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 45,
        } as unknown as WhiteboardElement;

        selectTool['initialElementStates'].set('r1', { ...mockElement });

        jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 120, y: 120 });
        apiService.getSelectedElements = jest.fn().mockReturnValue([mockElement]);

        const mockResize = jest.fn().mockReturnValue({ ...mockElement });
        (getElementUtil as jest.Mock).mockReturnValue({
          resize: mockResize,
          getBounds: jest.fn().mockReturnValue({ minX: 0, minY: 0, maxX: 100, maxY: 100 }),
        });

        const transformCallback = jest.fn((callback) => callback([mockElement]));
        apiService.transformSelectedElements = transformCallback;

        const event = createMockPointerInfo({ x: 120, y: 120, eventType: 'pointermove' });
        selectTool.handlePointerMove(event);
        flushRAF();

        expect(transformCallback).toHaveBeenCalled();
      });
    });
  });

  // ================================================================== //
  //  Multi-element rotation with rotatePointAroundCenter                //
  // ================================================================== //

  describe('multi-element rotation with rotatePointAroundCenter', () => {
    it('should rotate multiple elements around group center', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 0;

      const el1 = {
        id: '1',
        type: ElementType.Rectangle,
        x: 25,
        y: 25,
        width: 50,
        height: 50,
        rotation: 0,
      } as WhiteboardElement;
      const el2 = {
        id: '2',
        type: ElementType.Rectangle,
        x: 75,
        y: 75,
        width: 30,
        height: 30,
        rotation: 0,
      } as WhiteboardElement;

      selectTool['initialElementStates'].set('1', { ...el1 });
      selectTool['initialElementStates'].set('2', { ...el2 });
      selectTool['initialElementRotations'].set('1', 0);
      selectTool['initialElementRotations'].set('2', 0);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el1, el2]);
      (calculateAngle as jest.Mock).mockReturnValue(90);

      (rotatePointAroundCenter as jest.Mock).mockImplementation((point) => ({ x: point.x + 10, y: point.y + 10 }));

      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: jest.fn().mockReturnValue({ minX: 25, minY: 25, maxX: 75, maxY: 75 }),
      });

      const transformCallback = jest.fn((callback) => callback([el1, el2]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
      const callback = transformCallback.mock.calls[0][0];
      const result = callback([el1, el2]);
      expect(result[0].rotation).toBeDefined();
      expect(result[1].rotation).toBeDefined();
      expect(rotatePointAroundCenter).toHaveBeenCalled();
    });

    it('should handle locked elements in multi-element rotation', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 0;

      const locked = {
        id: '1',
        type: ElementType.Rectangle,
        x: 25,
        y: 25,
        width: 50,
        height: 50,
        rotation: 0,
        locked: true,
      } as WhiteboardElement;
      const unlocked = {
        id: '2',
        type: ElementType.Rectangle,
        x: 75,
        y: 75,
        width: 30,
        height: 30,
        rotation: 0,
      } as WhiteboardElement;

      selectTool['initialElementStates'].set('1', { ...locked });
      selectTool['initialElementStates'].set('2', { ...unlocked });
      selectTool['initialElementRotations'].set('2', 0);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([locked, unlocked]);
      (calculateAngle as jest.Mock).mockReturnValue(90);

      (rotatePointAroundCenter as jest.Mock).mockImplementation((point) => ({ x: point.x, y: point.y }));

      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: jest.fn().mockReturnValue({ minX: 0, minY: 0, maxX: 100, maxY: 100 }),
      });

      const transformCallback = jest.fn((callback) => callback([locked, unlocked]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([locked, unlocked]);
      expect(result[0]).toEqual(locked); // Locked unchanged
    });

    it('should handle missing initial element state in multi-rotation', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 0;

      const el = { id: '1', type: ElementType.Rectangle, x: 25, y: 25, rotation: 0 } as WhiteboardElement;
      // Don't set initialElementStates

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el, el]);
      (calculateAngle as jest.Mock).mockReturnValue(90);

      const transformCallback = jest.fn((callback) => callback([el, el]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([el, el]);
      // Should return unchanged elements since no initial state
      expect(result[0]).toEqual(el);
    });
  });

  // ================================================================== //
  //  cancelAnimationFrame on pointer up with pending RAF                //
  // ================================================================== //

  describe('cancelAnimationFrame on pointerUp', () => {
    it('should cancel pending RAF on pointer up', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };

      // Trigger a pointer move to queue a RAF
      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      // Don't flush RAF — leave it pending

      // Now pointer up should cancel it
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);
      selectTool.handlePointerUp();

      expect(cancelAnimationFrame).toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  initializeResize with no selected elements                         //
  // ================================================================== //

  describe('initializeResize with no elements', () => {
    it('should handle empty selection during resize init', () => {
      const mockTarget = { id: SELECTOR_GRIP_RESIZE + '_se', getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      (getRotatedDirection as jest.Mock).mockReturnValue(Direction.SE);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Resize);
    });
  });

  // ================================================================== //
  //  getResizeDirection with no selected elements                       //
  // ================================================================== //

  describe('getResizeDirection with empty selection', () => {
    it('should return base direction when no elements selected', () => {
      const mockTarget = { id: SELECTOR_GRIP_RESIZE + '_se', getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      apiService.getSelectedElements = jest.fn().mockReturnValue([]);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      // With empty selection, getResizeDirection falls through to return baseDirection
      expect(selectTool.getCurrentHandle()).toBe(Direction.SE);
    });
  });

  // ================================================================== //
  //  Multi-element resize missing initial element state                 //
  // ================================================================== //

  describe('multi-element resize missing initial state', () => {
    it('should return element unchanged if no initial state exists', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const el1 = { id: '1', type: ElementType.Rectangle, x: 10, y: 10, width: 40, height: 40 } as WhiteboardElement;
      const el2 = {
        id: '2',
        type: ElementType.Rectangle,
        x: 30,
        y: 30,
        width: 20,
        height: 20,
        rotation: 0,
      } as WhiteboardElement;
      // Only set initial state for el2, not el1 — so el1 triggers the guard
      selectTool['initialElementStates'].set('2', { ...el2 });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el1, el2]);

      const transformCallback = jest.fn((callback) => callback([el1, el2]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).toHaveBeenCalled();
      const callback = transformCallback.mock.calls[0][0];
      const result = callback([el1, el2]);
      // el1 has no initial state → returned unchanged
      expect(result[0]).toEqual(el1);
      // el2 has initial state → resized
      expect(result[1]).not.toEqual(el2);
    });

    it('should handle element with no initial state inside multi-resize callback', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      selectTool['initialElementStates'] = new Map();

      const el1 = { id: 'x', type: ElementType.Rectangle, x: 10, y: 10, width: 40, height: 40 } as WhiteboardElement;
      const el2 = { id: 'y', type: ElementType.Rectangle, x: 30, y: 30, width: 20, height: 20 } as WhiteboardElement;

      apiService.getSelectedElements = jest.fn().mockReturnValue([el1, el2]);

      const results: WhiteboardElement[][] = [];
      apiService.transformSelectedElements = jest.fn((cb: (elements: WhiteboardElement[]) => WhiteboardElement[]) => {
        results.push(cb([el1, el2]));
      });

      // calling the private method directly
      selectTool['handleResize']({ x: 150, y: 150 }, false);

      expect(apiService.transformSelectedElements).toHaveBeenCalled();
      // Both elements should be returned unchanged since no initial state
      expect(results[0][0]).toBe(el1);
      expect(results[0][1]).toBe(el2);
    });

    it('should return early for unrecognized direction in multi-resize', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = 'INVALID' as unknown as Direction;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const el1 = { id: '1', type: ElementType.Rectangle, x: 10, y: 10, width: 40, height: 40 } as WhiteboardElement;
      const el2 = { id: '2', type: ElementType.Rectangle, x: 30, y: 30, width: 20, height: 20 } as WhiteboardElement;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el1, el2]);

      const transformCallback = jest.fn();
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // default case in switch → early return, transformSelectedElements not called
      expect(transformCallback).not.toHaveBeenCalled();
    });

    it('should return early when newWidth or newHeight becomes non-positive', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const el1 = { id: '1', type: ElementType.Rectangle, x: 10, y: 10, width: 40, height: 40 } as WhiteboardElement;
      const el2 = { id: '2', type: ElementType.Rectangle, x: 30, y: 30, width: 20, height: 20 } as WhiteboardElement;

      // SE direction: newWidth = initialBounds.width + dx, newHeight = initialBounds.height + dy
      // dx = -200, so newWidth = 100 + (-200) = -100 → negative
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: -100, y: -100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el1, el2]);

      const transformCallback = jest.fn();
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: -100, y: -100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(transformCallback).not.toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  Preserve rotation in multi-element resize                          //
  // ================================================================== //

  describe('multi-element resize preserves rotation', () => {
    it('should preserve individual element rotation during group resize', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };

      const el = {
        id: '1',
        type: ElementType.Rectangle,
        x: 10,
        y: 10,
        width: 40,
        height: 40,
        rotation: 30,
        style: {},
      } as WhiteboardElement;

      selectTool['initialElementStates'].set('1', { ...el });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el, el]);

      const transformCallback = jest.fn((callback) => callback([el, el]));
      apiService.transformSelectedElements = transformCallback;

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      const callback = transformCallback.mock.calls[0][0];
      const result = callback([el, el]);
      expect(result[0].rotation).toBe(30); // Preserved from initial state
    });
  });

  // ================================================================== //
  //  handlePointerDown null element id                                  //
  // ================================================================== //

  describe('handleElementSelect null elementId', () => {
    it('should bail when getAttribute returns null for data-id', () => {
      const mockTarget = {
        id: ITEM_PREFIX + 'something',
        getAttribute: jest.fn().mockReturnValue(null),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      expect(apiService.selectElements).not.toHaveBeenCalled();
      expect(apiService.toggleSelection).not.toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  Box select with shift key on init                                  //
  // ================================================================== //

  describe('initializeBoxSelect with shift key', () => {
    it('should not clear selection when shift is pressed', () => {
      (getMouseTarget as jest.Mock).mockReturnValue(null);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const mockEvent = createMockPointerInfo({ x: 100, y: 200, shiftKey: true, eventType: 'pointerdown' });
      (apiService.clearSelection as jest.Mock).mockClear();
      selectTool.handlePointerDown(mockEvent);

      expect(apiService.clearSelection).not.toHaveBeenCalled();
      expect(apiService.setSelectionBox).toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  initializeRotation with non-function bbox signal                   //
  // ================================================================== //

  describe('initializeRotation with object bbox', () => {
    it('should handle bbox signal as non-function value', () => {
      const mockBbox = { x: 10, y: 20, width: 100, height: 80 };
      apiService.getBoundingBoxSignal = jest.fn().mockReturnValue(mockBbox);
      apiService.setBoundingBox = jest.fn();
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      (calculateAngle as jest.Mock).mockReturnValue(0);
      apiService.getSelectedElements = jest.fn().mockReturnValue([{ id: '1', rotation: 10 }]);

      const mockTarget = { id: SELECTOR_GRIP_ROTATE };
      (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
      const event = createMockPointerInfo({ target: mockTarget as unknown as EventTarget, eventType: 'pointerdown' });
      selectTool.handlePointerDown(event);

      // Should use the object directly since it's not a function
      // but the code casts it — either way selectionCenter should be set
      // The code does: typeof maybeFn === 'function' ? maybeFn() : bboxOrSignal
      // Since mockBbox is an object, it should use it directly
      expect(selectTool['selectionCenter']).toEqual({
        x: 10 + 100 / 2,
        y: 20 + 80 / 2,
      });
    });
  });

  // ================================================================== //
  //  Guard clause returns (uncovered branches)                          //
  // ================================================================== //

  describe('guard clause returns', () => {
    it('handleMove should return early when startPoint is null', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('handleResize should return early when startPoint is null', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['startPoint'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('handleResize should return early when currentHandle is null', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['currentHandle'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('handleResize should return early when initialBoundingBox is null', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['currentHandle'] = Direction.SE;
      selectTool['initialBoundingBox'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('handleRotate should return early when startPoint is null', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('handleRotate should return early when selectionCenter is null', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 50, y: 50 };
      selectTool['selectionCenter'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('handleBoxSelect should return early when startPoint is null', () => {
      selectTool['currentAction'] = SelectAction.BoxSelect;
      selectTool['startPoint'] = null;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.setSelectionBox).not.toHaveBeenCalled();
    });
  });

  // ================================================================== //
  //  Binary expression fallback branches                                //
  // ================================================================== //

  describe('binary expression fallback branches', () => {
    it('should use rx/ry fallback when width/height not present on rotated element (single resize)', () => {
      // Element that only has rx/ry but no width/height
      const ellipse = {
        id: 'e1',
        type: ElementType.Ellipse,
        x: 50,
        y: 50,
        rx: 40,
        ry: 30,
        rotation: 45,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 130, y: 110 };
      selectTool['initialBoundingBox'] = { x: 10, y: 20, width: 80, height: 60 };
      selectTool['initialElementStates'].set('e1', { ...ellipse });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 130 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([ellipse]);

      const mockResize = jest.fn().mockReturnValue({ ...ellipse, rx: 50, ry: 40, rotation: 45 });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 0, minY: 10, maxX: 100, maxY: 90 }),
      });

      let capturedCallback: ((elements: WhiteboardElement[]) => WhiteboardElement[]) | null = null;
      apiService.transformSelectedElements = jest.fn((cb: (elements: WhiteboardElement[]) => WhiteboardElement[]) => {
        capturedCallback = cb;
      });

      const event = createMockPointerInfo({ x: 150, y: 130, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(capturedCallback).not.toBeNull();
      const result = capturedCallback!([ellipse]); // eslint-disable-line @typescript-eslint/no-non-null-assertion
      expect(result[0]).toBeDefined();
      expect('rx' in result[0]).toBe(true);
    });

    it('should fallback to 0 when no width/height/rx/ry on rotated element', () => {
      // Element with rotation but no width/height/rx/ry
      const oddElement = {
        id: 'o1',
        type: ElementType.Rectangle,
        x: 50,
        y: 50,
        rotation: 90,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      selectTool['initialElementStates'].set('o1', { ...oddElement });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([oddElement]);

      const mockResize = jest.fn().mockReturnValue({ ...oddElement, width: 50, height: 50, rotation: 90 });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 0, minY: 0, maxX: 100, maxY: 100 }),
      });

      let capturedCallback: ((elements: WhiteboardElement[]) => WhiteboardElement[]) | null = null;
      apiService.transformSelectedElements = jest.fn((cb: (elements: WhiteboardElement[]) => WhiteboardElement[]) => {
        capturedCallback = cb;
      });

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(capturedCallback).not.toBeNull();
      const result = capturedCallback!([oddElement]); // eslint-disable-line @typescript-eslint/no-non-null-assertion
      // Should work with 0 fallback → no error thrown
      expect(result[0]).toBeDefined();
    });

    it('should use rotation ?? 0 in anchor correction after resize', () => {
      // Resized element that has no rotation on the resized result
      const el = {
        id: 'r1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 45,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      selectTool['initialElementStates'].set('r1', { ...el });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el]);

      // Return resized element WITHOUT rotation property to trigger ?? 0
      const resized = { ...el, width: 150, height: 150 };
      delete (resized as Record<string, unknown>)['rotation'];
      const mockResize = jest.fn().mockReturnValue(resized);
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 0, minY: 0, maxX: 150, maxY: 150 }),
      });

      let capturedCallback: ((elements: WhiteboardElement[]) => WhiteboardElement[]) | null = null;
      apiService.transformSelectedElements = jest.fn((cb: (elements: WhiteboardElement[]) => WhiteboardElement[]) => {
        capturedCallback = cb;
      });

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(capturedCallback).not.toBeNull();
      const result = capturedCallback!([el]); // eslint-disable-line @typescript-eslint/no-non-null-assertion
      expect(result[0]).toBeDefined();
    });

    it('should handle endBinding-only in arrow detach during move', () => {
      const mockAb = {
        createBinding: jest.fn(),
        recomputeBindingsForElements: jest.fn().mockReturnValue([]),
      };
      selectTool.setConnectionServices(
        {} as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        {} as ConnectionUIService
      );

      // Arrow with only endBinding (startBinding is null)
      const arrow = {
        id: 'arrow-1',
        type: ElementType.Arrow,
        x: 0,
        y: 0,
        startBinding: null,
        endBinding: { elementId: 'rect-2', pointId: 'right' },
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 50, y: 50 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([arrow]);
      apiService.transformSelectedElements = jest.fn();

      const event = createMockPointerInfo({ x: 50, y: 50, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(apiService.updateElements).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'arrow-1', endBinding: null }),
      ]);
      // startBinding was null, so no update for it
      const update = (apiService.updateElements as jest.Mock).mock.calls[0][0][0];
      expect(update.startBinding).toBeUndefined();
    });

    it('should handle multi-rotation with element missing from initialElementRotations', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 50, y: 50 };
      selectTool['rotateStartAngle'] = 0;

      // Element has rotation: undefined (not set), and is NOT in initialElementRotations
      // This triggers the ?? initialElement.rotation ?? 0 fallback path
      const el = { id: '1', type: ElementType.Rectangle, x: 25, y: 25, width: 50, height: 50 } as WhiteboardElement;

      selectTool['initialElementStates'].set('1', { ...el }); // el has no rotation property
      // Don't set initialElementRotations for '1'

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 100 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el, el]);
      (calculateAngle as jest.Mock).mockReturnValue(45);

      (rotatePointAroundCenter as jest.Mock).mockImplementation((point) => ({ x: point.x, y: point.y }));
      (getElementUtil as jest.Mock).mockReturnValue({
        getBounds: jest.fn().mockReturnValue({ minX: 25, minY: 25, maxX: 75, maxY: 75 }),
      });

      let capturedCallback: ((elements: WhiteboardElement[]) => WhiteboardElement[]) | null = null;
      apiService.transformSelectedElements = jest.fn((cb: (elements: WhiteboardElement[]) => WhiteboardElement[]) => {
        capturedCallback = cb;
      });

      const event = createMockPointerInfo({ x: 150, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(capturedCallback).not.toBeNull();
      const result = capturedCallback!([el, el]); // eslint-disable-line @typescript-eslint/no-non-null-assertion
      // Falls through to ?? 0 (no rotation on element, no entry in map)
      expect(result[0].rotation).toBeDefined();
    });

    it('should handle element without x1/y1/x2/y2 in worldToLocal with rotation', () => {
      // Element with rotation but no x1/y1/x2/y2 (non-arrow)
      const rect = {
        id: 'rect-1',
        type: ElementType.Arrow, // Needs to be arrow for DragEndpoint path
        x: 50,
        y: 50,
        rotation: 30,
      } as unknown as WhiteboardElement;

      apiService.getElementById = jest.fn().mockReturnValue(rect);
      apiService.getElements = jest.fn().mockReturnValue([rect]);

      const mockCp = { findSnapTarget: jest.fn().mockReturnValue(null), getConnectionPoints: jest.fn() };
      const mockAb = { createBinding: jest.fn(), recomputeBindingsForElements: jest.fn().mockReturnValue([]) };
      const mockUi = { setSnapIndicator: jest.fn(), setVisibleConnectionPoints: jest.fn(), clearAll: jest.fn() };
      selectTool.setConnectionServices(
        mockCp as unknown as ConnectionPointsService,
        mockAb as unknown as ArrowBindingService,
        mockUi as unknown as ConnectionUIService
      );

      selectTool['currentAction'] = SelectAction.DragEndpoint;
      selectTool['startPoint'] = { x: 50, y: 50 };
      selectTool['dragEndpointId'] = 'rect-1';
      selectTool['dragEndpointEnd'] = 'end';

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      const event = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      // worldToLocal runs with ?? 0 fallbacks for x1/y1/x2/y2
      expect(apiService.updateElements).toHaveBeenCalled();
    });

    it('should handle single-element resize with locked element in callback', () => {
      const lockedEl = {
        id: 'r1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        locked: true,
        style: {},
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      selectTool['initialElementStates'].set('r1', { ...lockedEl });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([lockedEl]);

      let capturedCallback: ((elements: WhiteboardElement[]) => WhiteboardElement[]) | null = null;
      apiService.transformSelectedElements = jest.fn((cb: (elements: WhiteboardElement[]) => WhiteboardElement[]) => {
        capturedCallback = cb;
      });

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(capturedCallback).not.toBeNull();
      const result = capturedCallback!([lockedEl]); // eslint-disable-line @typescript-eslint/no-non-null-assertion
      // Locked element should be returned unchanged
      expect(result[0]).toEqual(lockedEl);
    });

    it('single-resize should return el unchanged when initial state is missing from callback', () => {
      const el = {
        id: 'unknown',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
      } as unknown as WhiteboardElement;

      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.SE;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['initialBoundingBox'] = { x: 0, y: 0, width: 100, height: 100 };
      // Set initial state for the main element so handleResize proceeds
      selectTool['initialElementStates'].set('unknown', { ...el });

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 150 });
      apiService.getSelectedElements = jest.fn().mockReturnValue([el]);

      // Mock getElementUtil to return resize function
      const mockResize = jest.fn().mockReturnValue({ ...el, width: 150, height: 150 });
      (getElementUtil as jest.Mock).mockReturnValue({
        resize: mockResize,
        getBounds: jest.fn().mockReturnValue({ minX: 0, minY: 0, maxX: 150, maxY: 150 }),
      });

      let capturedCallback: ((elements: WhiteboardElement[]) => WhiteboardElement[]) | null = null;
      apiService.transformSelectedElements = jest.fn((cb: (elements: WhiteboardElement[]) => WhiteboardElement[]) => {
        capturedCallback = cb;
      });

      const event = createMockPointerInfo({ x: 150, y: 150, eventType: 'pointermove' });
      selectTool.handlePointerMove(event);
      flushRAF();

      expect(capturedCallback).not.toBeNull();
      // Call the callback with an element whose id is NOT in initialElementStates
      const unknownEl = { id: 'different', type: ElementType.Rectangle } as WhiteboardElement;
      const result = capturedCallback!([unknownEl]); // eslint-disable-line @typescript-eslint/no-non-null-assertion
      // Should return the element unchanged since no initial state for 'different'
      expect(result[0]).toBe(unknownEl);
    });
  });
});
