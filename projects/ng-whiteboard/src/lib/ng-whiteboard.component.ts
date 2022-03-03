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

  @Output() onInit = new EventEmitter<any>();
  @Output() onClear = new EventEmitter<any>();
  @Output() onUndo = new EventEmitter<any>();
  @Output() onRedo = new EventEmitter<any>();
  @Output() onImageAdded = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<string>();

  private selection: Selection<any, unknown, null, undefined> = undefined;

  private _subscriptionList: Subscription[] = [];

  private undoStack: WhiteboardData[][] = [];
  private redoStack: WhiteboardData[][] = [];

  drawingEnabled = false;
  types = ElementTypeEnum;
  tempElement: WhiteboardData;
  tempDraw: [number, number][];

  selectedElementId: string;
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
    this.initalizeEvents(this.selection);
  }

  ngOnDestroy(): void {
    this._subscriptionList.forEach((subscription) => this._unsubscribe(subscription));
  }

  private _initInputsFromOptions(options: WhiteboardOptions): void {
    if (options) {
      // if (!this._isNullOrUndefined(options.imageUrl)) {
      //   this.imageUrl = options.imageUrl;
      // }
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
    this._subscriptionList.push(
      this.whiteboardService.saveSvgMethodCalled$.subscribe(({ name, format }) => this.saveSvg(name, format))
    );
    this._subscriptionList.push(this.whiteboardService.eraseSvgMethodCalled$.subscribe(() => this.clearSvg()));
    this._subscriptionList.push(this.whiteboardService.undoSvgMethodCalled$.subscribe(() => this.undoDraw()));
    this._subscriptionList.push(this.whiteboardService.redoSvgMethodCalled$.subscribe(() => this.redoDraw()));
    this._subscriptionList.push(
      this.whiteboardService.addImageMethodCalled$.subscribe((image) => this.addImage(image))
    );
    this._subscriptionList.push(this.whiteboardService.addTextMethodCalled$.subscribe((text) => this.addText(text)));
  }

  initalizeEvents(selection: Selection<any, unknown, null, undefined>) {
    selection.call(
      drag()
        .on('start', () => this.handleMouseDown())
        .on('drag', () => this.handleMouseDrag())
        .on('end', () => this.handleMouseUp())
    );
  }

  handleMouseDown() {
    switch (this.selectedTool) {
      case ToolsEnum.BRUSH:
        this.drawingEnabled = true;
        this.tempDraw = [mouse(this.selection.node())];
        this.tempElement = this._freeHandElFactory(this.tempDraw);
        console.log(this.tempElement);

        this.data.push(this.tempElement);
        this.pushToUndo();
        break;
      case ToolsEnum.SELECT:
        // const x =  subjx(`#${this.selectedElementId}`).drag()
        // console.log(this.selectedElementId)
        break;
      case ToolsEnum.TEXT:
        console.log('here');

        const [x, y] = mouse(this.selection.node());
        const textEl = this._textElFactory(x, y);
        this.data.push(textEl);

        console.log(textEl);
        break;
      default:
        break;
    }
  }

  handleMouseDrag() {
    switch (this.selectedTool) {
      case ToolsEnum.BRUSH:
        if (!this.drawingEnabled) {
          return;
        }
        this.tempDraw.push(mouse(this.selection.node()));
        this.tempElement.value = d3Line(this.tempDraw);
        break;

      default:
        break;
    }
  }
  handleMouseUp() {
    switch (this.selectedTool) {
      case ToolsEnum.BRUSH:
        this.drawingEnabled = false;
        this.tempElement = null;
        this.tempDraw = null;
        break;

      default:
        break;
    }
  }

  handleSelect(elementId: string) {
    if (this.selectedTool === ToolsEnum.SELECT) {
      this.selectedElementId = elementId;
      console.log(this.selectedElementId);
    }
  }

  addImage(obj: IAddImage): void {
    const tempImg = new Image();
    tempImg.onload = () => {
      const aspectRatio = tempImg.width / tempImg.height;
      const height =
        tempImg.height > Number(this.selection.style('height').replace('px', ''))
          ? Number(this.selection.style('height').replace('px', '')) - 40
          : tempImg.height;
      const width =
        height === Number(this.selection.style('height').replace('px', '')) - 40
          ? (Number(this.selection.style('height').replace('px', '')) - 40) * aspectRatio
          : tempImg.width;

      const newImage = new ImageShape(obj.image, width, height, obj.x, obj.y);
      // const element = new ElementType(newImage);

      this.pushToUndo();
    };
    tempImg.src = obj.image.toString();
  }

  addText(obj: IAddText) {
    const text = new TextShape(obj.text, this.color, this.size, obj.x, obj.y);
    // const element = new ElementType(text);

    this.pushToUndo();
  }

  private undoDraw() {
    if (!this.undoStack.length) {
      return;
    }
    const currentState = this.undoStack.pop();
    this.redoStack.push(currentState);
    this.data = this.undoStack[this.undoStack.length - 1] || [];
    this.onUndo.emit();
  }

  private redoDraw() {
    if (!this.redoStack.length) {
      return;
    }
    const currentState = this.redoStack.pop();
    this.undoStack.push(currentState);
    this.data = currentState;
    this.onRedo.emit();
  }

  clearSvg() {
    this._data = [];
    this.pushToUndo();
    this.onClear.emit();
  }

  saveSvg(name: string, format?: formatTypes) {
    const svgString = this.saveAsSvg(this.selection.clone(true).node());
    if (format === 'svg') {
      this.download('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))), name);
    } else {
      this.svgString2Image(
        svgString,
        Number(this.selection.style('width').replace('px', '')),
        Number(this.selection.style('height').replace('px', '')),
        format,
        (img) => {
          this.download(img, name);
        }
      );
    }

    // this.data.push(element);
    // this.pushToUndo();
  }

  pushToUndo() {
    this.undoStack.push(this.data);
    this.redoStack = [];
  }

  move(item: any) {
    const element = select(`#${item.id}`);
    element.attr('class', 'onMove');
    let x = 0;
    let y = 0;
    element.call(
      drag()
        .on('start', (e) => {
          x = event.x;
          y = event.y;
        })
        .on('drag', function () {
          const translateX = item.shape.x + (event.x - x);
          const translateY = item.shape.y + (event.y - y);
          select(this).attr('transform', () => {
            return `translate(${translateX}, ${translateY})`;
          });
        })
        .on('end', (e) => {
          item.shape.x = item.shape.x + (event.x - x);
          item.shape.y = item.shape.y + (event.y - y);
        })
    );
  }

  clearMove(item: any) {
    const element = select(`#${item.id}`);
    element.on('mousedown.drag', null);
    element.attr('class', '');

    // console.log({ element });
  }

  //  Important
  // generateCanvasDataUrl(returnedDataType: string = 'image/png', returnedDataQuality: number = 1): string {
  //   return this.context.canvas.toDataURL(returnedDataType, returnedDataQuality);
  // }
  //  Important
  // generateCanvasBlob(callbackFn: any, returnedDataType: string = 'image/png', returnedDataQuality: number = 1): void {
  //   let toBlobMethod: Function;

  //   if (typeof this.context.canvas.toBlob !== 'undefined') {
  //     toBlobMethod = this.context.canvas.toBlob.bind(this.context.canvas);
  //   } else if (typeof (this.context.canvas as any).msToBlob !== 'undefined') {
  //     // For IE
  //     toBlobMethod = (callback) => {
  //       callback && callback((this.context.canvas as any).msToBlob());
  //     };
  //   }

  //   toBlobMethod && toBlobMethod((blob: Blob) => {
  //     callbackFn && callbackFn(blob, returnedDataType);
  //   }, returnedDataType, returnedDataQuality);
  // }

  //  Important
  // downloadCanvasImage(returnedDataType: string = 'image/png', downloadData?: string | Blob, customFileName?: string): void {
  //   if (window.navigator.msSaveOrOpenBlob === undefined) {
  //     const downloadLink = document.createElement('a');
  //     downloadLink.setAttribute('href', downloadData ? downloadData as string : this.generateCanvasDataUrl(returnedDataType));

  //     const fileName = customFileName ? customFileName
  //       : (this.downloadedFileName ? this.downloadedFileName : 'canvas_drawing_' + new Date().valueOf());

  //     downloadLink.setAttribute('download', fileName + this._generateDataTypeString(returnedDataType));
  //     document.body.appendChild(downloadLink);
  //     downloadLink.click();
  //     document.body.removeChild(downloadLink);
  //   } else {
  //     // IE-specific code
  //     if (downloadData) {
  //       this._saveCanvasBlob(downloadData as Blob, returnedDataType);
  //     } else {
  //       this.generateCanvasBlob(this._saveCanvasBlob.bind(this), returnedDataType);
  //     }
  //   }
  // }
  //  Important
  // private _saveCanvasBlob(blob: Blob, returnedDataType: string = 'image/png'): void {
  //   window.navigator.msSaveOrOpenBlob(blob, 'canvas_drawing_' +
  //     new Date().valueOf() + this._generateDataTypeString(returnedDataType));
  // }

  // generateCanvasData(callback: any, returnedDataType: string = 'image/png', returnedDataQuality: number = 1): void {
  //   if (window.navigator.msSaveOrOpenBlob === undefined) {
  //     callback && callback(this.generateCanvasDataUrl(returnedDataType, returnedDataQuality));
  //   } else {
  //     this.generateCanvasBlob(callback, returnedDataType, returnedDataQuality);
  //   }
  // }

  /**
   * Local method to invoke saving of the canvas data when clicked on the canvas Save button
   * This method will emit the generated data with the specified Event Emitter
   *
   * @param returnedDataType
   */
  //  saveLocal(returnedDataType: string = 'image/png'): void {
  //   this.generateCanvasData((generatedData: string | Blob) => {
  //     this.onSave.emit(generatedData);

  //     if (this.shouldDownloadDrawing) {
  //       this.downloadCanvasImage(returnedDataType, generatedData);
  //     }
  //   });
  // }

  // private startWriting() {
  //   this.selection.on('mousedown.drag', null);
  //   this.selection.attr('class', `mo`).on('click', function () {
  //     select(this).append('dev').text('fdfsdfsdfs');
  //     const coord = mouse(this);
  //     console.log(mouse(this));
  //     addTextInput(this, coord);
  //   });

  //   // this.selection = this.initSvg(this.svgContainer.nativeElement);

  //   function addTextInput(svg, coord) {
  //     const myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  //     const textdiv = document.createElement('input');
  //     textdiv.setAttribute('autofocus', '');
  //     textdiv.setAttribute('width', 'auto');
  //     myforeign.setAttribute('width', '100%');
  //     myforeign.setAttribute('height', '100%');
  //     myforeign.classList.add('foreign'); // to make div fit text
  //     textdiv.classList.add('insideforeign'); // to make div fit text
  //     // textdiv.addEventListener("mousedown", elementMousedown, false);
  //     myforeign.setAttributeNS(null, 'transform', 'translate(' + coord[0] + ' ' + coord[1] + ')');
  //     svg.appendChild(myforeign);
  //     myforeign.appendChild(textdiv);
  //   }
  // }

  // private addImage(image: string | ArrayBuffer) {
  //   this.drawImage(image);
  // }

  // private saveSvg(name: string, format: 'png' | 'jpeg' | 'svg') {
  //   const svgString = this.saveAsSvg(this.selection.clone(true).node());
  //   if (format === 'svg') {
  //     this.download('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))), name);
  //   } else {
  //     this.svgString2Image(
  //       svgString,
  //       Number(this.selection.style('width').replace('px', '')),
  //       Number(this.selection.style('height').replace('px', '')),
  //       format,
  //       (img) => {
  //         this.download(img, name);
  //       }
  //     );
  //   }

  //   this.save.emit();
  // }

  // private drawLine(pathNode: SVGPathElement | SVGGElement) {
  //   this.selection.node().appendChild(pathNode);
  // }

  // private drawImage(
  //   image: string | ArrayBuffer,
  //   x = 0,
  //   y = 0,
  //   r = 1,
  //   scale = 1,
  //   width?: undefined,
  //   height?: undefined
  // ) {
  //   const group = this.selection
  //     .append('g')
  //     .data([{ x, y, r, scale }])
  //     .attr('x', x)
  //     .attr('y', y)
  //     .attr('transform', 'translate(0,0)');

  //   const tempImg = new Image();
  //   tempImg.onload = () => {
  //     const aspectRatio = tempImg.width / tempImg.height;
  //     const height =
  //       tempImg.height > Number(this.selection.style('height').replace('px', ''))
  //         ? Number(this.selection.style('height').replace('px', '')) - 40
  //         : tempImg.height;
  //     const width =
  //       height === Number(this.selection.style('height').replace('px', '')) - 40
  //         ? (Number(this.selection.style('height').replace('px', '')) - 40) * aspectRatio
  //         : tempImg.width;
  //     group
  //       .append('image')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('height', height)
  //       .attr('width', width)
  //       .attr('preserveAspectRatio', 'none')
  //       .attr('xlink:href', image.toString());

  //     group
  //       .append('rect')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('width', 20)
  //       .attr('height', 20)
  //       .style('opacity', 0)
  //       .attr('fill', (d) => {
  //         return '#cccccc';
  //       })
  //       .call(
  //         drag()
  //           .subject(() => {
  //             const p = [event.x, event.y];
  //             return [p, p];
  //           })
  //           .on('start', () => {
  //             event.on('drag', function (d: { x: number; y: number; scale: string }) {
  //               const cursor = select(this);
  //               const cord = mouse(this);

  //               d.x += cord[0] - Number(cursor.attr('width')) / 2;
  //               d.y += cord[1] - Number(cursor.attr('height')) / 2;
  //               select(this.parentNode).attr('transform', () => {
  //                 return (
  //                   'translate(' + [d.x, d.y] + '),rotate(' + 0 + ',160, 160),scale(' + d.scale + ',' + d.scale + ')'
  //                 );
  //               });
  //             });
  //           })
  //       );
  //     group
  //       .on('mouseover', function () {
  //         select(this).select('rect').style('opacity', 1.0);
  //       })
  //       .on('mouseout', function () {
  //         select(this).select('rect').style('opacity', 0);
  //       });
  //     // this.undoStack.push({ type: ActionType.Image, image: group.node() });
  //   };
  //   tempImg.src = image.toString();
  // }

  //  addResizer(itemId: string) {
  //    const el = select(`#${itemId}`);
  //    let width =  500;
  //    let height = 100;
  //    let x = 0;
  //    let y = 0;

  //    let w  = 0;
  //    let h  = 0;
  //   let isXChecked = true;
  //   let isYChecked = false;
  //   const dragbarw = 5;
  //   const group = el.append('g')
  //     .data([{ x, y }]);

  //   const dragrect = group.append('rect')
  //     .attr('id', 'active')
  //     .attr('x', function (d) { return d.x; })
  //     .attr('y', function (d) { return d.y; })
  //     .attr('height', height)
  //     .attr('width', width)
  //     .attr('fill-opacity', .5)
  //     .attr('cursor', 'move')
  //     .call(drag().on("drag", dragmove));

  //   const dragbarleft = group.append('rect')
  //     .attr('x', function (d) { return d.x - (dragbarw / 2); })
  //     .attr('y', function (d) { return d.y + (dragbarw / 2); })
  //     .attr('height', height - dragbarw)
  //     .attr('id', 'dragleft')
  //     .attr('width', dragbarw)
  //     .attr('fill', 'lightblue')
  //     .attr('fill-opacity', .5)
  //     .attr('cursor', 'ew-resize')
  //     .call(drag().on("drag", ldragresize));

  //   const dragbarright = group.append('rect')
  //     .attr('x', function (d) { return d.x + width - (dragbarw / 2); })
  //     .attr('y', function (d) { return d.y + (dragbarw / 2); })
  //     .attr('id', 'dragright')
  //     .attr('height', height - dragbarw)
  //     .attr('width', dragbarw)
  //     .attr('fill', 'lightblue')
  //     .attr('fill-opacity', .5)
  //     .attr('cursor', 'ew-resize')
  //     .call(drag().on("drag", rdragresize));

  //   const dragbartop = group.append('rect')
  //     .attr('x', function (d) { return d.x + (dragbarw / 2); })
  //     .attr('y', function (d) { return d.y - (dragbarw / 2); })
  //     .attr('height', dragbarw)
  //     .attr('id', 'dragleft')
  //     .attr('width', width - dragbarw)
  //     .attr('fill', 'lightgreen')
  //     .attr('fill-opacity', .5)
  //     .attr('cursor', 'ns-resize')
  //     .call(drag().on("drag", tdragresize));

  //   const dragbarbottom = group.append('rect')
  //     .attr('x', function (d) { return d.x + (dragbarw / 2); })
  //     .attr('y', function (d) { return d.y + height - (dragbarw / 2); })
  //     .attr('id', 'dragright')
  //     .attr('height', dragbarw)
  //     .attr('width', width - dragbarw)
  //     .attr('fill', 'lightgreen')
  //     .attr('fill-opacity', .5)
  //     .attr('cursor', 'ns-resize')
  //     .call(drag().on("drag", function bdragresize(d) {
  //       var dragy = Math.max(d.y + (dragbarw / 2), Math.min(h, d.y + height + event.dy));

  //       //recalculate width
  //       height = dragy - d.y;

  //       //move the right drag handle
  //       dragbarbottom
  //         .attr("y", function (d) { return dragy - (dragbarw / 2) });

  //       //resize the drag rectangle
  //       //as we are only resizing from the right, the x coordinate does not need to change
  //       dragrect
  //         .attr("height", height);
  //       dragbarleft
  //         .attr("height", height - dragbarw);
  //       dragbarright
  //         .attr("height", height - dragbarw);
  //     }));

  //     function dragmove(d) {
  //       if (isXChecked) {
  //         dragrect
  //           .attr("x", d.x = Math.max(0, Math.min(w - width, event.x)))
  //         dragbarleft
  //           .attr("x", function (d) { return d.x - (dragbarw / 2); })
  //         dragbarright
  //           .attr("x", function (d) { return d.x + width - (dragbarw / 2); })
  //         dragbartop
  //           .attr("x", function (d) { return d.x + (dragbarw / 2); })
  //         dragbarbottom
  //           .attr("x", function (d) { return d.x + (dragbarw / 2); })
  //       }
  //       if (isYChecked) {
  //         dragrect
  //           .attr("y", d.y = Math.max(0, Math.min(h - height, event.y)));
  //         dragbarleft
  //           .attr("y", function (d) { return d.y + (dragbarw / 2); });
  //         dragbarright
  //           .attr("y", function (d) { return d.y + (dragbarw / 2); });
  //         dragbartop
  //           .attr("y", function (d) { return d.y - (dragbarw / 2); });
  //         dragbarbottom
  //           .attr("y", function (d) { return d.y + height - (dragbarw / 2); });
  //       }
  //     }

  //     function ldragresize(d) {
  //       if (isXChecked) {
  //         var oldx = d.x;
  //         //Max x on the right is x + width - dragbarw
  //         //Max x on the left is 0 - (dragbarw/2)
  //         d.x = Math.max(0, Math.min(d.x + width - (dragbarw / 2), event.x));
  //         width = width + (oldx - d.x);
  //         dragbarleft
  //           .attr("x", function (d) { return d.x - (dragbarw / 2); });

  //         dragrect
  //           .attr("x", function (d) { return d.x; })
  //           .attr("width", width);

  //         dragbartop
  //           .attr("x", function (d) { return d.x + (dragbarw / 2); })
  //           .attr("width", width - dragbarw)
  //         dragbarbottom
  //           .attr("x", function (d) { return d.x + (dragbarw / 2); })
  //           .attr("width", width - dragbarw)
  //       }
  //     }

  //     function rdragresize(d) {
  //       if (isXChecked) {
  //         //Max x on the left is x - width
  //         //Max x on the right is width of screen + (dragbarw/2)
  //         var dragx = Math.max(d.x + (dragbarw / 2), Math.min(w, d.x + width + event.dx));

  //         //recalculate width
  //         width = dragx - d.x;

  //         //move the right drag handle
  //         dragbarright
  //           .attr("x", function (d) { return dragx - (dragbarw / 2) });

  //         //resize the drag rectangle
  //         //as we are only resizing from the right, the x coordinate does not need to change
  //         dragrect
  //           .attr("width", width);
  //         dragbartop
  //           .attr("width", width - dragbarw)
  //         dragbarbottom
  //           .attr("width", width - dragbarw)
  //       }
  //     }

  //     function tdragresize(d) {

  //       if (isYChecked) {
  //         var oldy = d.y;
  //         //Max x on the right is x + width - dragbarw
  //         //Max x on the left is 0 - (dragbarw/2)
  //         d.y = Math.max(0, Math.min(d.y + height - (dragbarw / 2), event.y));
  //         height = height + (oldy - d.y);
  //         dragbartop
  //           .attr("y", function (d) { return d.y - (dragbarw / 2); });

  //         dragrect
  //           .attr("y", function (d) { return d.y; })
  //           .attr("height", height);

  //         dragbarleft
  //           .attr("y", function (d) { return d.y + (dragbarw / 2); })
  //           .attr("height", height - dragbarw);
  //         dragbarright
  //           .attr("y", function (d) { return d.y + (dragbarw / 2); })
  //           .attr("height", height - dragbarw);
  //       }
  //     }
  // }

  private _freeHandElFactory(tempDraw: [number, number][]): WhiteboardData {
    console.log(this.strokeColor);

    return new WhiteboardData(
      ElementTypeEnum.FREE_HAND,
      d3Line(tempDraw),
      new ElementOptions(this.fillColor, this.strokeColor, this.size, this.lineJoin, this.lineCap),
      0,
      0,
      0,
      0
    );
  }
  private _textElFactory(x: number, y: number): WhiteboardData {
    return new WhiteboardData(
      ElementTypeEnum.TEXT,
      'Mostafa',
      new ElementOptions(this.fillColor, this.strokeColor, this.size, this.lineJoin, this.lineCap),
      x,
      y,
      0,
      0
    );
  }

  private saveAsSvg(svgNode): string {
    svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');

    // Set width and height for svg element
    svgNode.setAttribute('width', Number(this.selection.style('width').replace('px', '')));
    svgNode.setAttribute('height', Number(this.selection.style('height').replace('px', '')));

    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(svgNode);
    svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
    svgString = svgString.replace(/NS\d+:href/g, 'xlink:href');
    return svgString;
  }

  private download(url: string, name: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('visibility', 'hidden');
    link.download = name || 'new white-board';
    document.body.appendChild(link);
    link.click();
  }
  // private undoDraw() {
  //   if (!this.undoStack.length) {
  //     return;
  //   }
  //   const currentState = this.undoStack.pop();
  //   this.redoStack.push(currentState);
  //   this._dataType = this.undoStack[this.undoStack.length - 1] || [];
  //   this.undo.emit();
  // }

  // private redoDraw() {
  //   if (!this.redoStack.length) {
  //     return;
  //   }
  //   const currentState = this.redoStack.pop();
  //   this.undoStack.push(currentState);
  //   this._dataType = currentState;
  //   this.redo.emit();
  // }

  // clearSvg() {
  //   this.data = [];
  //   this.pushToUndo();
  //   this.clear.emit();
  // }

  // saveSvg() {}

  // pushToUndo() {
  //   this.undoStack.push(JSON.parse(JSON.stringify(this._dataType)));
  //   this.redoStack = [];
  // }

  // handleSvgClick() {
  //   this.selection.on('click', (e) => {
  //     this.onClick.emit(event);
  //   });
  // }

  // move(item: ElementType<LineShape | ImageShape | TextShape>) {
  //   const element = select(`#${item.id}`);
  //   element.attr('class', 'onMove')
  //   let x = 0;
  //   let y = 0;
  //   element.call(
  //     drag()
  //       .on('start', (e) => {
  //         x = event.x;
  //         y = event.y;
  //       })
  //       .on('drag', function () {
  //         const translateX = item.shape.x + (event.x - x);
  //         const translateY = item.shape.y + (event.y - y);
  //         select(this).attr('transform', () => {
  //           return `translate(${translateX}, ${translateY})`;
  //         });
  //       })
  //       .on('end', (e) => {
  //         item.shape.x = item.shape.x + (event.x - x);
  //         item.shape.y = item.shape.y + (event.y - y);
  //       })
  //   );
  // }

  // clearMove(item: ElementType<LineShape | ImageShape | TextShape>) {
  //   const element = select(`#${item.id}`);
  //   element.on('mousedown.drag', null);
  //   element.attr('class', '')

  // console.log({ element });
  // }

  // draw(): void {
  //   const d3Line = line().curve(curveBasis);
  //   let tempDraw: [number, number][];

  //   this.selection.call(
  //     drag()
  //       .container(this.svgContainer.nativeElement)
  //       .subject(() => {
  //         const p = [event.x, event.y];
  //         return [p, p];
  //       })
  //       .on('start', (e) => {
  //         if (!this.drawingEnabled) {
  //           return;
  //         }
  //         tempDraw = event.subject;
  //         // this.tempLine = d3Line(tempDraw);
  //       })
  //       .on('drag', () => {
  //         if (!this.drawingEnabled) {
  //           return;
  //         }

  //         tempDraw.push(mouse(this.selection.node()));
  //         // this.tempLine = d3Line(tempDraw);
  //       })
  //       .on('end', () => {
  //         if (!this.drawingEnabled) {
  //           return;
  //         }
  //         tempDraw.push(mouse(this.selection.node()));
  //         // this.tempLine = d3Line(tempDraw);
  //         // const line = new LineShape(this.tempLine, this.color, this.size, this.lineJoin, this.lineCap);
  //         // this.tempLine = '';
  //         this.pushToUndo();
  //       })
  //   );
  // }
  // private initSvg(selector: ContainerElement) {
  //   const d3Line = line().curve(curveBasis);
  //   const svg = select(selector)
  //     .attr('class', '')
  //     .call(
  //       drag()
  //         .container(selector)
  //         .subject(() => {
  //           const p = [event.x, event.y];
  //           return [p, p];
  //         })
  //         .on('start', () => {
  //           const d = event.subject;
  //           const active = svg
  //             .append('path')
  //             .datum(d)
  //             .attr('class', 'line')
  //             .attr(
  //               'style',
  //               `
  //          fill: none;
  //          stroke: ${this.color || this.whiteboardOptions.color};
  //          stroke-width: ${this.size || this.whiteboardOptions.size};
  //          stroke-linejoin: ${this.linejoin || this.whiteboardOptions.linejoin};
  //          stroke-linecap: ${this.linecap || this.whiteboardOptions.linecap};
  //          `
  //             );
  //           active.attr('d', d3Line);
  //           event.on('drag', function () {
  //             active.datum().push(mouse(this));
  //             active.attr('d', d3Line);
  //           });
  //           event.on('end', () => {
  //             active.attr('d', d3Line);
  //             if (this.undoStack.length < 1) {
  //               this.redoStack = [];
  //             }
  //             this.undoStack.push({ type: ActionType.Line, line: active.node() });

  //             console.log(active.attr('d'));

  //             this.data.push(
  //               new Line(
  //                 ActionType.Line,
  //                 active.attr('d'),
  //                 this.color || this.whiteboardOptions.color,
  //                 this.size || this.whiteboardOptions.size,
  //                 this.linejoin || this.whiteboardOptions.linejoin,
  //                 this.linecap || this.whiteboardOptions.linecap
  //               )
  //             );
  //             this.dataChange.emit(this.data);
  //           });
  //         })
  //     );
  //   this.init.emit();
  //   return svg;
  // }

  // private startWriting() {
  //   this.selection.on('mousedown.drag', null);
  //   this.selection.attr('class', `mo`).on('click', function () {
  //     select(this).append('dev').text('fdfsdfsdfs');
  //     const coord = mouse(this);
  //     console.log(mouse(this));
  //     addTextInput(this, coord);
  //   });

  //   // this.selection = this.initSvg(this.svgContainer.nativeElement);

  //   function addTextInput(svg, coord) {
  //     const myforeign = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
  //     const textdiv = document.createElement('input');
  //     textdiv.setAttribute('autofocus', '');
  //     textdiv.setAttribute('width', 'auto');
  //     myforeign.setAttribute('width', '100%');
  //     myforeign.setAttribute('height', '100%');
  //     myforeign.classList.add('foreign'); // to make div fit text
  //     textdiv.classList.add('insideforeign'); // to make div fit text
  //     // textdiv.addEventListener("mousedown", elementMousedown, false);
  //     myforeign.setAttributeNS(null, 'transform', 'translate(' + coord[0] + ' ' + coord[1] + ')');
  //     svg.appendChild(myforeign);
  //     myforeign.appendChild(textdiv);
  //   }
  // }

  // private addImage(image: string | ArrayBuffer) {
  //   this.drawImage(image);
  // }

  // private saveSvg(name: string, format: 'png' | 'jpeg' | 'svg') {
  //   const svgString = this.saveAsSvg(this.selection.clone(true).node());
  //   if (format === 'svg') {
  //     this.download('data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString))), name);
  //   } else {
  //     this.svgString2Image(
  //       svgString,
  //       Number(this.selection.style('width').replace('px', '')),
  //       Number(this.selection.style('height').replace('px', '')),
  //       format,
  //       (img) => {
  //         this.download(img, name);
  //       }
  //     );
  //   }

  //   this.save.emit();
  // }

  // private drawLine(pathNode: SVGPathElement | SVGGElement) {
  //   this.selection.node().appendChild(pathNode);
  // }

  // private drawImage(
  //   image: string | ArrayBuffer,
  //   x = 0,
  //   y = 0,
  //   r = 1,
  //   scale = 1,
  //   width?: undefined,
  //   height?: undefined
  // ) {
  //   const group = this.selection
  //     .append('g')
  //     .data([{ x, y, r, scale }])
  //     .attr('x', x)
  //     .attr('y', y)
  //     .attr('transform', 'translate(0,0)');

  //   const tempImg = new Image();
  //   tempImg.onload = () => {
  //     const aspectRatio = tempImg.width / tempImg.height;
  //     const height =
  //       tempImg.height > Number(this.selection.style('height').replace('px', ''))
  //         ? Number(this.selection.style('height').replace('px', '')) - 40
  //         : tempImg.height;
  //     const width =
  //       height === Number(this.selection.style('height').replace('px', '')) - 40
  //         ? (Number(this.selection.style('height').replace('px', '')) - 40) * aspectRatio
  //         : tempImg.width;
  //     group
  //       .append('image')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('height', height)
  //       .attr('width', width)
  //       .attr('preserveAspectRatio', 'none')
  //       .attr('xlink:href', image.toString());

  //     group
  //       .append('rect')
  //       .attr('x', 0)
  //       .attr('y', 0)
  //       .attr('width', 20)
  //       .attr('height', 20)
  //       .style('opacity', 0)
  //       .attr('fill', (d) => {
  //         return '#cccccc';
  //       })
  //       .call(
  //         drag()
  //           .subject(() => {
  //             const p = [event.x, event.y];
  //             return [p, p];
  //           })
  //           .on('start', () => {
  //             event.on('drag', function (d: { x: number; y: number; scale: string }) {
  //               const cursor = select(this);
  //               const cord = mouse(this);

  //               d.x += cord[0] - Number(cursor.attr('width')) / 2;
  //               d.y += cord[1] - Number(cursor.attr('height')) / 2;
  //               select(this.parentNode).attr('transform', () => {
  //                 return (
  //                   'translate(' + [d.x, d.y] + '),rotate(' + 0 + ',160, 160),scale(' + d.scale + ',' + d.scale + ')'
  //                 );
  //               });
  //             });
  //           })
  //       );
  //     group
  //       .on('mouseover', function () {
  //         select(this).select('rect').style('opacity', 1.0);
  //       })
  //       .on('mouseout', function () {
  //         select(this).select('rect').style('opacity', 0);
  //       });
  //     // this.undoStack.push({ type: ActionType.Image, image: group.node() });
  //   };
  //   tempImg.src = image.toString();
  // }

  private svgString2Image(
    svgString: string,
    width: number,
    height: number,
    format: string,
    callback: (img: string) => void
  ) {
    // set default for format parameter
    format = format || 'png';
    // SVG data URL from SVG string
    const svgData = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
    // create canvas in memory(not in DOM)
    const canvas = document.createElement('canvas');
    // get canvas context for drawing on canvas
    const context = canvas.getContext('2d');
    // set canvas size
    canvas.width = width;
    canvas.height = height;
    // create image in memory(not in DOM)
    const image = new Image();
    // later when image loads run this
    image.onload = () => {
      // async (happens later)
      // clear canvas
      context.clearRect(0, 0, width, height);
      // draw image with SVG data to canvas
      context.drawImage(image, 0, 0, width, height);
      // snapshot canvas as png
      const pngData = canvas.toDataURL('image/' + format);
      // pass png data URL to callback
      callback(pngData);
    }; // end async
    // start loading SVG data into in memory image
    image.src = svgData;
  }

  // private saveAsSvg(svgNode): string {
  //   svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');

  //   // Set width and height for svg element
  //   svgNode.setAttribute('width', Number(this.selection.style('width').replace('px', '')));
  //   svgNode.setAttribute('height', Number(this.selection.style('height').replace('px', '')));

  //   const serializer = new XMLSerializer();
  //   let svgString = serializer.serializeToString(svgNode);
  //   svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  //   svgString = svgString.replace(/NS\d+:href/g, 'xlink:href');
  //   return svgString;
  // }

  // private download(url: string, name: string): void {
  //   const link = document.createElement('a');
  //   link.href = url;
  //   link.setAttribute('visibility', 'hidden');
  //   link.download = name || 'new white-board';
  //   document.body.appendChild(link);
  //   link.click();
  // }

  private _handleKeyDown(event: any): void {
    if (event.ctrlKey || event.metaKey) {
      if (event.keyCode === 90) {
        event.preventDefault();
        this.undoDraw();
      }
      if (event.keyCode === 89) {
        event.preventDefault();
        this.redoDraw();
      }
      if (event.keyCode === 83 || event.keyCode === 115) {
        event.preventDefault();
        // this.saveSvg();
      }
    }
  }

  private _unsubscribe(subscription: Subscription): void {
    if (subscription) {
      subscription.unsubscribe();
    }
  }
}
