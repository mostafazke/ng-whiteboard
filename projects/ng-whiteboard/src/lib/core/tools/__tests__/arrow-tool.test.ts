import { createElement } from '../../elements/element.utils';
import { ElementType } from '../../types';
import { snapToGrid, snapToAngle } from '../../utils';
import { ArrowTool } from '../arrow-tool';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/utils');

describe('ArrowTool', () => {
  let arrowTool: ArrowTool;
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

    arrowTool = new ArrowTool(mockDataService);
    arrowTool.activate();
  });

  it('should handle pointer down event', () => {
    const event = { offsetX: 100, offsetY: 100 } as PointerEvent;
    mockDataService.getCanvasCoordinates.mockReturnValue([100, 100]);
    (createElement as jest.Mock).mockReturnValue({});

    arrowTool.handlePointerDown(event);

    expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([100, 100]);
    expect(createElement).toHaveBeenCalledWith(ElementType.Arrow, {
      x1: 100,
      y1: 100,
      x2: 100,
      y2: 100,
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
    const event = { offsetX: 150, offsetY: 150, shiftKey: false } as PointerEvent;
    mockDataService.getCanvasCoordinates.mockReturnValue([150, 150]);
    arrowTool.element = { x1: 100, y1: 100, x2: 100, y2: 100 } as any;

    arrowTool.handlePointerMove(event);

    expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([150, 150]);
    expect(arrowTool.element?.x2).toBe(150);
    expect(arrowTool.element?.y2).toBe(150);
  });

  it('should handle pointer up event', () => {
    arrowTool.element = { x1: 100, y1: 100, x2: 150, y2: 150 } as any;
    arrowTool.startPoint = [100, 100];

    arrowTool.handlePointerUp();

    expect(mockDataService.commitDraftToData).toHaveBeenCalled();
    expect(arrowTool.startPoint).toBeNull();
    expect(arrowTool.element).toBeNull();
  });

  it('should snap to grid if allowed', () => {
    mockWhiteboardConfig.snapToGrid = true;
    const event = { offsetX: 105, offsetY: 105 } as PointerEvent;
    mockDataService.getCanvasCoordinates.mockReturnValue([105, 105]);
    (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);

    arrowTool.handlePointerDown(event);

    expect(snapToGrid).toHaveBeenCalledWith(105, 10);
    expect(snapToGrid).toHaveBeenCalledWith(105, 10);
  });

  it('should snap to angle if shift key is pressed', () => {
    const event = { offsetX: 150, offsetY: 150, shiftKey: true } as PointerEvent;
    mockDataService.getCanvasCoordinates.mockReturnValue([150, 150]);
    arrowTool.element = { x1: 100, y1: 100, x2: 100, y2: 100 } as any;
    (snapToAngle as jest.Mock).mockReturnValue({ x: 140, y: 140 });

    arrowTool.handlePointerMove(event);

    expect(snapToAngle).toHaveBeenCalledWith(100, 100, 150, 150);
    expect(arrowTool.element?.x2).toBe(140);
    expect(arrowTool.element?.y2).toBe(140);
  });
});
