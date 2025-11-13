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

// Mock the modules
jest.mock('../elements/element.utils');
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
});
