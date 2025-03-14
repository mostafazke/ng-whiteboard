import { HandTool } from '../hand-tool';
import { ToolType } from '../../types';

describe('HandTool', () => {
  let handTool: HandTool;
  let mockDataService: any;

  beforeEach(() => {
    mockDataService = {
      getConfig: jest.fn().mockReturnValue({
        gridTranslation: { x: 0, y: 0 },
        elementsTranslation: { x: 0, y: 0 },
      }),
      updateGridTranslation: jest.fn(),
      updateElementsTranslation: jest.fn(),
    };

    handTool = new HandTool(mockDataService);
  });

  it('should have the correct type', () => {
    expect(handTool.type).toBe(ToolType.Hand);
  });

  it('should set isDragging to true and initialize startX and startY on handlePointerDown', () => {
    const event = { clientX: 100, clientY: 200 } as PointerEvent;
    handTool.handlePointerDown(event);
    expect(handTool['isDragging']).toBe(true);
    expect(handTool['startX']).toBe(100);
    expect(handTool['startY']).toBe(200);
  });

  it('should update grid and elements positions on handlePointerMove when dragging', () => {
    handTool['isDragging'] = true;
    handTool['startX'] = 100;
    handTool['startY'] = 200;

    const event = { clientX: 150, clientY: 250 } as PointerEvent;
    handTool.handlePointerMove(event);

    expect(mockDataService.updateGridTranslation).toHaveBeenCalledWith(50 % 100, 50 % 100);
    expect(mockDataService.updateElementsTranslation).toHaveBeenCalledWith(50, 50);
    expect(handTool['startX']).toBe(150);
    expect(handTool['startY']).toBe(250);
  });

  it('should not update positions on handlePointerMove when not dragging', () => {
    handTool['isDragging'] = false;
    const event = { clientX: 150, clientY: 250 } as PointerEvent;
    handTool.handlePointerMove(event);

    expect(mockDataService.updateGridTranslation).not.toHaveBeenCalled();
    expect(mockDataService.updateElementsTranslation).not.toHaveBeenCalled();
  });

  it('should set isDragging to false on handlePointerUp', () => {
    handTool['isDragging'] = true;
    handTool.handlePointerUp();
    expect(handTool['isDragging']).toBe(false);
  });
});
