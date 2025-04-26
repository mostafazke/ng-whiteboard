import { RectangleTool } from '../rectangle-tool';
import { ElementType, LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { createElement } from '../../elements/element.utils';
import { DataService } from '../../data/data.service';
import { snapToGrid } from '../../utils/geometry';
import { ITEM_PREFIX } from '../../constants';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
}));

describe('RectangleTool', () => {
  let rectangleTool: RectangleTool;
  let dataService: DataService;
  let config: WhiteboardConfig;

  beforeEach(() => {
    config = {
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Butt,
      lineJoin: LineJoin.Miter,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
    } as WhiteboardConfig;

    dataService = {
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(config),
    } as unknown as DataService;

    rectangleTool = new RectangleTool(dataService);
    rectangleTool.activate();
  });

  it('should initialize with the correct type', () => {
    expect(rectangleTool.type).toBe(ToolType.Rectangle);
  });

  describe('handlePointerDown', () => {
    it('should create a rectangle element and add it to draft', () => {
      const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.activate();
      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 200 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object));
      expect(dataService.addToDraft).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should snap to grid if enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;

      const mockEvent = { clientX: 105, clientY: 215 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 105, y: 215 });
      (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);
      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.activate();
      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 220 });
    });
  });

  describe('handlePointerMove', () => {
    it('should update the rectangle dimensions and position', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 100 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 50,
          height: 50,
          x: 50,
          y: 50,
        })
      );
    });

    it('should maintain square dimensions when shift key is pressed', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 80, shiftKey: true } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 80 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 50,
          height: 50,
          x: 50,
          y: 50,
        })
      );
    });

    it('should double dimensions and center when alt key is pressed', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 100, altKey: true } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 100,
          height: 100,
          x: 0,
          y: 0,
        })
      );
    });

    it('should snap dimensions and position to grid if snapToGrid is enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 105, clientY: 115 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 105, y: 115 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 60,
          height: 60,
          x: 60,
          y: 60,
        })
      );
    });
  });

  describe('handlePointerUp', () => {
    it('should commit the draft to data and reset state', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 50, height: 50, x: 50, y: 50 } as any;

      rectangleTool.handlePointerUp();

      expect(dataService.commitDraftToData).toHaveBeenCalled();
      expect(rectangleTool.startPoint).toBeNull();
      expect(rectangleTool.element).toBeNull();
    });

    it('should not proceed if the tool is not active', () => {
      rectangleTool.deactivate();
      const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toBeNull();
      expect(rectangleTool.element).toBeNull();
      expect(dataService.addToDraft).not.toHaveBeenCalled();
    });

    it('should calculate pointer position correctly', () => {
      const mockEvent = { clientX: 150, clientY: 250 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 150, y: 250 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object));
      expect(dataService.addToDraft).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should snap pointer position to grid if snapToGrid is enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;

      const mockEvent = { clientX: 105, clientY: 215 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 105, y: 215 });
      (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);
      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 220 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object));
      expect(dataService.addToDraft).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should create a rectangle element with the correct style', () => {
      const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
      jest.spyOn(rectangleTool as any, 'getElementStyle').mockReturnValue({
        strokeColor: '#000000',
        strokeWidth: 2,
        lineJoin: LineJoin.Miter,
        fill: '#ffffff',
        dasharray: '',
        dashoffset: 0,
      });
      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, {
        x: 100,
        y: 200,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          lineJoin: LineJoin.Miter,
          fill: '#ffffff',
          dasharray: '',
          dashoffset: 0,
        },
      });
    });

    it('should not proceed if the tool is not active', () => {
      rectangleTool.deactivate();
      const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toBeNull();
      expect(rectangleTool.element).toBeNull();
      expect(dataService.addToDraft).not.toHaveBeenCalled();
    });

    it('should set startPoint and create a rectangle element', () => {
      const mockEvent = { clientX: 150, clientY: 250 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 150, y: 250 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object));
      expect(dataService.addToDraft).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should snap pointer position to grid if snapToGrid is enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;

      const mockEvent = { clientX: 105, clientY: 215 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 105, y: 215 });
      (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);

      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 220 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object));
      expect(dataService.addToDraft).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should create a rectangle element with the correct style', () => {
      const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
      jest.spyOn(rectangleTool as any, 'getElementStyle').mockReturnValue({
        strokeColor: '#000000',
        strokeWidth: 2,
        lineJoin: LineJoin.Miter,
        fill: '#ffffff',
        dasharray: '',
        dashoffset: 0,
      });
      (createElement as jest.Mock).mockReturnValue({ type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, {
        x: 100,
        y: 200,
        style: {
          strokeColor: '#000000',
          strokeWidth: 2,
          lineJoin: LineJoin.Miter,
          fill: '#ffffff',
          dasharray: '',
          dashoffset: 0,
        },
      });
    });

    it('should update the rectangle dimensions and position based on pointer movement', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 100 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 50,
          height: 50,
          x: 50,
          y: 50,
        })
      );
    });

    it('should maintain square dimensions when shift key is pressed', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 80, shiftKey: true } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 80 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 50,
          height: 50,
          x: 50,
          y: 50,
        })
      );
    });

    it('should double dimensions and center when alt key is pressed', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 100, altKey: true } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 100,
          height: 100,
          x: 0,
          y: 0,
        })
      );
    });

    it('should snap dimensions and position to grid if snapToGrid is enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 105, clientY: 115 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 105, y: 115 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 60,
          height: 60,
          x: 60,
          y: 60,
        })
      );
    });

    it('should not update dimensions or position if the tool is inactive', () => {
      rectangleTool.deactivate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 100 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 0,
          height: 0,
          x: 0,
          y: 0,
        })
      );
    });

    it('should not update dimensions or position if startPoint is null', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = null;
      rectangleTool.element = { width: 0, height: 0, x: 0, y: 0 } as any;

      const mockEvent = { clientX: 100, clientY: 100 } as PointerEvent;
      jest.spyOn(rectangleTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 100 });

      rectangleTool.handlePointerMove(mockEvent);

      expect(rectangleTool.element).toEqual(
        expect.objectContaining({
          width: 0,
          height: 0,
          x: 0,
          y: 0,
        })
      );
    });
  });
});
