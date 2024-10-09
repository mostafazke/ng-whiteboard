import {
  Component,
  AfterViewInit,
  ViewChild,
  Input,
  ElementRef,
  OnDestroy,
  Output,
  EventEmitter,
  OnChanges,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { NgWhiteboardService } from './ng-whiteboard.service';
import { Subscription, fromEvent, skip, BehaviorSubject } from 'rxjs';
import {
  ElementTypeEnum,
  FormatType,
  formatTypes,
  IAddImage,
  LineCapEnum,
  LineJoinEnum,
  ToolHandlers,
  ToolsEnum,
  WhiteboardElement,
  WhiteboardOptions,
} from './models';
import Utils from './ng-whiteboard.utils';
import { SvgService } from './core/svg/svg.service';
import { getStroke } from 'perfect-freehand';

type BBox = { x: number; y: number; width: number; height: number };
const getStrokeOptions = {
  size: 1,
  smoothing: 1,
  thinning: 0,
  streamline: 0.9,
};
@Component({
  selector: 'ng-whiteboard',
  templateUrl: './ng-whiteboard.component.html',
  styleUrls: ['./ng-whiteboard.component.scss'],
  providers: [SvgService],
})
export class NgWhiteboardComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer', { static: false })
  svgContainer!: ElementRef<SVGSVGElement>;
  @ViewChild('textInput', { static: false }) private textInput!: ElementRef<HTMLInputElement>;

  private _data: BehaviorSubject<WhiteboardElement[]> = new BehaviorSubject<WhiteboardElement[]>([]);

  @Input() set data(data: WhiteboardElement[]) {
    if (data) {
      this._data.next(data);
    }
  }
  get data(): WhiteboardElement[] {
    return this._data.getValue();
  }

  @Input() options!: WhiteboardOptions;

  @Input() set selectedTool(tool: ToolsEnum) {
    if (this._selectedTool !== tool) {
      if (this._selectedTool === ToolsEnum.TEXT && this.tempElement?.type === ElementTypeEnum.TEXT) {
        this.finishTextInput();
      }
      this._selectedTool = tool;
      this.toolChanged.emit(tool);
      this.clearSelectedElement();
      this.tempElement = null as never;
    }
  }
  get selectedTool(): ToolsEnum {
    return this._selectedTool;
  }
  @Input() drawingEnabled = true;
  @Input() canvasWidth = 800;
  @Input() canvasHeight = 600;
  @Input() fullScreen = true;
  @Input() center = true;
  @Input() strokeColor = '#000';
  @Input() strokeWidth = 2;
  @Input() backgroundColor = '#fff';
  @Input() lineJoin = LineJoinEnum.ROUND;
  @Input() lineCap = LineCapEnum.ROUND;
  @Input() fill = '#333';
  @Input() zoom = 1;
  @Input() fontFamily = 'sans-serif';
  @Input() fontSize = 24;
  @Input() dasharray = '';
  @Input() dashoffset = 0;
  @Input() x = 0;
  @Input() y = 0;
  @Input() enableGrid = false;
  @Input() gridSize = 10;
  @Input() snapToGrid = false;

  @Output() ready = new EventEmitter();
  @Output() dataChange = new EventEmitter<WhiteboardElement[]>();
  @Output() clear = new EventEmitter();
  @Output() undo = new EventEmitter();
  @Output() redo = new EventEmitter();
  @Output() save = new EventEmitter<string>();
  @Output() imageAdded = new EventEmitter();
  @Output() selectElement = new EventEmitter<WhiteboardElement | null>();
  @Output() deleteElement = new EventEmitter<WhiteboardElement>();
  @Output() toolChanged = new EventEmitter<ToolsEnum>();

  private _subscriptionList: Subscription[] = [];

  private _initialData: WhiteboardElement[] = [];
  private undoStack: WhiteboardElement[][] = [];
  private redoStack: WhiteboardElement[][] = [];
  private _selectedTool: ToolsEnum = ToolsEnum.BRUSH;
  selectedElement!: WhiteboardElement;

  types = ElementTypeEnum;
  tools = ToolsEnum;

  tempElement!: WhiteboardElement;
  tempDraw!: [number, number][];

  rubberBox = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    display: 'none',
  };

  constructor(
    private whiteboardService: NgWhiteboardService,
    private _cd: ChangeDetectorRef,
    private _svgService: SvgService
  ) {}

  ngOnInit(): void {
    this._initInputsFromOptions(this.options);
    this._initObservables();
    this._initialData = JSON.parse(JSON.stringify(this.data));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      this._initInputsFromOptions(changes['options'].currentValue);
    }
  }

  ngAfterViewInit() {
    this._resizeScreen();
    this._cd.detectChanges();
    this.ready.emit();
  }

  ngOnDestroy(): void {
    this._subscriptionList.forEach((subscription) => this._unsubscribe(subscription));
  }

  private _initInputsFromOptions(options: WhiteboardOptions): void {
    if (options) {
      if (options.drawingEnabled != undefined) {
        this.drawingEnabled = options.drawingEnabled;
      }
      if (options.selectedTool != undefined) {
        this.selectedTool = options.selectedTool;
      }
      if (options.canvasWidth != undefined) {
        this.canvasWidth = options.canvasWidth;
      }
      if (options.canvasHeight != undefined) {
        this.canvasHeight = options.canvasHeight;
      }
      if (options.fullScreen != undefined) {
        this.fullScreen = options.fullScreen;
      }
      if (options.center != undefined) {
        this.center = options.center;
      }
      if (options.strokeColor != undefined) {
        this.strokeColor = options.strokeColor;
      }
      if (options.strokeWidth != undefined) {
        this.strokeWidth = options.strokeWidth;
      }
      if (options.backgroundColor != undefined) {
        this.backgroundColor = options.backgroundColor;
      }
      if (options.lineJoin != undefined) {
        this.lineJoin = options.lineJoin;
      }
      if (options.lineCap != undefined) {
        this.lineCap = options.lineCap;
      }
      if (options.fill != undefined) {
        this.fill = options.fill;
      }
      if (options.zoom != undefined) {
        this.zoom = options.zoom;
      }
      if (options.fontFamily != undefined) {
        this.fontFamily = options.fontFamily;
      }
      if (options.fontSize != undefined) {
        this.fontSize = options.fontSize;
      }
      if (options.dasharray != undefined) {
        this.dasharray = options.dasharray;
      }
      if (options.dashoffset != undefined) {
        this.dashoffset = options.dashoffset;
      }
      if (options.x != undefined) {
        this.x = options.x;
      }
      if (options.y != undefined) {
        this.y = options.y;
      }
      if (options.enableGrid != undefined) {
        this.enableGrid = options.enableGrid;
      }
      if (options.gridSize != undefined) {
        this.gridSize = options.gridSize;
      }
      if (options.snapToGrid != undefined) {
        this.snapToGrid = options.snapToGrid;
      }
    }
  }

  private _initObservables(): void {
    this._subscriptionList.push(this._svgService.getPointerDown$().subscribe(this.handleStartEvent.bind(this)));
    this._subscriptionList.push(this._svgService.getPointerMove$().subscribe(this.handleDragEvent.bind(this)));
    this._subscriptionList.push(this._svgService.getPointerUp$().subscribe(this.handleEndEvent.bind(this)));
    this._subscriptionList.push(
      this.whiteboardService.saveMethodCalled$.subscribe(({ name, format }) => this.saveDraw(name, format))
    );
    this._subscriptionList.push(
      this.whiteboardService.addImageMethodCalled$.subscribe((image) => this.addImage(image))
    );
    this._subscriptionList.push(this.whiteboardService.eraseMethodCalled$.subscribe(() => this.clearDraw()));
    this._subscriptionList.push(this.whiteboardService.undoMethodCalled$.subscribe(() => this.undoDraw()));
    this._subscriptionList.push(this.whiteboardService.redoMethodCalled$.subscribe(() => this.redoDraw()));
    this._subscriptionList.push(fromEvent(window, 'resize').subscribe(() => this._resizeScreen()));
    this._subscriptionList.push(
      this._data.pipe(skip(1)).subscribe((data) => {
        this.dataChange.emit(data);
      })
    );
  }

  handleStartEvent(info: PointerEvent) {
    this.redoStack = [];
    const toolHandlers: ToolHandlers = {
      [ToolsEnum.BRUSH]: this.handleStartBrush,
      [ToolsEnum.IMAGE]: this.handleImageTool,
      [ToolsEnum.LINE]: this.handleStartLine,
      [ToolsEnum.ARROW]: this.handleStartArrow,
      [ToolsEnum.RECT]: this.handleStartRect,
      [ToolsEnum.ELLIPSE]: this.handleStartEllipse,
      [ToolsEnum.TEXT]: this.handleTextTool,
      [ToolsEnum.SELECT]: this.handleSelectTool,
      [ToolsEnum.ERASER]: this.handleEraserTool,
    };
    const handler = toolHandlers[this.selectedTool];
    if (handler) {
      handler.apply(this, [info]);
    }
  }
  handleDragEvent(info: PointerEvent) {
    const toolHandlers: ToolHandlers = {
      [ToolsEnum.BRUSH]: this.handleDragBrush,
      [ToolsEnum.LINE]: this.handleDragLine,
      [ToolsEnum.ARROW]: this.handleDragArrow,
      [ToolsEnum.RECT]: this.handleDragRect,
      [ToolsEnum.ELLIPSE]: this.handleDragEllipse,
      [ToolsEnum.TEXT]: this.handleTextDrag,
    };
    const handler = toolHandlers[this.selectedTool];
    if (handler) {
      handler.apply(this, [info]);
    }
  }
  handleEndEvent(info: PointerEvent) {
    const toolHandlers: ToolHandlers = {
      [ToolsEnum.BRUSH]: this.handleEndBrush,
      [ToolsEnum.LINE]: this.handleEndLine,
      [ToolsEnum.ARROW]: this.handleEndArrow,
      [ToolsEnum.RECT]: this.handleEndRect,
      [ToolsEnum.ELLIPSE]: this.handleEndEllipse,
      [ToolsEnum.TEXT]: this.handleTextEnd,
    };
    const handler = toolHandlers[this.selectedTool];
    if (handler) {
      handler.apply(this, [info]);
    }
  }
  // Handle Brush tool
  handleStartBrush(info: PointerEvent) {
    const element = this._generateNewElement(ElementTypeEnum.BRUSH);
    this.tempDraw = [this._calculateXAndY([info.offsetX, info.offsetY])];
    const outlinePoints = getStroke(this.tempDraw, getStrokeOptions);
    const pathData = Utils.getSvgPathFromStroke(outlinePoints);
    element.value = pathData;
    element.options.strokeWidth = this.strokeWidth;
    this.tempElement = element;
  }
  handleDragBrush(info: PointerEvent) {
    this.tempDraw.push(this._calculateXAndY([info.offsetX, info.offsetY]));
    const outlinePoints = getStroke(this.tempDraw, getStrokeOptions);
    const pathData = Utils.getSvgPathFromStroke(outlinePoints);
    this.tempElement.value = pathData;
  }
  handleEndBrush(info: PointerEvent) {
    this.tempDraw.push(this._calculateXAndY([info.offsetX, info.offsetY]));
    const outlinePoints = getStroke(this.tempDraw, getStrokeOptions);
    const pathData = Utils.getSvgPathFromStroke(outlinePoints);
    this.tempElement.value = pathData;
    this._pushToData(this.tempElement);
    this._pushToUndo();
    this.tempDraw = null as never;
    this.tempElement = null as never;
  }
  // Handle Image tool
  handleImageTool(info: PointerEvent) {
    const [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent) => {
          const image = (e.target as FileReader).result as string;
          this.addImage({ image, x, y });
        };
        reader.readAsDataURL(files[0]);
      }
    };
    input.click();
  }
  // Handle Line tool
  handleStartLine(info: PointerEvent) {
    const element = this._generateNewElement(ElementTypeEnum.LINE);
    let [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);

    if (this.snapToGrid) {
      x = Utils.snapToGrid(x, this.gridSize);
      y = Utils.snapToGrid(y, this.gridSize);
    }

    element.options.x1 = x;
    element.options.y1 = y;
    element.options.x2 = x;
    element.options.y2 = y;
    this.tempElement = element;
  }
  handleDragLine(info: PointerEvent) {
    let [x2, y2] = this._calculateXAndY([info.offsetX, info.offsetY]);

    if (this.snapToGrid) {
      x2 = Utils.snapToGrid(x2, this.gridSize);
      y2 = Utils.snapToGrid(y2, this.gridSize);
    }

    if (info.shiftKey) {
      const x1 = this.tempElement.options.x1 as number;
      const y1 = this.tempElement.options.y1 as number;
      const { x, y } = Utils.snapToAngle(x1, y1, x2, y2);
      [x2, y2] = [x, y];
    }

    this.tempElement.options.x2 = x2;
    this.tempElement.options.y2 = y2;
  }
  handleEndLine() {
    if (
      this.tempElement.options.x1 != this.tempElement.options.x2 ||
      this.tempElement.options.y1 != this.tempElement.options.y2
    ) {
      this._pushToData(this.tempElement);
      this._pushToUndo();
      this.tempElement = null as never;
    }
  }
  // Handle Arrow tool
  handleStartArrow(info: PointerEvent) {
    const element = this._generateNewElement(ElementTypeEnum.ARROW);
    let [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);

    if (this.snapToGrid) {
      x = Utils.snapToGrid(x, this.gridSize);
      y = Utils.snapToGrid(y, this.gridSize);
    }

    element.options.x1 = x;
    element.options.y1 = y;
    element.options.x2 = x;
    element.options.y2 = y;
    this.tempElement = element;
  }
  handleDragArrow(info: PointerEvent) {
    let [x2, y2] = this._calculateXAndY([info.offsetX, info.offsetY]);

    if (this.snapToGrid) {
      x2 = Utils.snapToGrid(x2, this.gridSize);
      y2 = Utils.snapToGrid(y2, this.gridSize);
    }

    if (info.shiftKey) {
      const x1 = this.tempElement.options.x1 as number;
      const y1 = this.tempElement.options.y1 as number;
      const { x, y } = Utils.snapToAngle(x1, y1, x2, y2);
      [x2, y2] = [x, y];
    }

    this.tempElement.options.x2 = x2;
    this.tempElement.options.y2 = y2;
  }
  handleEndArrow() {
    if (
      this.tempElement.options.x1 != this.tempElement.options.x2 ||
      this.tempElement.options.y1 != this.tempElement.options.y2
    ) {
      this._pushToData(this.tempElement);
      this._pushToUndo();
      this.tempElement = null as never;
    }
  }
  // Handle Rect tool
  handleStartRect(info: PointerEvent) {
    const element = this._generateNewElement(ElementTypeEnum.RECT);
    let [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);
    if (this.snapToGrid) {
      x = Utils.snapToGrid(x, this.gridSize);
      y = Utils.snapToGrid(y, this.gridSize);
    }
    element.options.x1 = x;
    element.options.y1 = y;
    element.options.x2 = x;
    element.options.y2 = y;
    element.options.width = 1;
    element.options.height = 1;
    this.tempElement = element;
  }
  handleDragRect(info: PointerEvent) {
    const [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);
    const start_x = this.tempElement.options.x1 || 0;
    const start_y = this.tempElement.options.y1 || 0;
    let w = Math.abs(x - start_x);
    let h = Math.abs(y - start_y);
    let new_x = null;
    let new_y = null;

    if (info.shiftKey) {
      w = h = Math.max(w, h);
      new_x = start_x < x ? start_x : start_x - w;
      new_y = start_y < y ? start_y : start_y - h;
    } else {
      new_x = Math.min(start_x, x);
      new_y = Math.min(start_y, y);
    }
    if (info.altKey) {
      w *= 2;
      h *= 2;
      new_x = start_x - w / 2;
      new_y = start_y - h / 2;
    }
    if (this.snapToGrid) {
      w = Utils.snapToGrid(w, this.gridSize);
      h = Utils.snapToGrid(h, this.gridSize);
      new_x = Utils.snapToGrid(new_x, this.gridSize);
      new_y = Utils.snapToGrid(new_y, this.gridSize);
    }

    this.tempElement.options.width = w;
    this.tempElement.options.height = h;
    this.tempElement.options.x2 = new_x;
    this.tempElement.options.y2 = new_y;
  }
  handleEndRect() {
    if (this.tempElement.options.width != 0 || this.tempElement.options.height != 0) {
      this._pushToData(this.tempElement);
      this._pushToUndo();
      this.tempElement = null as never;
    }
  }
  // Handle Ellipse tool
  handleStartEllipse(info: PointerEvent) {
    const element = this._generateNewElement(ElementTypeEnum.ELLIPSE);
    const [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);

    // workaround
    element.options.x1 = x;
    element.options.y1 = y;

    element.options.cx = x;
    element.options.cy = y;
    this.tempElement = element;
  }
  handleDragEllipse(info: PointerEvent) {
    const [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);
    const start_x = this.tempElement.options.x1 || 0;
    const start_y = this.tempElement.options.y1 || 0;
    let cx = Math.abs(start_x + (x - start_x) / 2);
    let cy = Math.abs(start_y + (y - start_y) / 2);
    let rx = Math.abs(start_x - cx);
    let ry = Math.abs(start_y - cy);

    if (info.shiftKey) {
      ry = rx;
      cy = y > start_y ? start_y + rx : start_y - rx;
    }
    if (info.altKey) {
      cx = start_x;
      cy = start_y;
      rx = Math.abs(x - cx);
      ry = info.shiftKey ? rx : Math.abs(y - cy);
    }

    this.tempElement.options.rx = rx;
    this.tempElement.options.ry = ry;
    this.tempElement.options.cx = cx;
    this.tempElement.options.cy = cy;
  }
  handleEndEllipse() {
    if (this.tempElement.options.rx != 0 || this.tempElement.options.ry != 0) {
      this._pushToData(this.tempElement);
      this._pushToUndo();
      this.tempElement = null as never;
    }
  }
  // Handle Text tool
  handleTextTool(info: PointerEvent) {
    if (this.tempElement) {
      // finish the current one if needed
      this.finishTextInput();
      return;
    }
    let element = this._getTargetElement(info);
    if (element && element.type === ElementTypeEnum.TEXT) {
      this._removeFromData(element);
    } else {
      element = this._generateNewElement(ElementTypeEnum.TEXT);
      const [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);
      element.options.top = y;
      element.options.left = x;
      element.options.strokeWidth = 0;
    }
    this.tempElement = element;
    this._cd.detectChanges();
    setTimeout(() => {
      this.textInput.nativeElement.focus();
    }, 0);
  }
  handleTextDrag(info: PointerEvent) {
    if (!this.tempElement) {
      return;
    }
    const [x, y] = this._calculateXAndY([info.offsetX, info.offsetY]);
    this.tempElement.options.top = y;
    this.tempElement.options.left = x;
  }
  handleTextEnd() {
    if (!this.tempElement) {
      return;
    }
    this._pushToUndo();
  }
  // Handle Select tool
  handleSelectTool(info: PointerEvent) {
    const mouse_target = this._getMouseTarget(info);
    if (mouse_target) {
      if (mouse_target.id === 'selectorGroup') {
        return;
      }
      const id = mouse_target.getAttribute('data-wb-id');
      const selectedElement = this.data.find((el) => el.id === id) as WhiteboardElement;
      this.setSelectedElement(selectedElement);
    } else {
      this.clearSelectedElement();
    }
  }
  // Handle Eraser tool
  handleEraserTool(info: PointerEvent) {
    const element = this._getTargetElement(info);

    if (element) {
      this.data = this.data.filter((el) => el.id !== element.id);
      this._pushToUndo();
      this.deleteElement.emit(element);
    }
  }
  // convert the value of this.textInput.nativeElement to an SVG text node, unless it's empty,
  // and then dismiss this.textInput.nativeElement
  finishTextInput() {
    const value = this.textInput.nativeElement.value;
    this.tempElement.value = value;
    if (this.tempElement.value) {
      this._pushToData(this.tempElement);
      this._pushToUndo();
    }
    this.tempElement = null as never;
  }
  // Handle Text Input
  updateTextItem(value: string) {
    if (this.tempElement && this.selectedTool == ToolsEnum.TEXT) {
      this.tempElement.value = value;
    }
  }
  setSelectedElement(element: WhiteboardElement) {
    this.selectedTool = ToolsEnum.SELECT;
    const currentBBox = this._getElementBbox(element);
    this.selectedElement = element;
    this.selectElement.emit(element);
    this._showGrips(currentBBox);
  }
  clearSelectedElement() {
    this.selectedElement = null as never;
    this.rubberBox.display = 'none';
    this.selectElement.emit(null);
  }
  addImage(imageSrc: IAddImage) {
    const tempImg = new Image();
    tempImg.onload = () => {
      const svgHeight = this.canvasHeight;
      const imageWidth = tempImg.width;
      const imageHeight = tempImg.height;
      const aspectRatio = tempImg.width / tempImg.height;
      const height = imageHeight > svgHeight ? svgHeight - 40 : imageHeight;
      const width = height === svgHeight - 40 ? (svgHeight - 40) * aspectRatio : imageWidth;

      let x = imageSrc.x || (imageWidth - width) * (imageSrc.x || 0);
      let y = imageSrc.y || (imageHeight - height) * (imageSrc.y || 0);

      if (x < 0) {
        x = 0;
      }
      if (y < 0) {
        y = 0;
      }

      const element = this._generateNewElement(ElementTypeEnum.IMAGE);
      element.value = imageSrc.image as string;
      element.options.width = width;
      element.options.height = height;
      element.x = x;
      element.y = y;
      this._pushToData(element);
      this.imageAdded.emit();
      this._pushToUndo();
    };
    tempImg.src = imageSrc.image as string;
  }
  async saveDraw(name: string, format: formatTypes) {
    const svgElement = this.svgContainer.nativeElement.getElementById('svgcontent') as SVGSVGElement;
    const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

    const selectorParentGroup = svgClone.getElementById('selectorParentGroup');
    if (selectorParentGroup) {
      selectorParentGroup.remove();
    }
    const contentBackground = svgClone.getElementById('contentBackground');
    if (contentBackground) {
      contentBackground.removeAttribute('opacity');
    }

    svgClone.setAttribute('x', '0');
    svgClone.setAttribute('y', '0');

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const imageString = await Utils.svgToBase64(svgString, this.canvasWidth, this.canvasHeight, format);
    switch (format) {
      case FormatType.Base64:
        this.save.emit(imageString);
        break;
      case FormatType.Svg: {
        const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
        Utils.downloadFile(imgSrc, name);
        this.save.emit(imgSrc);
        break;
      }
      default:
        Utils.downloadFile(imageString, name);
        this.save.emit(imageString);
        break;
    }
  }
  clearDraw() {
    this.data = [];
    this._data.next(this.data);
    this._pushToUndo();
    this.clear.emit();
  }
  undoDraw() {
    if (!this.undoStack.length) {
      return;
    }
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState as WhiteboardElement[]);
    if (this.undoStack.length) {
      this.data = JSON.parse(JSON.stringify(this.undoStack[this.undoStack.length - 1]));
    } else {
      this.data = JSON.parse(JSON.stringify(this._initialData));
    }
    this.undo.emit();
  }
  redoDraw() {
    if (!this.redoStack.length) {
      return;
    }
    const currentState = this.redoStack.pop() as WhiteboardElement[];
    this.undoStack.push(JSON.parse(JSON.stringify(currentState)));
    this.data = currentState;
    this.redo.emit();
  }
  private _pushToUndo() {
    this.undoStack.push(JSON.parse(JSON.stringify(this.data)));
  }
  private _pushToData(element: WhiteboardElement) {
    this.data.push(element);
    this._data.next(this.data);
  }
  private _removeFromData(element: WhiteboardElement) {
    const index = this.data.indexOf(element);
    if (index > -1) {
      this.data.splice(index, 1);
      this._data.next(this.data);
    }
  }
  private _generateNewElement(name: ElementTypeEnum): WhiteboardElement {
    const element = new WhiteboardElement(name, {
      strokeWidth: this.strokeWidth,
      strokeColor: this.strokeColor,
      fill: this.fill,
      lineJoin: this.lineJoin,
      lineCap: this.lineCap,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      dasharray: this.dasharray,
      dashoffset: this.dashoffset,
    });
    return element;
  }
  private _calculateXAndY([x, y]: [number, number]): [number, number] {
    return [(x - this.x) / this.zoom, (y - this.y) / this.zoom];
  }
  private _resizeScreen() {
    const svgContainer = this.svgContainer.nativeElement;
    if (this.fullScreen) {
      this.canvasWidth = svgContainer.clientWidth;
      this.canvasHeight = svgContainer.clientHeight;
    }
    if (this.center) {
      this.x = svgContainer.clientWidth / 2 - this.canvasWidth / 2;
      this.y = svgContainer.clientHeight / 2 - this.canvasHeight / 2;
    }
  }
  private _getElementBbox(element: WhiteboardElement): DOMRect {
    const elementId = `item_${element.id}`;
    const el = this.svgContainer.nativeElement.getElementById(elementId) as SVGGraphicsElement;
    const bbox = el.getBBox();
    return bbox;
  }
  private _getMouseTarget(info: PointerEvent): SVGGraphicsElement | null {
    if (info == null || info.target == null) {
      return null;
    }
    let mouse_target = info.target as SVGGraphicsElement;
    if (mouse_target.id === 'svgroot') {
      return null;
    }
    if (mouse_target.parentNode) {
      mouse_target = mouse_target.parentNode.parentNode as SVGGraphicsElement;
      if (mouse_target.id === 'selectorGroup') {
        return mouse_target;
      }
      while (!mouse_target.id.includes('item_')) {
        if (mouse_target.id === 'svgroot') {
          return null;
        }
        mouse_target = mouse_target.parentNode as SVGGraphicsElement;
      }
    }
    return mouse_target;
  }
  private _getTargetElement(info: PointerEvent): WhiteboardElement | null {
    const mouse_target = this._getMouseTarget(info);
    if (mouse_target) {
      if (mouse_target.id === 'selectorGroup') {
        return null;
      }
      const id = mouse_target.getAttribute('data-wb-id');
      return this.data.find((el) => el.id === id) as WhiteboardElement;
    }
    return null;
  }
  private _showGrips(bbox: DOMRect) {
    this.rubberBox = {
      x: bbox.x - ((this.selectedElement.options.strokeWidth as number) || 0) * 0.5,
      y: bbox.y - ((this.selectedElement.options.strokeWidth as number) || 0) * 0.5,
      width: bbox.width + (this.selectedElement.options.strokeWidth as number) || 0,
      height: bbox.height + (this.selectedElement.options.strokeWidth as number) || 0,
      display: 'block',
    };
  }
  moveSelect(downEvent: PointerEvent) {
    let isPointerDown = true;
    downEvent.stopPropagation();
    const element = downEvent.target as SVGGraphicsElement;
    element.addEventListener('pointermove', (moveEvent) => {
      if (!isPointerDown) return;
      if (this.selectedElement) {
        this.selectedElement.x += moveEvent.movementX;
        this.selectedElement.y += moveEvent.movementY;
      }
    });
    element.addEventListener('pointerup', () => {
      isPointerDown = false;
    });
  }
  resizeSelect(downEvent: PointerEvent) {
    let isPointerDown = true;
    const element = downEvent.target as SVGGraphicsElement;
    document.addEventListener('pointermove', (moveEvent) => {
      if (!isPointerDown) return;
      const grip = element.id.split('_')[2];
      const x = (moveEvent as PointerEvent).movementX;
      const y = (moveEvent as PointerEvent).movementY;
      const bbox = this._getElementBbox(this.selectedElement);
      const width = bbox.width;
      const height = bbox.height;
      switch (this.selectedElement.type) {
        case ElementTypeEnum.ELLIPSE:
          this._resizeElipse(grip, { x, y, width, height });
          break;
        case ElementTypeEnum.LINE:
        case ElementTypeEnum.ARROW:
          this._resizeLine(grip, { x, y, width, height });
          break;
        default:
          this._resizeDefault(grip, { x, y, width, height });
          break;
      }
      this._showGrips(this._getElementBbox(this.selectedElement));
    });
    document.addEventListener('pointerup', () => {
      isPointerDown = false;
    });
  }
  private _resizeLine(dir: string, bbox: BBox) {
    switch (dir) {
      case 'nw':
        (this.selectedElement.options.x1 as number) += bbox.x;
        (this.selectedElement.options.y1 as number) += bbox.y;
        break;
      case 'n':
        (this.selectedElement.options.y1 as number) += bbox.y;
        break;
      case 'ne':
        (this.selectedElement.options.x2 as number) += bbox.x;
        (this.selectedElement.options.y1 as number) += bbox.y;
        break;
      case 'e':
        (this.selectedElement.options.x2 as number) += bbox.x;
        break;
      case 'se':
        (this.selectedElement.options.x2 as number) += bbox.x;
        (this.selectedElement.options.y2 as number) += bbox.y;
        break;
      case 's':
        (this.selectedElement.options.y2 as number) += bbox.y;
        break;
      case 'sw':
        (this.selectedElement.options.x1 as number) += bbox.x;
        (this.selectedElement.options.y2 as number) += bbox.y;
        break;
      case 'w':
        (this.selectedElement.options.x1 as number) += bbox.x;
        break;
    }
  }
  private _resizeElipse(dir: string, bbox: BBox) {
    switch (dir) {
      case 'nw':
        this.selectedElement.x += bbox.x / 2;
        this.selectedElement.y += bbox.y / 2;
        (this.selectedElement.options.rx as number) -= bbox.x / 2;
        (this.selectedElement.options.ry as number) -= bbox.y / 2;
        break;
      case 'n':
        this.selectedElement.y += bbox.y / 2;
        (this.selectedElement.options.ry as number) -= bbox.y / 2;
        break;
      case 'ne':
        this.selectedElement.x += bbox.x / 2;
        this.selectedElement.y += bbox.y / 2;
        (this.selectedElement.options.rx as number) += bbox.x / 2;
        (this.selectedElement.options.ry as number) -= bbox.y / 2;
        break;
      case 'e':
        this.selectedElement.x += bbox.x / 2;
        (this.selectedElement.options.rx as number) += bbox.x / 2;
        break;
      case 'se':
        this.selectedElement.x += bbox.x / 2;
        this.selectedElement.y += bbox.y / 2;
        (this.selectedElement.options.rx as number) += bbox.x / 2;
        (this.selectedElement.options.ry as number) += bbox.y / 2;
        break;
      case 's':
        this.selectedElement.y += bbox.y / 2;
        (this.selectedElement.options.ry as number) += bbox.y / 2;
        break;
      case 'sw':
        this.selectedElement.x += bbox.x / 2;
        this.selectedElement.y += bbox.y / 2;
        (this.selectedElement.options.rx as number) -= bbox.x / 2;
        (this.selectedElement.options.ry as number) += bbox.y / 2;
        break;
      case 'w':
        this.selectedElement.x += bbox.x / 2;
        (this.selectedElement.options.rx as number) -= bbox.x / 2;
        break;
    }
  }
  private _resizeDefault(dir: string, bbox: BBox) {
    switch (dir) {
      case 'nw':
        this.selectedElement.x += bbox.x;
        this.selectedElement.y += bbox.y;
        this.selectedElement.options.width = bbox.width - bbox.x;
        this.selectedElement.options.height = bbox.height - bbox.y;
        break;
      case 'n':
        this.selectedElement.y += bbox.y;
        this.selectedElement.options.height = bbox.height - bbox.y;
        break;
      case 'ne':
        this.selectedElement.y += bbox.y;
        this.selectedElement.options.width = bbox.width + bbox.x;
        this.selectedElement.options.height = bbox.height - bbox.y;
        break;
      case 'e':
        this.selectedElement.options.width = bbox.width + bbox.x;
        break;
      case 'se':
        this.selectedElement.options.width = bbox.width + bbox.x;
        this.selectedElement.options.height = bbox.height + bbox.y;
        break;
      case 's':
        this.selectedElement.options.height = bbox.height + bbox.y;
        break;
      case 'sw':
        this.selectedElement.x += bbox.x;
        this.selectedElement.options.width = bbox.width - bbox.x;
        this.selectedElement.options.height = bbox.height + bbox.y;
        break;
      case 'w':
        this.selectedElement.x += bbox.x;
        this.selectedElement.options.width = bbox.width - bbox.x;
        break;
    }
  }
  private _unsubscribe(subscription: Subscription): void {
    if (subscription) {
      subscription.unsubscribe();
    }
  }
}
