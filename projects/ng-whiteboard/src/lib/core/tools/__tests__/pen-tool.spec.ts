import { DataService } from '../../data/data.service';
import { ElementType, LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { PenTool } from '../pen-tool';
import { createElement } from '../../elements/element.utils';
import { calculatePath } from '../../utils';

jest.mock('../../elements/element.utils');
jest.mock('../../utils', () => ({
  calculatePath: jest.fn().mockReturnValue(''),
}));

describe('PenTool', () => {
  let penTool: PenTool;
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

    penTool = new PenTool(dataService);
    penTool.activate();
  });

  it('should create a PenTool instance', () => {
    expect(penTool).toBeTruthy();
    expect(penTool.type).toBe(ToolType.Pen);
  });

  it('should handle pointer down and create a PenElement', () => {
    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    jest.spyOn(penTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ points: [], path: '', style: {} });

    penTool.handlePointerDown(mockEvent);

    expect(penTool.getPointerPosition).toHaveBeenCalledWith(mockEvent);
    expect(createElement).toHaveBeenCalledWith(ElementType.Pen, {
      path: '',
      points: [[100, 200]],
      style: {
        strokeColor: '#000000',
        strokeWidth: 2,
        lineCap: LineCap.Butt,
        lineJoin: LineJoin.Miter,
        dasharray: '',
        dashoffset: 0,
      },
    });
    expect(dataService.addToDraft).toHaveBeenCalled();
  });

  it('should handle pointer move and update the PenElement', () => {
    const mockEvent = { clientX: 150, clientY: 250 } as PointerEvent;
    jest.spyOn(penTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
    penTool.element = { points: [[100, 200]], path: '', style: {} } as any;
    (calculatePath as jest.Mock).mockReturnValue('M100,200 L150,250');

    penTool.handlePointerMove(mockEvent);

    expect(penTool.getPointerPosition).toHaveBeenCalledWith(mockEvent);
    expect(penTool.element?.points).toEqual([
      [100, 200],
      [150, 250],
    ]);
    expect(penTool.element?.path).toBe('M100,200 L150,250');
  });

  it('should handle pointer up and commit the draft', () => {
    penTool.element = { points: [[100, 200]], path: '', style: {} } as any;

    penTool.handlePointerUp();

    expect(dataService.commitDraftToData).toHaveBeenCalled();
    expect(penTool.element).toBeNull();
  });

  it('should not handle pointer events if not active', () => {
    penTool.deactivate();

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    jest.spyOn(penTool, 'getPointerPosition');

    penTool.handlePointerDown(mockEvent);
    penTool.handlePointerMove(mockEvent);
    penTool.handlePointerUp();

    expect(penTool.getPointerPosition).not.toHaveBeenCalled();
    expect(dataService.addToDraft).not.toHaveBeenCalled();
    expect(dataService.commitDraftToData).not.toHaveBeenCalled();
  });
});
