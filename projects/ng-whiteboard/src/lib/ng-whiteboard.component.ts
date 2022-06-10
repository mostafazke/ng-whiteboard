import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ContainerElement, curveBasis, drag, event, line, mouse, select, Selection } from 'd3';
import { Subscription } from 'rxjs';
import { IAddImage } from './models/add-image.model';
import { IAddText } from './models/add-text.model';
import { ElementOptions } from './models/element-options.model';
import { ElementTypeEnum } from './models/element-type.enum';
import { LineCapEnum } from './models/line-cap.enum';
import { LineJoinEnum } from './models/line-join.enum';
import { ImageShape } from './models/shapes/image.model';
import { TextShape } from './models/shapes/text.model';
import { ToolsEnum } from './models/tools.enum';
import { WhiteboardData } from './models/whiteboard-data.model';
import { WhiteboardOptions } from './models/whiteboard-options.model';
import { NgWhiteboardService } from './ng-whiteboard.service';
import { formatTypes } from './ng-whiteboard.types';

const d3Line = line().curve(curveBasis);
@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ng-whiteboard',
  templateUrl: 'ng-whiteboard.component.html',
  styleUrls: ['ng-whiteboard.component.scss'],
})
export class NgWhiteboardComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer', { static: false }) private svgContainer: ElementRef<SVGGraphicsElement>;
  @ViewChild('textInput', { static: false }) private textInput: ElementRef<HTMLInputElement>;
  @Input() options: WhiteboardOptions;

  private _data: WhiteboardData[];
  @Input() set data(data: WhiteboardData[]) {
    this._data = data;
  }

  get data(): WhiteboardData[] {
    return this._data;
  }

  private _zoom = 1;
  @Input() set zoom(zoom: number) {
    this._zoom = zoom;
  }
  get zoom(): number {
    return this._zoom;
  }
  @Input() selectedTool: ToolsEnum = ToolsEnum.BRUSH;
  @Input() aspectRatio: number;
  @Input() canvasWidth = 800;
  @Input() canvasHeight = 600;
  @Input() size = 2;
  @Input() color = '#000';
  @Input() strokeColor = '#000';
  @Input() backgroundColor = '#fff';
  @Input() scaleFactor = 0;
  @Input() showStrokeColorPicker = false;
  @Input() showFillColorPicker = false;
  @Input() downloadedFileName: string;
  @Input() lineJoin = LineJoinEnum.ROUND;
  @Input() lineCap = LineCapEnum.ROUND;
  @Input() shapeSelectorEnabled = true;
  @Input() showShapeSelector = false;
  @Input() fillColor = '#333';

  // show_outside_canvas: true,
  // selectNew: true,
  // dimensions: [800, 600],
  // initFill: {color: 'fff', opacity: 1},
  // initStroke: {width: 1, color: '000', opacity: 1},
  // imgPath: 'images/',
  // baseUnit: 'px',
  defaultFont = 'Noto Sans JP';

  @Output() onInit = new EventEmitter<any>();
  @Output() onClear = new EventEmitter<any>();
  @Output() onUndo = new EventEmitter<any>();
  @Output() onRedo = new EventEmitter<any>();
  @Output() zoomChanged = new EventEmitter<any>();
  @Output() onImageAdded = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<string>();

  private selection: Selection<any, unknown, null, undefined> = undefined;

  private _subscriptionList: Subscription[] = [];

  private undoStack: WhiteboardData[][] = [];
  private redoStack: WhiteboardData[][] = [];

  drawingEnabled = true;
  types = ElementTypeEnum;
  tempElement: WhiteboardData;
  tempLineElement: WhiteboardData;
  tempRectElement: WhiteboardData;
  tempDraw: [number, number][];
  tempTextElement: WhiteboardData;

  selectedElement: WhiteboardData;
  selectedElements: WhiteboardData[] = [];
  currentBBox: { x: number; y: number; width: number; height: number };

  x: number = 0;
  y: number = 0;

  width = 800;
  height = 600;

  rubberBox = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    display: 'none',
  };

  math = Math;
  constructor(private whiteboardService: NgWhiteboardService) {}

  ngOnInit(): void {
    this._initInputsFromOptions(this.options);
    this._initObservables();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.options) {
      //&& !isEqual(changes.options.currentValue, changes.options.previousValue)
      this._initInputsFromOptions(changes.options.currentValue);
    }
  }

  ngAfterViewInit() {
    this.selection = select(this.svgContainer.nativeElement);
    setTimeout(() => {
      // const { x, y } = this._calculateXAndY();
      // this.x = x;
      // this.y = y;
    }, 0);
    this.initalizeEvents(this.selection);
  }

  ngOnDestroy(): void {
    this._subscriptionList.forEach((subscription) => this._unsubscribe(subscription));
  }

  private _initInputsFromOptions(options: WhiteboardOptions): void {
    if (options) {
      if (!this._isNullOrUndefined(options.drawingEnabled)) {
        this.drawingEnabled = options.drawingEnabled;
      }
      if (!this._isNullOrUndefined(options.selectedTool)) {
        this.selectedTool = options.selectedTool;
      }
      if (!this._isNullOrUndefined(options.aspectRatio)) {
        this.aspectRatio = options.aspectRatio;
      }
      if (!this._isNullOrUndefined(options.size)) {
        this.size = options.size;
      }
      if (!this._isNullOrUndefined(options.scaleFactor)) {
        this.scaleFactor = options.scaleFactor;
      }
      if (!this._isNullOrUndefined(options.downloadedFileName)) {
        this.downloadedFileName = options.downloadedFileName;
      }
      if (!this._isNullOrUndefined(options.lineJoin)) {
        this.lineJoin = options.lineJoin;
      }
      if (!this._isNullOrUndefined(options.lineCap)) {
        this.lineCap = options.lineCap;
      }
      if (!this._isNullOrUndefined(options.fillColor)) {
        this.fillColor = options.fillColor;
      }
      if (!this._isNullOrUndefined(options.strokeColor)) {
        this.strokeColor = options.strokeColor;
      }
      if (!this._isNullOrUndefined(options.color)) {
        this.color = options.color;
      }
      if (!this._isNullOrUndefined(options.backgroundColor)) {
        this.backgroundColor = options.backgroundColor;
      }
    }
  }

  private _isNullOrUndefined(property: any): boolean {
    return property === null || property === undefined;
  }

  private _initObservables(): void {
    // this._subscriptionList.push(
    //   this.whiteboardService.saveSvgMethodCalled$.subscribe(({ name, format }) => this.saveSvg(name, format))
    // );
    this._subscriptionList.push(this.whiteboardService.eraseSvgMethodCalled$.subscribe(() => this.clear()));
    this._subscriptionList.push(this.whiteboardService.undoSvgMethodCalled$.subscribe(() => this.undo()));
    this._subscriptionList.push(this.whiteboardService.redoSvgMethodCalled$.subscribe(() => this.redo()));
    this._subscriptionList.push(
      this.whiteboardService.addImageMethodCalled$.subscribe((image) => this.handleDrawImage(image))
    );
    // this._subscriptionList.push(this.whiteboardService.addTextMethodCalled$.subscribe((text) => this.addText(text)));
  }

  undo(): void {
    if (!this.undoStack.length) {
      return;
    }
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);
    this.data = this.undoStack[this.undoStack.length - 1] || [];
    this.onUndo.emit();
  }

  redo(): void {
    if (!this.redoStack.length) {
      return;
    }
    const currentState = this.redoStack.pop();
    this.undoStack.push(currentState);
    this.data = currentState;
    this.onRedo.emit();
  }

  clear() {
    this.data = [];
    this._pushToUndo();
    this.onClear.emit();
  }

  initalizeEvents(selection: Selection<any, unknown, null, undefined>): void {
    if (!this.drawingEnabled) {
      return;
    }
    let dragging = false;
    console.log(selection);

    selection.call(
      drag()
        .on('start', () => {
          dragging = true;
          this.redoStack = [];
          this.handleStartEvent();
        })
        .on('drag', () => {
          if (!dragging) {
            return;
          }
          this.handleDragEvent();
        })
        .on('end', () => {
          dragging = false;
          this.handleEndEvent();
        })
    );
  }

  handleStartEvent() {
    switch (this.selectedTool) {
      case ToolsEnum.BRUSH:
        this.handleStartBrush();
        break;
      case ToolsEnum.LINE:
        this.handleStartLine();
        break;
      case ToolsEnum.RECT:
        this.handleStartRect();
        break;
      case ToolsEnum.TEXT:
        this.handleTextTool();
        break;
      case ToolsEnum.SELECT:
        this.handleStartSelect();
        break;
      default:
        break;
    }
  }
  handleDragEvent() {
    switch (this.selectedTool) {
      case ToolsEnum.BRUSH:
        this.handleDragBrush();
        break;
      case ToolsEnum.LINE:
        this.handleDragLine();
        break;
      case ToolsEnum.RECT:
        this.handleDragRect();
        break;
      case ToolsEnum.TEXT:
        this.handleTextDrag();
        break;
      case ToolsEnum.SELECT:
        this.handleDragSelect();
        break;
      default:
        break;
    }
  }
  handleEndEvent() {
    switch (this.selectedTool) {
      case ToolsEnum.BRUSH:
        this.handleEndBrush();
        break;
      case ToolsEnum.LINE:
        this.handleEndLine();
        break;
      case ToolsEnum.RECT:
        this.handleEndRect();
        break;
      case ToolsEnum.TEXT:
        this.handleTextEnd();
        break;
      case ToolsEnum.SELECT:
        this.handleEndSelect();
        break;
      default:
        break;
    }
  }
  // Handle Brush tool
  handleStartBrush() {
    const element = this._generateNewElement(ElementTypeEnum.BRUSH);
    this.tempDraw = [this._calculateXAndY(mouse(this.selection.node()))];
    element.value = d3Line(this.tempDraw);
    this.tempElement = element;
  }
  handleDragBrush() {
    this.tempDraw.push(this._calculateXAndY(mouse(this.selection.node())));
    this.tempElement.value = d3Line(this.tempDraw);
  }
  handleEndBrush() {
    this.tempDraw.push(this._calculateXAndY(mouse(this.selection.node())));
    this.tempElement.value = d3Line(this.tempDraw);
    this._pushToData(this.tempElement);
    this._pushToUndo();
    this.tempDraw = null;
    this.tempElement = null;
  }
  // Handle Line tool
  handleStartLine() {
    const element = this._generateNewElement(ElementTypeEnum.LINE);
    const [x, y] = this._calculateXAndY(mouse(this.selection.node()));
    element.x1 = x;
    element.y1 = y;
    element.x2 = x;
    element.y2 = y;
    this.tempLineElement = element;
    this._pushToData(this.tempLineElement);
  }
  handleDragLine() {
    let [x2, y2] = this._calculateXAndY(mouse(this.selection.node()));

    // if(curConfig.gridSnapping){
    //   x = snapToGrid(x);
    //   y = snapToGrid(y);
    // }

    if (event.sourceEvent.shiftKey) {
      const x1 = this.tempLineElement.x1;
      const y1 = this.tempLineElement.y1;
      let { x, y } = this._snapToAngle(x1, y1, x2, y2);
      [x2, y2] = [x, y];
    }

    this.tempLineElement.x2 = x2;
    this.tempLineElement.y2 = y2;
  }
  handleEndLine() {
    if (this.tempLineElement.x1 != this.tempLineElement.x2 || this.tempLineElement.y1 != this.tempLineElement.y2) {
      this._pushToUndo();
      this.tempLineElement = null;
      return;
    }
    this.data.pop();
  }
  // Handle Rect tool
  handleStartRect() {
    const element = this._generateNewElement(ElementTypeEnum.RECT);
    const [x, y] = this._calculateXAndY(mouse(this.selection.node()));
    element.x1 = x;
    element.y1 = y;
    element.x2 = x;
    element.y2 = y;
    element.width = 1;
    element.height = 1;
    this.tempRectElement = element;
    this._pushToData(this.tempRectElement);
  }
  handleDragRect() {
    let [x, y] = this._calculateXAndY(mouse(this.selection.node()));
    const start_x = this.tempRectElement.x1;
    const start_y = this.tempRectElement.y1;
    let w = Math.abs(x - start_x);
    let h = Math.abs(y - start_y);
    let new_x = null;
    let new_y = null;

    if (event.sourceEvent.shiftKey) {
      w = h = Math.max(w, h);
      new_x = start_x < x ? start_x : start_x - w;
      new_y = start_y < y ? start_y : start_y - h;
    } else {
      new_x = Math.min(start_x, x);
      new_y = Math.min(start_y, y);
    }
    if (event.sourceEvent.altKey) {
      w *= 2;
      h *= 2;
      new_x = start_x - w / 2;
      new_y = start_y - h / 2;
    }

    // if (gridSnapping) {
    //   w = snapToGrid(w);
    //   h = snapToGrid(h);
    //   new_x = snapToGrid(new_x);
    //   new_y = snapToGrid(new_y);
    // }

    this.tempRectElement.width = w;
    this.tempRectElement.height = h;
    this.tempRectElement.x2 = new_x;
    this.tempRectElement.y2 = new_y;
  }
  handleEndRect() {
    if (this.tempRectElement.width != 0 || this.tempRectElement.height != 0) {
      this._pushToUndo();
      this.tempRectElement = null;
      return;
    }
    this.data.pop();
  }

  // Handle Draw Image
  handleDrawImage(imageSrc: IAddImage) {
    try {
      const tempImg = new Image();
      tempImg.onload = () => {
        const { svgHeight } = this._getSvgWidthHeight();
        const imageWidth = tempImg.width;
        const imageHeight = tempImg.height;
        const aspectRatio = tempImg.width / tempImg.height;
        const height = imageHeight > svgHeight ? svgHeight - 40 : imageHeight;
        const width = height === svgHeight - 40 ? (svgHeight - 40) * aspectRatio : imageWidth;

        let x = (imageWidth - width) * (imageSrc.x || 0);
        let y = (imageHeight - height) * (imageSrc.y || 0);

        if (x < 0) {
          x = 0;
        }
        if (y < 0) {
          y = 0;
        }

        const element = this._generateNewElement(ElementTypeEnum.IMAGE);
        element.value = imageSrc.image as string;
        element.width = width;
        element.height = height;
        element.x = x;
        element.y = y;
        this._pushToData(element);
      };
      tempImg.src = imageSrc.image as string;
    } catch (error) {
      console.error(error);
    }
  }
  // Handle Text tool
  handleTextTool() {
    if (this.tempTextElement) {
      // finish the current one if needed
      this.finishTextInput();
      return;
    }
    const element = this._generateNewElement(ElementTypeEnum.TEXT);
    const [x, y] = this._calculateXAndY(mouse(this.selection.node()));
    element.top = y;
    element.left = x;
    this.tempTextElement = element;
    setTimeout(() => {
      this.textInput.nativeElement.focus();
    }, 0);
  }
  handleTextDrag() {
    if (!this.tempTextElement) {
      return;
    }
    const [x, y] = this._calculateXAndY(mouse(this.selection.node()));
    this.tempTextElement.top = y;
    this.tempTextElement.left = x;
  }
  handleTextEnd() {
    if (!this.tempTextElement) {
      return;
    }
    this._pushToUndo();
  }
  // Handle Text Input
  updateTextItem(value: string) {
    this.tempTextElement.value = value;
  }

  // Handle Select tool
  handleStartSelect() {
    const mouse_target = this.getMouseTarget();
    if (mouse_target) {
      const id = mouse_target.getAttribute('data-wb-id');
      this.selectedElement = this.data.find((el) => el.id === id);
      // if this element is not yet selected, clear selection and select it
      // if (this.selectedElements.indexOf(this.selectedElement) == -1) {
      //   // only clear selection if shift is not pressed (otherwise, add
      //   // element to selection)
      //   if (!event.sourceEvent.shiftKey) {
      //     // No need to do the call here as it will be done on addToSelection
      //     this._clearSelection();
      //   }
      //   this._addToSelection([this.selectedElement]);
      // }

      const currentBBox = mouse_target.getBBox();

      currentBBox.width += this.selectedElement.elementOptions.size;
      currentBBox.height += this.selectedElement.elementOptions.size;
      currentBBox.x -= this.selectedElement.elementOptions.size * 0.5;
      currentBBox.y -= this.selectedElement.elementOptions.size * 0.5;

      this._showGrips(currentBBox);
    } else {
      this.selectedElement = null;
      this.rubberBox.display = 'none';
    }
  }
  handleDragSelect() {
    // const [x, y] = this._calculateXAndY(mouse(this.selection.node()));
    // this.tempRectElement.x2 = x;
    // this.tempRectElement.y2 = y;
  }
  handleEndSelect() {
    // if (this.tempRectElement.width != 0 || this.tempRectElement.height != 0) {
    //   this._pushToUndo();
    //   this.tempRectElement = null;
    //   return;
    // }
    // this.data.pop();
  }

  // convert the value of this.textInput.nativeElement to an SVG text node, unless it's empty,
  // and then dismiss this.textInput.nativeElement
  finishTextInput() {
    var value = this.textInput.nativeElement.value;
    this.tempTextElement.value = value;
    if (this.tempTextElement.value) {
      this._pushToData(this.tempTextElement);
      this._pushToUndo();
    }
    this.tempTextElement = null;
  }

  getMouseTarget(): SVGGraphicsElement {
    let evt: Event = event.sourceEvent;
    if (evt == null || evt.target == null) {
      return null;
    }
    var mouse_target = evt.target as SVGGraphicsElement;

    if (mouse_target.parentNode) {
      while (!mouse_target.id.includes('item_')) {
        if (mouse_target.id === 'svgroot') {
          return null;
        }
        mouse_target = mouse_target.parentNode as SVGGraphicsElement;
      }
    }
    return mouse_target;
  }

  private _pushToData(element: WhiteboardData) {
    this.data.push(element);
  }
  private _pushToUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.data)));
  }

  private _generateNewElement(name: ElementTypeEnum): WhiteboardData {
    const element = new WhiteboardData(name);
    element.elementOptions = new ElementOptions(
      this.fillColor,
      this.strokeColor,
      this.size,
      this.lineJoin,
      this.lineCap
    );

    return element;
  }

  private _calculateXAndY([x, y]: [number, number]): [number, number] {
    return [(x - this.x) / this.zoom, (y - this.y) / this.zoom];
  }

  private _getSvgWidthHeight(): { svgWidth: number; svgHeight: number } {
    const svgWidth = parseInt(this.selection.style('width'), 10);
    const svgHeight = parseInt(this.selection.style('height'), 10);
    return { svgWidth, svgHeight };
  }

  private _unsubscribe(subscription: Subscription): void {
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  private _snapToAngle(x1: number, y1: number, x2: number, y2: number) {
    var snap = Math.PI / 4; // 45 degrees
    var dx = x2 - x1;
    var dy = y2 - y1;
    var angle = Math.atan2(dy, dx);
    var dist = Math.sqrt(dx * dx + dy * dy);
    var snapangle = Math.round(angle / snap) * snap;
    var x = x1 + dist * Math.cos(snapangle);
    var y = y1 + dist * Math.sin(snapangle);
    //console.log(x1,y1,x2,y2,x,y,angle)
    return { x: x, y: y, a: snapangle };
  }
  private _clearSelection() {
    this.selectedElements = [];
  }
  private _addToSelection(elemsToAdd) {
    if (elemsToAdd.length === 0) return false;
    // find the first null in our selectedElements array

    // now add each element consecutively
    var i = elemsToAdd.length;
    while (i--) {
      var elem = elemsToAdd[i];
      if (!elem) continue;

      // if it's not already there, add it
      if (this.selectedElements.indexOf(elem) == -1) {
        this.selectedElements.push(elem);
      }
    }
  }

  private _showGrips(bbox: DOMRect) {
    console.log(bbox);
    this.rubberBox = {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
      display: 'block',
    };
  }
}
