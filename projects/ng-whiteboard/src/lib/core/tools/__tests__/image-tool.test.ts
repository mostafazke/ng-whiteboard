import { ImageTool } from '../image-tool';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { ApiService } from '../../api/api.service';
import { createMockPointerInfo } from '../../testing';

jest.mock('../../elements/element.utils');

describe('ImageTool', () => {
  let imageTool: ImageTool;
  let apiService: ApiService;
  let config: WhiteboardConfig;

  beforeEach(() => {
    config = {
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Round,
      lineJoin: LineJoin.Round,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
    } as WhiteboardConfig;

    apiService = {
      getConfig: jest.fn().mockReturnValue(config),
      addImage: jest.fn(),
      pickImage: jest.fn(),
    } as unknown as ApiService;

    imageTool = new ImageTool(apiService);
    imageTool.activate();
  });

  it('should have the correct type', () => {
    expect(imageTool.type).toBe(ToolType.Image);
  });

  it('opens the image picker at the pointer position', () => {
    const mockEvent = createMockPointerInfo({ clientX: 100, clientY: 200, eventType: 'pointerdown' });
    jest.spyOn(imageTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });

    imageTool.handlePointerDown(mockEvent);

    expect(apiService.pickImage).toHaveBeenCalledWith({ x: 100, y: 200 });
  });
});
