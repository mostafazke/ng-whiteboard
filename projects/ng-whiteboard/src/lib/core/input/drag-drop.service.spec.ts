import { TestBed } from '@angular/core/testing';
import { DragDropService } from './drag-drop.service';
import { ApiService } from '../api/api.service';
import { ConfigService } from '../config/config.service';
import { ElementType, WhiteboardConfig, WhiteboardElement, PenType } from '../types';
import { createElement } from '../elements/element.utils';
import { getCanvasCoordinates } from '../utils/geometry';

// Mock the modules
jest.mock('../elements/element.utils');
jest.mock('../utils/geometry');

describe('DragDropService', () => {
  let service: DragDropService;
  let mockApiService: jest.Mocked<ApiService>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockCreateElement: jest.MockedFunction<typeof createElement>;
  let mockGetCanvasCoordinates: jest.MockedFunction<typeof getCanvasCoordinates>;

  const mockConfig = {
    strokeColor: '#000000',
    fillColor: '#ffffff',
    strokeWidth: 2,
    fontSize: 16,
    fontFamily: 'Arial',
    zoom: 1,
    x: 0,
    y: 0,
    drawingEnabled: true,
    canvasWidth: 800,
    canvasHeight: 600,
    fullScreen: false,
    center: false,
    canvasX: 0,
    canvasY: 0,
    backgroundColor: '#ffffff',
    lineJoin: 'round' as const,
    lineCap: 'round' as const,
    fill: '#ffffff',
    dasharray: '',
    dashoffset: 0,
    enableGrid: false,
    gridSize: 20,
    snapToGrid: false,
    keyboardShortcutsEnabled: true,
    penType: PenType.Pen,
  } as WhiteboardConfig;

  const createMockDragEvent = (clientX: number, clientY: number): DragEvent => {
    return {
      clientX,
      clientY,
      dataTransfer: {
        files: [] as unknown as FileList,
        types: [],
        getData: jest.fn(),
        setData: jest.fn(),
        clearData: jest.fn(),
        items: [] as unknown as DataTransferItemList,
        dropEffect: 'none',
        effectAllowed: 'all',
        setDragImage: jest.fn(),
      },
      preventDefault: jest.fn(),
      stopPropagation: jest.fn(),
    } as unknown as DragEvent;
  };

  beforeEach(() => {
    mockApiService = {
      addElements: jest.fn(),
      getNextZIndex: jest.fn().mockReturnValue(10),
      getActiveLayerId: jest.fn().mockReturnValue('layer-1'),
    } as unknown as jest.Mocked<ApiService>;

    mockConfigService = {
      getConfig: jest.fn().mockReturnValue(mockConfig),
    } as unknown as jest.Mocked<ConfigService>;

    TestBed.configureTestingModule({
      providers: [
        DragDropService,
        { provide: ApiService, useValue: mockApiService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(DragDropService);

    // Get mocked functions
    mockCreateElement = createElement as jest.MockedFunction<typeof createElement>;
    mockGetCanvasCoordinates = getCanvasCoordinates as jest.MockedFunction<typeof getCanvasCoordinates>;

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('handleFiles', () => {
    it('should handle image files and create image elements', (done) => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => (index === 0 ? mockFile : null),
        [Symbol.iterator]: function* () {
          yield mockFile;
        },
      } as FileList;

      const createElementSpy = mockCreateElement.mockReturnValue({
        id: 'image-1',
        type: ElementType.Image,
        src: 'data:image/png;base64,',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        zIndex: 10,
      } as WhiteboardElement);

      // Mock FileReader
      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: 'data:image/png;base64,mockImageData' },
              } as ProgressEvent<FileReader>);

              expect(createElementSpy).toHaveBeenCalledWith(
                ElementType.Image,
                {
                  src: 'data:image/png;base64,mockImageData',
                  x: 100,
                  y: 100,
                  width: 200,
                  height: 200,
                  zIndex: 10,
                },
                'layer-1'
              );

              expect(mockApiService.addElements).toHaveBeenCalledWith([
                expect.objectContaining({
                  type: ElementType.Image,
                  src: 'data:image/png;base64,',
                }),
              ]);

              done();
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      service.handleFiles(fileList);
    });

    it('should handle multiple image files', (done) => {
      const mockFile1 = new File([''], 'test1.png', { type: 'image/png' });
      const mockFile2 = new File([''], 'test2.jpg', { type: 'image/jpeg' });

      const fileList = {
        0: mockFile1,
        1: mockFile2,
        length: 2,
        item: (index: number) => (index === 0 ? mockFile1 : index === 1 ? mockFile2 : null),
        [Symbol.iterator]: function* () {
          yield mockFile1;
          yield mockFile2;
        },
      } as FileList;

      let callCount = 0;
      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              callCount++;
              this.onload({
                target: { result: `data:image/png;base64,mockImageData${callCount}` },
              } as ProgressEvent<FileReader>);

              if (callCount === 2) {
                expect(mockApiService.addElements).toHaveBeenCalledTimes(2);
                done();
              }
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);
      mockCreateElement.mockReturnValue({} as WhiteboardElement);

      service.handleFiles(fileList);
    });

    it('should ignore non-image files', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => (index === 0 ? mockFile : null),
        [Symbol.iterator]: function* () {
          yield mockFile;
        },
      } as FileList;

      const readAsDataURLSpy = jest.fn();
      jest.spyOn(global, 'FileReader').mockImplementation(
        () =>
          ({
            readAsDataURL: readAsDataURLSpy,
          } as unknown as FileReader)
      );

      service.handleFiles(fileList);

      expect(readAsDataURLSpy).not.toHaveBeenCalled();
      expect(mockApiService.addElements).not.toHaveBeenCalled();
    });

    it('should handle FileReader onload with no result', (done) => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const fileList = {
        0: mockFile,
        length: 1,
        item: (index: number) => (index === 0 ? mockFile : null),
        [Symbol.iterator]: function* () {
          yield mockFile;
        },
      } as FileList;

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: null },
              } as ProgressEvent<FileReader>);

              expect(mockApiService.addElements).not.toHaveBeenCalled();
              done();
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      service.handleFiles(fileList);
    });

    it('should handle empty FileList', () => {
      const fileList = {
        length: 0,
        item: () => null,
        [Symbol.iterator]: function* () {
          // Empty iterator
        },
      } as FileList;

      service.handleFiles(fileList);

      expect(mockApiService.addElements).not.toHaveBeenCalled();
    });
  });

  describe('handleText', () => {
    it('should create text element with plain text', () => {
      const event = createMockDragEvent(150, 200);
      const content = 'Hello World';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      const createElementSpy = mockCreateElement.mockReturnValue({
        id: 'text-1',
        type: ElementType.Text,
      } as WhiteboardElement);

      service.handleText(content, event, false);

      expect(mockGetCanvasCoordinates).toHaveBeenCalledWith(mockConfig, { x: 150, y: 200 });
      expect(createElementSpy).toHaveBeenCalledWith(
        ElementType.Text,
        {
          x: 100,
          y: 150 + 16 * 0.8,
          text: 'Hello World',
          style: {
            color: '#000000',
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
          },
          zIndex: 10,
        },
        'layer-1'
      );
      expect(mockApiService.addElements).toHaveBeenCalled();
    });

    it('should handle HTML content and extract text', () => {
      const event = createMockDragEvent(150, 200);
      const content = '<p>Hello World</p>';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      mockCreateElement.mockReturnValue({} as WhiteboardElement);

      // Mock DOMParser
      const mockParse = jest.fn().mockReturnValue({
        body: {
          textContent: 'Hello World',
          firstElementChild: null,
        },
      });
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: mockParse,
      })) as unknown as typeof DOMParser;

      service.handleText(content, event, true);

      expect(mockParse).toHaveBeenCalledWith(content, 'text/html');
      expect(mockApiService.addElements).toHaveBeenCalled();
    });

    it('should extract styles from HTML content with bold font weight (string)', () => {
      const event = createMockDragEvent(150, 200);
      const content =
        '<p style="color: red; font-size: 24px; font-family: Georgia; font-weight: bold; font-style: italic;">Styled Text</p>';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      const createElementSpy = mockCreateElement.mockReturnValue({} as WhiteboardElement);

      // Mock DOMParser and computedStyle
      const mockElement = document.createElement('p');
      const mockParse = jest.fn().mockReturnValue({
        body: {
          textContent: 'Styled Text',
          firstElementChild: mockElement,
        },
      });
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: mockParse,
      })) as unknown as typeof DOMParser;

      // Mock getComputedStyle
      global.window.getComputedStyle = jest.fn().mockReturnValue({
        color: 'red',
        fontSize: '24px',
        fontFamily: 'Georgia',
        fontWeight: 'bold',
        fontStyle: 'italic',
      } as CSSStyleDeclaration);

      service.handleText(content, event, true);

      expect(createElementSpy).toHaveBeenCalledWith(
        ElementType.Text,
        expect.objectContaining({
          text: 'Styled Text',
          style: {
            color: 'red',
            fontSize: 24,
            fontFamily: 'Georgia',
            fontWeight: 'bold',
            fontStyle: 'italic',
          },
        }),
        'layer-1'
      );
    });

    it('should extract styles from HTML content with numeric font weight >= 700', () => {
      const event = createMockDragEvent(150, 200);
      const content = '<p>Bold Text</p>';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      mockCreateElement.mockImplementation(
        (type, props) =>
          ({
            id: 'text-1',
            type,
            ...props,
          } as WhiteboardElement)
      );

      const mockElement = document.createElement('p');
      const mockParse = jest.fn().mockReturnValue({
        body: {
          textContent: 'Bold Text',
          firstElementChild: mockElement,
        },
      });
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: mockParse,
      })) as unknown as typeof DOMParser;

      global.window.getComputedStyle = jest.fn().mockReturnValue({
        color: '#000000',
        fontSize: '16px',
        fontFamily: 'Arial',
        fontWeight: '700',
        fontStyle: 'normal',
      } as CSSStyleDeclaration);

      service.handleText(content, event, true);

      expect(mockApiService.addElements).toHaveBeenCalledWith([
        expect.objectContaining({
          style: expect.objectContaining({
            fontWeight: 'bold',
          }),
        }),
      ]);
    });

    it('should use normal font weight for numeric values < 700', () => {
      const event = createMockDragEvent(150, 200);
      const content = '<p>Normal Text</p>';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      mockCreateElement.mockImplementation(
        (type, props) =>
          ({
            id: 'text-1',
            type,
            ...props,
          } as WhiteboardElement)
      );

      const mockElement = document.createElement('p');
      const mockParse = jest.fn().mockReturnValue({
        body: {
          textContent: 'Normal Text',
          firstElementChild: mockElement,
        },
      });
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: mockParse,
      })) as unknown as typeof DOMParser;

      global.window.getComputedStyle = jest.fn().mockReturnValue({
        color: '#000000',
        fontSize: '16px',
        fontFamily: 'Arial',
        fontWeight: '400',
        fontStyle: 'normal',
      } as CSSStyleDeclaration);

      service.handleText(content, event, true);

      expect(mockApiService.addElements).toHaveBeenCalledWith([
        expect.objectContaining({
          style: expect.objectContaining({
            fontWeight: 'normal',
          }),
        }),
      ]);
    });

    it('should handle HTML with missing styles and use defaults', () => {
      const event = createMockDragEvent(150, 200);
      const content = '<p>Text</p>';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      const createElementSpy = mockCreateElement.mockReturnValue({} as WhiteboardElement);

      const mockElement = document.createElement('p');
      const mockParse = jest.fn().mockReturnValue({
        body: {
          textContent: 'Text',
          firstElementChild: mockElement,
        },
      });
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: mockParse,
      })) as unknown as typeof DOMParser;

      global.window.getComputedStyle = jest.fn().mockReturnValue({
        color: '',
        fontSize: '',
        fontFamily: '',
        fontWeight: '',
        fontStyle: '',
      } as CSSStyleDeclaration);

      service.handleText(content, event, true);

      expect(createElementSpy).toHaveBeenCalledWith(
        ElementType.Text,
        expect.objectContaining({
          style: {
            color: '#000000',
            fontSize: 16,
            fontFamily: 'Arial',
            fontWeight: 'normal',
            fontStyle: 'normal',
          },
        }),
        'layer-1'
      );
    });

    it('should not create element for empty text content', () => {
      const event = createMockDragEvent(150, 200);
      const content = '';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });

      service.handleText(content, event, false);

      expect(mockApiService.addElements).not.toHaveBeenCalled();
    });

    it('should not create element for whitespace-only HTML', () => {
      const event = createMockDragEvent(150, 200);
      const content = '<p>   </p>';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });

      const mockParse = jest.fn().mockReturnValue({
        body: {
          textContent: '   ',
          firstElementChild: null,
        },
      });
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: mockParse,
      })) as unknown as typeof DOMParser;

      service.handleText(content, event, true);

      expect(mockApiService.addElements).not.toHaveBeenCalled();
    });

    it('should trim whitespace from HTML content', () => {
      const event = createMockDragEvent(150, 200);
      const content = '<p>  Text with spaces  </p>';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      const createElementSpy = mockCreateElement.mockReturnValue({} as WhiteboardElement);

      const mockParse = jest.fn().mockReturnValue({
        body: {
          textContent: '  Text with spaces  ',
          firstElementChild: null,
        },
      });
      global.DOMParser = jest.fn().mockImplementation(() => ({
        parseFromString: mockParse,
      })) as unknown as typeof DOMParser;

      service.handleText(content, event, true);

      expect(createElementSpy).toHaveBeenCalledWith(
        ElementType.Text,
        expect.objectContaining({
          text: 'Text with spaces',
        }),
        'layer-1'
      );
    });

    it('should calculate Y position with fontSize offset', () => {
      const event = createMockDragEvent(150, 200);
      const content = 'Test';

      mockGetCanvasCoordinates.mockReturnValue({ x: 100, y: 150 });
      const createElementSpy = mockCreateElement.mockReturnValue({} as WhiteboardElement);

      // Use a different fontSize
      const customConfig = { ...mockConfig, fontSize: 20 };
      mockConfigService.getConfig.mockReturnValue(customConfig);

      service.handleText(content, event, false);

      expect(createElementSpy).toHaveBeenCalledWith(
        ElementType.Text,
        expect.objectContaining({
          x: 100,
          y: 150 + 20 * 0.8, // 150 + 16
        }),
        'layer-1'
      );
    });
  });

  describe('handleElements', () => {
    it('should copy and position elements at drop location', () => {
      const event = createMockDragEvent(300, 400);

      const elements: WhiteboardElement[] = [
        {
          id: 'elem-1',
          type: ElementType.Rectangle,
          x: 50,
          y: 60,
          zIndex: 1,
        } as WhiteboardElement,
        {
          id: 'elem-2',
          type: ElementType.Ellipse,
          x: 100,
          y: 120,
          zIndex: 2,
        } as WhiteboardElement,
      ];

      mockGetCanvasCoordinates.mockReturnValue({ x: 200, y: 250 });

      service.handleElements(elements, event);

      expect(mockGetCanvasCoordinates).toHaveBeenCalledWith(mockConfig, { x: 300, y: 400 });
      expect(mockApiService.getNextZIndex).toHaveBeenCalledTimes(2);
      expect(mockApiService.addElements).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'elem-1',
          x: 250, // 200 + 50
          y: 310, // 250 + 60
          zIndex: 10,
        }),
        expect.objectContaining({
          id: 'elem-2',
          x: 300, // 200 + 100
          y: 370, // 250 + 120
          zIndex: 10,
        }),
      ]);
    });

    it('should handle elements with no x/y coordinates', () => {
      const event = createMockDragEvent(300, 400);

      const elements: WhiteboardElement[] = [
        {
          id: 'elem-1',
          type: ElementType.Rectangle,
          zIndex: 1,
        } as WhiteboardElement,
      ];

      mockGetCanvasCoordinates.mockReturnValue({ x: 200, y: 250 });

      service.handleElements(elements, event);

      expect(mockApiService.addElements).toHaveBeenCalledWith([
        expect.objectContaining({
          x: 200, // 200 + 0
          y: 250, // 250 + 0
          zIndex: 10,
        }),
      ]);
    });

    it('should handle empty elements array', () => {
      const event = createMockDragEvent(300, 400);
      const elements: WhiteboardElement[] = [];

      mockGetCanvasCoordinates.mockReturnValue({ x: 200, y: 250 });

      service.handleElements(elements, event);

      expect(mockApiService.addElements).toHaveBeenCalledWith([]);
    });

    it('should preserve all element properties except position and zIndex', () => {
      const event = createMockDragEvent(300, 400);

      const elements: WhiteboardElement[] = [
        {
          id: 'elem-1',
          type: ElementType.Rectangle,
          x: 50,
          y: 60,
          width: 100,
          height: 50,
          rotation: 45,
          opacity: 80,
          zIndex: 1,
          layerId: 'original-layer',
          style: { strokeColor: '#ff0000' },
        } as WhiteboardElement,
      ];

      mockGetCanvasCoordinates.mockReturnValue({ x: 200, y: 250 });

      service.handleElements(elements, event);

      expect(mockApiService.addElements).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'elem-1',
          type: ElementType.Rectangle,
          x: 250,
          y: 310,
          width: 100,
          height: 50,
          rotation: 45,
          opacity: 80,
          zIndex: 10,
          layerId: 'original-layer',
          style: { strokeColor: '#ff0000' },
        }),
      ]);
    });

    it('should call getNextZIndex for each element', () => {
      const event = createMockDragEvent(300, 400);
      const elements: WhiteboardElement[] = [
        { id: 'elem-1', type: ElementType.Rectangle, x: 0, y: 0, zIndex: 1 } as WhiteboardElement,
        { id: 'elem-2', type: ElementType.Ellipse, x: 0, y: 0, zIndex: 2 } as WhiteboardElement,
        { id: 'elem-3', type: ElementType.Line, x: 0, y: 0, zIndex: 3 } as WhiteboardElement,
      ];

      mockGetCanvasCoordinates.mockReturnValue({ x: 200, y: 250 });
      mockApiService.getNextZIndex.mockReturnValueOnce(10).mockReturnValueOnce(11).mockReturnValueOnce(12);

      service.handleElements(elements, event);

      expect(mockApiService.getNextZIndex).toHaveBeenCalledTimes(3);
      expect(mockApiService.addElements).toHaveBeenCalledWith([
        expect.objectContaining({ zIndex: 10 }),
        expect.objectContaining({ zIndex: 11 }),
        expect.objectContaining({ zIndex: 12 }),
      ]);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle drag and drop workflow for multiple file types', (done) => {
      const imageFile = new File([''], 'image.png', { type: 'image/png' });
      const textFile = new File([''], 'text.txt', { type: 'text/plain' });

      const fileList = {
        0: imageFile,
        1: textFile,
        length: 2,
        item: (index: number) => (index === 0 ? imageFile : index === 1 ? textFile : null),
        [Symbol.iterator]: function* () {
          yield imageFile;
          yield textFile;
        },
      } as FileList;

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: 'data:image/png;base64,test' },
              } as ProgressEvent<FileReader>);

              // Only image file should be processed
              expect(mockApiService.addElements).toHaveBeenCalledTimes(1);
              done();
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);
      mockCreateElement.mockReturnValue({} as WhiteboardElement);

      service.handleFiles(fileList);
    });

    it('should handle different coordinate transformations', () => {
      const event = createMockDragEvent(500, 600);

      // Test with zoom and pan
      const zoomedConfig = {
        ...mockConfig,
        zoom: 2,
        panX: 100,
        panY: 50,
      };
      mockConfigService.getConfig.mockReturnValue(zoomedConfig);

      mockGetCanvasCoordinates.mockReturnValue({ x: 150, y: 275 });
      mockCreateElement.mockReturnValue({} as WhiteboardElement);

      service.handleText('Test', event, false);

      expect(mockGetCanvasCoordinates).toHaveBeenCalledWith(zoomedConfig, { x: 500, y: 600 });
    });
  });
});
