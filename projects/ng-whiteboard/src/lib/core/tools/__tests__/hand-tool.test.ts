import { HandTool } from '../hand-tool';
import { ToolType } from '../../types';
import { ApiService } from '../../api/api.service';
import { createMockPointerInfo, createMockApiService } from '../../testing';

describe('HandTool', () => {
  let handTool: HandTool;
  let mockApiService: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    mockApiService = createMockApiService();
    mockApiService.getConfig = jest.fn().mockReturnValue({
      gridTranslation: { x: 0, y: 0 },
      elementsTranslation: { x: 0, y: 0 },
      zoom: 1,
    });
    mockApiService.pan = jest.fn();
    mockApiService.setCursor = jest.fn();
    mockApiService.resetCursor = jest.fn();

    handTool = new HandTool(mockApiService as unknown as ApiService);
  });

  it('should have the correct type', () => {
    expect(handTool.type).toBe(ToolType.Hand);
  });

  it('should set isDragging to true and initialize startX and startY on handlePointerDown', () => {
    const event = createMockPointerInfo({ clientX: 100, clientY: 200, eventType: 'pointerdown' });
    handTool.handlePointerDown(event);
    expect(handTool['isDragging']).toBe(true);
    expect(handTool['startX']).toBe(100);
    expect(handTool['startY']).toBe(200);
  });

  it('should update grid and elements positions on handlePointerMove when dragging', () => {
    handTool['isDragging'] = true;
    handTool['startX'] = 100;
    handTool['startY'] = 200;

    const event = createMockPointerInfo({ clientX: 150, clientY: 250, eventType: 'pointermove' });
    handTool.handlePointerMove(event);

    expect(mockApiService.pan).toHaveBeenCalledWith(50, 50);
    expect(handTool['startX']).toBe(150);
    expect(handTool['startY']).toBe(250);
  });

  it('should not update positions on handlePointerMove when not dragging', () => {
    handTool['isDragging'] = false;
    const event = createMockPointerInfo({ clientX: 150, clientY: 250, eventType: 'pointermove' });
    handTool.handlePointerMove(event);

    expect(mockApiService.pan).not.toHaveBeenCalled();
  });

  it('should set isDragging to false on handlePointerUp', () => {
    handTool['isDragging'] = true;
    handTool.handlePointerUp();
    expect(handTool['isDragging']).toBe(false);
  });
});
