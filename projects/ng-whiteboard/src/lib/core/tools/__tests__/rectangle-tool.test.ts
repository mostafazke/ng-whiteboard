import { RectangleTool } from '../rectangle-tool';
import { ElementType, LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { RectangleElement } from '../../elements';
import { createElement } from '../../elements/element.utils';
import { ApiService } from '../../api/api.service';
import { snapToGrid } from '../../utils/geometry';
import { createMockPointerInfo } from '../../testing';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
  getCanvasCoordinates: jest.fn((config, point) => point),
}));

describe('RectangleTool', () => {
  let rectangleTool: RectangleTool;
  let apiService: ApiService;
  let config: WhiteboardConfig;

  beforeEach(() => {
    config = {
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Round,
      lineJoin: LineJoin.Round,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
      fullScreen: true,
      zoom: 1,
      x: 0,
      y: 0,
      canvasX: 0,
      canvasY: 0,
    } as WhiteboardConfig;

    apiService = {
      addDraftElements: jest.fn(),
      updateDraftElements: jest.fn((updates) => {
        // Mock implementation that updates the element properties
        if (rectangleTool.element && updates && updates.length > 0) {
          Object.assign(rectangleTool.element, updates[0]);
        }
      }),
      commitDraftElements: jest.fn(),
      getConfig: jest.fn().mockReturnValue(config),
      getNextZIndex: jest.fn().mockReturnValue(1),
      getActiveLayerId: jest.fn().mockReturnValue('layer-1'),
      selectElements: jest.fn(),
    } as unknown as ApiService;

    rectangleTool = new RectangleTool(apiService);
    rectangleTool.activate();
  });

  it('should initialize with the correct type', () => {
    expect(rectangleTool.type).toBe(ToolType.Rectangle);
  });

  describe('handlePointerDown', () => {
    it('should create a rectangle element and add it to draft', () => {
      const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.activate();
      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 200 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object), 'layer-1');
      expect(apiService.addDraftElements).toHaveBeenCalledWith([expect.any(Object)]);
    });

    it('should snap to grid if enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;

      const mockEvent = createMockPointerInfo({ x: 105, y: 215, eventType: 'pointerdown' });
      (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);
      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.activate();
      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 220 });
    });
  });

  describe('handlePointerMove', () => {
    it('should update the rectangle dimensions and position', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointermove' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 80, shiftKey: true, eventType: 'pointermove' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 100, altKey: true, eventType: 'pointermove' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 105, y: 115, eventType: 'pointerdown' });

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
      rectangleTool.element = { id: '1', width: 50, height: 50, x: 50, y: 50 } as unknown as RectangleElement;

      rectangleTool.handlePointerUp();

      expect(apiService.commitDraftElements).toHaveBeenCalled();
      expect(rectangleTool.startPoint).toBeNull();
      expect(rectangleTool.element).toBeNull();
    });

    it('should not proceed if the tool is not active', () => {
      rectangleTool.deactivate();
      const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toBeNull();
      expect(rectangleTool.element).toBeNull();
      expect(apiService.addDraftElements).not.toHaveBeenCalled();
    });

    it('should calculate pointer position correctly', () => {
      const mockEvent = createMockPointerInfo({ x: 150, y: 250, eventType: 'pointerdown' });
      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 150, y: 250 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object), 'layer-1');
      expect(apiService.addDraftElements).toHaveBeenCalledWith([expect.any(Object)]);
    });

    it('should snap pointer position to grid if snapToGrid is enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;

      const mockEvent = createMockPointerInfo({ x: 105, y: 215, eventType: 'pointerdown' });
      (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);
      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 220 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object), 'layer-1');
      expect(apiService.addDraftElements).toHaveBeenCalledWith([expect.any(Object)]);
    });

    it('should create a rectangle element with the correct style', () => {
      const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      // @ts-expect-error - spying on private method
      jest.spyOn(rectangleTool, 'getElementStyle').mockReturnValue({
        strokeColor: '#000000',
        strokeWidth: 2,
        lineJoin: LineJoin.Miter,
        fill: '#ffffff',
        dasharray: '',
        dashoffset: 0,
      });
      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(createElement).toHaveBeenCalledWith(
        ElementType.Rectangle,
        {
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
          zIndex: 1,
        },
        'layer-1'
      );
    });

    it('should not proceed if the tool is not active', () => {
      rectangleTool.deactivate();
      const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toBeNull();
      expect(rectangleTool.element).toBeNull();
      expect(apiService.addDraftElements).not.toHaveBeenCalled();
    });

    it('should set startPoint and create a rectangle element', () => {
      const mockEvent = createMockPointerInfo({ x: 150, y: 250, eventType: 'pointerdown' });
      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 150, y: 250 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object), 'layer-1');
      expect(apiService.addDraftElements).toHaveBeenCalledWith([expect.any(Object)]);
    });

    it('should snap pointer position to grid if snapToGrid is enabled', () => {
      rectangleTool.whiteboardConfig.snapToGrid = true;
      rectangleTool.whiteboardConfig.gridSize = 20;

      const mockEvent = createMockPointerInfo({ x: 105, y: 215, eventType: 'pointerdown' });
      (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);

      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(rectangleTool.startPoint).toEqual({ x: 100, y: 220 });
      expect(createElement).toHaveBeenCalledWith(ElementType.Rectangle, expect.any(Object), 'layer-1');
      expect(apiService.addDraftElements).toHaveBeenCalledWith([expect.any(Object)]);
    });

    it('should create a rectangle element with the correct style', () => {
      const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
      // @ts-expect-error - spying on private method
      jest.spyOn(rectangleTool, 'getElementStyle').mockReturnValue({
        strokeColor: '#000000',
        strokeWidth: 2,
        lineJoin: LineJoin.Miter,
        fill: '#ffffff',
        dasharray: '',
        dashoffset: 0,
      });
      (createElement as jest.Mock).mockReturnValue({ id: '1', type: ElementType.Rectangle });

      rectangleTool.handlePointerDown(mockEvent);

      expect(createElement).toHaveBeenCalledWith(
        ElementType.Rectangle,
        {
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
          zIndex: 1,
        },
        'layer-1'
      );
    });

    it('should update the rectangle dimensions and position based on pointer movement', () => {
      rectangleTool.activate();
      rectangleTool.startPoint = { x: 50, y: 50 };
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 80, shiftKey: true, eventType: 'pointermove' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 100, altKey: true, eventType: 'pointermove' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 105, y: 115, eventType: 'pointerdown' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });

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
      rectangleTool.element = { id: '1', width: 0, height: 0, x: 0, y: 0 } as unknown as RectangleElement;

      const mockEvent = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });

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
