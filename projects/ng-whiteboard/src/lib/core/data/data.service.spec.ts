import { RendererFactory2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { RectangleElement } from '../elements';
import { EventBusService } from '../event-bus/event-bus.service';
import { AddImage, ElementType, FormatType, ToolType, WhiteboardElement, WhiteboardEvent } from '../types';
import * as utils from '../utils';
import { DataService } from './data.service';
import {
  ITEM_PREFIX,
  MAX_STACK_SIZE,
  SELECTOR_BOX_PREFIX,
  SELECTOR_GRIP_PREFIX,
  SELECTOR_GROUP_ID,
  SVG_ROOT_ID,
} from '../constants';

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  svgToBase64: jest.fn().mockResolvedValue('data:image/png;base64,...'),
}));

describe('DataService', () => {
  let service: DataService;
  let mockElement: RectangleElement;
  let eventBusMock: any;
  let configMock: any;
  let rendererFactoryMock: any;
  let rendererMock: any;

  beforeEach(() => {
    eventBusMock = {
      emit: jest.fn(),
    };
    configMock = {
      getConfig: jest.fn().mockReturnValue({
        zoom: 1,
        x: 0,
        y: 0,
        elementsTranslation: { x: 0, y: 0 },
        canvasWidth: 800,
        canvasHeight: 600,
        enableGrid: false,
      }),
      updateConfig: jest.fn(),
    };
    rendererMock = {
      createRenderer: jest.fn().mockReturnValue({
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
      }),
    };
    rendererFactoryMock = {
      createRenderer: jest.fn().mockReturnValue(rendererMock),
    };

    TestBed.configureTestingModule({
      providers: [
        DataService,
        { provide: EventBusService, useValue: eventBusMock },
        { provide: ConfigService, useValue: configMock },
        { provide: RendererFactory2, useValue: rendererFactoryMock },
      ],
    });

    mockElement = {
      id: '1',
      type: ElementType.Rectangle,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rx: 0,
      rotation: 0,
      opacity: 100,
      style: {
        fill: '#000',
        strokeWidth: 1,
      },
    };

    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toggleGrid', () => {
    it('should toggle grid visibility', () => {
      service.toggleGrid();
      expect(configMock.updateConfig).toHaveBeenCalledWith({ enableGrid: true });
    });
  });

  describe('setActiveTool', () => {
    it('should set the active tool', () => {
      service.setActiveTool(ToolType.Eraser);
      expect(service.getActiveTool()).toBe(ToolType.Eraser);
    });
  });
  describe('fullScreen', () => {
    it('should set canvas dimensions to container dimensions', () => {
      const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      Object.defineProperty(svgContainer, 'clientWidth', { value: 1024 });
      Object.defineProperty(svgContainer, 'clientHeight', { value: 768 });
      service.initializeWhiteboard(svgContainer);
      service.fullScreen();
      expect(configMock.updateConfig).toHaveBeenCalledWith({ canvasWidth: 1024, canvasHeight: 768 });
    });
  });

  describe('centerCanvas', () => {
    it('should center the canvas within the container', () => {
      const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      Object.defineProperty(svgContainer, 'clientWidth', { value: 1024 });
      Object.defineProperty(svgContainer, 'clientHeight', { value: 768 });
      service.initializeWhiteboard(svgContainer);
      service.centerCanvas();
      expect(configMock.updateConfig).toHaveBeenCalledWith({ x: 112, y: 84 });
    });
  });

  describe('addImage', () => {
    let mockImage: AddImage;
    let imageOnload: () => void;

    beforeEach(() => {
      mockImage = { image: 'https://via.placeholder.com/150', x: 10, y: 20 };

      Object.defineProperty(Image.prototype, 'onload', {
        configurable: true,
        get() {
          return this._onload;
        },
        set(fn) {
          imageOnload = fn;
          this._onload = fn;
        },
      });
    });

    it('should add an image element to the whiteboard', () => {
      // Arrange
      jest.spyOn(eventBusMock, 'emit');
      service.selectElement = jest.fn();

      // Act
      service.addImage(mockImage);
      imageOnload?.();

      // Assert
      expect(service.getData().length).toBe(1);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ImageAdded, mockImage.image);
    });
  });

  describe('save', () => {
    it('should save the whiteboard as an image', async () => {
      // Arrange
      const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      svgContainer.setAttribute('id', 'svgcontent');

      const selectorParentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      selectorParentGroup.setAttribute('id', 'selectorParentGroup');
      svgContainer.appendChild(selectorParentGroup);

      const contentBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      contentBackground.setAttribute('id', 'contentBackground');
      contentBackground.setAttribute('opacity', '0.5');
      svgContainer.appendChild(contentBackground);

      jest.spyOn(service, 'getCanvas').mockReturnValue(svgContainer);
      jest.spyOn(utils, 'downloadFile').mockImplementation(jest.fn());

      // Act
      await service.save(FormatType.Png, 'Test board');

      // Assert
      expect(utils.downloadFile).toHaveBeenCalledWith('data:image/png;base64,...', 'Test board');
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Save, 'data:image/png;base64,...');
    });
  });

  describe('Initialization & Setup', () => {
    it('should initialize the whiteboard', () => {
      const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      service.initializeWhiteboard(svgContainer);
      expect(service.svgContainer).toBe(svgContainer);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Ready);
    });

    it('should return the SVG container when initialized', () => {
      const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      service.initializeWhiteboard(svgContainer);
      const result = service.getCanvas();
      expect(result).toBe(svgContainer);
    });

    it('should throw an error if SVG container is not initialized', () => {
      expect(() => service.getCanvas()).toThrow('SVG container not initialized');
    });
  });

  describe('Data Management', () => {
    it('should initialize with empty data', () => {
      expect(service.getData()).toEqual([]);
    });

    it('should return the data$ observable', (done) => {
      // Arrange
      const mockData: WhiteboardElement[] = [
        {
          id: '1',
          type: ElementType.Ellipse,
        } as WhiteboardElement,
        {
          id: '2',
          type: ElementType.Rectangle,
        } as WhiteboardElement,
      ];

      // Act
      service.setData(mockData);

      // Assert
      service.getData$().subscribe((data) => {
        expect(data).toEqual(mockData);
        done();
      });
    });

    it('should set new data and emit DataChange event', () => {
      const testData = [mockElement];
      service.setData(testData);
      expect(service.getData()).toEqual(testData);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.DataChange, testData);
    });

    it('should push the current state to undo stack', () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          type: ElementType.Rectangle,
        } as WhiteboardElement,
      ];
      service.setData(mockData);

      // Act
      service.pushToUndo();

      // Assert
      expect(service['undoStack'].length).toBe(1);
      expect(service['undoStack'][0]).toEqual(mockData);
    });

    it('should clear the redo stack after pushing to undo', () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          type: ElementType.Rectangle,
        } as WhiteboardElement,
      ];

      service['redoStack'] = [[{ id: '1', type: ElementType.Rectangle }] as WhiteboardElement[]];
      service.setData(mockData);

      // Act
      service.pushToUndo();

      // Assert
      expect(service['redoStack']).toEqual([]);
    });

    it('should limit undo stack size to MAX_STACK_SIZE', () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          type: ElementType.Rectangle,
        } as WhiteboardElement,
      ];
      service.setData(mockData);

      // Act
      for (let i = 0; i < MAX_STACK_SIZE + 2; i++) {
        service.pushToUndo();
      }

      // Assert: undo stack size should be MAX_STACK_SIZE
      expect(service['undoStack'].length).toBe(MAX_STACK_SIZE);
    });

    it('should deep clone the data before pushing to undo stack', () => {
      // Arrange
      const mockData = [
        {
          id: '1',
          type: ElementType.Rectangle,
        } as WhiteboardElement,
      ];
      service.setData(mockData);

      // Act
      service.pushToUndo();

      // Modify original data
      service.setData([{ id: '2', type: ElementType.Ellipse }] as WhiteboardElement[]);

      // Assert: The undo stack should still have the original data
      expect(service['undoStack'][0]).toEqual(mockData);
    });

    it('should undo last operation', () => {
      service.addElement(mockElement);
      service.undo();
      expect(service.getData().length).toBe(0);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Undo);
    });

    it('should return false if no operations to undo', () => {
      expect(service.undo()).toBe(false);
    });

    it('should redo last undone operation', () => {
      service.addElement(mockElement);
      service.pushToUndo();
      service.undo();
      service.redo();
      expect(service.getData()).toContainEqual(mockElement);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Redo);
    });

    it('should return false if no operations to redo', () => {
      expect(service.redo()).toBe(false);
    });

    it('should clear all data and emit Clear event', () => {
      service.addElement(mockElement);
      service.clear();
      expect(service.getData().length).toBe(0);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Clear);
    });
  });

  describe('Element Management', () => {
    it('should add element to data array and emit ElementAdded event', () => {
      service.addElement(mockElement);
      expect(service.getData()).toContain(mockElement);
      expect(service.getData().length).toBe(1);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementAdded, mockElement);
    });

    it('should add elements to the current data', () => {
      // Arrange
      const initialData = [{ id: '1', type: ElementType.Ellipse }] as WhiteboardElement[];
      service.setData(initialData);

      const newElements = [
        { id: '2', type: ElementType.Rectangle },
        { id: '3', type: ElementType.Arrow },
      ] as WhiteboardElement[];

      // Act
      service.addElements(newElements);

      // Assert
      const updatedData = service.getData();
      expect(updatedData.length).toBe(3);
      expect(updatedData).toEqual([
        { id: '1', type: ElementType.Ellipse },
        { id: '2', type: ElementType.Rectangle },
        { id: '3', type: ElementType.Arrow },
      ]);
    });

    it('should commit draft elements to data and emit DataChange event', () => {
      service.addToDraft(mockElement);
      service.commitDraftToData();
      expect(service.getData()).toContain(mockElement);
      expect(service.getData().length).toBe(1);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.DataChange, service.getData());
    });

    it('should add an element to the draft data', () => {
      // Arrange
      const newElement: WhiteboardElement = { id: '1', type: ElementType.Rectangle } as WhiteboardElement;
      expect(service.getDraftData()).toEqual([]);

      // Act
      service.addToDraft(newElement);

      // Assert
      const draftData = service.getDraftData();
      expect(draftData.length).toBe(1);
      expect(draftData[0]).toEqual(newElement);
    });

    it('should update an existing element in the draft data', () => {
      // Arrange
      const element1 = { id: '1', type: ElementType.Rectangle } as WhiteboardElement;
      const element2 = { id: '1', type: ElementType.Ellipse } as WhiteboardElement;
      service.addToDraft(element1);

      // Act
      service.updateDraft(element2);

      // Assert
      const draftData = service.getDraftData();
      expect(draftData.length).toBe(1);
      expect(draftData[0]).toEqual(element2);
    });

    it('should not update an element in the draft if it does not exist', () => {
      // Arrange
      const element1 = { id: '1', type: ElementType.Rectangle } as WhiteboardElement;
      const element2 = { id: '2', type: ElementType.Ellipse } as WhiteboardElement;

      service.addToDraft(element1);

      // Act
      service.updateDraft(element2);

      // Assert
      const draftData = service.getDraftData();
      expect(draftData.length).toBe(1);
      expect(draftData[0]).toEqual(element1);
    });

    it('should commit draft data to the main data and clear the draft', () => {
      // Arrange
      const element1 = { id: '1', type: ElementType.Rectangle } as WhiteboardElement;
      const element2 = { id: '2', type: ElementType.Ellipse } as WhiteboardElement;

      service.addToDraft(element1);
      service.addToDraft(element2);

      // Act
      service.commitDraftToData();

      // Assert
      const data = service.getData();
      expect(data.length).toBe(2);
      expect(data).toEqual([element1, element2]);
      const draftData = service.getDraftData();
      expect(draftData.length).toBe(0);
      expect(eventBusMock.emit).toHaveBeenCalledWith('dataChange', data);
    });

    it('should not commit draft data if draft is empty', () => {
      // Act
      service.commitDraftToData();

      // Assert
      const data = service.getData();
      expect(data.length).toBe(0);
      expect(service.getDraftData().length).toBe(0);
      expect(eventBusMock.emit).not.toHaveBeenCalled();
    });

    it('should update existing element and emit ElementUpdated event', () => {
      service.addElement(mockElement);
      const updatedElement: RectangleElement = { ...mockElement, width: 200, style: { ...mockElement.style } };
      service.updateElement(updatedElement);
      expect((service.getData()[0] as RectangleElement).width).toBe(200);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementUpdated, updatedElement);
    });

    it('should not modify array when updating non-existent element', () => {
      service.addElement(mockElement);
      const nonExistentElement = { ...mockElement, id: '2', width: 200 };
      service.updateElement(nonExistentElement);
      expect((service.getData()[0] as RectangleElement).width).toBe(100);
    });

    it('should remove existing element from data array and emit ElementDeleted event', () => {
      service.addElement(mockElement);
      service.removeElement(mockElement.id);
      expect(service.getData()).not.toContain(mockElement);
      expect(service.getData().length).toBe(0);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementDeleted, mockElement);
    });

    it('should not modify array when removing non-existent element', () => {
      service.addElement(mockElement);
      const nonExistentElement = { ...mockElement, id: '2' };
      service.removeElement(nonExistentElement.id);
      expect(service.getData().length).toBe(1);
    });

    it('should return true if the element exists in data', () => {
      // Arrange
      const existingElement = { id: '1', type: ElementType.Ellipse } as WhiteboardElement;
      const newData: WhiteboardElement[] = [existingElement];
      service.setData(newData);

      // Act
      const result = service.hasElement(existingElement);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if the element does not exist in data', () => {
      // Arrange
      const existingElement = { id: '1', type: ElementType.Ellipse } as WhiteboardElement;
      const nonExistingElement = { id: '2', type: ElementType.Rectangle } as WhiteboardElement;
      const newData: WhiteboardElement[] = [existingElement];
      service.setData(newData);

      // Act
      const result = service.hasElement(nonExistingElement);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if data is empty', () => {
      // Arrange
      const elementToCheck = { id: '1', type: ElementType.Ellipse } as WhiteboardElement;
      service.setData([]);

      // Act
      const result = service.hasElement(elementToCheck);

      // Assert
      expect(result).toBe(false);
    });

    it('should return bounding box when element is found', () => {
      // Arrange
      const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
      service.initializeWhiteboard(svgContainer);
      service.showGrips = jest.fn();

      const element = { id: '1', type: ElementType.Rectangle } as WhiteboardElement;
      const mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGGraphicsElement;
      mockElement.id = 'item_1';
      mockElement.getBBox = jest.fn().mockReturnValue({ x: 10, y: 20, width: 30, height: 40 });

      svgContainer.appendChild(mockElement);

      // Act
      const bbox = service.getElementBbox(element);

      // Assert
      expect(mockElement.getBBox).toHaveBeenCalled();
      expect(bbox).toEqual({ x: 10, y: 20, width: 30, height: 40 });
    });
  });

  describe('Tool management', () => {
    it('should set/get the active tool', () => {
      service.setActiveTool(ToolType.Line);
      expect(service.getActiveTool()).toBe(ToolType.Line);
    });

    it('should select and deselect an element', () => {
      service.getElementBbox = jest.fn();
      service.showGrips = jest.fn();

      service.addElement(mockElement);
      service.selectElement(mockElement);
      expect(service.getSelectedElement()).toBe(mockElement);

      service.selectElement(null);
      expect(service.getSelectedElement()).toBeNull();
    });

    it('should update the selected element', () => {
      service.getElementBbox = jest.fn();
      service.showGrips = jest.fn();

      service.addElement(mockElement);
      service.selectElement(mockElement);
      service.updateSelectedElement({ width: 200 });
      expect((service.getSelectedElement() as RectangleElement).width).toBe(200);
    });
  });
  describe('Mouse & Coordinate Handling', () => {
    it('should return correct canvas coordinates', () => {
      const coordinates = service.getCanvasCoordinates([100, 100]);
      expect(coordinates).toEqual([100, 100]);
    });
  });
  describe('Visual Elements Management', () => {
    it('should update the rubberBox configuration when an element is selected', () => {
      // Arrange
      service.getElementBbox = jest.fn().mockReturnValue({ x: 10, y: 20, width: 100, height: 200 });

      service.selectElement({
        id: '1',
        style: {
          strokeWidth: 2,
        },
      } as WhiteboardElement);

      const bbox = { x: 10, y: 20, width: 100, height: 200 } as DOMRect;
      const expectedConfig = {
        rubberBox: {
          x: bbox.x - 2 * 0.5,
          y: bbox.y - 2 * 0.5,
          width: bbox.width + 2,
          height: bbox.height + 2,
          display: 'block',
        },
      };

      // Act
      service.showGrips(bbox);

      // Assert
      expect(configMock.updateConfig).toHaveBeenCalledWith(expectedConfig);
    });

    it('should not update the rubberBox configuration if no element is selected', () => {
      // Arrange
      service.getSelectedElement = jest.fn(() => null);
      const bbox = { x: 10, y: 20, width: 100, height: 200 } as DOMRect;

      // Act
      service.showGrips(bbox);

      // Assert
      expect(configMock.updateConfig).not.toHaveBeenCalled(); // It should not call updateConfig
    });

    it('should calculate rubberBox correctly when strokeWidth is 0', () => {
      // Arrange
      const elementWithNoStrokeWidth = {
        id: '2',
        style: {
          strokeWidth: 0,
        },
      } as WhiteboardElement;
      service.getSelectedElement = jest.fn(() => elementWithNoStrokeWidth);
      const bbox = { x: 10, y: 20, width: 100, height: 200 } as DOMRect;
      const expectedConfig = {
        rubberBox: {
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
          display: 'block',
        },
      };

      // Act
      service.showGrips(bbox);

      // Assert
      expect(configMock.updateConfig).toHaveBeenCalledWith(expectedConfig);
    });
    // showGrips(bbox: DOMRect) {
    //   const currentElement = this.getSelectedElement();
    //   if (!currentElement) {
    //     return;
    //   }
    //   this.configService.updateConfig({
    //     rubberBox: {
    //       x: bbox.x - ((currentElement.style.strokeWidth as number) || 0) * 0.5,
    //       y: bbox.y - ((currentElement.style.strokeWidth as number) || 0) * 0.5,
    //       width: bbox.width + (currentElement.style.strokeWidth as number) || 0,
    //       height: bbox.height + (currentElement.style.strokeWidth as number) || 0,
    //       display: 'block',
    //     },
    //   });
    // }
    // resetGrips(): void {
    //   this.configService.updateConfig({
    //     rubberBox: {
    //       x: 0,
    //       y: 0,
    //       width: 0,
    //       height: 0,
    //       display: 'none',
    //     },
    //   });
    // }
    // setCanvasDimensions(width: number, height: number): void {
    //   this.configService.updateConfig({ canvasWidth: width, canvasHeight: height });
    // }
    // setCanvasPosition(x: number, y: number): void {
    //   this.configService.updateConfig({ x, y });
    // }
    // updateGridTranslation(dx: number, dy: number): void {
    //   this.configService.updateConfig({ gridTranslation: { x: dx, y: dy } });
    // }
    // updateElementsTranslation(dx: number, dy: number): void {
    //   this.configService.updateConfig({ elementsTranslation: { x: dx, y: dy } });
    // }
    // fullScreen(): void {
    //   const containerWidth = this.svgContainer?.clientWidth || 0;
    //   const containerHeight = this.svgContainer?.clientHeight || 0;
    //   this.setCanvasDimensions(containerWidth, containerHeight);
    // }
    // centerCanvas(): void {
    //   const { canvasWidth, canvasHeight, zoom } = this.getConfig();
    //   const containerWidth = this.svgContainer?.clientWidth || 0;
    //   const containerHeight = this.svgContainer?.clientHeight || 0;
    //   const centerX = (containerWidth - canvasWidth * zoom) / 2;
    //   const centerY = (containerHeight - canvasHeight * zoom) / 2;
    //   this.setCanvasPosition(centerX, centerY);
    // }
    // toggleGrid(): void {
    //   const { enableGrid } = this.getConfig();
    //   this.configService.updateConfig({ enableGrid: !enableGrid });
    // }
  });
  describe('Actions', () => {
    // addImage(imageInfo: AddImage): void {
    //   const tempImg = new Image();
    //   tempImg.onload = () => {
    //     const svgHeight = this.getConfig().canvasHeight;
    //     const imageWidth = tempImg.width;
    //     const imageHeight = tempImg.height;
    //     const aspectRatio = tempImg.width / tempImg.height;
    //     const height = imageHeight > svgHeight ? svgHeight - 40 : imageHeight;
    //     const width = height === svgHeight - 40 ? (svgHeight - 40) * aspectRatio : imageWidth;
    //     let x = imageInfo.x || (imageWidth - width) * (imageInfo.x || 0);
    //     let y = imageInfo.y || (imageHeight - height) * (imageInfo.y || 0);
    //     if (x < 0) {
    //       x = 0;
    //     }
    //     if (y < 0) {
    //       y = 0;
    //     }
    //     const element = createElement(ElementType.Image, {
    //       src: imageInfo.image,
    //       width,
    //       height,
    //       x,
    //       y,
    //     });
    //     this.addElement(element);
    //     this.selectElement(element);
    //     this.pushToUndo();
    //     this.EventBusService.emit(WhiteboardEvent.ImageAdded, element.src);
    //   };
    //   tempImg.src = imageInfo.image as string;
    // }
    //  save(format: FormatType, name = 'New board'): Promise<void> {
    //   const svgElement = this.getCanvas().getElementById('svgcontent') as SVGSVGElement;
    //   const svgClone = svgElement.cloneNode(true) as SVGSVGElement;
    //   const selectorParentGroup = svgClone.querySelector('#selectorParentGroup');
    //   if (selectorParentGroup) {
    //     selectorParentGroup.remove();
    //   }
    //   const contentBackground = svgClone.querySelector('#contentBackground');
    //   if (contentBackground) {
    //     contentBackground.removeAttribute('opacity');
    //   }
    //   svgClone.setAttribute('x', '0');
    //   svgClone.setAttribute('y', '0');
    //   const svgString = new XMLSerializer().serializeToString(svgClone);
    //   const imageString = await svgToBase64(
    //     svgString,
    //     this.getConfig().canvasWidth,
    //     this.getConfig().canvasHeight,
    //     format
    //   );
    //   switch (format) {
    //     case FormatType.Base64:
    //       this.EventBusService.emit(WhiteboardEvent.Save, imageString);
    //       break;
    //     case FormatType.Svg: {
    //       const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    //       downloadFile(imgSrc, name);
    //       this.EventBusService.emit(WhiteboardEvent.Save, imgSrc);
    //       break;
    //     }
    //     default:
    //       downloadFile(imageString, name);
    //       this.EventBusService.emit(WhiteboardEvent.Save, imageString);
    //       break;
    //   }
    // }
  });
});
