import { ImageTool } from '../image-tool';
import { LineCap, LineJoin, ToolType, WhiteboardConfig } from '../../types';
import { DataService } from '../../data/data.service';

jest.mock('../../elements/element.utils');
jest.mock('../../utils/utils');

describe('ImageTool', () => {
  let imageTool: ImageTool;
  let dataService: DataService;
  let config: WhiteboardConfig;

  beforeEach(() => {
    config = {
      strokeColor: '#000000',
      strokeWidth: 2,
      lineCap: LineCap.Butt,
      lineJoin: LineJoin.Miter,
      dasharray: '',
      dashoffset: 0,
      backgroundColor: '#ffffff',
      canvasWidth: 800,
      canvasHeight: 600,
    } as WhiteboardConfig;

    dataService = {
      addToDraft: jest.fn(),
      commitDraftToData: jest.fn(),
      getConfig: jest.fn().mockReturnValue(config),
      addImage: jest.fn(),
    } as unknown as DataService;

    imageTool = new ImageTool(dataService);
    imageTool.activate();
  });

  it('should have the correct type', () => {
    expect(imageTool.type).toBe(ToolType.Image);
  });

  it('should handle pointer down and upload an image', () => {
    const mockEvent = {
      clientX: 100,
      clientY: 200,
    } as PointerEvent;

    jest.spyOn(imageTool, 'getPointerPosition').mockReturnValue({ x: 100, y: 200 });
    const inputSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'input') {
        const mockInput = {
          type: '',
          accept: '',
          onchange: null,
          click: jest.fn(),
        } as unknown as HTMLInputElement;
        return mockInput;
      }
      return document.createElement(tagName);
    });

    const fileReaderMock = {
      readAsDataURL: jest.fn(),
      onload: null,
    } as unknown as FileReader;

    jest.spyOn(window, 'FileReader').mockImplementation(() => fileReaderMock);

    imageTool.handlePointerDown(mockEvent);

    const inputElement = inputSpy.mock.results[0].value as HTMLInputElement;
    expect(inputElement.type).toBe('file');
    expect(inputElement.accept).toBe('image/*');
    expect(inputElement.click).toHaveBeenCalled();

    const mockFile = new Blob(['image content'], { type: 'image/png' });
    const mockFileList = {
      0: mockFile,
      length: 1,
      item: (index: number) => (index === 0 ? mockFile : null),
    } as unknown as FileList;

    inputElement.onchange!({
      target: { files: mockFileList },
    } as unknown as Event);

    expect(fileReaderMock.readAsDataURL).toHaveBeenCalledWith(mockFile);

    const mockImageData = 'data:image/png;base64,mockImageData';
    fileReaderMock.onload!({
      target: { result: mockImageData },
    } as ProgressEvent<FileReader>);

    expect(dataService.addImage).toHaveBeenCalledWith({
      image: mockImageData,
      x: 100,
      y: 200,
    });
  });
});
