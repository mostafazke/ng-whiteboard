import { EraserTool } from '../eraser-tool';
import { ToolType, WhiteboardElement } from '../../types';
import { getTargetElement } from '../../utils';

jest.mock('../../utils');

describe('EraserTool', () => {
  let eraserTool: EraserTool;
  let mockDataService: any;

  beforeEach(() => {
    mockDataService = {
      removeElement: jest.fn(),
      updateElement: jest.fn(),
      getData: jest.fn(),
    };
    eraserTool = new EraserTool(mockDataService);
    eraserTool.activate();
  });

  it('should have type ToolType.Eraser', () => {
    expect(eraserTool.type).toBe(ToolType.Eraser);
  });

  describe('handlePointerDown', () => {
    it('should clear hoveredElements and process element if active', () => {
      const event = new MouseEvent('pointerdown') as PointerEvent;
      const element = { id: '1', opacity: 100 } as WhiteboardElement;

      (getTargetElement as jest.Mock).mockReturnValue(element);

      eraserTool.handlePointerDown(event);

      expect(eraserTool['hoveredElements'].size).toBe(1);
      expect(mockDataService.updateElement).toHaveBeenCalledWith(element, false);
    });

    it('should not process element if not active', () => {
      eraserTool.deactivate();
      const event = new MouseEvent('pointerdown') as PointerEvent;

      eraserTool.handlePointerDown(event);

      expect(eraserTool['hoveredElements'].size).toBe(0);
      expect(mockDataService.updateElement).not.toHaveBeenCalled();
    });
  });

  describe('handlePointerUp', () => {
    it('should remove elements from dataService if active', () => {
      const element = { id: '1', opacity: 100 } as WhiteboardElement;
      eraserTool['hoveredElements'].add(element);

      eraserTool.handlePointerUp();

      expect(mockDataService.removeElement).toHaveBeenCalledWith('1');
      expect(eraserTool['hoveredElements'].size).toBe(0);
    });

    it('should not remove elements if not active', () => {
      eraserTool.deactivate();

      eraserTool.handlePointerUp();

      expect(mockDataService.removeElement).not.toHaveBeenCalled();
    });
  });

  describe('processElement', () => {
    it('should add element to hoveredElements and update its opacity', () => {
      const event = new MouseEvent('pointermove') as PointerEvent;
      const element = { id: '1', opacity: 100 } as WhiteboardElement;

      (getTargetElement as jest.Mock).mockReturnValue(element);

      eraserTool['processElement'](event);

      expect(element.opacity).toBe(50);
      expect(eraserTool['hoveredElements'].has(element)).toBe(true);
      expect(mockDataService.updateElement).toHaveBeenCalledWith(element, false);
    });

    it('should not add element if it is already in hoveredElements', () => {
      const event = new MouseEvent('pointermove') as PointerEvent;
      const element = { id: '1', opacity: 100 } as WhiteboardElement;

      eraserTool['hoveredElements'].add(element);
      (getTargetElement as jest.Mock).mockReturnValue(element);

      eraserTool['processElement'](event);

      expect(mockDataService.updateElement).not.toHaveBeenCalled();
    });
  });
});
