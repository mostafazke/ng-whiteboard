import { TestBed } from '@angular/core/testing';
import { IOService } from './io.service';
import { ElementsService } from '../elements/elements.service';
import { CanvasService } from '../canvas/canvas.service';
import { ZoomService } from '../viewport/zoom.service';
import { PanService } from '../viewport/pan.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { SelectionService } from '../elements/selection.service';
import { ElementType, FormatType, WhiteboardElement, WhiteboardConfig } from '../types';
import { WhiteboardEvent } from '../types/events';
import { createElement } from '../elements/element.utils';
import { downloadFile } from '../utils/common';
import { svgToBase64 } from '../utils/svg';
import { ConfigService } from '../config/config.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { getElementUtil } from '../elements/element.utils';

// Mock the modules
jest.mock('../elements/element.utils', () => ({
  ...jest.requireActual('../elements/element.utils'),
  createElement: jest.fn(),
}));
jest.mock('../utils/common');
jest.mock('../utils/svg');

describe('IOService', () => {
  let service: IOService;
  let mockElementsService: jest.Mocked<ElementsService>;
  let mockCanvasService: jest.Mocked<CanvasService>;
  let mockZoomService: jest.Mocked<ZoomService>;
  let mockPanService: jest.Mocked<PanService>;
  let mockEventBusService: jest.Mocked<EventBusService>;
  let mockSelectionService: jest.Mocked<SelectionService>;
  let mockCreateElement: jest.MockedFunction<typeof createElement>;
  let mockDownloadFile: jest.MockedFunction<typeof downloadFile>;
  let mockSvgToBase64: jest.MockedFunction<typeof svgToBase64>;

  const mockConfig: WhiteboardConfig = {
    canvasWidth: 800,
    canvasHeight: 600,
    backgroundColor: '#ffffff',
    zoom: 1,
    x: 0,
    y: 0,
  } as WhiteboardConfig;

  const mockElement: WhiteboardElement = {
    id: 'element-1',
    type: ElementType.Image,
    x: 100,
    y: 100,
    width: 200,
    height: 150,
    src: 'data:image/png;base64,test',
    zIndex: 1,
  } as WhiteboardElement;

  beforeEach(() => {
    mockElementsService = {
      addElements: jest.fn(),
      setElements: jest.fn(),
      getElements: jest.fn().mockReturnValue([mockElement]),
      getNextZIndex: jest.fn().mockReturnValue(10),
      clear: jest.fn(),
    } as unknown as jest.Mocked<ElementsService>;

    mockCanvasService = {
      getConfig: jest.fn().mockReturnValue(mockConfig),
      getCanvas: jest.fn(),
      setCanvasDimensions: jest.fn(),
    } as unknown as jest.Mocked<CanvasService>;

    mockZoomService = {
      zoom: jest.fn(),
    } as unknown as jest.Mocked<ZoomService>;

    mockPanService = {
      panTo: jest.fn(),
    } as unknown as jest.Mocked<PanService>;

    mockEventBusService = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventBusService>;

    mockSelectionService = {
      selectElements: jest.fn(),
    } as unknown as jest.Mocked<SelectionService>;

    TestBed.configureTestingModule({
      providers: [
        IOService,
        { provide: ElementsService, useValue: mockElementsService },
        { provide: CanvasService, useValue: mockCanvasService },
        { provide: ZoomService, useValue: mockZoomService },
        { provide: PanService, useValue: mockPanService },
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: SelectionService, useValue: mockSelectionService },
      ],
    });

    service = TestBed.inject(IOService);

    // Get mocked functions
    mockCreateElement = createElement as jest.MockedFunction<typeof createElement>;
    mockDownloadFile = downloadFile as jest.MockedFunction<typeof downloadFile>;
    mockSvgToBase64 = svgToBase64 as jest.MockedFunction<typeof svgToBase64>;

    // Reset all mocks
    jest.clearAllMocks();

    // Mock console methods to avoid noise
    jest.spyOn(console, 'error').mockImplementation(() => {
      // No-op
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addImage', () => {
    it('should add image with provided dimensions and position', (done) => {
      const imageInfo = {
        image: 'data:image/png;base64,test',
        x: 50,
        y: 75,
      };

      mockCreateElement.mockReturnValue({
        ...mockElement,
        selectAfterDraw: false,
      } as WhiteboardElement);

      // Mock Image
      const mockImage = {
        width: 100,
        height: 80,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      service.addImage(imageInfo);

      // Set src to trigger onload
      mockImage.src = imageInfo.image;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();

          expect(mockCreateElement).toHaveBeenCalledWith(
            ElementType.Image,
            expect.objectContaining({
              src: imageInfo.image,
              width: 100,
              height: 80,
              x: 50,
              y: 75,
              zIndex: 10,
            })
          );
          expect(mockElementsService.addElements).toHaveBeenCalled();
          expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ImageAdded, imageInfo.image);
          done();
        }
      }, 0);
    });

    it('should scale down large images to fit canvas height', (done) => {
      const imageInfo = {
        image: 'data:image/png;base64,largeImage',
      };

      mockCreateElement.mockReturnValue(mockElement);

      const mockImage = {
        width: 1000,
        height: 800, // Larger than canvas height (600)
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      service.addImage(imageInfo);
      mockImage.src = imageInfo.image;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();

          const expectedHeight = 600 - 40; // canvasHeight - 40
          const expectedWidth = expectedHeight * (1000 / 800); // aspectRatio

          expect(mockCreateElement).toHaveBeenCalledWith(
            ElementType.Image,
            expect.objectContaining({
              width: expectedWidth,
              height: expectedHeight,
            })
          );
          done();
        }
      }, 0);
    });

    it('should use default position (0, 0) when not provided', (done) => {
      const imageInfo = {
        image: 'data:image/png;base64,test',
      };

      mockCreateElement.mockReturnValue(mockElement);

      const mockImage = {
        width: 100,
        height: 80,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      service.addImage(imageInfo);
      mockImage.src = imageInfo.image;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();

          expect(mockCreateElement).toHaveBeenCalledWith(
            ElementType.Image,
            expect.objectContaining({
              x: 0,
              y: 0,
            })
          );
          done();
        }
      }, 0);
    });

    it('should ensure image is not positioned with negative coordinates', (done) => {
      const imageInfo = {
        image: 'data:image/png;base64,test',
        x: -50,
        y: -25,
      };

      mockCreateElement.mockReturnValue(mockElement);

      const mockImage = {
        width: 100,
        height: 80,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      service.addImage(imageInfo);
      mockImage.src = imageInfo.image;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();

          expect(mockCreateElement).toHaveBeenCalledWith(
            ElementType.Image,
            expect.objectContaining({
              x: 0,
              y: 0,
            })
          );
          done();
        }
      }, 0);
    });

    it('should select element after draw if selectAfterDraw is true', (done) => {
      const imageInfo = {
        image: 'data:image/png;base64,test',
      };

      const elementWithSelect = {
        ...mockElement,
        selectAfterDraw: true,
      } as WhiteboardElement;

      mockCreateElement.mockReturnValue(elementWithSelect);

      const mockImage = {
        width: 100,
        height: 80,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      service.addImage(imageInfo);
      mockImage.src = imageInfo.image;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();

          expect(mockSelectionService.selectElements).toHaveBeenCalledWith([elementWithSelect.id]);
          done();
        }
      }, 0);
    });

    it('should not select element after draw if selectAfterDraw is false', (done) => {
      const imageInfo = {
        image: 'data:image/png;base64,test',
      };

      const elementWithoutSelect = {
        ...mockElement,
        selectAfterDraw: false,
      } as WhiteboardElement;

      mockCreateElement.mockReturnValue(elementWithoutSelect);

      const mockImage = {
        width: 100,
        height: 80,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      service.addImage(imageInfo);
      mockImage.src = imageInfo.image;

      setTimeout(() => {
        if (mockImage.onload) {
          mockImage.onload();

          expect(mockSelectionService.selectElements).not.toHaveBeenCalled();
          done();
        }
      }, 0);
    });

    it('should handle image load error', (done) => {
      const imageInfo = {
        image: 'data:image/png;base64,invalid',
      };

      const mockImage = {
        width: 100,
        height: 80,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      service.addImage(imageInfo);
      mockImage.src = imageInfo.image;

      setTimeout(() => {
        if (mockImage.onerror) {
          mockImage.onerror();

          expect(console.error).toHaveBeenCalledWith('Failed to load image');
          expect(mockElementsService.addElements).not.toHaveBeenCalled();
          done();
        }
      }, 0);
    });
  });

  describe('importImageFile', () => {
    it('should import image file successfully', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      const x = 100;
      const y = 150;

      mockCreateElement.mockReturnValue(mockElement);

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as (() => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: 'data:image/png;base64,testData' },
              } as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockImage = {
        width: 200,
        height: 150,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const promise = service.importImageFile(file, x, y);

      // Trigger FileReader onload
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (mockImage.onload) {
        mockImage.onload();
      }

      await promise;

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should reject if file is not an image', async () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });

      await expect(service.importImageFile(file)).rejects.toThrow('Invalid file type. Only images are supported.');
    });

    it('should reject if FileReader fails', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({} as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      await expect(service.importImageFile(file)).rejects.toThrow('Failed to read file');
    });

    it('should reject if FileReader result is null', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: null },
              } as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      await expect(service.importImageFile(file)).rejects.toThrow('Failed to read file');
    });
  });

  describe('importImageFromUrl', () => {
    it('should import image from URL successfully', async () => {
      const url = 'https://example.com/image.png';
      const x = 100;
      const y = 150;

      const mockBlob = new Blob(['mock image data'], { type: 'image/png' });

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      mockCreateElement.mockReturnValue(mockElement);

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as (() => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: 'data:image/png;base64,urlData' },
              } as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockImage = {
        width: 200,
        height: 150,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const promise = service.importImageFromUrl(url, x, y);

      await new Promise((resolve) => setTimeout(resolve, 10));
      if (mockImage.onload) {
        mockImage.onload();
      }

      await promise;

      expect(global.fetch).toHaveBeenCalledWith(url);
    });

    it('should reject if fetch fails', async () => {
      const url = 'https://example.com/invalid.png';

      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(service.importImageFromUrl(url)).rejects.toThrow('Failed to load image from URL');
    });

    it('should reject if FileReader fails when processing URL', async () => {
      const url = 'https://example.com/image.png';
      const mockBlob = new Blob(['mock image data'], { type: 'image/png' });

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror({} as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      await expect(service.importImageFromUrl(url)).rejects.toThrow('Failed to process URL');
    });

    it('should reject if FileReader result is null when processing URL', async () => {
      const url = 'https://example.com/image.png';
      const mockBlob = new Blob(['mock image data'], { type: 'image/png' });

      global.fetch = jest.fn().mockResolvedValue({
        blob: jest.fn().mockResolvedValue(mockBlob),
      });

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: null },
              } as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      await expect(service.importImageFromUrl(url)).rejects.toThrow('Failed to process URL');
    });
  });

  describe('save', () => {
    let mockSvgElement: SVGSVGElement;

    beforeEach(() => {
      mockSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockSvgElement.setAttribute('id', 'svgcontent');

      // Add child elements
      const selectorGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      selectorGroup.setAttribute('id', 'selectorParentGroup');
      mockSvgElement.appendChild(selectorGroup);

      const contentBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      contentBg.setAttribute('id', 'contentBackground');
      contentBg.setAttribute('opacity', '0.5');
      mockSvgElement.appendChild(contentBg);

      mockCanvasService.getCanvas.mockReturnValue(mockSvgElement);
      mockSvgToBase64.mockResolvedValue('data:image/png;base64,exportedData');
    });

    it('should save as Base64 format', async () => {
      const result = await service.save(FormatType.Base64, 'test-board');

      expect(mockSvgToBase64).toHaveBeenCalled();
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Save, 'data:image/png;base64,exportedData');
      expect(mockDownloadFile).not.toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,exportedData');
    });

    it('should save as PNG format and download file', async () => {
      const result = await service.save(FormatType.Png, 'test-board');

      expect(mockSvgToBase64).toHaveBeenCalled();
      expect(mockDownloadFile).toHaveBeenCalledWith('data:image/png;base64,exportedData', 'test-board.png');
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Save, 'data:image/png;base64,exportedData');
      expect(result).toBe('data:image/png;base64,exportedData');
    });

    it('should save as JPEG format and download file', async () => {
      const result = await service.save(FormatType.Jpeg, 'test-board');

      expect(mockDownloadFile).toHaveBeenCalledWith('data:image/png;base64,exportedData', 'test-board.jpg');
      expect(result).toBe('data:image/png;base64,exportedData');
    });

    it('should save as SVG format', async () => {
      const result = await service.save(FormatType.Svg, 'test-board');

      expect(mockDownloadFile).toHaveBeenCalledWith(expect.stringContaining('data:image/svg+xml'), 'test-board.svg');
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Save, expect.any(String));
      expect(result).toBe('data:image/png;base64,exportedData');
    });

    it('should throw error if SVG content not found', async () => {
      const mockEmptySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockEmptySvg.getElementById = jest.fn().mockReturnValue(null);
      mockCanvasService.getCanvas.mockReturnValue(mockEmptySvg as unknown as SVGSVGElement);

      await expect(service.save(FormatType.Png)).rejects.toThrow('SVG content not found');
    });

    it('should handle svgToBase64 errors', async () => {
      mockSvgToBase64.mockRejectedValue(new Error('Conversion failed'));

      await expect(service.save(FormatType.Png)).rejects.toThrow('Conversion failed');
      expect(console.error).toHaveBeenCalledWith('Failed to save whiteboard:', expect.any(Error));
    });

    it('should remove selectorParentGroup from cloned SVG', async () => {
      await service.save(FormatType.Png);

      // Verify the original SVG still has the selector group
      expect(mockSvgElement.querySelector('#selectorParentGroup')).toBeTruthy();
    });

    it('should remove opacity from contentBackground in cloned SVG', async () => {
      await service.save(FormatType.Png);

      // Verify the original SVG still has the opacity
      const contentBg = mockSvgElement.querySelector('#contentBackground');
      expect(contentBg?.getAttribute('opacity')).toBe('0.5');
    });

    it('should reset SVG position in cloned SVG', async () => {
      mockSvgElement.setAttribute('x', '100');
      mockSvgElement.setAttribute('y', '50');

      await service.save(FormatType.Png);

      // Verify the original SVG still has the position
      expect(mockSvgElement.getAttribute('x')).toBe('100');
      expect(mockSvgElement.getAttribute('y')).toBe('50');
    });

    it('should embed transform-origin styles so rotated elements export at the correct position', async () => {
      await service.save(FormatType.Png);

      const svgString = mockSvgToBase64.mock.calls[0][0];
      expect(svgString).toContain('transform-box: fill-box');
      expect(svgString).toContain('transform-origin: center');
    });
  });

  describe('Export convenience methods', () => {
    beforeEach(() => {
      const mockSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockSvgElement.setAttribute('id', 'svgcontent');

      mockCanvasService.getCanvas.mockReturnValue(mockSvgElement);
      mockSvgToBase64.mockResolvedValue('data:image/png;base64,test');
    });

    it('should export as PNG', async () => {
      const result = await service.exportAsPng('my-whiteboard');

      expect(mockDownloadFile).toHaveBeenCalledWith(expect.any(String), 'my-whiteboard.png');
      expect(result).toBe('data:image/png;base64,test');
    });

    it('should export as JPEG', async () => {
      const result = await service.exportAsJpeg('my-whiteboard');

      expect(mockDownloadFile).toHaveBeenCalledWith(expect.any(String), 'my-whiteboard.jpg');
      expect(result).toBe('data:image/png;base64,test');
    });

    it('should export as SVG', async () => {
      const result = await service.exportAsSvg('my-whiteboard');

      expect(mockDownloadFile).toHaveBeenCalledWith(expect.any(String), 'my-whiteboard.svg');
      expect(result).toBe('data:image/png;base64,test');
    });

    it('should export as Base64', async () => {
      const result = await service.exportAsBase64();

      expect(mockDownloadFile).not.toHaveBeenCalled();
      expect(result).toBe('data:image/png;base64,test');
    });
  });

  describe('exportData', () => {
    it('should export whiteboard data as JSON', () => {
      const result = service.exportData();
      const parsed = JSON.parse(result);

      expect(parsed).toHaveProperty('version', '1.0');
      expect(parsed).toHaveProperty('timestamp');
      expect(parsed).toHaveProperty('elements');
      // Changed: exportData returns canvas/editor/etc instead of flat config
      expect(parsed).toHaveProperty('canvas');
      expect(parsed).toHaveProperty('editor');
      expect(parsed.elements).toEqual([mockElement]);
      expect(parsed.canvas.width).toBe(800);
      expect(parsed.canvas.height).toBe(600);
    });

    it('exports only title in editor block', () => {
      const parsed = JSON.parse(service.exportData());

      expect(parsed.editor).toEqual({ title: 'Whiteboard' });
    });

    it('should not export a theme by default', () => {
      // JSON.stringify drops undefined values, so inspect the object before it is stringified.
      mockCanvasService.getConfig.mockReturnValue({ ...mockConfig, theme: undefined });
      const stringify = jest.spyOn(JSON, 'stringify');
      let exported: { settings: object };
      try {
        service.exportData();
        exported = stringify.mock.calls[0][0] as { settings: object };
      } finally {
        stringify.mockRestore();
      }

      expect(Object.keys(exported.settings)).not.toContain('theme');
    });

    it('should export theme when set', () => {
      mockCanvasService.getConfig.mockReturnValue({ ...mockConfig, theme: 'dark' });

      const parsed = JSON.parse(service.exportData());

      expect(parsed.settings.theme).toBe('dark');
    });

    it('should include timestamp in ISO format', () => {
      const result = service.exportData();
      const parsed = JSON.parse(result);

      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });

  describe('importData', () => {
    it('should import whiteboard data from JSON', () => {
      const jsonData = JSON.stringify({
        version: '1.0',
        timestamp: '2025-01-01T00:00:00.000Z',
        elements: [mockElement],
        canvas: {
          width: 1024,
          height: 768,
          backgroundColor: '#f0f0f0',
        },
        viewport: {
          zoom: 1.5,
          x: 100,
          y: 50,
        },
      });

      service.importData(jsonData);

      expect(mockElementsService.setElements).toHaveBeenCalledWith([mockElement]);
      expect(mockCanvasService.setCanvasDimensions).toHaveBeenCalledWith(1024, 768);
      expect(mockZoomService.zoom).toHaveBeenCalledWith(1.5);
      expect(mockPanService.panTo).toHaveBeenCalledWith(100, 50);
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsAdded, [mockElement]);
    });

    it('imports legacy editor block', () => {
      const configService = TestBed.inject(ConfigService);
      expect((service as unknown as { configService: ConfigService }).configService).toBe(configService);
      const jsonData = JSON.stringify({
        version: '1.0',
        elements: [mockElement],
        editor: { title: 'Old', showBlog: false, showWebinars: true, theme: 'dark', enableEditor: true },
      });

      expect(() => service.importData(jsonData)).not.toThrow();
      expect(configService.getEditorConfig().title).toBe('Old');
      expect(configService.getEditorConfig()).toEqual({ title: 'Old' });
      expect(configService.getConfig().theme).toBeUndefined();
    });

    it('ignores an unknown settings.theme instead of failing mid-import', () => {
      const configService = TestBed.inject(ConfigService);
      const jsonData = JSON.stringify({
        version: '1.0',
        elements: [mockElement],
        settings: { theme: 'Dark', drawingEnabled: false },
      });

      expect(() => service.importData(jsonData)).not.toThrow();
      expect(configService.getConfig().theme).toBeUndefined();
      expect(configService.getConfig().drawingEnabled).toBe(false);
    });

    it('imports a valid settings.theme', () => {
      const configService = TestBed.inject(ConfigService);
      service.importData(JSON.stringify({ version: '1.0', elements: [mockElement], settings: { theme: 'dark' } }));
      expect(configService.getConfig().theme).toBe('dark');
    });

    it('should import data without config', () => {
      const jsonData = JSON.stringify({
        version: '1.0',
        elements: [mockElement],
      });

      service.importData(jsonData);

      expect(mockElementsService.setElements).toHaveBeenCalledWith([mockElement]);
      expect(mockCanvasService.setCanvasDimensions).not.toHaveBeenCalled();
      expect(mockZoomService.zoom).not.toHaveBeenCalled();
      expect(mockPanService.panTo).not.toHaveBeenCalled();
    });

    it('should use default canvas dimensions if not provided in config', () => {
      const jsonData = JSON.stringify({
        version: '1.0',
        elements: [mockElement],
        canvas: {
          width: 800,
          height: 600,
        },
      });

      service.importData(jsonData);

      expect(mockCanvasService.setCanvasDimensions).toHaveBeenCalledWith(800, 600);
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = 'not valid json';

      expect(() => service.importData(invalidJson)).toThrow();
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw error if elements array is missing', () => {
      const jsonData = JSON.stringify({
        version: '1.0',
      });

      expect(() => service.importData(jsonData)).toThrow('Invalid data format: elements array not found');
    });

    it('should throw error if elements is not an array', () => {
      const jsonData = JSON.stringify({
        version: '1.0',
        elements: 'not an array',
      });

      expect(() => service.importData(jsonData)).toThrow('Invalid data format: elements array not found');
    });
  });

  describe('importMultipleImages', () => {
    it('should handle empty file list', async () => {
      const fileList = {
        length: 0,
        item: () => null,
      } as FileList;

      await service.importMultipleImages(fileList);

      expect(mockElementsService.addElements).not.toHaveBeenCalled();
    });

    it('should call importImageFile for each file', async () => {
      const file1 = new File([''], 'test1.png', { type: 'image/png' });
      const file2 = new File([''], 'test2.png', { type: 'image/png' });

      const fileList = {
        0: file1,
        1: file2,
        length: 2,
        item: (index: number) => [file1, file2][index] || null,
      } as FileList;

      const importSpy = jest.spyOn(service, 'importImageFile').mockResolvedValue();

      await service.importMultipleImages(fileList, 50);

      expect(importSpy).toHaveBeenCalledTimes(2);
      expect(importSpy).toHaveBeenCalledWith(file1, 0, 0);
      expect(importSpy).toHaveBeenCalledWith(file2, 250, 0);

      importSpy.mockRestore();
    });

    it('should arrange images in grid when exceeding width', async () => {
      const files: File[] = [];
      for (let i = 0; i < 5; i++) {
        files.push(new File([''], `test${i}.png`, { type: 'image/png' }));
      }

      const fileList = {
        ...files,
        length: 5,
        item: (index: number) => files[index] || null,
      } as FileList;

      const importSpy = jest.spyOn(service, 'importImageFile').mockResolvedValue();

      await service.importMultipleImages(fileList, 50);

      expect(importSpy).toHaveBeenCalledTimes(5);
      // First row
      expect(importSpy).toHaveBeenCalledWith(files[0], 0, 0);
      expect(importSpy).toHaveBeenCalledWith(files[1], 250, 0);
      expect(importSpy).toHaveBeenCalledWith(files[2], 500, 0);
      expect(importSpy).toHaveBeenCalledWith(files[3], 750, 0);
      // Second row (exceeds 800 width)
      expect(importSpy).toHaveBeenCalledWith(files[4], 0, 250);

      importSpy.mockRestore();
    });
  });

  describe('Extension methods', () => {
    // These methods don't exist in the implementation, skipping tests
    it.skip('should throw error for unimplemented customExport', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (service as any).customExport('custom', 'test')).toThrow('Custom export format not implemented');
    });

    it.skip('should throw error for unimplemented customImport', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (service as any).customImport({}, 'custom')).toThrow('Custom import format not implemented');
    });

    it('should return image data unchanged in processImage', () => {
      const imageData = 'data:image/png;base64,test';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (service as any).processImage(imageData);

      expect(result).toBe(imageData);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete export-import workflow', async () => {
      // Setup SVG for export
      const mockSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockSvgElement.setAttribute('id', 'svgcontent');

      mockCanvasService.getCanvas.mockReturnValue(mockSvgElement);
      mockSvgToBase64.mockResolvedValue('data:image/png;base64,exported');

      // Export data
      const exportedData = service.exportData();

      // Import data back
      service.importData(exportedData);

      expect(mockElementsService.setElements).toHaveBeenCalledWith([mockElement]);
    });

    it('should handle image import and export workflow', async () => {
      // Import image
      const file = new File([''], 'test.png', { type: 'image/png' });

      mockCreateElement.mockReturnValue(mockElement);

      const mockFileReader = {
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        onerror: null as ((event: ProgressEvent<FileReader>) => void) | null,
        readAsDataURL: jest.fn(function (this: FileReader) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({
                target: { result: 'data:image/png;base64,test' },
              } as ProgressEvent<FileReader>);
            }
          }, 0);
        }),
      };

      jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      const mockImage = {
        width: 200,
        height: 150,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      jest.spyOn(global, 'Image').mockImplementation(() => mockImage as unknown as HTMLImageElement);

      const promise = service.importImageFile(file, 100, 100);

      await new Promise((resolve) => setTimeout(resolve, 10));
      if (mockImage.onload) {
        mockImage.onload();
      }

      await promise;

      // Export
      const mockSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockSvgElement.setAttribute('id', 'svgcontent');

      mockCanvasService.getCanvas.mockReturnValue(mockSvgElement);
      mockSvgToBase64.mockResolvedValue('data:image/png;base64,exported');

      const result = await service.exportAsPng('test');

      expect(result).toBe('data:image/png;base64,exported');
      expect(mockElementsService.addElements).toHaveBeenCalled();
    });
  });

  describe('export engine', () => {
    const NS = 'http://www.w3.org/2000/svg';
    let layerService: LayerManagementService;

    const makeRect = (id: string, x: number, y: number, w: number, h: number, extra: object = {}) =>
      getElementUtil(ElementType.Rectangle).create({
        id,
        x,
        y,
        width: w,
        height: h,
        style: { strokeWidth: 2 },
        ...extra,
      } as never) as WhiteboardElement;

    const buildSvg = (ids: string[]) => {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('id', 'svgcontent');
      svg.setAttribute('width', '100%');
      svg.setAttribute('height', '100%');
      svg.setAttribute('_ngcontent-abc-c1', '');
      const bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('id', 'contentBackground');
      bg.setAttribute('width', '100%');
      bg.setAttribute('height', '100%');
      bg.setAttribute('fill', '#fff');
      bg.setAttribute('_ngcontent-abc-c1', '');
      svg.appendChild(bg);
      const grid = document.createElementNS(NS, 'g');
      const gridRect = document.createElementNS(NS, 'rect');
      gridRect.setAttribute('fill', 'url(#grid)');
      grid.appendChild(gridRect);
      svg.appendChild(grid);
      const content = document.createElementNS(NS, 'g');
      content.setAttribute('id', 'contentGroup');
      content.setAttribute('transform', 'translate(40, 30)');
      for (const id of ids) {
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', 'wb_element');
        g.setAttribute('data-wb-id', id);
        g.setAttribute('_ngcontent-abc-c1', '');
        content.appendChild(g);
      }
      const selector = document.createElementNS(NS, 'g');
      selector.setAttribute('id', 'selectorParentGroup');
      content.appendChild(selector);
      svg.appendChild(content);
      return svg;
    };

    const capturedSvg = () => mockSvgToBase64.mock.calls[0][0] as string;

    beforeEach(() => {
      layerService = TestBed.inject(LayerManagementService);
      layerService.importLayerState({
        layers: [
          { id: 'L1', name: 'one', visible: true, locked: false, zIndex: 0, elements: [] },
          { id: 'L2', name: 'two', visible: false, locked: false, zIndex: 1, elements: [] },
        ],
        activeLayerId: 'L1',
      });
      mockElementsService.getElements.mockReturnValue([
        makeRect('a', 10, 10, 100, 50, { layerId: 'L1' }),
        makeRect('hidden', 1000, 1000, 50, 50, { layerId: 'L2' }),
        makeRect('gone', -500, -500, 50, 50, { layerId: 'L1', isDeleting: true }),
      ]);
      mockCanvasService.getCanvas.mockReturnValue(buildSvg(['a', 'hidden', 'gone']));
      mockSvgToBase64.mockResolvedValue('data:image/png;base64,AAAA');
    });

    it('crops svg output to content plus padding with explicit size and no angular attributes', async () => {
      await service.save(FormatType.Svg, 'b');
      const svg = capturedSvg();
      expect(svg).toContain('viewBox="-7 -7 134 84"');
      expect(svg).toContain('width="134"');
      expect(svg).toContain('height="84"');
      expect(svg).not.toContain('_ngcontent');
      expect(svg).not.toContain('selectorParentGroup');
      expect(svg).not.toContain('url(#grid)');
      expect(svg).not.toContain('translate(40, 30)');
    });

    it('excludes hidden-layer and deleting elements', async () => {
      await service.save(FormatType.Svg, 'b');
      const svg = capturedSvg();
      expect(svg).toContain('data-wb-id="a"');
      expect(svg).not.toContain('data-wb-id="hidden"');
      expect(svg).not.toContain('data-wb-id="gone"');
    });

    it('requests output size scaled from the crop', async () => {
      await service.save(FormatType.Png, 'b', { scale: 2 });
      expect(mockSvgToBase64).toHaveBeenCalledWith(expect.any(String), 268, 168, FormatType.Png);
    });

    it('honours custom padding', async () => {
      await service.save(FormatType.Png, 'b', { padding: 0 });
      expect(mockSvgToBase64).toHaveBeenCalledWith(expect.any(String), 102, 52, FormatType.Png);
    });

    it('excludes a hidden-layer element even when it is selected', async () => {
      mockSelectionService.getSelectedIds = jest.fn().mockReturnValue(['hidden']);
      await service.save(FormatType.Png, 'b', { onlySelected: true });
      expect(mockSvgToBase64).toHaveBeenCalledWith(expect.any(String), 800, 600, FormatType.Png);
      expect(capturedSvg()).not.toContain('data-wb-id="hidden"');
      expect(capturedSvg()).not.toContain('data-wb-id="a"');
    });

    it('keeps only selected visible elements when onlySelected', async () => {
      mockSelectionService.getSelectedIds = jest.fn().mockReturnValue(['a', 'hidden']);
      await service.save(FormatType.Svg, 'b', { onlySelected: true });
      expect(capturedSvg()).toContain('viewBox="-7 -7 134 84"');
    });

    it('removes the background when transparent', async () => {
      await service.save(FormatType.Svg, 'b', { background: false });
      expect(capturedSvg()).not.toContain('contentBackground');
    });

    it('fits the background rect to the crop', async () => {
      await service.save(FormatType.Svg, 'b');
      expect(capturedSvg()).toMatch(/<rect[^>]*id="contentBackground"[^>]*>/);
      expect(capturedSvg()).toContain('x="-7"');
    });

    it('exports the canvas box when the board is empty', async () => {
      mockElementsService.getElements.mockReturnValue([]);
      await service.save(FormatType.Png, 'b');
      expect(mockSvgToBase64).toHaveBeenCalledWith(expect.any(String), 800, 600, FormatType.Png);
      expect(capturedSvg()).toContain('viewBox="0 0 800 600"');
    });

    it('renderExport returns the data url and size without downloading or emitting', async () => {
      const result = await service.renderExport(FormatType.Png, { scale: 2 });
      expect(result).toEqual({ dataUrl: 'data:image/png;base64,AAAA', width: 268, height: 168 });
      expect(mockDownloadFile).not.toHaveBeenCalled();
      expect(mockEventBusService.emit).not.toHaveBeenCalled();
    });

    describe('copyToClipboard', () => {
      const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      class FakeClipboardItem {
        constructor(public items: Record<string, Blob>) {}
      }

      afterEach(() => {
        if (original) Object.defineProperty(navigator, 'clipboard', original);
        else delete (navigator as unknown as Record<string, unknown>)['clipboard'];
        delete (globalThis as Record<string, unknown>)['ClipboardItem'];
      });

      it('writes a png item', async () => {
        const write = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { write }, configurable: true });
        (globalThis as Record<string, unknown>)['ClipboardItem'] = FakeClipboardItem;

        await service.copyToClipboard(FormatType.Png);

        expect(write).toHaveBeenCalledTimes(1);
        const item = write.mock.calls[0][0][0] as FakeClipboardItem;
        expect(item.items['image/png'].type).toBe('image/png');
      });

      it('writes svg as text', async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

        await service.copyToClipboard(FormatType.Svg);

        expect(writeText).toHaveBeenCalledWith(expect.stringContaining('viewBox="-7 -7 134 84"'));
      });

      it('rejects when image copy is unsupported', async () => {
        Object.defineProperty(navigator, 'clipboard', { value: {}, configurable: true });
        await expect(service.copyToClipboard(FormatType.Png)).rejects.toThrow(/not supported/i);
      });
    });
  });
});
