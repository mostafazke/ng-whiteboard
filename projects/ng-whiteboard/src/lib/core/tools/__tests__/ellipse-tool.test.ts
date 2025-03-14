import { EllipseTool } from '../ellipse-tool';
import { ToolType, ElementType } from '../../types';
import { createElement } from '../../elements/element.utils';

describe('EllipseTool', () => {
  let ellipseTool: EllipseTool;
  let mockDataService: any;
  let mockWhiteboardConfig: any;

  beforeEach(() => {
    mockWhiteboardConfig = {
      snapToGrid: false,
      gridSize: 10,
      strokeColor: '#000000',
      strokeWidth: 1,
      lineCap: 'round',
      dasharray: '',
      dashoffset: 0,
    };

    mockDataService = {
      getCanvasCoordinates: jest.fn(),
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(mockWhiteboardConfig),
    };

    ellipseTool = new EllipseTool(mockDataService);
    ellipseTool.activate();
  });

  it('should set type to ToolType.Ellipse', () => {
    expect(ellipseTool.type).toBe(ToolType.Ellipse);
  });

  it('should handle pointer down event', () => {
    const event = { offsetX: 100, offsetY: 100 } as PointerEvent;
    (mockDataService.getCanvasCoordinates as jest.Mock).mockReturnValue([100, 100]);

    ellipseTool.handlePointerDown(event);

    expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([100, 100]);
    expect(ellipseTool.startPoint).toEqual([100, 100]);
    expect(ellipseTool.element).toBeTruthy();
    expect(mockDataService.addToDraft).toHaveBeenCalledWith(ellipseTool.element);
  });

  it('should handle pointer move event', () => {
    const event = { offsetX: 200, offsetY: 200, shiftKey: false, altKey: false } as PointerEvent;
    (mockDataService.getCanvasCoordinates as jest.Mock).mockReturnValue([200, 200]);

    ellipseTool.startPoint = [100, 100];
    ellipseTool.element = createElement(ElementType.Ellipse, { cx: 100, cy: 100, style: {} });

    ellipseTool.handlePointerMove(event);

    expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([200, 200]);
    expect(ellipseTool.element).toMatchObject({
      cx: 150,
      cy: 150,
      rx: 50,
      ry: 50,
    });
  });

  it('should handle pointer up event', () => {
    ellipseTool.startPoint = [100, 100];
    ellipseTool.element = createElement(ElementType.Ellipse, { cx: 100, cy: 100, style: {} });

    ellipseTool.handlePointerUp();

    expect(mockDataService.commitDraftToData).toHaveBeenCalled();
    expect(ellipseTool.startPoint).toBeNull();
    expect(ellipseTool.element).toBeNull();
  });

  it('should get element style', () => {
    const style = ellipseTool['getElementStyle']();
    expect(style).toEqual({
      strokeColor: '#000000',
      strokeWidth: 1,
      dasharray: '',
      dashoffset: 0,
    });
  });
});
