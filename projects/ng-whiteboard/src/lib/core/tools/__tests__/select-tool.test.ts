import { DataService } from '../../data/data.service';
import { getElementUtil } from '../../elements/element.utils';
import { Direction, ElementType, LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { getMouseTarget } from '../../utils';
import { SelectTool } from '../select-tool';

jest.mock('../../elements/element.utils');

jest.mock('../../utils', () => ({
  getMouseTarget: jest.fn(),
}));

describe('SelectTool', () => {
  let selectTool: SelectTool;
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
      selectElement: jest.fn(),
      getData: jest.fn().mockReturnValue([]),
      getSelectedElement: jest.fn(),
      showGrips: jest.fn(),
      getElementBbox: jest.fn(),
      updateSelectedElement: jest.fn(),
    } as unknown as DataService;

    selectTool = new SelectTool(dataService);
    selectTool.activate();
  });

  it('should initialize with correct type', () => {
    expect(selectTool.type).toBe(ToolType.Select);
  });

  it('should handle pointer down and select an element', () => {
    const mockElement = { id: 'item_1', getAttribute: jest.fn().mockReturnValue('1') };
    (getMouseTarget as jest.Mock).mockReturnValue(mockElement);
    dataService.getData = jest.fn().mockReturnValue([{ id: '1' }]);

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    selectTool.handlePointerDown(mockEvent);

    expect(selectTool.currentAction).toBe('select');
    expect(dataService.selectElement).toHaveBeenCalledWith({ id: '1' });
  });

  it('should handle pointer down and start resizing', () => {
    const mockElement = { id: 'selectorGrip_resize_n', getAttribute: jest.fn() };
    (getMouseTarget as jest.Mock).mockReturnValue(mockElement);

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    selectTool.handlePointerDown(mockEvent);

    expect(selectTool.currentAction).toBe('resize');
    expect(selectTool.direction).toBe(Direction.N);
  });

  it('should handle pointer down and start moving', () => {
    const mockElement = { id: 'selectorBox', getAttribute: jest.fn() };
    (getMouseTarget as jest.Mock).mockReturnValue(mockElement);

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    selectTool.handlePointerDown(mockEvent);

    expect(selectTool.currentAction).toBe('move');
  });

  it('should handle pointer down and deselect if no target', () => {
    (getMouseTarget as jest.Mock).mockReturnValue(null);

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    selectTool.handlePointerDown(mockEvent);

    expect(selectTool.currentAction).toBeNull();
    expect(dataService.selectElement).toHaveBeenCalledWith(null);
  });

  it('should handle pointer move and resize element', () => {
    selectTool.currentAction = 'resize';
    selectTool.isDragging = true;
    dataService.getSelectedElement = jest.fn().mockReturnValue({ type: ElementType.Rectangle });
    const mockResize = jest.fn();
    (getElementUtil as jest.Mock).mockReturnValue({
      resize: mockResize,
    });

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    selectTool.handlePointerMove(mockEvent);

    expect(mockResize).toHaveBeenCalled();
  });

  it('should handle pointer move and move element', () => {
    selectTool.currentAction = 'move';
    selectTool.isDragging = true;
    dataService.getSelectedElement = jest.fn().mockReturnValue({ x: 100, y: 200 });

    const mockEvent = { clientX: 100, clientY: 200 } as PointerEvent;
    selectTool.handlePointerMove(mockEvent);

    expect(dataService.updateSelectedElement).toHaveBeenCalled();
  });

  it('should handle pointer up and reset state', () => {
    selectTool.isDragging = true;
    selectTool.currentAction = 'move';

    selectTool.handlePointerUp();

    expect(selectTool.isDragging).toBe(false);
    expect(selectTool.currentAction).toBeNull();
  });
});
