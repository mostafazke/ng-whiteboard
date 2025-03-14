import { ITEM_PREFIX } from '../../constants';
import { Direction } from '../../types';
import { getMouseTarget } from '../../utils';
import { SelectTool } from '../select-tool';

jest.mock('../../utils', () => ({
  getMouseTarget: jest.fn(),
}));

describe('SelectTool', () => {
  let selectTool: SelectTool;
  let mockDataService: any;

  beforeEach(() => {
    mockDataService = {
      selectElement: jest.fn(),
      getData: jest.fn(),
      getSelectedElement: jest.fn(),
      showGrips: jest.fn(),
      getElementBbox: jest.fn(),
      updateSelectedElement: jest.fn(),
    };
    selectTool = new SelectTool(mockDataService);
  });

  it('should set currentAction to select and call handleSelect when ITEM_PREFIX is found', () => {
    const mockEvent = new MouseEvent('pointerdown') as PointerEvent;
    const mockTarget = { id: `${ITEM_PREFIX}_123`, getAttribute: jest.fn().mockReturnValue('123') };
    (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);
    mockDataService.getData.mockReturnValue([{ id: '123' }]);
    selectTool.handlePointerDown(mockEvent);

    expect(selectTool.currentAction).toBe('select');
    expect(selectTool.isDragging).toBe(true);
    expect(mockTarget.getAttribute).toHaveBeenCalledWith('data-wb-id');
    expect(mockDataService.selectElement).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should set currentAction to resize and call handleResize when selectorGrip_resize is found', () => {
    const mockEvent = new MouseEvent('pointerdown') as PointerEvent;
    const mockTarget = { id: 'selectorGrip_resize_e' };
    (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);

    selectTool.handlePointerDown(mockEvent);

    expect(selectTool.currentAction).toBe('resize');
    expect(selectTool.direction).toBe(Direction.E);
    expect(selectTool.isDragging).toBe(true);
  });

  it('should set currentAction to move and call handleMove when selectorBox is found', () => {
    const mockEvent = new MouseEvent('pointerdown') as PointerEvent;
    const mockTarget = { id: 'selectorBox' };
    (getMouseTarget as jest.Mock).mockReturnValue(mockTarget);

    selectTool.handlePointerDown(mockEvent);

    expect(selectTool.currentAction).toBe('move');
    expect(selectTool.isDragging).toBe(true);
  });

  it('should call dataService.selectElement with null and set currentAction to null when no target is found', () => {
    const mockEvent = new MouseEvent('pointerdown') as PointerEvent;
    (getMouseTarget as jest.Mock).mockReturnValue(null);

    selectTool.handlePointerDown(mockEvent);

    expect(mockDataService.selectElement).toHaveBeenCalledWith(null);
    expect(selectTool.currentAction).toBe(null);
    expect(selectTool.isDragging).toBe(false);
  });
});
