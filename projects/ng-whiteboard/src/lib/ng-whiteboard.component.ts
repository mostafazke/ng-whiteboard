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
  @ViewChild('svgContainer', { static: false }) private svgContainer: ElementRef<ContainerElement>;
  @ViewChild('textInput', { static: false }) private textInput: ElementRef<HTMLInputElement>;
  @Input() options: WhiteboardOptions;

  private _data: WhiteboardData[];
  @Input() set data(data: WhiteboardData[]) {
    this._data = data;
  }

  get data(): WhiteboardData[] {
    return this._data;
  }

  @Input() selectedTool: ToolsEnum = ToolsEnum.BRUSH;
  @Input() aspectRatio: number;
  @Input() canvasWidth = 800;
  @Input() canvasHeight = 600;
  @Input() zoom = 1;
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
  // defaultFont: "Noto Sans JP"

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
  tempDraw: [number, number][];
  tempTextElement: WhiteboardData;

  selectedElement: WhiteboardData;
  selectedElements: WhiteboardData[];
  currentBBox: { x: number; y: number; width: number; height: number };

  x: number = 0;
  y: number = 0;

  width = 800;
  height = 600;

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
      case ToolsEnum.SELECT:
        break;
      case ToolsEnum.TEXT:
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
      case ToolsEnum.SELECT:
        break;
      case ToolsEnum.TEXT:
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
    let target: SVGGraphicsElement = event.sourceEvent.target;
    if (target instanceof SVGTextElement) {
      // clicked on a previous text
      if (this.tempTextElement) {
        // finish the current one if needed
        this.finishTextInput();
      }
      while (!target.classList.contains('wb_element')) {
        target = target.parentNode as SVGGraphicsElement;
      }
      const selectedElementId = target.getAttribute('data-wb-id');
      this.tempTextElement = this.data.find((el) => el.id === selectedElementId);
      const value = this.tempTextElement.value;
      this.tempTextElement.value = '';
      const coords = [this.tempTextElement.x, this.tempTextElement.y];
      this.openTextInput(coords, value);
    } else {
      // click was not on a previous text
      if (!this.tempTextElement) {
        // no active text input
        const element = this._generateNewElement(ElementTypeEnum.TEXT);
        const [x, y] = mouse(this.selection.node());
        element.value = '';
        element.x = x;
        element.y = y;
        this.tempTextElement = element;
        this._pushToData(element);
        this.openTextInput([x, y]);
      } else {
        // active text input
        this.finishTextInput();
      }
    }
  }
  // Handle Select tool
  handleStartSelect() {
    const currentElement = this.getMouseTarget();
    if (currentElement.tagName !== 'svg') {
      const selectedElementId = currentElement.getAttribute('data-wb-id');
      this.selectedElement = this.data.find((el) => el.id === selectedElementId);
      console.log(this.selectedElement);
      console.log(currentElement.getBoundingClientRect());
      this.currentBBox = currentElement.getBoundingClientRect();
      console.log(this.currentBBox);
    }
  }

  openTextInput(coords, value = '') {
    this.textInput.nativeElement.setAttribute('style', `left: ${coords[0]}px; top: ${coords[1]}px;`);
    this.textInput.nativeElement.value = value;
    this.textInput.nativeElement.focus();
  }

  dismissTextInput() {
    // clear the input and hide it
    this.textInput.nativeElement.value = '';
    this.textInput.nativeElement.setAttribute('style', 'display: none;');
  }

  // convert the value of this.textInput.nativeElement to an SVG text node, unless it's empty,
  // and then dismiss this.textInput.nativeElement
  finishTextInput() {
    var value = this.textInput.nativeElement.value;
    if (value != '') {
      this.tempTextElement.value = value;
      this.tempTextElement = null;
    }
    this.dismissTextInput();
  }

  getMouseTarget(): SVGGraphicsElement {
    let mouse_target = event.sourceEvent.target;
    if (mouse_target == null) {
      return null;
    }
    var svgns = 'http://www.w3.org/2000/svg',
      xlinkns = 'http://www.w3.org/1999/xlink',
      xmlns = 'http://www.w3.org/XML/1998/namespace',
      xmlnsns = 'http://www.w3.org/2000/xmlns/', // see http://www.w3.org/TR/REC-xml-names/#xmlReserved
      se_ns = 'http://svg-edit.googlecode.com',
      htmlns = 'http://www.w3.org/1999/xhtml',
      mathns = 'http://www.w3.org/1998/Math/MathML';

    // if it was a <use>, Opera and WebKit return the SVGElementInstance
    if (mouse_target.correspondingUseElement) mouse_target = mouse_target.correspondingUseElement;

    // for foreign content, go up until we find the foreignObject
    // WebKit browsers set the mouse target to the svgcanvas div
    if ([mathns, htmlns].indexOf(mouse_target.namespaceURI) >= 0 && mouse_target.id != 'svgcanvas') {
      while (mouse_target.nodeName != 'foreignObject') {
        mouse_target = mouse_target.parentNode;
        if (!mouse_target) return this.svgContainer.nativeElement as SVGGraphicsElement;
      }
    }

    // If it's root-like, select the root
    if (['svgroot', 'svgcontent', 'elementsGroup'].indexOf(mouse_target.id) >= 0) {
      return this.svgContainer.nativeElement as SVGGraphicsElement;
    }

    while (mouse_target.parentNode && mouse_target.parentNode.id !== ('elementsGroup' || 'svgroot')) {
      mouse_target = mouse_target.parentNode;
    }

    // go up until we hit a child of a layer
    while (mouse_target.parentNode.parentNode.tagName == 'g') {
      mouse_target = mouse_target.parentNode;
    }
    // Webkit bubbles the mouse event all the way up to the div, so we
    // set the mouse_target to the svgroot like the other browsers
    if (mouse_target.nodeName.toLowerCase() == 'div') {
      mouse_target = this.svgContainer.nativeElement;
    }

    return mouse_target;
  }

  getZoom() {
    return this.zoom;
  }

  setZoom(zoom: number) {
    this.zoom = zoom;
    this.zoomChanged.emit(zoom);
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
}
