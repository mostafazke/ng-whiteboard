import { DataService } from '../../data/data.service';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { snapToAngle } from '../../utils/geometry';
import { snapToGrid } from '../../utils/geometry';
import { ArrowTool } from '../arrow-tool';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
  snapToAngle: jest.fn(),
}));

describe('ArrowTool', () => {
  let arrowTool: ArrowTool;
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
      snapToGrid: false,
      gridSize: 10,
    } as WhiteboardConfig;

    dataService = {
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(config),
    } as unknown as DataService;

    arrowTool = new ArrowTool(dataService);
    arrowTool.activate();
  });

  it('should initialize with the correct type', () => {
    expect(arrowTool.type).toBe(ToolType.Arrow);
  });

  it('should handle pointer down and create an element', () => {
    const mockEvent = {
      clientX: 100,
      clientY: 200,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ x1: 100, y1: 200, x2: 100, y2: 200 });

    arrowTool.handlePointerDown(mockEvent);

    expect(arrowTool.startPoint).toEqual({ x: 100, y: 200 });
    expect(arrowTool.element).toBeDefined();
    expect(dataService.addToDraft).toHaveBeenCalledWith(arrowTool.element);
  });

  it('should handle pointer move and update the element', () => {
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      shiftKey: false,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
    arrowTool.element = { x1: 100, y1: 200, x2: 100, y2: 200 } as any;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element?.x2).toBe(150);
    expect(arrowTool.element?.y2).toBe(250);
  });

  it('should handle pointer up and commit the draft', () => {
    arrowTool.element = { x1: 100, y1: 200, x2: 150, y2: 250 } as any;
    arrowTool.startPoint = { x: 100, y: 200 };

    arrowTool.handlePointerUp();

    expect(dataService.commitDraftToData).toHaveBeenCalled();
    expect(arrowTool.element).toBeNull();
    expect(arrowTool.startPoint).toBeNull();
  });

  it('should not update element if movement is below MIN_LENGTH', () => {
    const mockEvent = {
      clientX: 101,
      clientY: 201,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 101, y: 201 });
    arrowTool.element = { x1: 100, y1: 200, x2: 100, y2: 200 } as any;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element?.x2).toBe(101);
    expect(arrowTool.element?.y2).toBe(201);
  });

  it('should not update element if tool is inactive', () => {
    arrowTool.deactivate();

    const mockEvent = {
      clientX: 150,
      clientY: 250,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
    arrowTool.element = { x1: 100, y1: 200, x2: 100, y2: 200 } as any;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element?.x2).toBe(100);
    expect(arrowTool.element?.y2).toBe(200);
  });

  it('should not update element if no element is active', () => {
    const mockEvent = {
      clientX: 150,
      clientY: 250,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
    arrowTool.element = null;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element).toBeNull();
  });

  it('should update element coordinates when movement is significant', () => {
    const mockEvent = {
      clientX: 160,
      clientY: 260,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 160, y: 260 });
    arrowTool.element = { x1: 100, y1: 200, x2: 100, y2: 200 } as any;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element?.x2).toBe(160);
    expect(arrowTool.element?.y2).toBe(260);
  });

  it('should not update element coordinates when movement is below MIN_LENGTH', () => {
    const mockEvent = {
      clientX: 101,
      clientY: 201,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 101, y: 201 });
    arrowTool.element = { x1: 100, y1: 200, x2: 100, y2: 200 } as any;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element?.x2).toBe(101);
    expect(arrowTool.element?.y2).toBe(201);
  });

  it('should snap to grid when enabled', () => {
    config.snapToGrid = true;
    config.gridSize = 10;

    const mockEvent = {
      clientX: 105,
      clientY: 205,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 105, y: 205 });
    (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);

    arrowTool.element = { x1: 100, y1: 200, x2: 100, y2: 200 } as any;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element?.x2).toBe(110);
    expect(arrowTool.element?.y2).toBe(210);
  });

  it('should snap to angle when shift key is pressed', () => {
    const mockEvent = {
      clientX: 150,
      clientY: 250,
      shiftKey: true,
    } as PointerEvent;

    jest.spyOn(arrowTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
    (snapToAngle as jest.Mock).mockReturnValue({ x: 160, y: 240 });

    arrowTool.element = { x1: 100, y1: 200, x2: 100, y2: 200 } as any;

    arrowTool.handlePointerMove(mockEvent);

    expect(arrowTool.element?.x2).toBe(160);
    expect(arrowTool.element?.y2).toBe(240);
  });
});
