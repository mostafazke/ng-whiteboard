import { LineTool } from '../line-tool';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { snapToAngle } from '../../utils/geometry';
import { DataService } from '../../data/data.service';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
  snapToAngle: jest.fn(),
}));

describe('LineTool', () => {
  let lineTool: LineTool;
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

    lineTool = new LineTool(dataService);
    lineTool.activate();
  });

  it('should initialize with correct type', () => {
    expect(lineTool.type).toBe(ToolType.Line);
  });

  it('should handle pointer down and create a line element', () => {
    const event = {
      clientX: 100,
      clientY: 150,
    } as PointerEvent;

    jest.spyOn(lineTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 150 });
    (createElement as jest.Mock).mockReturnValue({
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    lineTool.handlePointerDown(event);

    expect(lineTool.startPoint).toEqual({ x: 100, y: 150 });
    expect(lineTool.element).toEqual({
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });
    expect(dataService.addToDraft).toHaveBeenCalledWith(lineTool.element);
  });

  it('should handle pointer move and update line element coordinates', () => {
    const downEvent = {
      clientX: 100,
      clientY: 150,
    } as PointerEvent;
    const moveEvent = {
      clientX: 200,
      clientY: 250,
      shiftKey: false,
    } as PointerEvent;

    jest
      .spyOn(lineTool, 'getPointerPosition')
      .mockReturnValueOnce({ x: 100, y: 150 }) // For handlePointerDown
      .mockReturnValueOnce({ x: 200, y: 250 }); // For handlePointerMove

    (createElement as jest.Mock).mockReturnValue({
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerMove(moveEvent);

    expect(lineTool.element?.x2).toBe(200);
    expect(lineTool.element?.y2).toBe(250);
  });

  it('should snap to grid when pointer moves if snapToGrid is enabled', () => {
    config.snapToGrid = true;
    config.gridSize = 20;

    const downEvent = {
      clientX: 100,
      clientY: 150,
    } as PointerEvent;
    const moveEvent = {
      clientX: 210,
      clientY: 260,
      shiftKey: false,
    } as PointerEvent;

    jest
      .spyOn(lineTool, 'getPointerPosition')
      .mockReturnValueOnce({ x: 100, y: 150 })
      .mockReturnValueOnce({ x: 210, y: 260 });

    (createElement as jest.Mock).mockReturnValue({
      x1: 100,
      y1: 160,
      x2: 100,
      y2: 160,
      style: {},
    });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerMove(moveEvent);

    // With gridSize 20, 210 should snap to 220
    expect(lineTool.element?.x2).toBe(220);
    // With gridSize 20, 260 should snap to 260
    expect(lineTool.element?.y2).toBe(260);
  });

  it('should snap to angle when shift key is pressed during pointer move', () => {
    const downEvent = {
      clientX: 100,
      clientY: 150,
    } as PointerEvent;
    const moveEvent = {
      clientX: 200,
      clientY: 250,
      shiftKey: true,
    } as PointerEvent;

    jest
      .spyOn(lineTool, 'getPointerPosition')
      .mockReturnValueOnce({ x: 100, y: 150 }) // For handlePointerDown
      .mockReturnValueOnce({ x: 200, y: 250 }); // For handlePointerMove

    (snapToAngle as jest.Mock).mockReturnValue({ x: 200, y: 200 });
    (createElement as jest.Mock).mockReturnValue({
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerMove(moveEvent);

    expect(lineTool.element?.x2).toBe(200); // Snapped to angle
    expect(lineTool.element?.y2).toBe(200); // Snapped to angle
  });

  it('should handle pointer up and commit the draft', () => {
    const downEvent = {
      clientX: 100,
      clientY: 150,
    } as PointerEvent;

    jest.spyOn(lineTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 150 });
    (createElement as jest.Mock).mockReturnValue({
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerUp();

    expect(dataService.commitDraftToData).toHaveBeenCalled();
    expect(lineTool.startPoint).toBeNull();
    expect(lineTool.element).toBeNull();
  });
});
