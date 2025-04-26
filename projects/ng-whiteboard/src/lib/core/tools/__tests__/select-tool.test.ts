import { DataService } from '../../data/data.service';
import { getElementUtil } from '../../elements/element.utils';
import { Direction, ElementType, ToolType, WhiteboardConfig, WhiteboardElement } from '../../types';
import { getMouseTarget } from '../../utils/dom';
import {
  calculateAngle,
  findNearestSnapAngle,
  getRotatedDirection,
  getSnappedOffset,
  isElementInSelectionBox,
  normalizeAngle,
} from '../../utils/geometry';
import { SelectAction, SelectTool } from '../select-tool';
import { ITEM_PREFIX, SELECTOR_GRIP_RESIZE, SELECTOR_GRIP_ROTATE } from './../../constants/index';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/dom', () => ({
  getMouseTarget: jest.fn(),
}));

jest.mock('../../utils/geometry', () => ({
  getSnappedOffset: jest.fn(),
  calculateAngle: jest.fn(),
  findNearestSnapAngle: jest.fn(),
  normalizeAngle: jest.fn(),
  isElementInSelectionBox: jest.fn(),
  getCanvasCoordinates: jest.fn(),
  getRotatedDirection: jest.fn(),
}));

describe('SelectTool', () => {
  let selectTool: SelectTool;
  let dataService: DataService;
  let config: WhiteboardConfig;

  beforeEach(() => {
    config = {
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
      elementsTranslation: { x: 0, y: 0 },
    } as WhiteboardConfig;

    dataService = {
      getConfig: jest.fn().mockReturnValue(config),
      getData: jest.fn().mockReturnValue([]),
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
      toggleSelection: jest.fn(),
      getCanvasCoordinates: jest.fn().mockImplementation((x, y) => ({ x, y })),
    } as unknown as DataService;

    selectTool = new SelectTool(dataService);
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
    it('should clear selection on activate', () => {
      selectTool.onActivate();
      expect(dataService.clearSelection).toHaveBeenCalled();
    });

    it('should clear selection on deactivate', () => {
      selectTool.onDeactivate();
      expect(dataService.clearSelection).toHaveBeenCalled();
    });
  });

  describe('handlePointerDown', () => {
    it('should handle element selection without shift key', () => {
      const mockElement = {
        id: ITEM_PREFIX + '1',
        getAttribute: jest.fn().mockReturnValue('1'),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);
      dataService.getData = jest.fn().mockReturnValue([{ id: '1' }]);

      const mockEvent = { offsetX: 100, offsetY: 200, shiftKey: false } as PointerEvent;
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Move);
      expect(dataService.selectElements).toHaveBeenCalledWith([{ id: '1' }]);
      expect(dataService.toggleSelection).not.toHaveBeenCalled();
    });

    it('should handle element selection with shift key (multi-select)', () => {
      const mockElement = {
        id: ITEM_PREFIX + '1',
        getAttribute: jest.fn().mockReturnValue('1'),
      };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);
      dataService.getData = jest.fn().mockReturnValue([{ id: '1' }]);

      const mockEvent = { offsetX: 100, offsetY: 200, shiftKey: true } as PointerEvent;
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Move);
      expect(dataService.toggleSelection).toHaveBeenCalledWith({ id: '1' });
    });

    it('should handle resize grip selection', () => {
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
      const mockElement = { id: SELECTOR_GRIP_RESIZE + '_n', getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);
      dataService.getSelectedElements = jest.fn().mockReturnValue([{ type: ElementType.Rectangle }]);
      const mockResize = jest.fn();
      (getElementUtil as jest.Mock).mockReturnValue({ resize: mockResize });
      (getRotatedDirection as jest.Mock).mockReturnValue(Direction.N);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const mockEvent = { offsetX: 100, offsetY: 200 } as PointerEvent;
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Resize);
      expect(selectTool.getCurrentHandle()).toBe(Direction.N);
    });

    it('should handle rotate grip selection', () => {
      const mockElement = { id: SELECTOR_GRIP_ROTATE, getAttribute: jest.fn() };
      (getMouseTarget as jest.Mock).mockReturnValue(mockElement);

      const event = { target: { id: SELECTOR_GRIP_ROTATE } } as any;
      selectTool.handlePointerDown(event);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.Rotate);
    });

    it('should initialize box selection without shift key', () => {
      (getMouseTarget as jest.Mock).mockReturnValue(null);
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const mockEvent = { offsetX: 100, offsetY: 200, shiftKey: false } as PointerEvent;
      selectTool.handlePointerDown(mockEvent);

      expect(selectTool.getCurrentAction()).toBe(SelectAction.BoxSelect);
      expect(dataService.clearSelection).toHaveBeenCalled();
      expect(dataService.setSelectionBox).toHaveBeenCalledWith({
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

      const mockEvent = { offsetX: 100, offsetY: 200 } as PointerEvent;
      selectTool.handlePointerMove(mockEvent);

      expect(dataService.transformSelectedElements).not.toHaveBeenCalled();
    });

    it('should handle element move without shift key', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 50, y: 100 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      dataService.getSelectedElements = jest.fn().mockReturnValue([{ x: 100, y: 200 }]);
      dataService.transformSelectedElements = jest.fn();

      const event = { offsetX: 150, offsetY: 300, shiftKey: false } as PointerEvent;
      selectTool.handlePointerMove(event);

      expect(dataService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
      expect(selectTool['startPoint']).toEqual({ x: 100, y: 200 });
    });

    it('should handle element move with shift key (snapping)', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 50, y: 100 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      dataService.getSelectedElements = jest.fn().mockReturnValue([{ x: 100, y: 200 }]);
      dataService.transformSelectedElements = jest.fn();

      const mockSnappedOffset = { x: 50, y: 50 };
      (getSnappedOffset as jest.Mock).mockReturnValue(mockSnappedOffset);

      const event = { offsetX: 150, offsetY: 300, shiftKey: true } as PointerEvent;
      selectTool.handlePointerMove(event);

      expect(getSnappedOffset).toHaveBeenCalledWith(50, 100);
      expect(dataService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
      expect(selectTool['startPoint']).toEqual({ x: 100, y: 200 });
    });

    it('should handle element resize without shift key', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.N;
      selectTool['startPoint'] = { x: 50, y: 50 };

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      dataService.getSelectedElements = jest.fn().mockReturnValue([{ type: ElementType.Rectangle }]);
      dataService.transformSelectedElements = jest.fn();

      const mockResize = jest.fn().mockImplementation((el, dir, dx, dy) => ({
        ...el,
        width: el.width + dx,
      }));
      (getElementUtil as jest.Mock).mockReturnValue({ resize: mockResize });

      const event = { offsetX: 100, offsetY: 200, shiftKey: false } as PointerEvent;
      selectTool.handlePointerMove(event);

      expect(dataService.transformSelectedElements).toHaveBeenCalled();
      expect(selectTool['startPoint']).toEqual({ x: 100, y: 200 });
    });

    it('should handle element resize with shift key (snapping)', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['currentHandle'] = Direction.N;
      selectTool['startPoint'] = { x: 50, y: 50 };

      dataService.getSelectedElements = jest.fn().mockReturnValue([{ type: ElementType.Rectangle }]);
      dataService.transformSelectedElements = jest.fn();

      const mockResize = jest.fn().mockImplementation((el, dir, dx, dy) => ({
        ...el,
        width: el.width + dx,
      }));
      (getElementUtil as jest.Mock).mockReturnValue({ resize: mockResize });

      const mockSnappedOffset = { x: 50, y: 50 };
      (getSnappedOffset as jest.Mock).mockReturnValue(mockSnappedOffset);

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const event = { offsetX: 100, offsetY: 200, shiftKey: true } as PointerEvent;
      selectTool.handlePointerMove(event);

      expect(getSnappedOffset).toHaveBeenCalledWith(50, 150);
      expect(dataService.transformSelectedElements).toHaveBeenCalled();
    });

    it('should handle element rotation without shift key', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 150, y: 150 };
      selectTool['rotateStartAngle'] = 0;
      dataService.getSelectedElements = jest.fn().mockReturnValue([{ rotation: 0 }]);
      dataService.transformSelectedElements = jest.fn();
      (calculateAngle as jest.Mock).mockReturnValue(45);

      const mockEvent = { offsetX: 200, offsetY: 200, shiftKey: false } as PointerEvent;
      selectTool.handlePointerMove(mockEvent);

      expect(dataService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
      expect(selectTool['rotateStartAngle']).toBe(45);
    });

    it('should handle element rotation with shift key (angle snapping)', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 100, y: 100 };
      selectTool['selectionCenter'] = { x: 150, y: 150 };
      selectTool['rotateStartAngle'] = 0;
      dataService.getSelectedElements = jest.fn().mockReturnValue([{ rotation: 0 }]);
      dataService.transformSelectedElements = jest.fn();
      (calculateAngle as jest.Mock).mockReturnValue(47);
      (findNearestSnapAngle as jest.Mock).mockReturnValue(45);

      const mockEvent = { offsetX: 200, offsetY: 200, shiftKey: true } as PointerEvent;
      selectTool.handlePointerMove(mockEvent);

      expect(findNearestSnapAngle).toHaveBeenCalledWith(47, selectTool['ROTATION_SNAP_ANGLES'], 5);
      expect(dataService.transformSelectedElements).toHaveBeenCalledWith(expect.any(Function));
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

      dataService.getData = jest.fn().mockReturnValue([mockElement]);
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

      dataService.setSelectionBox = jest.fn();
      dataService.selectElements = jest.fn();

      const event = { offsetX: 200, offsetY: 200, shiftKey: false } as PointerEvent;
      selectTool.handlePointerMove(event);

      expect(dataService.setSelectionBox).toHaveBeenCalledWith({
        x: 0,
        y: 0,
        width: 100,
        height: 200,
        visible: true,
      });

      expect(dataService.selectElements).toHaveBeenCalledWith([mockElement], false);
    });

    it('should handle box selection with shift key (multi-select)', () => {
      selectTool['currentAction'] = SelectAction.BoxSelect;
      selectTool['startPoint'] = { x: 100, y: 100 };
      dataService.setSelectionBox = jest.fn();
      dataService.selectElements = jest.fn();
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

      dataService.getData = jest.fn().mockReturnValue(mockElements);
      (isElementInSelectionBox as jest.Mock).mockReturnValue(true);

      const mockElementUtil = {
        getBounds: jest.fn().mockReturnValue(mockBounds),
      };

      (getElementUtil as jest.Mock).mockReturnValue(mockElementUtil);

      const mockEvent = { offsetX: 200, offsetY: 200, shiftKey: true } as PointerEvent;
      selectTool.handlePointerMove(mockEvent);

      expect(dataService.selectElements).toHaveBeenCalledWith([mockElements[0]], true);
    });
  });

  describe('handlePointerMove', () => {
    it('should handle Move action', () => {
      selectTool['currentAction'] = SelectAction.Move;
      selectTool['startPoint'] = { x: 0, y: 0 };
      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      const event = { offsetX: 10, offsetY: 20 } as any;
      selectTool.handlePointerMove(event);

      expect(dataService.transformSelectedElements).toHaveBeenCalled();
    });

    it('should handle Resize action', () => {
      selectTool['currentAction'] = SelectAction.Resize;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['currentHandle'] = Direction.N;

      jest.spyOn(selectTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      (dataService.getSelectedElements as jest.Mock).mockReturnValue([
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

      const event = { offsetX: 10, offsetY: 20 } as any;
      selectTool.handlePointerMove(event);

      expect(dataService.transformSelectedElements).toHaveBeenCalled();
    });

    it('should handle Rotate action', () => {
      selectTool['currentAction'] = SelectAction.Rotate;
      selectTool['startPoint'] = { x: 0, y: 0 };
      selectTool['selectionCenter'] = { x: 5, y: 5 };
      selectTool['rotateStartAngle'] = 0;

      (dataService.getSelectedElements as jest.Mock).mockReturnValue([
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

      const event = { offsetX: 10, offsetY: 20 } as any;
      selectTool.handlePointerMove(event);

      expect(dataService.transformSelectedElements).toHaveBeenCalled();
    });
  });

  describe('handlePointerUp', () => {
    it('should reset state after pointer up', () => {
      selectTool['currentAction'] = SelectAction.BoxSelect;
      selectTool['startPoint'] = { x: 0, y: 0 };

      selectTool.handlePointerUp();

      expect(selectTool.getCurrentAction()).toBe(SelectAction.None);
      expect(selectTool.getStartPoint()).toBeNull();
      expect(dataService.clearSelectionBox).toHaveBeenCalled();
    });
  });
});
