import { ApiService } from '../../api/api.service';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, ToolType, WhiteboardConfig, ElementType } from '../../types';
import { EllipseTool } from '../ellipse-tool';
import { createMockPointerInfo, createMockApiService, createMockWhiteboardConfig } from '../../testing';

jest.mock('../../elements/element.utils');

describe('EllipseTool', () => {
  let ellipseTool: EllipseTool;
  let apiService: ReturnType<typeof createMockApiService>;
  let config: WhiteboardConfig;

  beforeEach(() => {
    config = createMockWhiteboardConfig({
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Round,
      lineJoin: LineJoin.Round,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
      fullScreen: true,
      zoom: 1,
      x: 0,
      y: 0,
      canvasX: 0,
      canvasY: 0,
    });

    apiService = createMockApiService();
    apiService.addDraftElements = jest.fn();
    apiService.commitDraftElements = jest.fn();
    apiService.updateDraftElements = jest.fn();
    apiService.getConfig = jest.fn().mockReturnValue(config);
    apiService.getCurrentLayer = jest.fn().mockReturnValue('layer1');
    apiService.getActiveLayerId = jest.fn().mockReturnValue('layer1');
    apiService.getNextZIndex = jest.fn().mockReturnValue(1);

    ellipseTool = new EllipseTool(apiService as unknown as ApiService);
    ellipseTool.activate();
  });

  it('should initialize with the correct type', () => {
    expect(ellipseTool.type).toBe(ToolType.Ellipse);
  });

  it('should handle pointer down and create an ellipse element', () => {
    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      cx: 100,
      cy: 200,
      rx: 0,
      ry: 0,
      type: ElementType.Ellipse,
    });

    const mockEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(mockEvent);

    expect(ellipseTool.startPoint).toEqual({ x: 100, y: 200 });
    expect(apiService.addDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({ cx: 100, cy: 200, rx: 0, ry: 0 }),
    ]);
  });

  it('should handle pointer move and update the ellipse dimensions', () => {
    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      cx: 100,
      cy: 100,
      rx: 0,
      ry: 0,
      type: ElementType.Ellipse,
    });

    const downEvent = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({ x: 200, y: 200, eventType: 'pointermove' });
    ellipseTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '1',
        cx: 150,
        cy: 150,
        rx: 50,
        ry: 50,
      }),
    ]);
  });

  it('should handle pointer move with shift key for a perfect circle', () => {
    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      cx: 100,
      cy: 100,
      rx: 0,
      ry: 0,
      type: ElementType.Ellipse,
    });

    const downEvent = createMockPointerInfo({ x: 100, y: 100, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({ x: 200, y: 250, shiftKey: true, eventType: 'pointermove' });
    ellipseTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '1',
        rx: 50,
        ry: 50, // Should be same as rx due to shiftKey
      }),
    ]);
  });

  it('should handle pointer move with alt key for centered ellipse', () => {
    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      cx: 100,
      cy: 200,
      rx: 0,
      ry: 0,
      type: ElementType.Ellipse,
    });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({ x: 100, y: 200, altKey: true, eventType: 'pointermove' });
    ellipseTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '1',
        cx: 100,
        cy: 200,
        rx: 0,
        ry: 0,
      }),
    ]);
  });

  it('should handle pointer move and update the ellipse dimensions', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 150, cy: 100, rx: 50, ry: 50 });

    const downEvent = createMockPointerInfo({ clientX: 100, clientY: 100, eventType: 'pointerdown' });

    ellipseTool.handlePointerDown(downEvent);
    const moveEvent = createMockPointerInfo({ clientX: 200, clientY: 200, eventType: 'pointermove' });

    ellipseTool.handlePointerMove(moveEvent);

    expect(ellipseTool.element).toEqual(
      expect.objectContaining({
        cx: 150,
        cy: 100,
        rx: 50,
        ry: 50,
      })
    );
  });

  it('should handle pointer move with shift key for a perfect circle', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 150, cy: 100, rx: 50, ry: 50 });

    const downEvent = createMockPointerInfo({ clientX: 100, clientY: 100, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({ clientX: 200, clientY: 150, shiftKey: true, eventType: 'pointermove' });
    ellipseTool.handlePointerMove(moveEvent);

    expect(ellipseTool.element).toEqual(
      expect.objectContaining({
        cx: 150,
        cy: 100,
        rx: 50,
        ry: 50,
      })
    );
  });

  it('should handle pointer move with alt key for centered ellipse', () => {
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    (createElement as jest.Mock).mockReturnValue({ cx: 100, cy: 100, rx: 0, ry: 0 });

    const downEvent = createMockPointerInfo({ clientX: 100, clientY: 200, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({ clientX: 200, clientY: 150, altKey: true, eventType: 'pointermove' });
    ellipseTool.handlePointerMove(moveEvent);

    expect(ellipseTool.element).toEqual(
      expect.objectContaining({
        cx: 100,
        cy: 100,
        rx: 0,
        ry: 0,
      })
    );
  });

  it('should handle pointer up and commit the draft', () => {
    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      cx: 100,
      cy: 200,
      rx: 0,
      ry: 0,
      type: ElementType.Ellipse,
    });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(downEvent);

    ellipseTool.handlePointerUp();

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(ellipseTool.startPoint).toBeNull();
    expect(ellipseTool.element).toBeNull();
  });

  it('should snap to grid when enabled', () => {
    config.snapToGrid = true;
    config.gridSize = 20;
    jest.spyOn(ellipseTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

    const event = createMockPointerInfo({ clientX: 105, clientY: 115, eventType: 'pointerdown' });
    ellipseTool.handlePointerDown(event);

    expect(ellipseTool.startPoint).toEqual({ x: 100, y: 200 });
  });
});
