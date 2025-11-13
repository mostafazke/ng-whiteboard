import { LineTool } from '../line-tool';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { snapToAngle } from '../../utils/geometry';
import { ApiService } from '../../api/api.service';
import { createMockPointerInfo, createMockApiService, createMockWhiteboardConfig } from '../../testing';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
  snapToAngle: jest.fn(),
  getCanvasCoordinates: jest.fn((config, point) => point),
}));

describe('LineTool', () => {
  let lineTool: LineTool;
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
    });

    apiService = createMockApiService();
    apiService.addDraftElements = jest.fn();
    apiService.updateDraftElements = jest.fn((updates) => {
      // Mock implementation that updates the element properties
      if (lineTool.element && updates && updates.length > 0) {
        Object.assign(lineTool.element, updates[0]);
      }
    });
    apiService.commitDraftElements = jest.fn();
    apiService.getConfig = jest.fn().mockReturnValue(config);
    apiService.getCurrentLayer = jest.fn().mockReturnValue('layer1');
    apiService.getActiveLayerId = jest.fn().mockReturnValue('layer1');
    apiService.getNextZIndex = jest.fn().mockReturnValue(1);
    apiService.selectElements = jest.fn();

    lineTool = new LineTool(apiService as unknown as ApiService);
    lineTool.activate();
  });

  it('should initialize with correct type', () => {
    expect(lineTool.type).toBe(ToolType.Line);
  });

  it('should handle pointer down and create a line element', () => {
    const event = createMockPointerInfo({
      x: 100,
      y: 150,
      eventType: 'pointerdown',
    });

    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    lineTool.handlePointerDown(event);

    expect(lineTool.startPoint).toEqual({ x: 100, y: 150 });
    expect(apiService.addDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({
        x1: 100,
        y1: 150,
        x2: 100,
        y2: 150,
      }),
    ]);
  });

  it('should handle pointer move and update line element coordinates', () => {
    const downEvent = createMockPointerInfo({
      x: 100,
      y: 150,
      eventType: 'pointerdown',
    });
    const moveEvent = createMockPointerInfo({
      x: 200,
      y: 250,
      shiftKey: false,
      eventType: 'pointermove',
    });

    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({
        id: '1',
        x2: 200,
        y2: 250,
      }),
    ]);
  });

  it('should snap to grid when pointer moves if snapToGrid is enabled', () => {
    config.snapToGrid = true;
    config.gridSize = 20;

    const downEvent = createMockPointerInfo({
      x: 100,
      y: 150,
      eventType: 'pointerdown',
    });
    const moveEvent = createMockPointerInfo({
      x: 210,
      y: 260,
      shiftKey: false,
      eventType: 'pointermove',
    });

    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      x1: 100,
      y1: 160,
      x2: 100,
      y2: 160,
      style: {},
    });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerMove(moveEvent);

    // With gridSize 20, 210 should snap to 220
    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({
        x2: 220,
        y2: 260,
      }),
    ]);
  });

  it('should snap to angle when shift key is pressed during pointer move', () => {
    const downEvent = createMockPointerInfo({
      x: 100,
      y: 150,
      eventType: 'pointerdown',
    });
    const moveEvent = createMockPointerInfo({
      x: 200,
      y: 250,
      shiftKey: true,
      eventType: 'pointermove',
    });

    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    (snapToAngle as jest.Mock).mockReturnValue({ x: 200, y: 200, a: Math.PI / 4 });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerMove(moveEvent);

    expect(snapToAngle).toHaveBeenCalledWith(100, 150, 200, 250);
    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({
        x2: 200,
        y2: 200,
      }),
    ]);
  });

  it('should handle pointer up and commit the draft', () => {
    const downEvent = createMockPointerInfo({
      x: 100,
      y: 150,
      eventType: 'pointerdown',
    });

    (createElement as jest.Mock).mockReturnValue({
      id: '1',
      x1: 100,
      y1: 150,
      x2: 100,
      y2: 150,
      style: {},
    });

    lineTool.handlePointerDown(downEvent);
    lineTool.handlePointerUp();

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(lineTool.startPoint).toBeNull();
    expect(lineTool.element).toBeNull();
  });

  it('should snap to angle when shift key is pressed during pointer move', () => {
    const downEvent = createMockPointerInfo({
      clientX: 100,
      clientY: 150,
      eventType: 'pointerdown',
    });
    const moveEvent = createMockPointerInfo({
      clientX: 200,
      clientY: 250,
      shiftKey: true,
      eventType: 'pointermove',
    });

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
    const downEvent = createMockPointerInfo({
      clientX: 100,
      clientY: 150,
      eventType: 'pointerdown',
    });

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

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(lineTool.startPoint).toBeNull();
    expect(lineTool.element).toBeNull();
  });
});
