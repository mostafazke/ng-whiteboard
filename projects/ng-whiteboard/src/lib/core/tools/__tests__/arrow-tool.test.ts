import { createMockPointerInfo, createMockApiService, createMockWhiteboardConfig } from '../../testing';
import { ApiService } from '../../api/api.service';
import { createElement } from '../../elements/element.utils';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { ArrowElement } from '../../elements';
import { snapToAngle } from '../../utils/geometry';
import { snapToGrid } from '../../utils/geometry';
import { ArrowTool } from '../arrow-tool';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/geometry', () => ({
  snapToGrid: jest.fn((value, gridSize) => Math.round(value / gridSize) * gridSize),
  snapToAngle: jest.fn(),
  getCanvasCoordinates: jest.fn((config, point) => point),
}));

describe('ArrowTool', () => {
  let arrowTool: ArrowTool;
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
      snapToGrid: false,
      gridSize: 10,
      fullScreen: true,
      zoom: 1,
      x: 0,
      y: 0,
      canvasX: 0,
      canvasY: 0,
    });

    apiService = createMockApiService();
    apiService.addDraftElements = jest.fn();
    apiService.updateDraftElements = jest.fn((updates) => {
      // Mock implementation that updates the element properties
      if (arrowTool.element && updates && updates.length > 0) {
        Object.assign(arrowTool.element, updates[0]);
      }
    });
    apiService.commitDraft = jest.fn();
    apiService.commitDraftElements = jest.fn();
    apiService.getConfig = jest.fn().mockReturnValue(config);
    apiService.getCurrentLayer = jest.fn().mockReturnValue('layer-1');
    apiService.getNextZIndex = jest.fn().mockReturnValue(1);
    apiService.getActiveLayerId = jest.fn().mockReturnValue('layer-1');
    apiService.selectElements = jest.fn();

    arrowTool = new ArrowTool(apiService as unknown as ApiService);
    arrowTool.activate();
  });

  it('should initialize with the correct type', () => {
    expect(arrowTool.type).toBe(ToolType.Arrow);
  });

  it('should handle pointer down and create an element', () => {
    const mockEvent = createMockPointerInfo({
      x: 100,
      y: 200,
      eventType: 'pointerdown',
    });

    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    arrowTool.handlePointerDown(mockEvent);

    expect(arrowTool.startPoint).toEqual({ x: 100, y: 200 });
    expect(arrowTool.element).toBeDefined();
    expect(apiService.addDraftElements).toHaveBeenCalledWith([arrowTool.element]);
  });

  it('should handle pointer move and update the element', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      shiftKey: false,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', x2: 150, y2: 250 }),
    ]);
  });

  it('should handle pointer up and commit the draft', () => {
    arrowTool.element = { x1: 100, y1: 200, x2: 150, y2: 250 } as unknown as ArrowElement;
    arrowTool.startPoint = { x: 100, y: 200 };

    arrowTool.handlePointerUp();

    expect(apiService.commitDraftElements).toHaveBeenCalled();
    expect(arrowTool.element).toBeNull();
    expect(arrowTool.startPoint).toBeNull();
  });

  it('should not update element if movement is below MIN_LENGTH', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 101,
      y: 201,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    // Movement is only 1 pixel in each direction, which is below MIN_LENGTH (2)
    // So the element should NOT be updated
    expect(arrowTool.element?.x2).toBe(100);
    expect(arrowTool.element?.y2).toBe(200);
  });

  it('should not update element if tool is inactive', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    arrowTool.deactivate();

    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element?.x2).toBe(100);
    expect(arrowTool.element?.y2).toBe(200);
  });

  it('should not update element if no element is active', () => {
    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      eventType: 'pointermove',
    });

    arrowTool.element = null;

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element).toBeNull();
  });

  it('should update element coordinates when movement is significant', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 160,
      y: 260,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element?.x2).toBe(160);
    expect(arrowTool.element?.y2).toBe(260);
  });

  it('should not update element coordinates when movement is below MIN_LENGTH', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 101,
      y: 201,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    // Movement is only 1 pixel in each direction, which is below MIN_LENGTH (2)
    // So the element should NOT be updated
    expect(arrowTool.element?.x2).toBe(100);
    expect(arrowTool.element?.y2).toBe(200);
  });

  it('should snap to grid when enabled', () => {
    config.snapToGrid = true;
    config.gridSize = 10;

    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });
    (snapToGrid as jest.Mock).mockImplementation((value, gridSize) => Math.round(value / gridSize) * gridSize);

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 105,
      y: 205,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(arrowTool.element?.x2).toBe(110);
    expect(arrowTool.element?.y2).toBe(210);
  });

  it('should snap to angle when shift key is pressed', () => {
    (createElement as jest.Mock).mockReturnValue({ id: '1', x1: 100, y1: 200, x2: 100, y2: 200 });
    (snapToAngle as jest.Mock).mockReturnValue({ x: 160, y: 240 });

    const downEvent = createMockPointerInfo({ x: 100, y: 200, eventType: 'pointerdown' });
    arrowTool.handlePointerDown(downEvent);

    const moveEvent = createMockPointerInfo({
      x: 150,
      y: 250,
      shiftKey: true,
      eventType: 'pointermove',
    });

    arrowTool.handlePointerMove(moveEvent);

    expect(apiService.updateDraftElements).toHaveBeenCalledWith([
      expect.objectContaining({ id: '1', x2: 160, y2: 240 }),
    ]);
  });
});
