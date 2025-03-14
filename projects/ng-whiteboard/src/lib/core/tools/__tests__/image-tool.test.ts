import { ImageTool } from '../image-tool';
import { ToolType } from '../../types';

describe('ImageTool', () => {
  let imageTool: ImageTool;
  let mockDataService: any;
  const input = document.createElement('input');

  beforeEach(() => {
    mockDataService = {
      removeElement: jest.fn(),
      updateElement: jest.fn(),
      getCanvasCoordinates: jest.fn(),
    };
    imageTool = new ImageTool(mockDataService);
    imageTool.activate();
  });

  it('should have the correct type', () => {
    expect(imageTool.type).toBe(ToolType.Image);
  });

  it('should handle pointer down event and add image', () => {
    const event = new MouseEvent('pointerdown', { offsetX: 100, offsetY: 200 } as any) as PointerEvent;
    const canvasCoordinates = [50, 100];
    mockDataService.getCanvasCoordinates.mockReturnValue(canvasCoordinates);

    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        setTimeout(() => {
          const file = new Blob(['image content'], { type: 'image/png' });
          const fileList: FileList = {
            0: file,
            length: 1,
            item: (index: number) => file,
          } as any;
          Object.defineProperty(input, 'files', {
            value: fileList,
            writable: false,
          });
          input.onchange!({ target: input } as any);
        }, 0);
        return input;
      }
      return document.createElement(tagName);
    });

    imageTool.handlePointerDown(event);

    setTimeout(() => {
      expect(mockDataService.getCanvasCoordinates).toHaveBeenCalledWith([100, 200]);
      expect(mockDataService.addImage).toHaveBeenCalledWith({
        image: jasmine.any(String),
        x: 50,
        y: 100,
      });
    }, 0);
  });
});
