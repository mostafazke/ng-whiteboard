import { getElementUtil } from '../../elements/element.utils';
import { ElementType, ToolType, WhiteboardElement } from '../../types';
import { EraserTool } from '../eraser-tool';
import { createMockPointerInfo, createMockApiService } from '../../testing';
import { ApiService } from '../../api/api.service';

describe('EraserTool', () => {
  let eraserTool: EraserTool;
  let mockApiService: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    mockApiService = createMockApiService();
    mockApiService.getElements = jest.fn().mockReturnValue([]) as unknown as typeof mockApiService.getElements;
    mockApiService.getConfig = jest.fn() as unknown as typeof mockApiService.getConfig;
    mockApiService.removeElements = jest.fn();
    mockApiService.updateElements = jest.fn();

    eraserTool = new EraserTool(mockApiService as unknown as ApiService);
  });

  it('should initialize with the correct type', () => {
    expect(eraserTool.type).toBe(ToolType.Eraser);
  });

  describe('handlePointerDown', () => {
    it('should start erasing and set the last position', () => {
      const mockElement = { id: '1', type: ElementType.Rectangle, opacity: 100 } as WhiteboardElement;
      (mockApiService.getElements as jest.Mock).mockReturnValue([mockElement]);
      const mockEvent = createMockPointerInfo({ clientX: 100, clientY: 200, eventType: 'pointerdown' });
      jest.spyOn(eraserTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

      eraserTool.activate();
      eraserTool.handlePointerDown(mockEvent);

      expect(eraserTool['isErasing']).toBe(true);
      expect(eraserTool['lastPosition']).toEqual({ x: 100, y: 200 });
    });

    it('should not start erasing if the tool is not active', () => {
      const mockEvent = createMockPointerInfo({ clientX: 100, clientY: 200, eventType: 'pointerdown' });

      eraserTool.deactivate();
      eraserTool.handlePointerDown(mockEvent);

      expect(eraserTool['isErasing']).toBe(false);
      expect(eraserTool['lastPosition']).toBeNull();
    });
  });

  describe('handlePointerMove', () => {
    it('should erase elements when moving the pointer', () => {
      const mockElement = { id: '1', type: ElementType.Rectangle, opacity: 100 } as WhiteboardElement;
      (mockApiService.getElements as jest.Mock).mockReturnValue([mockElement]);

      const mockEvent = createMockPointerInfo({ clientX: 150, clientY: 250, altKey: false, eventType: 'pointermove' });
      jest.spyOn(eraserTool, 'getPointerPosition').mockReturnValue({ x: 150, y: 250 });
      // @ts-expect-error - spying on private method
      jest.spyOn(eraserTool, 'eraseElementsAt');

      eraserTool.activate();
      eraserTool['isErasing'] = true;
      eraserTool['lastPosition'] = { x: 100, y: 200 };

      eraserTool.handlePointerMove(mockEvent);

      expect(eraserTool['eraseElementsAt']).toHaveBeenCalledWith({ x: 100, y: 200 }, { x: 150, y: 250 }, false);
      expect(eraserTool['lastPosition']).toEqual({ x: 150, y: 250 });
    });

    it('should not erase elements if the tool is not active or erasing', () => {
      const mockEvent = createMockPointerInfo({ clientX: 150, clientY: 250, eventType: 'pointermove' });

      eraserTool.deactivate();
      eraserTool.handlePointerMove(mockEvent);

      expect(eraserTool['lastPosition']).toBeNull();
    });
  });

  describe('handlePointerUp', () => {
    it('should remove hovered elements and reset state', () => {
      const mockElement = { id: '1', type: ElementType.Rectangle } as WhiteboardElement;
      eraserTool['hoveredElementIds'].add(mockElement.id);
      (mockApiService.getElements as jest.Mock).mockReturnValue([mockElement]);

      eraserTool.activate();
      eraserTool.handlePointerUp();

      expect(mockApiService.removeElements).toHaveBeenCalledWith([mockElement]);
      expect(eraserTool['hoveredElementIds'].size).toBe(0);
      expect(eraserTool['isErasing']).toBe(false);
      expect(eraserTool['lastPosition']).toBeNull();
    });

    it('should do nothing if the tool is not active', () => {
      eraserTool.deactivate();
      eraserTool.handlePointerUp();

      expect(mockApiService.removeElements).not.toHaveBeenCalled();
    });
  });

  describe('eraseElementsAt', () => {
    it('should update elements based on erasing logic', () => {
      const mockElement = { id: '1', type: ElementType.Rectangle, opacity: 100 } as WhiteboardElement;
      const mockBounds = { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
      // @ts-expect-error - spying on private method
      jest.spyOn(eraserTool, 'isPointInElement').mockReturnValue(true);
      jest.spyOn(eraserTool, 'getPointerPosition');
      (mockApiService.getElements as jest.Mock).mockReturnValue([mockElement]);
      (mockApiService.getConfig as jest.Mock).mockReturnValue({ zoom: 1 });

      jest.spyOn(getElementUtil(mockElement.type), 'getBounds').mockReturnValue(mockBounds);

      eraserTool['eraseElementsAt']({ x: 10, y: 10 }, { x: 20, y: 20 });

      expect(eraserTool['hoveredElementIds'].has(mockElement.id)).toBe(true);
      expect(mockElement.isDeleting).toBe(true);
      expect(mockApiService.updateElements).toHaveBeenCalledWith([mockElement]);
    });
  });
});
