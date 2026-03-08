import { Component, Output, ViewEncapsulation, EventEmitter, Input, inject } from '@angular/core';
import {
  ElementType,
  FormatType,
  LineCap,
  LineJoin,
  NgWhiteboardService,
  ToolType,
  WhiteboardElement,
  WhiteboardConfig,
  NgWhiteboardComponent,
  ArrowHeadStyle,
  ArrowLineStyle,
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
  encapsulation: ViewEncapsulation.ShadowDom,
  providers: [NgWhiteboardService],
})
export class ComprehensiveComponent {
  private whiteboardService = inject(NgWhiteboardService);
  boardId = 'comprehensive-board';
  selectedTool: ToolType = ToolType.Pen;
  selectedElements: WhiteboardElement[] = [];
  dashArrays = strokeDashArrayOptions;
  options: Partial<WhiteboardConfig> = {
    drawingEnabled: true,
    strokeColor: '#333333',
    strokeWidth: 5,
    fill: 'transparent',
    backgroundColor: '#F8F9FA',
    canvasHeight: 600,
    canvasWidth: 800,
    dasharray: '',
    lineJoin: LineJoin.Round,
    lineCap: LineCap.Round,
    zoom: 1,
    fullScreen: false,
    center: true,
    enableGrid: false,
    fontSize: 16,
    dashoffset: 0,
    gridSize: 20,
    snapToGrid: false,
    keyboardShortcutsEnabled: true,
  };

  toolType = ToolType;
  elementType = ElementType;
  formatType = FormatType;

  /** Available arrowhead styles for UI dropdowns */
  arrowHeadStyles: ArrowHeadStyle[] = ['none', 'arrow', 'open-arrow', 'diamond', 'open-diamond', 'circle', 'open-circle', 'bar'];

  /** Available arrow line styles */
  arrowLineStyles: ArrowLineStyle[] = ['straight', 'curve', 'elbow'];

  startHeadOpen = false;
  endHeadOpen = false;
  startHeadDropdownStyle: Record<string, string> = {};
  endHeadDropdownStyle: Record<string, string> = {};

  toggleStartHead(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.startHeadDropdownStyle = { top: rect.bottom + 4 + 'px', left: rect.left + 'px' };
    this.startHeadOpen = !this.startHeadOpen;
    this.endHeadOpen = false;
  }

  toggleEndHead(event: MouseEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.endHeadDropdownStyle = { top: rect.bottom + 4 + 'px', left: rect.left + 'px' };
    this.endHeadOpen = !this.endHeadOpen;
    this.startHeadOpen = false;
  }

  /** SVG path data for each arrowhead style icon (32×20 viewBox, head on right, tip at x=30) */
  readonly headIconData: Record<string, { linePath: string; headPath: string; filled: boolean }> = {
    'none':         { linePath: 'M 2 10 L 30 10',  headPath: '',                                              filled: false },
    'arrow':        { linePath: 'M 2 10 L 18 10',  headPath: 'M 18 5 L 30 10 L 18 15 Z',                     filled: true  },
    'open-arrow':   { linePath: 'M 2 10 L 20 10',  headPath: 'M 20 5 L 30 10 L 20 15',                       filled: false },
    'diamond':      { linePath: 'M 2 10 L 14 10',  headPath: 'M 30 10 L 22 5 L 14 10 L 22 15 Z',             filled: true  },
    'open-diamond': { linePath: 'M 2 10 L 14 10',  headPath: 'M 30 10 L 22 5 L 14 10 L 22 15 Z',             filled: false },
    'circle':       { linePath: 'M 2 10 L 18 10',  headPath: 'M 18 10 A 6 6 0 1 1 30 10 A 6 6 0 1 1 18 10 Z', filled: true  },
    'open-circle':  { linePath: 'M 2 10 L 18 10',  headPath: 'M 18 10 A 6 6 0 1 1 30 10 A 6 6 0 1 1 18 10 Z', filled: false },
    'bar':          { linePath: 'M 2 10 L 26 10',  headPath: 'M 26 3 L 26 17',                               filled: false },
  };

  @Input() data: WhiteboardElement[] = [];
  @Output() dataChange = new EventEmitter<WhiteboardElement[]>();

  constructor() {
    this.whiteboardService.setActiveBoard(this.boardId);
  }

  onDataChange(data: WhiteboardElement[]) {
    this.dataChange.emit(data);
  }

  // Document management methods
  newDocument() {
    this.whiteboardService.clear();
  }

  saveAs(format: FormatType) {
    this.whiteboardService.save(format, undefined);
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

  toggleGrid() {
    this.whiteboardService.updateConfig({
      enableGrid: !this.options.enableGrid,
    });
  }

  // Image handling method
  addImage(fileInput: EventTarget | null) {
    if (fileInput) {
      const files = (fileInput as HTMLInputElement).files;
      if (files) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent) => {
          const image = (e.target as FileReader).result;
          if (image) {
            this.whiteboardService.addImage({ image });
          }
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

  // Arrow configuration methods
  setArrowStartHead(style: string) {
    const headStyle = style as ArrowHeadStyle;
    this.updateOptions({
      arrowConfig: {
        ...(this.options.arrowConfig ?? { startHeadStyle: 'diamond', endHeadStyle: 'arrow', lineStyle: 'straight' as ArrowLineStyle }),
        startHeadStyle: headStyle,
      },
    });
    // Also update selected arrow elements
    this.selectedElements.forEach((element) => {
      if (element.type === ElementType.Arrow) {
        this.updateSelectedElement({ startHead: { type: headStyle } } as Partial<WhiteboardElement>);
      }
    });
  }

  setArrowEndHead(style: string) {
    const headStyle = style as ArrowHeadStyle;
    this.updateOptions({
      arrowConfig: {
        ...(this.options.arrowConfig ?? { startHeadStyle: 'diamond', endHeadStyle: 'arrow', lineStyle: 'straight' as ArrowLineStyle }),
        endHeadStyle: headStyle,
      },
    });
    // Also update selected arrow elements
    this.selectedElements.forEach((element) => {
      if (element.type === ElementType.Arrow) {
        this.updateSelectedElement({ endHead: { type: headStyle } } as Partial<WhiteboardElement>);
      }
    });
  }

  setArrowLineStyle(style: string) {
    const lineStyle = style as ArrowLineStyle;
    this.updateOptions({
      arrowConfig: {
        ...(this.options.arrowConfig ?? { startHeadStyle: 'diamond', endHeadStyle: 'arrow', lineStyle: 'straight' as ArrowLineStyle }),
        lineStyle,
      },
    });
    // Update selected arrow elements to match
    this.selectedElements.forEach((element) => {
      if (element.type === ElementType.Arrow) {
        const midX = ((element as any).x1 + (element as any).x2) / 2;
        const midY = ((element as any).y1 + (element as any).y2) / 2;
        let pathType;
        if (lineStyle === 'curve') {
          pathType = { type: 'quadratic' as const, cx: midX, cy: midY };
        } else if (lineStyle === 'elbow') {
          pathType = { type: 'elbow' as const, midRatio: 0.5 };
        } else {
          pathType = { type: 'straight' as const };
        }
        this.updateSelectedElement({ pathType } as Partial<WhiteboardElement>);
      }
    });
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
