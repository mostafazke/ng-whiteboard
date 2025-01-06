import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { StrokeOptions, getStroke } from 'perfect-freehand';
import {
  ElementTypeEnum,
  FormatType,
  IAddImage,
  LineCapEnum,
  LineJoinEnum,
  NgWhiteboardComponent,
  NgWhiteboardService,
  WhiteboardElement,
} from '../';
import { ToolsEnum } from './models/tools.enum';
import Utils from './ng-whiteboard.utils';
import { DataService } from './core/data/data.service';
import { BehaviorSubject } from 'rxjs';

describe('NgWhiteboardComponent', () => {
  let component: NgWhiteboardComponent;
  let fixture: ComponentFixture<NgWhiteboardComponent>;
  let mockDataService: jest.Mocked<DataService>;

  beforeEach(() => {
    mockDataService = {
      undoDraw: jest.fn(),
      redoDraw: jest.fn(),
      clearDraw: jest.fn(),
      addElement: jest.fn(),
      removeElement: jest.fn(),
      getData: jest.fn(),
      setData: jest.fn(),
      data$: new BehaviorSubject<WhiteboardElement[]>([]).asObservable(),
    } as unknown as jest.Mocked<DataService>;
  });
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NgWhiteboardComponent],
      providers: [NgWhiteboardService, { provide: DataService, useValue: mockDataService }],
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgWhiteboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    jest.restoreAllMocks();
  });

  it('should create instance', () => {
    expect(component).toBeDefined();
  });
  describe('initialize', () => {
    it('should have an svg with id #svgroot', () => {
      const svgroot = fixture.nativeElement.querySelector('#svgroot');

      expect(svgroot).toBeDefined();
      expect(svgroot instanceof SVGElement).toBeTruthy();
    });

    it(`should have data property as array`, () => {
      expect(component.data).toBeDefined();
      expect(Array.isArray(component.data)).toBeTruthy();
    });

    it('should initialize the service observables', () => {
      expect(component['_subscriptionList'].length).toBe(10);
    });

    it('should return if drawingEnabled is false', () => {
      // arrange
      jest.spyOn(component, 'handleStartEvent');
      const element = document.createElement('svg');
      document.body.appendChild(element);
      component.drawingEnabled = false;
      // act
      element.dispatchEvent(
        new MouseEvent('mousedown', {
          view: window,
        })
      );
      // assert
      expect(component.handleStartEvent).not.toHaveBeenCalled();
    });

    it('should not trigger drag event before start event', () => {
      // arrange
      jest.spyOn(component, 'handleDragEvent');
      const element = document.createElement('svg');
      document.body.appendChild(element);
      // act
      element.dispatchEvent(
        new MouseEvent('mousemove', {
          view: window,
        })
      );
      // assert
      expect(component.handleDragEvent).not.toHaveBeenCalled();
    });
  });
  describe('ngOnChanges', () => {
    it('should update component options with provided values', () => {
      // arrange
      const options = {
        selectedTool: ToolsEnum.RECT,
        drawingEnabled: true,
        canvasWidth: 100,
        canvasHeight: 100,
        fullScreen: true,
        center: true,
        strokeColor: '#fff',
        strokeWidth: 5,
        backgroundColor: '#000',
        lineJoin: LineJoinEnum.ROUND,
        lineCap: LineCapEnum.ROUND,
        fill: '#000',
        zoom: 1,
        fontFamily: 'arial',
        fontSize: 16,
        dasharray: 'string',
        dashoffset: 0,
        x: 0,
        y: 0,
        enableGrid: true,
        gridSize: 16,
        snapToGrid: true,
      };
      // act
      component.options = options;
      component.ngOnChanges({
        options: {
          firstChange: true,
          currentValue: options,
          previousValue: {},
          isFirstChange: () => true,
        },
      });
      // assert
      expect(component.selectedTool).toBe(ToolsEnum.RECT);
      expect(component.drawingEnabled).toBe(true);
      expect(component.canvasWidth).toBe(100);
      expect(component.canvasHeight).toBe(100);
      expect(component.fullScreen).toBe(true);
      expect(component.center).toBe(true);
      expect(component.strokeColor).toBe('#fff');
      expect(component.strokeWidth).toBe(5);
      expect(component.backgroundColor).toBe('#000');
      expect(component.lineJoin).toBe(LineJoinEnum.ROUND);
      expect(component.lineCap).toBe(LineCapEnum.ROUND);
      expect(component.fill).toBe('#000');
      expect(component.zoom).toBe(1);
      expect(component.fontFamily).toBe('arial');
      expect(component.fontSize).toBe(16);
      expect(component.dasharray).toBe('string');
      expect(component.dashoffset).toBe(0);
      expect(component.x).toBe(0);
      expect(component.y).toBe(0);
      expect(component.enableGrid).toBe(true);
      expect(component.gridSize).toBe(16);
      expect(component.snapToGrid).toBe(true);
    });
  });
  describe('ngAfterViewInit', () => {
    it('should emit ready event', () => {
      // arrange
      jest.spyOn(component.ready, 'emit');
      // act
      component.ngAfterViewInit();
      // assert
      expect(component.ready.emit).toHaveBeenCalled();
    });
  });
  describe('ngOnDestroy', () => {
    it('should unsubscribe from events', () => {
      // arrange
      jest.spyOn(component['_subscriptionList'][0], 'unsubscribe');
      // act
      component.ngOnDestroy();
      // assert
      expect(component['_subscriptionList'][0].unsubscribe).toHaveBeenCalled();
    });
  });
  describe('handleStartEvent', () => {
    it('should call the correct handler based on the selected tool', () => {
      // arrange
      component.selectedTool = ToolsEnum.BRUSH;
      component.handleStartBrush = jest.fn();
      component.handleImageTool = jest.fn();
      component.handleStartLine = jest.fn();
      component.handleStartRect = jest.fn();
      component.handleStartEllipse = jest.fn();
      component.handleTextTool = jest.fn();
      component.handleSelectTool = jest.fn();
      component.handleEraserTool = jest.fn();
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;

      // act
      component.handleStartEvent(mockDownEvent);

      // assert
      expect(component.handleStartBrush).toHaveBeenCalled();
      expect(component.handleImageTool).not.toHaveBeenCalled();
      expect(component.handleStartLine).not.toHaveBeenCalled();
      expect(component.handleStartRect).not.toHaveBeenCalled();
      expect(component.handleStartEllipse).not.toHaveBeenCalled();
      expect(component.handleTextTool).not.toHaveBeenCalled();
      expect(component.handleSelectTool).not.toHaveBeenCalled();
      expect(component.handleEraserTool).not.toHaveBeenCalled();
    });
  });
  describe('handleDragEvent', () => {
    it('should call the correct handler based on the selected tool', () => {
      // arrange
      component.selectedTool = ToolsEnum.BRUSH;
      component.handleDragBrush = jest.fn();
      component.handleDragLine = jest.fn();
      component.handleDragRect = jest.fn();
      component.handleDragEllipse = jest.fn();
      component.handleTextDrag = jest.fn();
      const mockMoveEvent = new MouseEvent('pointermove') as PointerEvent;

      // act
      component.handleDragEvent(mockMoveEvent);

      // assert
      expect(component.handleDragBrush).toHaveBeenCalled();
      expect(component.handleDragLine).not.toHaveBeenCalled();
      expect(component.handleDragRect).not.toHaveBeenCalled();
      expect(component.handleDragEllipse).not.toHaveBeenCalled();
      expect(component.handleTextDrag).not.toHaveBeenCalled();
    });
  });
  describe('handleEndEvent', () => {
    it('should call the correct handler based on the selected tool', () => {
      // arrange
      component.selectedTool = ToolsEnum.BRUSH;
      component.handleEndBrush = jest.fn();
      component.handleEndLine = jest.fn();
      component.handleEndRect = jest.fn();
      component.handleEndEllipse = jest.fn();
      component.handleTextEnd = jest.fn();
      const mockUpEvent = new MouseEvent('pointerup') as PointerEvent;

      // act
      component.handleEndEvent(mockUpEvent);

      // assert
      expect(component.handleEndBrush).toHaveBeenCalled();
      expect(component.handleEndLine).not.toHaveBeenCalled();
      expect(component.handleEndRect).not.toHaveBeenCalled();
      expect(component.handleEndEllipse).not.toHaveBeenCalled();
      expect(component.handleTextEnd).not.toHaveBeenCalled();
    });
  });
  describe('handleBrushShape', () => {
    let getStrokeOptions: StrokeOptions;
    beforeAll(() => {
      getStrokeOptions = {
        size: 1,
        smoothing: 1,
        thinning: 0,
        streamline: 0.9,
      };
    });
    describe('StartBrush', () => {
      it('should create Brush element', () => {
        // arrange
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleStartBrush(mockDownEvent);
        const outlinePoints = getStroke(component.tempDraw, getStrokeOptions);
        const data = Utils.getSvgPathFromStroke(outlinePoints);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.BRUSH);
        expect(component.tempElement.value).toBe(data);
        expect(component.data.length).toBe(1);
      });
    });
    describe('DragBrush', () => {
      it('should update Brush element value', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.BRUSH, {});
        component.tempDraw = [[100, 200]];
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleDragBrush(mockDownEvent);
        const outlinePoints = getStroke(component.tempDraw, getStrokeOptions);
        const data = Utils.getSvgPathFromStroke(outlinePoints);
        // assert
        expect(component.tempElement.value).toBe(data);
      });
    });
    describe('EndBrush', () => {
      it('should push Brush element to data', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.BRUSH, {});
        component.tempDraw = [[100, 200]];
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });

        // act
        component.handleEndBrush(mockDownEvent);

        // assert
        expect(component.tempElement).toBeNull();
        expect(component.tempDraw).toBeNull();
      });
    });
  });
  describe('handleImageTool', () => {
    it('should add image to component when file is uploaded', () => {
      // Arrange
      const input = document.createElement('input');
      const file = new File(['image'], 'image.png', { type: 'image/png' });
      jest.spyOn(document, 'createElement').mockReturnValue(input);
      jest.spyOn(input, 'click');
      jest.spyOn(input, 'addEventListener').mockImplementation((event, callback) => {
        if (event === 'change' && typeof callback === 'function') {
          const customEvent = new Event('change');
          Object.defineProperty(customEvent, 'target', {
            value: { files: [file] },
            writable: false,
          });
          callback(customEvent);
        }
      });
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;

      // Act
      component.handleImageTool(mockDownEvent);

      // Assert
      expect(input.click).toHaveBeenCalled();
      // expect(readerMock.readAsDataURL).toHaveBeenCalledWith(file);
      // expect(addImageSpy).toHaveBeenCalledWith({ image: readerResult, x: expect.any(Number), y: expect.any(Number) });
    });
  });
  describe('handleSelectTool', () => {
    beforeEach(() => {
      const initialData = [
        new WhiteboardElement(ElementTypeEnum.BRUSH, {}),
        new WhiteboardElement(ElementTypeEnum.RECT, {
          x1: 100,
          y1: 100,
          x2: 200,
          y2: 200,
          width: 10,
          height: 10,
        }),
        new WhiteboardElement(ElementTypeEnum.TEXT, {}),
      ];

      component.data = initialData;
      Object.defineProperty(global.SVGElement.prototype, 'getBBox', {
        configurable: true,
        writable: true,
        value: jest.fn().mockReturnValue({
          x: 0,
          y: 0,
        }),
      });
      fixture.detectChanges();
    });

    it('should clear selected element if mouse target is null', () => {
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      component['_getMouseTarget'] = jest.fn().mockReturnValue(null);

      component.handleSelectTool(mockDownEvent);
      expect(component.selectedElement).toBeNull();
    });

    it('should clear selected element if mouse target is the "selectorGroup"', () => {
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;

      const selectorGroup: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      selectorGroup.setAttribute('id', 'selectorGroup');
      component['_getMouseTarget'] = jest.fn().mockReturnValue(selectorGroup);

      component.handleSelectTool(mockDownEvent);

      expect(component.selectedElement).toBeUndefined();
    });

    it('should select the clicked element', () => {
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;

      const element = component.data[1];
      const elementNode = document.getElementById('item_' + element.id);
      component['_getMouseTarget'] = jest.fn().mockReturnValue(elementNode);
      component.handleSelectTool(mockDownEvent);
      expect(component.selectedElement).toEqual(element);
    });
  });
  describe('handleEraserTool', () => {
    beforeEach(() => {
      const initialData = [new WhiteboardElement(ElementTypeEnum.BRUSH, {})];

      component.data = initialData;

      fixture.detectChanges();
    });
    it('should not remove element if mouse_target not defined', () => {
      component['_getMouseTarget'] = jest.fn().mockReturnValue(null);
      const emitSpy = jest.spyOn(component.deleteElement, 'emit');
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;

      expect(component.data.length).toEqual(1);

      component.handleEraserTool(mockDownEvent);

      expect(component.data.length).toEqual(1);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should remove element from data and emit deleteElement', () => {
      const element = component.data[0];
      const elementNode = document.getElementById('item_' + element.id);
      component['_getMouseTarget'] = jest.fn().mockReturnValue(elementNode);
      const emitSpy = jest.spyOn(component.deleteElement, 'emit');
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;

      expect(component.data.length).toEqual(1);

      component.handleEraserTool(mockDownEvent);

      expect(component.data.length).toEqual(0);
      expect(emitSpy).toHaveBeenCalled();
    });
  });
  describe('handleLineShape', () => {
    describe('StartLine', () => {
      it('should create Line element', () => {
        // arrange
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });

        // act
        component.handleStartLine(mockDownEvent);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.LINE);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
        expect(component.data.length).toBe(1);
      });
      it('should start from grid snap if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleStartLine(mockDownEvent);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.LINE);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
      });
    });
    describe('DragLine', () => {
      it('should update Line element x2 y2', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.LINE, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleDragLine(mockDownEvent);
        // assert
        expect(component.tempElement.options.x2).toBe(100);
        expect(component.tempElement.options.y2).toBe(200);
      });
      it('should snap x2 and y2 to grid size if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        const element = new WhiteboardElement(ElementTypeEnum.LINE, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleDragLine(mockDownEvent);
        // assert
        expect(component.tempElement.options.x2).toBe(100);
        expect(component.tempElement.options.y2).toBe(200);
      });
      it('should snap x2 and y2 to specified angle when shift key is pressed', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.LINE, {});
        element.options.x1 = 1;
        element.options.y1 = 1;
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown', {
          shiftKey: true,
        }) as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 1 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 0 });
        // act
        component.handleDragLine(mockDownEvent);
        // assert
        expect(component.tempElement.options.x2).toEqual(1);
        expect(component.tempElement.options.y2).toEqual(0);
      });
    });
    describe('EndLine', () => {
      it('should push LINE to data if x1 is not equal to x2 or y1 is not equal to y2', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.LINE, {});
        element.options.x1 = 0;
        element.options.y1 = 0;
        element.options.x2 = 0;
        element.options.y2 = 10;
        component.tempElement = element;

        component.handleEndLine();
        expect(component.tempElement).toBeNull();
      });
    });
  });
  describe('handleArrowShape', () => {
    describe('StartArrow', () => {
      it('should create Arrow element', () => {
        // arrange
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });

        // act
        component.handleStartArrow(mockDownEvent);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.ARROW);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
        expect(component.data.length).toBe(1);
      });
      it('should start from grid snap if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleStartArrow(mockDownEvent);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.ARROW);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
      });
    });
    describe('DragArrow', () => {
      it('should update Arrow element x2 y2', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ARROW, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleDragArrow(mockDownEvent);
        // assert
        expect(component.tempElement.options.x2).toBe(100);
        expect(component.tempElement.options.y2).toBe(200);
      });
      it('should snap x2 and y2 to grid size if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        const element = new WhiteboardElement(ElementTypeEnum.ARROW, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleDragArrow(mockDownEvent);
        // assert
        expect(component.tempElement.options.x2).toBe(100);
        expect(component.tempElement.options.y2).toBe(200);
      });
      it('should snap x2 and y2 to specified angle when shift key is pressed', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ARROW, {});
        element.options.x1 = 1;
        element.options.y1 = 1;
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown', {
          shiftKey: true,
        }) as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 1 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 0 });
        // act
        component.handleDragArrow(mockDownEvent);
        // assert
        expect(component.tempElement.options.x2).toEqual(1);
        expect(component.tempElement.options.y2).toEqual(0);
      });
    });
    describe('EndArrow', () => {
      it('should push ARROW to data if x1 is not equal to x2 or y1 is not equal to y2', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ARROW, {});
        element.options.x1 = 0;
        element.options.y1 = 0;
        element.options.x2 = 0;
        element.options.y2 = 10;
        component.tempElement = element;

        component.handleEndArrow();
        expect(component.tempElement).toBeNull();
      });
    });
  });
  describe('handleRectShape', () => {
    describe('StartRect', () => {
      it('should create Rect element', () => {
        // arrange
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleStartRect(mockDownEvent);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.RECT);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
        expect(component.tempElement.options.x2).toBe(100);
        expect(component.tempElement.options.y2).toBe(200);
        expect(component.tempElement.options.width).toBe(1);
        expect(component.tempElement.options.height).toBe(1);
        expect(component.data.length).toBe(1);
      });
      it('should start from grid snap if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleStartRect(mockDownEvent);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.RECT);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
      });
    });
    describe('DragRect', () => {
      it('should update Rect element width,height,x2,y2', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.RECT, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleDragRect(mockDownEvent);
        // assert
        const width = Math.abs(100 - 0);
        const height = Math.abs(200 - 0);
        expect(component.tempElement.options.width).toBe(width);
        expect(component.tempElement.options.height).toBe(height);
        expect(component.tempElement.options.x2).toBe(0);
        expect(component.tempElement.options.y2).toBe(0);
      });
      it('should snap x2 and y2 to grid size if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        const element = new WhiteboardElement(ElementTypeEnum.RECT, {});
        element.options.x1 = 10;
        element.options.y1 = 20;
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 98 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 197 });
        // act
        component.handleDragRect(mockDownEvent);
        // assert
        expect(component.tempElement.options.width).toBe(90);
        expect(component.tempElement.options.height).toBe(180);
        expect(component.tempElement.options.x2).toBe(10);
        expect(component.tempElement.options.y2).toBe(20);
      });
      it('should snap x2 and y2 to specified angle when shift key is pressed', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.RECT, {});
        element.options.x1 = 10;
        element.options.y1 = 20;
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown', {
          shiftKey: true,
        }) as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 190 });
        // act
        component.handleDragRect(mockDownEvent);
        // assert
        expect(component.tempElement.options.width).toBe(180);
        expect(component.tempElement.options.height).toBe(180);
        expect(component.tempElement.options.x2).toEqual(10);
        expect(component.tempElement.options.y2).toEqual(20);
      });
      it('should multiply and snap x2 and y2 to specified angle when alt key is pressed', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.RECT, {});
        element.options.x1 = 100;
        element.options.y1 = 200;
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown', {
          altKey: true,
        }) as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 10 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 20 });

        // act
        component.handleDragRect(mockDownEvent);
        // assert
        expect(component.tempElement.options.width).toBe(180);
        expect(component.tempElement.options.height).toBe(360);
        expect(component.tempElement.options.x2).toEqual(10);
        expect(component.tempElement.options.y2).toEqual(20);
      });
    });
    describe('EndRect', () => {
      it('should push Rect to data if width is not equal to 0 or height is not equal to 0', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.RECT, {});
        element.options.width = 0;
        element.options.height = 10;
        component.tempElement = element;

        component.handleEndRect();
        expect(component.tempElement).toBeNull();
      });
    });
  });
  describe('handleEllipseShape', () => {
    describe('StartEllipse', () => {
      it('should create Ellipse element', () => {
        // arrange
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });
        // act
        component.handleStartEllipse(mockDownEvent);
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.ELLIPSE);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
        expect(component.tempElement.options.cx).toBe(100);
        expect(component.tempElement.options.cy).toBe(200);
        expect(component.data.length).toBe(1);
      });
    });
    describe('DragEllipse', () => {
      it('should update Rect element width,height,x2,y2', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 200 });

        // act
        component.handleDragEllipse(mockDownEvent);
        // assert
        expect(component.tempElement.options.rx).toBe(50);
        expect(component.tempElement.options.ry).toBe(100);
        expect(component.tempElement.options.cx).toBe(50);
        expect(component.tempElement.options.cy).toBe(100);
      });
      it('should snap x2 and y2 to specified angle when shift key is pressed', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown', {
          shiftKey: true,
        }) as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 100 });
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 200 });
        // act
        component.handleDragEllipse(mockDownEvent);
        // assert
        expect(component.tempElement.options.ry).toBe(100);
        expect(component.tempElement.options.cy).toBe(100);
      });
      it('should multiply and snap x2 and y2 to specified angle when alt key is pressed', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
        component.tempElement = element;
        const mockDownEvent = new MouseEvent('pointerdown', {
          altKey: true,
        }) as PointerEvent;
        Object.defineProperty(mockDownEvent, 'offsetX', { value: 10 });
        Object.defineProperty(mockDownEvent, 'offsetY', { value: 20 });

        // act
        component.handleDragEllipse(mockDownEvent);
        // assert
        expect(component.tempElement.options.rx).toBe(10);
        expect(component.tempElement.options.ry).toBe(20);
      });
    });
    describe('EndEllipse', () => {
      it('should push Ellipse to data if rx is not equal to 0 or ry is not equal to 0', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
        element.options.rx = 0;
        element.options.ry = 10;
        component.tempElement = element;

        component.handleEndEllipse();
        expect(component.tempElement).toBeNull();
      });
    });
  });
  describe('handleTextTool', () => {
    beforeEach(() => {
      component.selectedTool = ToolsEnum.TEXT;
      fixture.detectChanges();
    });

    it('should finish the current text element if there is one', () => {
      // arrange
      const element = new WhiteboardElement(ElementTypeEnum.TEXT, {});
      component.tempElement = element;
      jest.spyOn(component, 'finishTextInput');
      const input = document.createElement('input');
      component['textInput'] = { nativeElement: input };
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      // act
      component.handleTextTool(mockDownEvent);

      // assert
      expect(component.tempElement).toBeNull();
      expect(component.finishTextInput).toHaveBeenCalled();
    });
    it('should create a new text element and set focus on text input', () => {
      // arrange
      const x = 200;
      const y = 100;
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      Object.defineProperty(mockDownEvent, 'offsetX', { value: x });
      Object.defineProperty(mockDownEvent, 'offsetY', { value: y });
      component['_getTargetElement'] = jest.fn().mockReturnValue(null);
      const element = new WhiteboardElement(ElementTypeEnum.TEXT, {});
      component['_generateNewElement'] = jest.fn().mockReturnValue(element);
      const input = document.createElement('input');
      component['textInput'] = { nativeElement: input };
      // act
      component.handleTextTool(mockDownEvent);

      // assert
      expect(component.tempElement).not.toBeNull();
      expect(component.tempElement.type).toBe(element.type);
      expect(component.tempElement.options.top).toBe(y);
      expect(component.tempElement.options.left).toBe(x);
    });
    it('should update existing element if clicked on text element', () => {
      // arrange
      const element = new WhiteboardElement(ElementTypeEnum.TEXT, {}, 'new text');
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      component['_getTargetElement'] = jest.fn().mockReturnValue(element);
      const input = document.createElement('input');
      component['textInput'] = { nativeElement: input };
      // act
      component.handleTextTool(mockDownEvent);

      // assert
      expect(component.tempElement).not.toBeNull();
      expect(component.tempElement.type).toBe(element.type);
      expect(component.tempElement.value).toBe(element.value);
    });

    it('should updates the text element position when dragging', () => {
      // arrange
      const x = 10;
      const y = 20;
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      Object.defineProperty(mockDownEvent, 'offsetX', { value: x });
      Object.defineProperty(mockDownEvent, 'offsetY', { value: y });
      component.tempElement = new WhiteboardElement(ElementTypeEnum.TEXT, {
        top: 0,
        left: 0,
      });

      // act
      component.handleTextDrag(mockDownEvent);

      // assert
      expect(component.tempElement.options.top).toBe(y);
      expect(component.tempElement.options.left).toBe(x);
    });
    it('should return if current text element undefiend', () => {
      // arrange
      jest.spyOn(component, 'handleTextDrag');
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      // act
      component.handleTextDrag(mockDownEvent);

      // assert
      expect(component.handleTextDrag).toHaveReturned();
    });

    it('should skip push the current element to undo if tempElement id not defined', () => {
      // arrange
      component['_pushToData'] = jest.fn();

      // act
      component.handleTextEnd();

      // assert
      expect(component['_pushToData']).not.toHaveBeenCalled();
    });
    it('should update text element value if tempElement exist', () => {
      // Arrange
      const element = new WhiteboardElement(ElementTypeEnum.TEXT, {});
      component.tempElement = element;
      component.selectedTool = ToolsEnum.TEXT;

      // Act
      component.updateTextItem('new value');

      // Assert
      expect(component.tempElement.value).toEqual('new value');
    });
  });
  describe('saveDraw', () => {
    it('should save the board as base64 and emit save event', async () => {
      // arrange
      const saveMock = jest.fn();
      component.save.subscribe(saveMock);
      Utils.svgToBase64 = jest.fn().mockReturnValue('');
      const svgcontent = fixture.nativeElement.querySelector('#svgcontent') as SVGElement;
      const selectorParentGroup = document.createElement('g');
      selectorParentGroup.setAttribute('id', 'selectorParentGroup');
      svgcontent.appendChild(selectorParentGroup);
      // act
      await component.saveDraw('image', FormatType.Base64);
      // assert
      expect(saveMock).toHaveBeenCalled();
    });
    it('should save the board as Svg and emit save event', async () => {
      // arrange
      const saveMock = jest.fn();
      component.save.subscribe(saveMock);
      Utils.svgToBase64 = jest.fn().mockReturnValue('');
      Utils.downloadFile = jest.fn();
      // act
      await component.saveDraw('image', FormatType.Svg);
      // assert
      expect(saveMock).toHaveBeenCalled();
    });
    it('should save the board as Png and emit save event', async () => {
      // arrange
      const saveMock = jest.fn();
      component.save.subscribe(saveMock);
      Utils.svgToBase64 = jest.fn().mockReturnValue('');
      Utils.downloadFile = jest.fn();
      // act
      await component.saveDraw('image', FormatType.Png);
      // assert
      expect(saveMock).toHaveBeenCalled();
    });
  });
  describe('addImage', () => {
    let mockImage: IAddImage;
    let imageOnload: () => void;

    beforeEach(() => {
      mockImage = {
        image: 'https://via.placeholder.com/150',
        x: 10,
        y: 20,
      };
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
    it('should add the image to the data and emit imageAdded event', () => {
      // arrange
      jest.spyOn(component.imageAdded, 'emit');
      // act
      component.addImage(mockImage);
      if (imageOnload) {
        imageOnload();
      }

      // assert
      expect(component.data.length).toBe(1);
      expect(component.imageAdded.emit).toHaveBeenCalled();
    });

    it('should revert x, y to 0 if less than 0', () => {
      // arrange
      mockImage = {
        image: 'https://via.placeholder.com/150',
        x: -5,
        y: -10,
      };
      // act
      component.addImage(mockImage);
      if (imageOnload) {
        imageOnload();
      }
      // assert
      expect(component.data[0].x).toBe(0);
      expect(component.data[0].y).toBe(0);
    });
  });
  describe('clearDraw', () => {
    it('should clear drawing data and emit "clear" event', () => {
      // Arrange
      const initialData = [new WhiteboardElement(ElementTypeEnum.BRUSH, {})];
      component.data = initialData;
      const spyClearEmit = jest.spyOn(component.clear, 'emit');

      // Act
      component.clearDraw();

      // Assert
      expect(component.data).toEqual([]);
      expect(spyClearEmit).toHaveBeenCalled();
    });
  });
  describe('undoDraw', () => {
    it('should not undo anything if the undo stack is empty', () => {
      // arrange
      const spyUndoEmit = jest.spyOn(component.undo, 'emit');

      // act
      component.undoDraw();

      // assert
      expect(spyUndoEmit).not.toHaveBeenCalled();
    });

    it('should undo the last draw action and emit the "undo" event', () => {
      // arrange
      const spyUndoEmit = jest.spyOn(component.undo, 'emit');
      const element = new WhiteboardElement(ElementTypeEnum.RECT, {});
      component['_pushToData'](element);

      // act
      component.undoDraw();

      // assert
      expect(spyUndoEmit).toHaveBeenCalled();
    });
  });
  describe('redoDraw', () => {
    it('should not redo anything when redoStack is empty', () => {
      // arrange
      const spyRedoEmit = jest.spyOn(component.redo, 'emit');

      // act
      component.redoDraw();

      // assert
      expect(spyRedoEmit).not.toHaveBeenCalled();
    });
    it('should redo the last undone action when redoStack is not empty', () => {
      // arrange
      const spyRedoEmit = jest.spyOn(component.redo, 'emit');
      const element = new WhiteboardElement(ElementTypeEnum.RECT, {});
      component['_pushToData'](element);
      component.undoDraw();

      // act
      component.redoDraw();

      // assert
      expect(spyRedoEmit).toHaveBeenCalled();
      expect(component.data).toContainEqual(element);
    });
  });
  describe('getMouseTarget', () => {
    it('should return null if event or event.target is null', () => {
      // Arrange
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;

      // Act
      const result = component['_getMouseTarget'](mockDownEvent);

      // Assert
      expect(result).toBeNull();
    });
    it('should return null if mouse target id is svgroot', () => {
      // Arrange
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      Object.defineProperty(mockDownEvent, 'target', { value: { id: 'svgroot' } });

      // Act
      const result = component['_getMouseTarget'](mockDownEvent);

      // Assert
      expect(result).toBeNull();
    });
    it('should return target if parent node is selectorGroup', () => {
      // Arrange
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      Object.defineProperty(mockDownEvent, 'target', {
        value: { id: 'mouse_target', parentNode: { parentNode: { id: 'selectorGroup' } } },
      });

      // Act
      const result = component['_getMouseTarget'](mockDownEvent);

      // Assert
      expect(result).toEqual((<SVGSVGElement>mockDownEvent.target).parentNode?.parentNode);
    });
    it('should return mouse target', () => {
      // Arrange
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      Object.defineProperty(mockDownEvent, 'target', {
        value: { id: 'mouse_target', parentNode: { parentNode: { id: 'item_123' } } },
      });

      // Act
      const result = component['_getMouseTarget'](mockDownEvent);

      // Assert
      expect(result).toEqual((<SVGSVGElement>mockDownEvent.target).parentNode?.parentNode);
    });
    it('should return null if mouse target id after bubbling is svgroot', () => {
      // Arrange
      const mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      Object.defineProperty(mockDownEvent, 'target', {
        value: { id: 'mouse_target', parentNode: { parentNode: { id: 'svgroot' } } },
      });

      // Act
      const result = component['_getMouseTarget'](mockDownEvent);

      // Assert
      expect(result).toEqual(null);
    });
  });
  describe('moveSelect', () => {
    let mockSelectedElement: WhiteboardElement;
    let mockElement: SVGGraphicsElement;
    let mockDownEvent: PointerEvent;
    let mockMoveEvent: MouseEvent;
    let mockUpEvent: MouseEvent;

    beforeEach(() => {
      mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      mockSelectedElement = new WhiteboardElement(ElementTypeEnum.RECT, {});

      mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      mockMoveEvent = new MouseEvent('pointermove');
      mockUpEvent = new MouseEvent('pointerup');

      Object.defineProperty(mockDownEvent, 'target', {
        configurable: true,
        writable: true,
        value: mockElement,
      });
      Object.defineProperty(mockMoveEvent, 'movementX', {
        configurable: true,
        writable: true,
        value: 10,
      });
      Object.defineProperty(mockMoveEvent, 'movementY', {
        configurable: true,
        writable: true,
        value: 20,
      });
    });

    it('should move selected element on pointermove event', () => {
      // Arrange
      mockSelectedElement.x = 45;
      mockSelectedElement.y = 30;
      component.selectedElement = mockSelectedElement;

      // Act
      component.moveSelect(mockDownEvent);
      mockElement.dispatchEvent(mockMoveEvent);

      // Assert
      expect(component.selectedElement.x).toEqual(55);
      expect(component.selectedElement.y).toEqual(50);
    });

    it('should not move selected element when pointer is not down', () => {
      // Arrange
      component.selectedElement = mockSelectedElement;

      // Act
      component.moveSelect(mockDownEvent);
      mockElement.dispatchEvent(mockUpEvent); // pointer is up
      mockElement.dispatchEvent(mockMoveEvent);

      // Assert
      expect(component.selectedElement.x).toEqual(0);
      expect(component.selectedElement.y).toEqual(0);
    });
  });
  describe('resizeSelect', () => {
    let mockSelectedElement: WhiteboardElement;
    let mockElement: SVGGraphicsElement;
    let mockDownEvent: PointerEvent;
    let mockMoveEvent: MouseEvent;
    let mockUpEvent: MouseEvent;

    beforeEach(() => {
      mockSelectedElement = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
      mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      mockDownEvent = new MouseEvent('pointerdown') as PointerEvent;
      mockMoveEvent = new MouseEvent('pointermove');
      mockUpEvent = new MouseEvent('pointerup');
      document.dispatchEvent(mockUpEvent);

      Object.defineProperty(mockDownEvent, 'target', {
        configurable: true,
        writable: true,
        value: mockElement,
      });
      Object.defineProperty(mockMoveEvent, 'movementX', {
        configurable: true,
        writable: true,
        value: 10,
      });
      Object.defineProperty(mockMoveEvent, 'movementY', {
        configurable: true,
        writable: true,
        value: 20,
      });
    });

    it('should call _resizeElipse if selectedElement type is ELLIPSE', () => {
      // Arrange
      component['_resizeElipse'] = jest.fn();
      component['_getElementBbox'] = jest.fn().mockReturnValue({});
      mockSelectedElement = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
      component.selectedElement = mockSelectedElement;

      // Act
      component.resizeSelect(mockDownEvent);
      document.dispatchEvent(mockMoveEvent);

      // Assert
      expect(component['_resizeElipse']).toHaveBeenCalled();
    });

    it('should call _resizeLine if selectedElement type is LINE', () => {
      // Arrange
      component['_resizeLine'] = jest.fn();
      component['_getElementBbox'] = jest.fn().mockReturnValue({});
      mockSelectedElement = new WhiteboardElement(ElementTypeEnum.LINE, {});
      component.selectedElement = mockSelectedElement;

      // Act
      component.resizeSelect(mockDownEvent);
      document.dispatchEvent(mockMoveEvent);

      // Assert
      expect(component['_resizeLine']).toHaveBeenCalled();
    });

    it('should call _resizeDefault if selectedElement type is RECT', () => {
      // Arrange
      component['_resizeDefault'] = jest.fn();
      component['_getElementBbox'] = jest.fn().mockReturnValue({});
      mockSelectedElement = new WhiteboardElement(ElementTypeEnum.RECT, {});
      component.selectedElement = mockSelectedElement;

      // Act
      component.resizeSelect(mockDownEvent);
      document.dispatchEvent(mockMoveEvent);

      // Assert
      expect(component['_resizeDefault']).toHaveBeenCalled();
    });

    it('should return if pointer is not down', () => {
      // Arrange
      component['_resizeElipse'] = jest.fn();
      component['_getElementBbox'] = jest.fn().mockReturnValue({});
      mockSelectedElement = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
      component.selectedElement = mockSelectedElement;

      // Act
      component.resizeSelect(mockDownEvent);
      document.dispatchEvent(mockUpEvent); // pointer is up
      document.dispatchEvent(mockMoveEvent);

      // Assert
      expect(component['_resizeElipse']).not.toHaveBeenCalled();
    });
  });
  describe('resizeLine', () => {
    beforeEach(() => {
      component.selectedElement = new WhiteboardElement(ElementTypeEnum.LINE, {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      });
    });

    it('should resize the line correctly for "nw" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('nw', bbox);

      expect(component.selectedElement.options.x1).toBe(10);
      expect(component.selectedElement.options.y1).toBe(20);
    });
    it('should resize the line correctly for "n" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('n', bbox);

      expect(component.selectedElement.options.y1).toBe(20);
    });
    it('should resize the line correctly for "ne" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('ne', bbox);

      expect(component.selectedElement.options.x2).toBe(10);
      expect(component.selectedElement.options.y1).toBe(20);
    });
    it('should resize the line correctly for "e" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('e', bbox);

      expect(component.selectedElement.options.x2).toBe(10);
    });
    it('should resize the line correctly for "se" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('se', bbox);

      expect(component.selectedElement.options.x2).toBe(10);
      expect(component.selectedElement.options.y2).toBe(20);
    });
    it('should resize the line correctly for "s" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('s', bbox);

      expect(component.selectedElement.options.y2).toBe(20);
    });
    it('should resize the line correctly for "sw" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('sw', bbox);

      expect(component.selectedElement.options.x1).toBe(10);
      expect(component.selectedElement.options.y2).toBe(20);
    });
    it('should resize the line correctly for "w" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeLine']('w', bbox);

      expect(component.selectedElement.options.x1).toBe(10);
    });
  });
  describe('resizeElipse', () => {
    beforeEach(() => {
      component.selectedElement = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {
        cx: 0,
        cy: 0,
        rx: 0,
        ry: 0,
      });
    });

    it('should resize the elipse correctly for "nw" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('nw', bbox);

      expect(component.selectedElement.x).toBe(5);
      expect(component.selectedElement.y).toBe(10);
      expect(component.selectedElement.options.rx).toBe(-5);
      expect(component.selectedElement.options.ry).toBe(-10);
    });
    it('should resize the elipse correctly for "n" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('n', bbox);

      expect(component.selectedElement.y).toBe(10);
      expect(component.selectedElement.options.ry).toBe(-10);
    });
    it('should resize the elipse correctly for "ne" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('ne', bbox);

      expect(component.selectedElement.x).toBe(5);
      expect(component.selectedElement.y).toBe(10);
      expect(component.selectedElement.options.rx).toBe(5);
      expect(component.selectedElement.options.ry).toBe(-10);
    });
    it('should resize the elipse correctly for "e" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('e', bbox);

      expect(component.selectedElement.x).toBe(5);
      expect(component.selectedElement.options.rx).toBe(5);
    });
    it('should resize the elipse correctly for "se" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('se', bbox);

      expect(component.selectedElement.x).toBe(5);
      expect(component.selectedElement.y).toBe(10);
      expect(component.selectedElement.options.rx).toBe(5);
      expect(component.selectedElement.options.ry).toBe(10);
    });
    it('should resize the elipse correctly for "s" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('s', bbox);

      expect(component.selectedElement.y).toBe(10);
      expect(component.selectedElement.options.ry).toBe(10);
    });
    it('should resize the elipse correctly for "sw" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('sw', bbox);

      expect(component.selectedElement.x).toBe(5);
      expect(component.selectedElement.y).toBe(10);
      expect(component.selectedElement.options.rx).toBe(-5);
      expect(component.selectedElement.options.ry).toBe(10);
    });
    it('should resize the elipse correctly for "w" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeElipse']('w', bbox);

      expect(component.selectedElement.x).toBe(5);
      expect(component.selectedElement.options.rx).toBe(-5);
    });
  });
  describe('resizeDefault', () => {
    beforeEach(() => {
      component.selectedElement = new WhiteboardElement(ElementTypeEnum.RECT, {});
    });
    it('should resize the elipse correctly for "nw" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('nw', bbox);

      expect(component.selectedElement.x).toBe(10);
      expect(component.selectedElement.y).toBe(20);
      expect(component.selectedElement.options.width).toBe(40);
      expect(component.selectedElement.options.height).toBe(30);
    });
    it('should resize the elipse correctly for "n" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('n', bbox);

      expect(component.selectedElement.y).toBe(20);
      expect(component.selectedElement.options.height).toBe(30);
    });
    it('should resize the elipse correctly for "ne" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('ne', bbox);

      expect(component.selectedElement.y).toBe(20);
      expect(component.selectedElement.options.width).toBe(60);
      expect(component.selectedElement.options.height).toBe(30);
    });
    it('should resize the elipse correctly for "e" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('e', bbox);

      expect(component.selectedElement.options.width).toBe(60);
    });
    it('should resize the elipse correctly for "se" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('se', bbox);

      expect(component.selectedElement.options.width).toBe(60);
      expect(component.selectedElement.options.height).toBe(70);
    });
    it('should resize the elipse correctly for "s" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('s', bbox);

      expect(component.selectedElement.options.height).toBe(70);
    });
    it('should resize the elipse correctly for "sw" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('sw', bbox);

      expect(component.selectedElement.x).toBe(10);
      expect(component.selectedElement.options.width).toBe(40);
      expect(component.selectedElement.options.height).toBe(70);
    });
    it('should resize the elipse correctly for "w" direction', () => {
      const bbox = { x: 10, y: 20, width: 50, height: 50 };

      component['_resizeDefault']('w', bbox);

      expect(component.selectedElement.x).toBe(10);
      expect(component.selectedElement.options.width).toBe(40);
    });
  });
});
