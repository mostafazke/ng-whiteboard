import { Component, Output, ViewEncapsulation, EventEmitter, Input } from '@angular/core';
import {
  ElementType,
  FormatType,
  LineCap,
  LineJoin,
  NgWhiteboardService,
  ToolType,
  WhiteboardElement,
  WhiteboardOptions,
  NgWhiteboardComponent,
} from 'ng-whiteboard';
import { strokeDashArrayOptions } from '../../shared/strokeDashArrayOptions';
import { DragInputDirective } from './directives/drag-input.directive';
import { DragInputCursorPipe } from './pipes/drag-input-cursor.pipe';
import { FindDashArrayPipe } from './pipes/find-dash-array.pipe';
import { NgxColorsModule } from 'ngx-colors';
import { CommonModule } from '@angular/common';

type ColorProperty = 'fill' | 'strokeColor' | 'backgroundColor';

@Component({
  selector: 'app-comprehensive-component',
  templateUrl: './comprehensive.component.html',
  styleUrls: ['./comprehensive.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgWhiteboardComponent,
    NgxColorsModule,
    DragInputDirective,
    DragInputCursorPipe,
    FindDashArrayPipe,
  ],
  providers: [NgWhiteboardService],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ComprehensiveComponent {
  selectedTool: ToolType = ToolType.Pen;
  selectedElements: WhiteboardElement[] = [];
  dashArrays = strokeDashArrayOptions;
  options: WhiteboardOptions = {
    drawingEnabled: true,
    strokeColor: '#333333',
    strokeWidth: 5,
    fill: 'transparent',
    backgroundColor: '#F8F9FA',
    canvasHeight: 600,
    canvasWidth: 800,
    dasharray: '',
    lineJoin: LineJoin.Miter,
    lineCap: LineCap.Butt,
    zoom: 1,
    fullScreen: false,
    center: true,
    enableGrid: false,
  };

  x = 0;
  y = 0;

  toolType = ToolType;
  elementType = ElementType;
  formatType = FormatType;

  @Input() data: WhiteboardElement[] = [];
  @Output() dataChange = new EventEmitter<WhiteboardElement[]>();

  constructor(private whiteboardService: NgWhiteboardService) {}

  onDataChange(data: WhiteboardElement[]) {
    this.dataChange.emit(data);
  }

  // Document management methods
  newDocument() {
    this.whiteboardService.clear();
  }

  saveAs(format: FormatType) {
    this.whiteboardService.save(format);
  }

  // Tool selection methods
  selectTool(tool: ToolType) {
    this.selectedTool = tool;
  }

  // Undo/Redo methods
  undo() {
    this.whiteboardService.undo();
  }

  redo() {
    this.whiteboardService.redo();
  }

  // Grid toggle method
  toggleGrid() {
    this.whiteboardService.toggleGrid();
  }

  // Image handling method
  addImage(fileInput: EventTarget | null) {
    if (fileInput) {
      const files = (fileInput as HTMLInputElement).files;
      if (files) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent) => {
          const image = (e.target as FileReader).result;
          this.whiteboardService.addImage(image as string);
        };
        reader.readAsDataURL(files[0]);
      }
    }
  }

  // Color management methods
  colorChange(propName: ColorProperty, color: string) {
    this.selectedElements.forEach((element) => {
      let prop;
      if (element.type === ElementType.Text) {
        prop = propName === 'fill' ? 'strokeColor' : 'color';
      } else {
        prop = propName === 'fill' ? 'fill' : 'strokeColor';
      }
      this.updateSelectedElement({
        style: {
          ...element.style,
          [prop]: color,
        },
      });
    });
    this.updateOptions({ [propName]: color });
  }

  swapColors() {
    this.selectedElements.forEach((element) => {
      let newFill, newStrokeColor;
      if (element.type === ElementType.Text) {
        newFill = element.style.color;
        newStrokeColor = element.style.strokeColor;
        this.updateSelectedElement({
          style: {
            ...element.style,
            color: newStrokeColor,
            strokeColor: newFill,
          },
        });
      } else {
        newFill = element.style.fill;
        newStrokeColor = element.style.strokeColor;
        this.updateSelectedElement({
          style: {
            ...element.style,
            fill: newStrokeColor,
            strokeColor: newFill,
          },
        });
      }
    });
    const fill = this.options.fill;
    this.updateOptions({ fill: this.options.strokeColor, strokeColor: fill });
  }

  // Element update methods
  updateSelectedElement(partialElement: Partial<WhiteboardElement>) {
    this.whiteboardService.updateSelectedElements(partialElement);
  }

  setSizeResolution(value: string) {
    if (value === 'Custom') return;
    const [newWidth, newHeight] = value.split('x').map(Number);
    this.updateSize(newWidth, newHeight);
  }

  setDashArray(value: string) {
    this.selectedElements.forEach((element) => {
      this.updateSelectedElement({ style: { ...element.style, dasharray: value } });
    });
    this.updateOptions({ dasharray: value });
  }

  setStrokeJoin(value: string) {
    this.selectedElements.forEach((element) => {
      this.updateSelectedElement({ style: { ...element.style, lineJoin: value as LineJoin } });
    });
    this.updateOptions({ lineJoin: value as LineJoin });
  }

  setStrokeCap(value: string) {
    this.selectedElements.forEach((element) => {
      this.updateSelectedElement({ style: { ...element.style, lineCap: value as LineCap } });
    });
    this.updateOptions({ lineCap: value as LineCap });
  }

  updateSize(width: number, height: number) {
    if (this.options.canvasWidth) {
      this.animateChange(this.options.canvasWidth, width, (value) => {
        this.updateOptions({ canvasWidth: value });
      });
    }
    if (this.options.canvasHeight) {
      this.animateChange(this.options.canvasHeight, height, (value) => {
        this.updateOptions({ canvasHeight: value });
      });
    }
  }

  updateStrokeWidth(value: number) {
    this.selectedElements.forEach((element) => {
      this.updateSelectedElement({ style: { ...element.style, strokeWidth: value } });
    });
    this.updateOptions({ strokeWidth: value });
  }

  updateRotation(value: number) {
    this.updateSelectedElement({ rotation: value });
  }

  updateOpacity(value: number) {
    this.updateSelectedElement({ opacity: value });
  }

  updateCornerRadius(value: number) {
    this.updateSelectedElement({ rx: value });
  }

  updateTextContent(value: string) {
    this.updateSelectedElement({ text: value });
  }

  updateFontFamily(value: string) {
    this.selectedElements.forEach((element) => {
      this.updateSelectedElement({ style: { ...element.style, fontFamily: value } });
    });
  }

  updateFontSize(value: number) {
    this.selectedElements.forEach((element) => {
      this.updateSelectedElement({ style: { ...element.style, fontSize: value } });
    });
  }

  toggleFontWeight() {
    this.selectedElements.forEach((element) => {
      const fontWeight = element.style.fontWeight === 'normal' ? 'bold' : 'normal';
      this.updateSelectedElement({ style: { ...element.style, fontWeight } });
    });
  }

  toggleFontStyle() {
    this.selectedElements.forEach((element) => {
      const fontStyle = element.style.fontStyle === 'normal' ? 'italic' : 'normal';
      this.updateSelectedElement({ style: { ...element.style, fontStyle } });
    });
  }

  // Clipboard method
  onSave(img: string) {
    navigator.clipboard?.writeText(img);
  }

  // Element selection method
  selectElements(elements: WhiteboardElement[]) {
    console.log('🚀 ~ ComprehensiveComponent ~ selectElements ~ elements:', elements);
    this.selectedElements = elements;
  }

  // Zoom method
  zoomChange(zoom: string) {
    if (this.options.zoom) {
      this.animateChange(this.options.zoom * 100, +zoom, (value) => {
        this.updateOptions({ zoom: value / 100 });
      });
    }
  }

  // Animation method
  private animateChange(startValue: number, endValue: number, callback: (value: number) => void) {
    const diff = endValue - startValue;

    let animatationId: number | null = null;
    if (animatationId !== null) {
      cancelAnimationFrame(animatationId);
    }

    const start = Date.now();
    const duration = 500;
    const animate = () => {
      const progress = Date.now() - start;
      let tick = progress / duration;
      tick = Math.pow(tick - 1, 3) + 1;
      startValue = Number((endValue - diff + tick * diff).toFixed(0));
      callback(startValue);
      if (tick < 1 && tick > -0.9) {
        animatationId = requestAnimationFrame(animate);
      } else {
        callback(startValue);
      }
    };

    animate();
  }

  // Options update method
  private updateOptions(options: Partial<typeof ComprehensiveComponent.prototype.options>) {
    this.options = { ...this.options, ...options };
  }
}
