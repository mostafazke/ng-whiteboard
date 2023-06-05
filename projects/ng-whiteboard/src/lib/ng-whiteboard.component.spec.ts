import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import * as d3 from 'd3';
import { select } from 'd3';
import {
  ElementTypeEnum,
  FormatType,
  IAddImage,
  LineCapEnum,
  LineJoinEnum,
  NgWhiteboardComponent,
  NgWhiteboardService,
  WhiteboardElement,
} from 'ng-whiteboard';
import { ToolsEnum } from './models/tools.enum';
import Utils from './ng-whiteboard.utils';

describe('NgWhiteboardComponent', () => {
  let component: NgWhiteboardComponent;
  let fixture: ComponentFixture<NgWhiteboardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [NgWhiteboardComponent],
      providers: [NgWhiteboardService],
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
      expect(component['_subscriptionList'].length).toBe(7);
    });

    it('should trigger start event', () => {
      // arrange
      jest.spyOn(component, 'handleStartEvent');
      const redoState: WhiteboardElement[] = [new WhiteboardElement(ElementTypeEnum.BRUSH, {})];
      component['redoStack'] = [redoState];
      const element = document.createElement('svg');
      document.body.appendChild(element);
      const selection = select<Element, unknown>(element);
      // act
      component.initializeEvents.call(component, selection);
      element.dispatchEvent(
        new MouseEvent('mousedown', {
          view: window,
        })
      );
      // assert
      expect(component.handleStartEvent).toHaveBeenCalled();
      expect(component['redoStack'].length).toBe(0);
    });
    it('should return if drawingEnabled is false', () => {
      // arrange
      jest.spyOn(component, 'handleStartEvent');
      const element = document.createElement('svg');
      document.body.appendChild(element);
      component.drawingEnabled = false;
      const selection = select<Element, unknown>(element);
      // act
      component.initializeEvents.call(component, selection);
      element.dispatchEvent(
        new MouseEvent('mousedown', {
          view: window,
        })
      );
      // assert
      expect(component.handleStartEvent).not.toHaveBeenCalled();
    });

    it('should trigger drag event', () => {
      // arrange
      jest.spyOn(component, 'handleDragEvent');
      const element = document.createElement('svg');
      document.body.appendChild(element);
      const selection = select<Element, unknown>(element);
      // act
      component.initializeEvents.call(component, selection);
      element.dispatchEvent(
        new MouseEvent('mousedown', {
          view: window,
        })
      );
      element.dispatchEvent(
        new MouseEvent('mousemove', {
          view: window,
        })
      );
      // assert
      expect(component.handleDragEvent).toHaveBeenCalled();
    });

    it('should not trigger drag event before start event', () => {
      // arrange
      jest.spyOn(component, 'handleDragEvent');
      const element = document.createElement('svg');
      document.body.appendChild(element);
      const selection = select<Element, unknown>(element);
      // act
      component.initializeEvents.call(component, selection);
      element.dispatchEvent(
        new MouseEvent('mousemove', {
          view: window,
        })
      );
      // assert
      expect(component.handleDragEvent).not.toHaveBeenCalled();
    });

    it('should trigger end event', () => {
      // arrange
      jest.spyOn(component, 'handleEndEvent');
      const element = document.createElement('svg');
      document.body.appendChild(element);
      const selection = select<Element, unknown>(element);
      // act
      component.initializeEvents.call(component, selection);
      element.dispatchEvent(
        new MouseEvent('mousedown', {
          view: window,
        })
      );
      element.dispatchEvent(
        new MouseEvent('mouseup', {
          view: window,
        })
      );
      // assert
      expect(component.handleEndEvent).toHaveBeenCalled();
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
    it('should calls initializeEvents method', () => {
      jest.spyOn(component, 'initializeEvents');
      component.ngAfterViewInit();
      expect(component.initializeEvents).toHaveBeenCalled();
    });
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

      // act
      component.handleStartEvent();

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

      // act
      component.handleDragEvent();

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

      // act
      component.handleEndEvent();

      // assert
      expect(component.handleEndBrush).toHaveBeenCalled();
      expect(component.handleEndLine).not.toHaveBeenCalled();
      expect(component.handleEndRect).not.toHaveBeenCalled();
      expect(component.handleEndEllipse).not.toHaveBeenCalled();
      expect(component.handleTextEnd).not.toHaveBeenCalled();
    });
  });
  describe('handleImageTool', () => {
    it('should add image to component when file is uploaded', () => {
      // Arrange
      jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
      const selectionNode = document.createElement('svg');
      component['selection'] = select<Element, unknown>(selectionNode);
      const input = document.createElement('input');
      const file = new File(['image'], 'image.png', { type: 'image/png' });
      jest.spyOn(document, 'createElement').mockReturnValue(input);
      jest.spyOn(input, 'click');
      jest.spyOn(input, 'addEventListener').mockImplementation((event, callback: any) => {
        if (event === 'change') {
          callback({ target: { files: [file] } });
        }
      });
      // const addImageSpy = jest.spyOn(component, 'addImage');

      // Act
      component.handleImageTool();

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
        writable: true,
        value: jest.fn().mockReturnValue({
          x: 0,
          y: 0,
        }),
      });
      fixture.detectChanges();
    });

    it('should clear selected element if mouse target is null', () => {
      component['_getMouseTarget'] = jest.fn().mockReturnValue(null);
      component.handleSelectTool();
      expect(component.selectedElement).toBeNull();
    });

    it('should clear selected element if mouse target is the "selectorGroup"', () => {
      const selectorGroup: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      selectorGroup.setAttribute('id', 'selectorGroup');
      component['_getMouseTarget'] = jest.fn().mockReturnValue(selectorGroup);

      component.handleSelectTool();

      expect(component.selectedElement).toBeUndefined();
    });

    it('should select the clicked element', () => {
      const element = component.data[1];
      const elementNode = document.getElementById('item_' + element.id);
      component['_getMouseTarget'] = jest.fn().mockReturnValue(elementNode);
      component.handleSelectTool();
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
      expect(component.data.length).toEqual(1);

      component.handleEraserTool();

      expect(component.data.length).toEqual(1);
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should remove element from data and emit deleteElement', () => {
      const element = component.data[0];
      const elementNode = document.getElementById('item_' + element.id);
      component['_getMouseTarget'] = jest.fn().mockReturnValue(elementNode);
      const emitSpy = jest.spyOn(component.deleteElement, 'emit');

      expect(component.data.length).toEqual(1);

      component.handleEraserTool();

      expect(component.data.length).toEqual(0);
      expect(emitSpy).toHaveBeenCalled();
    });
  });
  describe('handleLineShape', () => {
    describe('StartLine', () => {
      it('should create Line element', () => {
        // arrange
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        // act
        component.handleStartLine();
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.LINE);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
      });
      it('should start from grid snap if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        // act
        component.handleStartLine();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: false,
            },
          },
        });
        // act
        component.handleDragLine();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [98, 197]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: false,
            },
          },
        });
        // act
        component.handleDragLine();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [1, 0]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: true,
            },
          },
        });
        // act
        component.handleDragLine();
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
        expect(component.data.length).toBe(1);
        expect(component.tempElement).toBeNull();
      });
    });
  });
  describe('handleRectShape', () => {
    describe('StartRect', () => {
      it('should create Rect element', () => {
        // arrange
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        // act
        component.handleStartRect();
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.RECT);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
        expect(component.tempElement.options.x2).toBe(100);
        expect(component.tempElement.options.y2).toBe(200);
        expect(component.tempElement.options.width).toBe(1);
        expect(component.tempElement.options.height).toBe(1);
      });
      it('should start from grid snap if snapToGrid is true', () => {
        // arrange
        component.gridSize = 10;
        component.snapToGrid = true;
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        // act
        component.handleStartRect();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: false,
              altKey: false,
            },
          },
        });
        // act
        component.handleDragRect();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [98, 197]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: false,
            },
          },
        });
        // act
        component.handleDragRect();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: true,
            },
          },
        });
        // act
        component.handleDragRect();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [10, 20]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              altKey: true,
            },
          },
        });
        // act
        component.handleDragRect();
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
        expect(component.data.length).toBe(1);
        expect(component.tempElement).toBeNull();
      });
    });
  });
  describe('handleEllipseShape', () => {
    describe('StartEllipse', () => {
      it('should create Ellipse element', () => {
        // arrange
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        // act
        component.handleStartEllipse();
        // assert
        expect(component.tempElement.type).toBe(ElementTypeEnum.ELLIPSE);
        expect(component.tempElement.options.x1).toBe(100);
        expect(component.tempElement.options.y1).toBe(200);
        expect(component.tempElement.options.cx).toBe(100);
        expect(component.tempElement.options.cy).toBe(200);
      });
    });
    describe('DragEllipse', () => {
      it('should update Rect element width,height,x2,y2', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
        component.tempElement = element;
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: false,
              altKey: false,
            },
          },
        });
        // act
        component.handleDragEllipse();
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
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              shiftKey: true,
            },
          },
        });
        // act
        component.handleDragEllipse();
        // assert
        expect(component.tempElement.options.ry).toBe(50);
        expect(component.tempElement.options.cy).toBe(50);
      });
      it('should multiply and snap x2 and y2 to specified angle when alt key is pressed', () => {
        // arrange
        const element = new WhiteboardElement(ElementTypeEnum.ELLIPSE, {});
        component.tempElement = element;
        jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [10, 20]));
        Object.defineProperty(d3, 'event', {
          value: {
            sourceEvent: {
              altKey: true,
            },
          },
        });
        // act
        component.handleDragEllipse();
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
        expect(component.data.length).toBe(1);
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

      // act
      component.handleTextTool();

      // assert
      expect(component.tempElement).toBeNull();
      expect(component.finishTextInput).toHaveBeenCalled();
    });
    it('should create a new text element and set focus on text input', () => {
      // arrange
      jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
      component['_getTargetElement'] = jest.fn().mockReturnValue(null);
      const element = new WhiteboardElement(ElementTypeEnum.TEXT, {});
      component['_generateNewElement'] = jest.fn().mockReturnValue(element);
      const input = document.createElement('input');
      component['textInput'] = { nativeElement: input };
      // act
      component.handleTextTool();

      // assert
      expect(component.tempElement).not.toBeNull();
      expect(component.tempElement.type).toBe(element.type);
      expect(component.tempElement.options.top).toBe(200);
      expect(component.tempElement.options.left).toBe(100);
    });
    it('should update existing element if clicked on text element', () => {
      // arrange
      const element = new WhiteboardElement(ElementTypeEnum.TEXT, {}, 'new text');
      jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [100, 200]));
      component['_getTargetElement'] = jest.fn().mockReturnValue(element);
      const input = document.createElement('input');
      component['textInput'] = { nativeElement: input };
      // act
      component.handleTextTool();

      // assert
      expect(component.tempElement).not.toBeNull();
      expect(component.tempElement.type).toBe(element.type);
      expect(component.tempElement.value).toBe(element.value);
    });

    it('should updates the text element position when dragging', () => {
      // arrange
      const x = 10;
      const y = 20;
      jest.spyOn(d3, 'mouse').mockImplementation(jest.fn(() => [x, y]));
      component.tempElement = { options: { top: 0, left: 0 } } as any;

      // act
      component.handleTextDrag();

      // assert
      expect(component.tempElement.options.top).toBe(y);
      expect(component.tempElement.options.left).toBe(x);
    });
    it('should return if current text element undefiend', () => {
      // arrange
      jest.spyOn(component, 'handleTextDrag');
      // act
      component.handleTextDrag();

      // assert
      expect(component.handleTextDrag).toHaveReturned();
    });

    it('should push the current element to undo', () => {
      // arrange
      component['_pushToUndo'] = jest.fn();
      component.tempElement = {} as any;

      // act
      component.handleTextEnd();

      // assert
      expect(component['_pushToUndo']).toHaveBeenCalled();
    });

    it('should skip push the current element to undo if tempElement id not defined', () => {
      // arrange
      component['_pushToUndo'] = jest.fn();

      // act
      component.handleTextEnd();

      // assert
      expect(component['_pushToUndo']).not.toHaveBeenCalled();
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
    let imageOnload: any;

    beforeEach(() => {
      mockImage = {
        image: 'https://via.placeholder.com/150',
        x: 10,
        y: 20,
      };
      Object.defineProperty(Image.prototype, 'onload', {
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
      expect(component['undoStack'].length).toBe(0);
      expect(component['redoStack'].length).toBe(0);
      expect(spyUndoEmit).not.toHaveBeenCalled();
    });

    it('should undo the last draw action and emit the "undo" event', () => {
      // arrange
      const spyUndoEmit = jest.spyOn(component.undo, 'emit');
      const initialData: WhiteboardElement[] = [new WhiteboardElement(ElementTypeEnum.BRUSH, {})];
      component['undoStack'] = [initialData, initialData];

      // act
      component.undoDraw();

      // assert
      expect(component['undoStack'].length).toBe(1);
      expect(component['redoStack'].length).toBe(1);
      expect(component['redoStack'][0]).toBe(initialData);
      expect(spyUndoEmit).toHaveBeenCalled();
    });
    it('should undo to initial data if undoStack is empty', () => {
      // arrange
      const spyUndoEmit = jest.spyOn(component.undo, 'emit');
      const initialData: WhiteboardElement[] = [new WhiteboardElement(ElementTypeEnum.BRUSH, {})];
      component['undoStack'] = [initialData];

      // act
      component.undoDraw();

      // assert
      expect(component['undoStack'].length).toBe(0);
      expect(component['redoStack'].length).toBe(1);
      expect(component['redoStack'][0]).toBe(initialData);
      expect(spyUndoEmit).toHaveBeenCalled();
    });
  });
  describe('redoDraw', () => {
    it('should not redo anything when redoStack is empty', () => {
      // arrange
      const spyRedoEmit = jest.spyOn(component.redo, 'emit');
      const initialData: WhiteboardElement[] = [new WhiteboardElement(ElementTypeEnum.BRUSH, {})];
      component['undoStack'] = [initialData];
      component['redoStack'] = [];

      // act
      component.redoDraw();

      // assert
      expect(component['undoStack'].length).toBe(1);
      expect(component['redoStack'].length).toBe(0);
      expect(spyRedoEmit).not.toHaveBeenCalled();
    });
    it('should redo the last undone action when redoStack is not empty', () => {
      // arrange
      const spyRedoEmit = jest.spyOn(component.redo, 'emit');
      const redoState: WhiteboardElement[] = [new WhiteboardElement(ElementTypeEnum.BRUSH, {})];
      component['redoStack'] = [redoState];
      component['undoStack'] = [];

      // act
      component.redoDraw();

      // assert
      expect(component['undoStack'].length).toBe(1);
      expect(component['redoStack'].length).toBe(0);
      expect(spyRedoEmit).toHaveBeenCalled();
    });
  });
  describe('getMouseTarget', () => {
    it('should return null if event or event.target is null', () => {
      // Arrange
      Object.defineProperty(d3, 'event', {
        value: {
          sourceEvent: null,
        },
      });
      // Act
      const result = component['_getMouseTarget']();

      // Assert
      expect(result).toBeNull();
    });
    it('should return null if mouse target id is svgroot', () => {
      // Arrange
      Object.defineProperty(d3, 'event', {
        value: {
          sourceEvent: { target: { id: 'svgroot' } },
        },
      });
      // Act
      const result = component['_getMouseTarget']();

      // Assert
      expect(result).toBeNull();
    });

    it('should return target if parent node is selectorGroup', () => {
      // Arrange
      Object.defineProperty(d3, 'event', {
        value: {
          sourceEvent: { target: { id: 'mouse_target', parentNode: { parentNode: { id: 'selectorGroup' } } } },
        },
      });

      // Act
      const result = component['_getMouseTarget']();

      // Assert
      expect(result).toEqual(d3.event.sourceEvent.target.parentNode.parentNode);
    });

    it('should return mouse target', () => {
      // Arrange
      Object.defineProperty(d3, 'event', {
        value: {
          sourceEvent: { target: { id: 'mouse_target', parentNode: { parentNode: { id: 'item_123' } } } },
        },
      });
      // Act
      const result = component['_getMouseTarget']();

      // Assert
      expect(result).toEqual(d3.event.sourceEvent.target.parentNode.parentNode);
    });
    it('should return null if mouse target id after bubbling is svgroot', () => {
      // Arrange
      Object.defineProperty(d3, 'event', {
        value: {
          sourceEvent: {
            target: { id: 'mouse_target', parentNode: { parentNode: { id: '123', parentNode: { id: 'svgroot' } } } },
          },
        },
      });
      // Act
      const result = component['_getMouseTarget']();

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
        writable: true,
        value: mockElement,
      });
      Object.defineProperty(mockMoveEvent, 'movementX', {
        writable: true,
        value: 10,
      });
      Object.defineProperty(mockMoveEvent, 'movementY', {
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
        writable: true,
        value: mockElement,
      });
      Object.defineProperty(mockMoveEvent, 'movementX', {
        writable: true,
        value: 10,
      });
      Object.defineProperty(mockMoveEvent, 'movementY', {
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
});
