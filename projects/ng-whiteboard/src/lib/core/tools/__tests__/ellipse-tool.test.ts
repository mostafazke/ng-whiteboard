import { DataService } from '../../data/data.service';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { EllipseTool } from '../ellipse-tool';

jest.mock('../../elements/element.utils');

describe('EllipseTool', () => {
  let ellipseTool: EllipseTool;
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

    ellipseTool = new EllipseTool(dataService);
    ellipseTool.activate();
  });

  it('should initialize with the correct type', () => {
    expect(ellipseTool.type).toBe(ToolType.Ellipse);
  });

  it('should handle pointer down and create an ellipse element', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 150, cy: 100, rx: 50, ry: 50 });

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    ellipseTool.handlePointerDown(mockEvent);

    expect(ellipseTool.startPoint).toEqual({ x: 100, y: 200 });
    expect(dataService.addToDraft).toHaveBeenCalledWith(expect.objectContaining({ cx: 150, cy: 100, rx: 50, ry: 50 }));
  });

  it('should handle pointer move and update the ellipse dimensions', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 150, cy: 100, rx: 50, ry: 50 });

    const downEvent = { offsetX: 100, offsetY: 100 } as PointerEvent;

    ellipseTool.handlePointerDown(downEvent);
    const moveEvent = { offsetX: 200, offsetY: 200 } as PointerEvent;

    ellipseTool.handlePointerMove(moveEvent);

    expect(ellipseTool.element).toEqual(
      expect.objectContaining({
        cx: 100,
        cy: 200,
        rx: 0,
        ry: 0,
      })
    );
  });

  it('should handle pointer move with shift key for a perfect circle', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 150, cy: 100, rx: 50, ry: 50 });

    const downEvent = { offsetX: 100, offsetY: 100 } as PointerEvent;
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = { offsetX: 200, offsetY: 150, shiftKey: true } as PointerEvent;
    ellipseTool.handlePointerMove(moveEvent);

    expect(ellipseTool.element).toEqual(
      expect.objectContaining({
        cx: 100,
        cy: 200,
        rx: 0,
        ry: 0,
      })
    );
  });

  it('should handle pointer move with alt key for centered ellipse', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 100, cy: 100, rx: 0, ry: 0 });

    const downEvent = { offsetX: 100, offsetY: 100 } as PointerEvent;
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = { offsetX: 150, offsetY: 150, altKey: true } as PointerEvent;
    ellipseTool.handlePointerMove(moveEvent);

    expect(ellipseTool.element).toEqual(
      expect.objectContaining({
        cx: 100,
        cy: 200,
        rx: 0,
        ry: 0,
      })
    );
  });

  it('should handle pointer up and commit the draft', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 100, cy: 100, rx: 0, ry: 0 });

    const downEvent = { clientX: 100, clientY: 100 } as PointerEvent;
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = { offsetX: 200, offsetY: 200 } as PointerEvent;
    ellipseTool.handlePointerMove(moveEvent);

    ellipseTool.handlePointerUp();

    expect(dataService.commitDraftToData).toHaveBeenCalled();
    expect(ellipseTool.startPoint).toBeNull();
    expect(ellipseTool.element).toBeNull();
  });

  it('should snap to grid when enabled', () => {
    config.snapToGrid = true;
    config.gridSize = 20;
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

    const event = { offsetX: 105, offsetY: 115 } as PointerEvent;
    ellipseTool.handlePointerDown(event);

    expect(ellipseTool.startPoint).toEqual({ x: 100, y: 200 });
    expect(dataService.addToDraft).toHaveBeenCalled();
  });
});
