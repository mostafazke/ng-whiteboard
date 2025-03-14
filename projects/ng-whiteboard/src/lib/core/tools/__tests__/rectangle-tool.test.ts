import { RectangleElement } from '../../elements';
import { createElement } from '../../elements/element.utils';
import { ToolType, ElementType } from '../../types';
import { RectangleTool } from '../rectangle-tool';

describe('RectangleTool', () => {
  let tool: RectangleTool;
  let mockDataService: any;
  let mockWhiteboardConfig: any;

  beforeEach(() => {
    mockWhiteboardConfig = {
      snapToGrid: false,
      gridSize: 10,
      strokeColor: '#000000',
      strokeWidth: 1,
      lineJoin: 'miter',
      fill: 'none',
      dasharray: '',
      dashoffset: 0,
    };

    mockDataService = {
      getCanvasCoordinates: jest.fn(),
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(mockWhiteboardConfig),
    };
    tool = new RectangleTool(mockDataService);
  });

  it('should initialize with correct type', () => {
    expect(tool.type).toBe(ToolType.Rectangle);
  });

  describe('handlePointerDown', () => {
    it('should not proceed if tool is not active', () => {
      tool.deactivate();
      const event = new MouseEvent('pointerdown', { offsetX: 10, offsetY: 20 } as MouseEventInit) as PointerEvent;
      tool.handlePointerDown(event);
      expect(mockDataService.getCanvasCoordinates).not.toHaveBeenCalled();
    });

    it('should create a new rectangle element and add to draft', () => {
      tool.activate();
      const event = new MouseEvent('pointerdown', { offsetX: 10, offsetY: 20 } as MouseEventInit) as PointerEvent;
      mockDataService.getCanvasCoordinates.mockReturnValue([10, 20]);
      tool.handlePointerDown(event);
      expect(tool.startPoint).toEqual([10, 20]);
      expect(mockDataService.addToDraft).toHaveBeenCalledWith(tool.element);
    });

    it('should snap coordinates to grid if allowed', () => {
      tool.activate();
      mockWhiteboardConfig.snapToGrid = true;
      const event = new MouseEvent('pointerdown', { offsetX: 15, offsetY: 25 } as MouseEventInit) as PointerEvent;
      mockDataService.getCanvasCoordinates.mockReturnValue([15, 25]);
      tool.handlePointerDown(event);
      expect(tool.startPoint).toEqual([20, 30]); // snapped to grid
    });
  });

  describe('handlePointerMove', () => {
    it('should not proceed if tool is not active', () => {
      tool.deactivate();
      const event = new MouseEvent('pointermove', { offsetX: 10, offsetY: 20 } as MouseEventInit) as PointerEvent;
      tool.handlePointerMove(event);
      expect(mockDataService.getCanvasCoordinates).not.toHaveBeenCalled();
    });

    it('should update element dimensions and position', () => {
      tool.activate();
      tool.startPoint = [10, 10];
      tool.element = createElement(ElementType.Rectangle, { x: 10, y: 10, style: {} });
      const event = new MouseEvent('pointermove', { offsetX: 20, offsetY: 30 } as MouseEventInit) as PointerEvent;
      mockDataService.getCanvasCoordinates.mockReturnValue([20, 30]);
      tool.handlePointerMove(event);
      expect(tool.element.width).toBe(10);
      expect(tool.element.height).toBe(20);
      expect(tool.element.x).toBe(10);
      expect(tool.element.y).toBe(10);
    });

    it('should snap dimensions and position to grid if allowed', () => {
      tool.activate();
      mockWhiteboardConfig.snapToGrid = true;
      tool.startPoint = [10, 10];
      tool.element = createElement(ElementType.Rectangle, { x: 10, y: 10, style: {} });
      const event = new MouseEvent('pointermove', { offsetX: 25, offsetY: 35 } as MouseEventInit) as PointerEvent;
      mockDataService.getCanvasCoordinates.mockReturnValue([25, 35]);
      tool.handlePointerMove(event);
      expect(tool.element.width).toBe(20); // snapped to grid
      expect(tool.element.height).toBe(30); // snapped to grid
      expect(tool.element.x).toBe(10);
      expect(tool.element.y).toBe(10);
    });
  });

  describe('handlePointerUp', () => {
    it('should not proceed if tool is not active', () => {
      tool.deactivate();
      tool.handlePointerUp();
      expect(mockDataService.commitDraftToData).not.toHaveBeenCalled();
    });

    it('should commit draft to data and reset startPoint and element', () => {
      tool.activate();
      tool.startPoint = [10, 10];
      tool.element = createElement(ElementType.Rectangle, { x: 10, y: 10, style: {} });
      tool.handlePointerUp();
      expect(mockDataService.commitDraftToData).toHaveBeenCalled();
      expect(tool.startPoint).toBeNull();
      expect(tool.element).toBeNull();
    });
  });

  describe('getElementStyle', () => {
    it('should return correct element style', () => {
      const style = tool['getElementStyle']();
      expect(style).toEqual({
        strokeColor: '#000000',
        strokeWidth: 1,
        lineJoin: 'miter',
        fill: 'none',
        dasharray: '',
        dashoffset: 0,
      });
    });
  });
});
