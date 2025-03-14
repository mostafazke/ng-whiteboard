import { DataService } from '../../data/data.service';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, WhiteboardConfig } from '../../types';
import { PenTool } from '../pen-tool';

jest.mock('../../elements/element.utils');

describe('PenTool', () => {
  let penTool: PenTool;
  let dataService: DataService;
  let mockConfig: WhiteboardConfig;

  beforeEach(() => {
    mockConfig = {
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
      getCanvasCoordinates: jest.fn().mockImplementation((coords) => coords),
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(mockConfig),
    } as unknown as DataService;

    penTool = new PenTool(dataService);
    penTool.activate();
  });

  it('should handle pointer down event and create new pen element', () => {
    (createElement as jest.Mock).mockReturnValue({
      points: [100, 200],
    });

    const event = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    }) as PointerEvent;
    Object.defineProperty(event, 'offsetX', { value: 100 });
    Object.defineProperty(event, 'offsetY', { value: 200 });
    penTool.handlePointerDown(event);

    expect(dataService.getCanvasCoordinates).toHaveBeenCalledWith([100, 200]);
    expect(dataService.addToDraft).toHaveBeenCalled();
    expect(penTool.element).toBeTruthy();
    expect(penTool.element?.points.length).toBe(2);
  });

  it('should not handle pointer down when inactive', () => {
    penTool.deactivate();
    const event = new MouseEvent('pointerdown', { offsetX: 100, offsetY: 200 } as MouseEventInit) as PointerEvent;
    penTool.handlePointerDown(event);

    expect(dataService.addToDraft).not.toHaveBeenCalled();
    expect(penTool.element).toBeNull();
  });

  it('should handle pointer move and update element points', () => {
    (createElement as jest.Mock).mockReturnValue({
      points: [],
    });
    const downEvent = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    }) as PointerEvent;
    Object.defineProperty(downEvent, 'offsetX', { value: 100 });
    Object.defineProperty(downEvent, 'offsetY', { value: 200 });
    penTool.handlePointerDown(downEvent);

    const moveEvent = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200,
    }) as PointerEvent;
    Object.defineProperty(moveEvent, 'offsetX', { value: 150 });
    Object.defineProperty(moveEvent, 'offsetY', { value: 250 });
    penTool.handlePointerMove(moveEvent);

    expect(penTool.element?.points.length).toBe(1);
    expect(dataService.getCanvasCoordinates).toHaveBeenCalledWith([150, 250]);
  });

  it('should not handle pointer move when no element exists', () => {
    const moveEvent = new MouseEvent('pointermove', { offsetX: 150, offsetY: 250 } as MouseEventInit) as PointerEvent;
    penTool.handlePointerMove(moveEvent);

    expect(dataService.getCanvasCoordinates).not.toHaveBeenCalled();
  });

  it('should handle pointer up and commit draft', () => {
    const downEvent = new MouseEvent('pointerdown', { offsetX: 100, offsetY: 200 } as MouseEventInit) as PointerEvent;
    penTool.handlePointerDown(downEvent);
    penTool.handlePointerUp();

    expect(dataService.commitDraftToData).toHaveBeenCalled();
    expect(penTool.element).toBeNull();
  });

  it('should not commit draft on pointer up when no element exists', () => {
    penTool.handlePointerUp();
    expect(dataService.commitDraftToData).not.toHaveBeenCalled();
  });
});
