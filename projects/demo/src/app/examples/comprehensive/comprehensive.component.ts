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
} from 'ng-whiteboard';
import { strokeDashArrayOptions } from '../../shared/strokeDashArrayOptions';

type ColorProperty = 'fill' | 'strokeColor' | 'backgroundColor';

@Component({
  selector: 'app-comprehensive-component',
  templateUrl: './comprehensive.component.html',
  styleUrls: ['./comprehensive.component.scss'],
  providers: [NgWhiteboardService],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class ComprehensiveComponent {
  selectedTool: ToolType = ToolType.Pen;
  selectedElement: WhiteboardElement | null = null;
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
    if (this.selectedElement) {
      let prop;
      if (this.selectedElement.type === ElementType.Text) {
        prop = propName === 'fill' ? 'strokeColor' : 'color';
      } else {
        prop = propName === 'fill' ? 'fill' : 'strokeColor';
      }
      this.updateSelectedElement({
        style: {
          ...this.selectedElement.style,
          [prop]: color,
        },
      });
    }
    this.updateOptions({ [propName]: color });
  }

  swapColors() {
    if (this.selectedElement) {
      let newFill, newStrokeColor;
      if (this.selectedElement.type === ElementType.Text) {
        newFill = this.selectedElement.style.color;
        newStrokeColor = this.selectedElement.style.strokeColor;
        this.updateSelectedElement({
          style: {
            ...this.selectedElement.style,
            color: newStrokeColor,
            strokeColor: newFill,
          },
        });
      } else {
        newFill = this.selectedElement.style.fill;
        newStrokeColor = this.selectedElement.style.strokeColor;
        this.updateSelectedElement({
          style: {
            ...this.selectedElement.style,
            fill: newStrokeColor,
            strokeColor: newFill,
          },
        });
      }
    }
    const fill = this.options.fill;
    this.updateOptions({ fill: this.options.strokeColor, strokeColor: fill });
  }

  // Element update methods
  updateSelectedElement(partialElement: Partial<WhiteboardElement>) {
    this.whiteboardService.updateSelectedElement(partialElement);
  }

  setSizeResolution(value: string) {
    if (value === 'Custom') return;
    const [newWidth, newHeight] = value.split('x').map(Number);
    this.updateSize(newWidth, newHeight);
  }

  setDashArray(value: string) {
    if (this.selectedElement) {
      this.updateSelectedElement({ style: { ...this.selectedElement.style, dasharray: value } });
    }
    this.updateOptions({ dasharray: value });
  }

  setStrokeJoin(value: string) {
    if (this.selectedElement) {
      this.updateSelectedElement({ style: { ...this.selectedElement.style, lineJoin: value as LineJoin } });
    }
    this.updateOptions({ lineJoin: value as LineJoin });
  }

  setStrokeCap(value: string) {
    if (this.selectedElement) {
      this.updateSelectedElement({ style: { ...this.selectedElement.style, lineCap: value as LineCap } });
    }
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
    if (this.selectedElement) {
      this.updateSelectedElement({ style: { ...this.selectedElement.style, strokeWidth: value } });
    }
    this.updateOptions({ strokeWidth: value });
  }

  updateRotation(value: number) {
    if (this.selectedElement) {
      this.updateSelectedElement({ rotation: value });
    }
  }

  updateOpacity(value: number) {
    if (this.selectedElement) {
      this.updateSelectedElement({ opacity: value });
    }
  }

  updateCornerRadius(value: number) {
    if (this.selectedElement) {
      this.updateSelectedElement({ rx: value });
    }
  }

  updateTextContent(value: string) {
    if (this.selectedElement) {
      this.updateSelectedElement({ text: value });
    }
  }

  updateFontFamily(value: string) {
    if (this.selectedElement) {
      this.updateSelectedElement({ style: { ...this.selectedElement.style, fontFamily: value } });
    }
  }

  updateFontSize(value: number) {
    if (this.selectedElement) {
      this.updateSelectedElement({ style: { ...this.selectedElement.style, fontSize: value } });
    }
  }

  toggleFontWeight() {
    if (this.selectedElement) {
      const fontWeight = this.selectedElement.style.fontWeight === 'normal' ? 'bold' : 'normal';
      this.updateSelectedElement({ style: { ...this.selectedElement.style, fontWeight } });
    }
  }

  toggleFontStyle() {
    if (this.selectedElement) {
      const fontStyle = this.selectedElement.style.fontStyle === 'normal' ? 'italic' : 'normal';
      this.updateSelectedElement({ style: { ...this.selectedElement.style, fontStyle } });
    }
  }

  // Clipboard method
  onSave(img: string) {
    navigator.clipboard?.writeText(img);
  }

  // Element selection method
  selectElement(element: WhiteboardElement | null) {
    this.selectedElement = element;
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
