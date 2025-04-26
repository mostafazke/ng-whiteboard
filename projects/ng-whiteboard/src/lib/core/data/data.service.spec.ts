import { RendererFactory2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ConfigService } from '../config/config.service';
import { MAX_STACK_SIZE } from '../constants';
import { ImageElement, RectangleElement } from '../elements';
import { EventBusService } from '../event-bus/event-bus.service';
import { AddImage, ElementType, FormatType, ToolType, WhiteboardElement, WhiteboardEvent } from '../types';
import { DataService } from './data.service';

import * as fileUtils from '../utils/common/file';

jest.mock('../utils/common', () => ({
  ...jest.requireActual('../utils/common'),
}));

jest.mock('../utils/drawing', () => ({
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
      service.selectElements = jest.fn();

      // Act
      service.addImage(mockImage);
      imageOnload?.();

      // Assert
      expect(service.getData().length).toBe(1);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ImageAdded, mockImage.image);
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
      service.addElements(mockElement);
      service.undo();
      expect(service.getData().length).toBe(0);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Undo);
    });

    it('should return false if no operations to undo', () => {
      expect(service.undo()).toBe(false);
    });

    it('should redo last undone operation', () => {
      service.addElements(mockElement);
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
      service.addElements(mockElement);
      service.clear();
      expect(service.getData().length).toBe(0);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Clear);
    });
  });

  describe('Element Management', () => {
    it('should add element to data array and emit ElementsAdded event', () => {
      service.addElements(mockElement);
      expect(service.getData()).toContain(mockElement);
      expect(service.getData().length).toBe(1);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsAdded, [mockElement]);
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
      // Clear any previous calls to emit
      jest.clearAllMocks();

      // Add the element first
      service.addElements(mockElement);
      jest.clearAllMocks(); // Clear the events from addElements

      // Update the element
      const updatedElement: RectangleElement = { ...mockElement, width: 200, style: { ...mockElement.style } };
      service.updateElements(updatedElement);

      // Verify the data was updated
      expect((service.getData()[0] as RectangleElement).width).toBe(200);

      // Verify the events were emitted in the correct order
      expect(eventBusMock.emit).toHaveBeenCalledTimes(2);
      expect(eventBusMock.emit).toHaveBeenNthCalledWith(1, WhiteboardEvent.DataChange, expect.any(Array));
      expect(eventBusMock.emit).toHaveBeenNthCalledWith(2, WhiteboardEvent.ElementsUpdated, [updatedElement]);
    });

    it('should not modify array when updating non-existent element', () => {
      service.addElements(mockElement);
      const nonExistentElement = { ...mockElement, id: '2', width: 200 };
      service.updateElements(nonExistentElement);
      expect((service.getData()[0] as RectangleElement).width).toBe(100);
    });

    it('should remove existing element from data array and emit ElementsDeleted event', () => {
      service.addElements(mockElement);
      service.removeElements([mockElement.id]);
      expect(service.getData()).not.toContain(mockElement);
      expect(service.getData().length).toBe(0);
      expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementsDeleted);
    });

    it('should not modify array when removing non-existent element', () => {
      service.addElements(mockElement);
      const nonExistentElement = { ...mockElement, id: '2' };
      service.removeElements([nonExistentElement.id]);
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
  });

  describe('Tool management', () => {
    it('should set/get the active tool', () => {
      service.setActiveTool(ToolType.Line);
      expect(service.getActiveTool()).toBe(ToolType.Line);
    });

    it('should select and deselect an element', () => {
      service.addElements(mockElement);
      service.selectElements(mockElement);
      expect(service.getSelectedIds()[0]).toBe(mockElement.id);

      service.clearSelection();
      expect(service.getSelectedIds()).toEqual([]);
    });

    it('should update the selected element', () => {
      service.addElements(mockElement);
      service.selectElements(mockElement);
      service.updateSelectedElements({ width: 200 });
      expect((service.getSelectedElements()[0] as RectangleElement).width).toBe(200);
    });
  });

  describe('Visual Elements Management', () => {
    describe('setCanvasDimensions', () => {
      it('should update canvas dimensions in the config', () => {
        service.setCanvasDimensions(1024, 768);
        expect(configMock.updateConfig).toHaveBeenCalledWith({ canvasWidth: 1024, canvasHeight: 768 });
      });
    });

    describe('setCanvasPosition', () => {
      it('should update canvas position in the config', () => {
        service.setCanvasPosition(100, 200);
        expect(configMock.updateConfig).toHaveBeenCalledWith({ x: 100, y: 200 });
      });
    });

    describe('updateGridTranslation', () => {
      it('should update grid translation in the config', () => {
        service.updateGridTranslation(10, 20);
        expect(configMock.updateConfig).toHaveBeenCalledWith({ gridTranslation: { x: 10, y: 20 } });
      });
    });

    describe('updateElementsTranslation', () => {
      it('should update elements translation in the config', () => {
        service.updateElementsTranslation(15, 25);
        expect(configMock.updateConfig).toHaveBeenCalledWith({ elementsTranslation: { x: 15, y: 25 } });
      });
    });

    describe('fullScreen', () => {
      it('should set canvas dimensions to match container dimensions', () => {
        const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
        Object.defineProperty(svgContainer, 'clientWidth', { value: 1920 });
        Object.defineProperty(svgContainer, 'clientHeight', { value: 1080 });
        service.initializeWhiteboard(svgContainer);

        service.fullScreen();

        expect(configMock.updateConfig).toHaveBeenCalledWith({ canvasWidth: 1920, canvasHeight: 1080 });
      });
    });

    describe('centerCanvas', () => {
      it('should center the canvas within the container', () => {
        const svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
        Object.defineProperty(svgContainer, 'clientWidth', { value: 1200 });
        Object.defineProperty(svgContainer, 'clientHeight', { value: 800 });
        service.initializeWhiteboard(svgContainer);

        configMock.getConfig.mockReturnValue({
          canvasWidth: 1000,
          canvasHeight: 600,
          zoom: 1,
        });

        service.centerCanvas();

        expect(configMock.updateConfig).toHaveBeenCalledWith({ x: 100, y: 100 });
      });
    });

    describe('toggleGrid', () => {
      it('should toggle the grid visibility', () => {
        configMock.getConfig.mockReturnValue({ enableGrid: false });

        service.toggleGrid();

        expect(configMock.updateConfig).toHaveBeenCalledWith({ enableGrid: true });
      });

      it('should toggle the grid visibility off', () => {
        configMock.getConfig.mockReturnValue({ enableGrid: true });

        service.toggleGrid();

        expect(configMock.updateConfig).toHaveBeenCalledWith({ enableGrid: false });
      });
    });
  });
  describe('Actions', () => {
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
        service.selectElements = jest.fn();

        // Act
        service.addImage(mockImage);
        imageOnload?.();

        // Assert
        expect(service.getData().length).toBe(1);
        expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ImageAdded, mockImage.image);
      });

      it('should calculate correct dimensions for the image', () => {
        // Arrange
        jest.spyOn(eventBusMock, 'emit');
        service.selectElements = jest.fn();
        Object.defineProperty(Image.prototype, 'width', { value: 300 });
        Object.defineProperty(Image.prototype, 'height', { value: 600 });

        // Act
        service.addImage(mockImage);
        imageOnload?.();

        // Assert
        const addedImage = service.getData()[0] as ImageElement;
        expect(addedImage.width).toBe(300);
        expect(addedImage.height).toBe(600);
      });

      it('should calculate correct dimensions for the image when it fits within canvas height', () => {
        // Arrange
        jest.spyOn(eventBusMock, 'emit');
        service.selectElements = jest.fn();
        Object.defineProperty(Image.prototype, 'width', { value: 200 });
        Object.defineProperty(Image.prototype, 'height', { value: 100 });

        // Act
        service.addImage(mockImage);
        imageOnload?.();

        // Assert
        const addedImage = service.getData()[0] as ImageElement;
        expect(addedImage.width).toBe(200);
        expect(addedImage.height).toBe(100);
      });

      it('should set x and y to 0 if calculated values are negative', () => {
        // Arrange
        jest.spyOn(eventBusMock, 'emit');
        service.selectElements = jest.fn();
        Object.defineProperty(Image.prototype, 'width', { value: 300 });
        Object.defineProperty(Image.prototype, 'height', { value: 600 });

        const negativePositionImage = { image: 'https://via.placeholder.com/150', x: -10, y: -20 };

        // Act
        service.addImage(negativePositionImage);
        imageOnload?.();

        // Assert
        const addedImage = service.getData()[0];
        expect(addedImage.x).toBe(0);
        expect(addedImage.y).toBe(0);
      });

      it('should emit ImageAdded event with the correct image source', () => {
        // Arrange
        jest.spyOn(eventBusMock, 'emit');

        // Act
        service.addImage(mockImage);
        imageOnload?.();

        // Assert
        expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.ImageAdded, mockImage.image);
      });

      it('should call selectElements with the newly added image', () => {
        // Arrange
        const selectElementsSpy = jest.spyOn(service, 'selectElements');

        // Act
        service.addImage(mockImage);
        imageOnload?.();

        // Assert
        const addedImage = service.getData()[0];
        expect(selectElementsSpy).toHaveBeenCalledWith(addedImage);
      });

      it('should push the new image to the undo stack', () => {
        // Arrange
        const pushToUndoSpy = jest.spyOn(service, 'pushToUndo');

        // Act
        service.addImage(mockImage);
        imageOnload?.();

        // Assert
        expect(pushToUndoSpy).toHaveBeenCalled();
      });
    });
    describe('save', () => {
      let svgContainer: SVGSVGElement;
      let selectorParentGroup: SVGGElement;
      let contentBackground: SVGRectElement;

      beforeEach(() => {
        svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
        svgContainer.setAttribute('id', 'svgcontent');

        selectorParentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        selectorParentGroup.setAttribute('id', 'selectorParentGroup');
        svgContainer.appendChild(selectorParentGroup);

        contentBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        contentBackground.setAttribute('id', 'contentBackground');
        contentBackground.setAttribute('opacity', '0.5');
        svgContainer.appendChild(contentBackground);

        jest.spyOn(service, 'getCanvas').mockReturnValue(svgContainer);
        jest.spyOn(fileUtils, 'downloadFile').mockImplementation(jest.fn());
      });

      it('should save the whiteboard as a Base64 image', () => {
        // Act
        service.save(FormatType.Base64, 'Test board').then(() => {
          // Assert
          expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Save, 'data:image/png;base64,...');
        });
      });

      it('should save the whiteboard as an SVG file', () => {
        // Act
        service.save(FormatType.Svg, 'Test board').then(() => {
          // Assert
          expect(fileUtils.downloadFile).toHaveBeenCalledWith(
            expect.stringContaining('data:image/svg+xml;base64,'),
            'Test board'
          );
          expect(eventBusMock.emit).toHaveBeenCalledWith(
            WhiteboardEvent.Save,
            expect.stringContaining('data:image/svg+xml;base64,')
          );
        });
      });

      it('should save the whiteboard as a PNG file by default', () => {
        // Act
        service.save(FormatType.Png, 'Test board').then(() => {
          // Assert
          expect(fileUtils.downloadFile).toHaveBeenCalledWith('data:image/png;base64,...', 'Test board');
          expect(eventBusMock.emit).toHaveBeenCalledWith(WhiteboardEvent.Save, 'data:image/png;base64,...');
        });
      });

      it('should remove the selectorParentGroup element from the SVG before saving', () => {
        // Act
        service.save(FormatType.Png, 'Test board').then(() => {
          // Assert
          expect(svgContainer.querySelector('#selectorParentGroup')).toBeNull();
        });
      });

      it('should remove the opacity attribute from the contentBackground element before saving', () => {
        // Act
        service.save(FormatType.Png, 'Test board').then(() => {
          // Assert
          expect(contentBackground.getAttribute('opacity')).toBeNull();
        });
      });

      it('should set the x and y attributes of the SVG to 0 before saving', () => {
        // Act
        service.save(FormatType.Png, 'Test board').then(() => {
          // Assert
          expect(svgContainer.getAttribute('x')).toBe('0');
          expect(svgContainer.getAttribute('y')).toBe('0');
        });
      });
    });
  });
});
