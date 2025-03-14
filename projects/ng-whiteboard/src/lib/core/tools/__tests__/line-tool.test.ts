import { LineTool } from '../line-tool';
import { createElement } from '../../elements/element.utils';
import { ElementType, ToolType } from '../../types';
import { snapToAngle } from '../../utils/utils';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/utils');

describe('LineTool', () => {
  let lineTool: LineTool;
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

    lineTool = new LineTool(mockDataService);
    lineTool.activate();
  });

  it('should initialize with correct type', () => {
    expect(lineTool.type).toBe(ToolType.Line);
  });

  it('should handle pointer down event', () => {
    const event = { offsetX: 10, offsetY: 20 } as PointerEvent;
    mockDataService.getCanvasCoordinates.mockReturnValue([10, 20]);

    lineTool.handlePointerDown(event);

    expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([10, 20]);
    expect(lineTool.startPoint).toEqual([10, 20]);
    expect(createElement).toHaveBeenCalledWith(ElementType.Line, {
      x1: 10,
      y1: 20,
      x2: 10,
      y2: 20,
      style: {
        strokeColor: '#000000',
        strokeWidth: 1,
        lineCap: 'round',
        dasharray: '',
        dashoffset: 0,
      },
    });
    expect(mockDataService.addToDraft).toHaveBeenCalled();
  });

  it('should handle pointer move event', () => {
    const event = { offsetX: 30, offsetY: 40, shiftKey: false } as PointerEvent;
    mockDataService.getCanvasCoordinates.mockReturnValue([30, 40]);
    (createElement as jest.Mock).mockReturnValue({ type: ElementType.Line, x1: 10, y1: 20, x2: 30, y2: 40 });
    lineTool.handlePointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent);
    lineTool.handlePointerMove(event);

    expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([10, 20]);
    expect(lineTool.element?.x1).toBe(10);
    expect(lineTool.element?.y1).toBe(20);
  });

  it('should snap to angle when shift key is pressed', () => {
    const event = { offsetX: 30, offsetY: 40, shiftKey: true } as PointerEvent;
    mockDataService.getCanvasCoordinates.mockReturnValue([30, 40]);
    (snapToAngle as jest.Mock).mockReturnValue({ x: 30, y: 40 });

    lineTool.handlePointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent);
    lineTool.handlePointerMove(event);

    expect(snapToAngle).toHaveBeenCalledWith(10, 20, 30, 40);
    expect(lineTool.element?.x2).toBe(30);
    expect(lineTool.element?.y2).toBe(40);
  });

  it('should handle pointer up event', () => {
    mockDataService.getCanvasCoordinates.mockReturnValue([30, 40]);

    lineTool.handlePointerDown({ offsetX: 10, offsetY: 20 } as PointerEvent);
    lineTool.handlePointerUp();

    // expect(lineTool.startPoint).toBeNull();
    expect(lineTool.element).toBeNull();
  });
});
