import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  ViewChild,
} from '@angular/core';
import { ConfigService } from '../../config/config.service';
import { GlobalKeyboardDirective, ResizeHandlerDirective } from '../../directives';

import { SvgDirective } from '../../svg/svg.directive';
import { SvgService } from '../../svg/svg.service';
import { ElementType, ToolType, WhiteboardElement } from '../../types';
import { ApiService } from '../../api';
import { CanvasService } from '../../canvas';
import { SelectionService } from '../../elements';
import { GripCursorPipe, ElementOpacityPipe, PointsToPathPipe } from '../../pipes';
import { ToolsService } from '../../tools';

@Component({
  selector: 'ng-whiteboard-canvas',
  standalone: true,
  imports: [
    CommonModule,
    GripCursorPipe,
    ElementOpacityPipe,
    PointsToPathPipe,
    SvgDirective,
    ResizeHandlerDirective,
    GlobalKeyboardDirective,
  ],
  templateUrl: './whiteboard-canvas.component.html',
  styleUrl: './whiteboard-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhiteboardCanvasComponent implements AfterViewInit {
  @ViewChild('svgContainer', { static: false })
  svgContainer!: ElementRef<SVGSVGElement>;

  apiService = inject(ApiService);
  configService = inject(ConfigService);
  toolsService = inject(ToolsService);
  selectionService = inject(SelectionService);
  canvasService = inject(CanvasService);
  svgService = inject(SvgService);

  config = this.configService.getConfigSignal();

  elements = this.apiService.allElements;
  layers = this.apiService.layers;
  selectedToolSignal = this.toolsService.selectedTool;
  selectionBoxSignal = this.selectionService.getSelectionBoxSignal();
  boundingBoxSignal = this.selectionService.getBoundingBoxSignal();
  transform = this.canvasService.getTransform();

  filteredElements = computed(() => {
    const layers = this.layers();
    const elements = this.elements();

    const sortElements = (arr: WhiteboardElement[]) =>
      arr.slice().sort((a, b) => {
        const layerA = a.layerId ? layers.find((l) => l.id === a.layerId) : undefined;
        const layerB = b.layerId ? layers.find((l) => l.id === b.layerId) : undefined;
        const zA = (layerA?.zIndex ?? 0) * 1000 + (a.zIndex ?? 0);
        const zB = (layerB?.zIndex ?? 0) * 1000 + (b.zIndex ?? 0);
        return zA - zB;
      });

    const visibleLayerIds = layers.filter((l) => l.visible).map((l) => l.id);

    if (visibleLayerIds.length === 0) {
      return [];
    }
    const filtered = elements.filter((el) => !el.layerId || visibleLayerIds.includes(el.layerId));
    const sorted = sortElements(filtered);

    // Add computed properties for rendering
    return sorted.map((el) => ({
      ...el,
      transform: this.buildTransform(el),
      isLocked: this.computeIsLocked(el, layers),
      blendMode: this.computeBlendMode(el, layers),
    }));
  });

  private buildTransform(element: WhiteboardElement): string {
    const scaleX = element.scaleX ?? 1;
    const scaleY = element.scaleY ?? 1;
    return `translate(${element.x},${element.y}) rotate(${element.rotation}) scale(${scaleX},${scaleY})`;
  }

  private computeIsLocked(element: WhiteboardElement, layers: ReturnType<typeof this.layers>): boolean {
    if (!element.layerId) return false;
    const layer = layers.find((l) => l.id === element.layerId);
    return layer?.locked || false;
  }

  private computeBlendMode(element: WhiteboardElement, layers: ReturnType<typeof this.layers>): string {
    if (!element.layerId) return 'normal';
    const layer = layers.find((l) => l.id === element.layerId);
    return layer?.blendMode || 'normal';
  }

  canvasWidth = computed(() => this.config().canvasWidth);
  canvasHeight = computed(() => this.config().canvasHeight);
  zoom = computed(() => this.config().zoom);
  x = computed(() => this.config().x);
  y = computed(() => this.config().y);
  canvasX = computed(() => this.config().canvasX);
  canvasY = computed(() => this.config().canvasY);
  gridSize = computed(() => this.config().gridSize);
  backgroundColor = computed(() => this.config().backgroundColor);
  enableGrid = computed(() => this.config().enableGrid);
  fullScreen = computed(() => this.config().fullScreen);

  svgDimensions = computed(() => {
    const fullScreen = this.fullScreen();
    const canvasWidth = this.canvasWidth();
    const canvasHeight = this.canvasHeight();
    const zoom = this.zoom();

    return fullScreen
      ? { width: '100%', height: '100%' }
      : { width: `${canvasWidth * zoom}px`, height: `${canvasHeight * zoom}px` };
  });

  svgViewBox = computed(() => {
    if (this.fullScreen()) {
      const viewWidth = this.canvasWidth() / this.zoom();
      const viewHeight = this.canvasHeight() / this.zoom();
      return `0 0 ${viewWidth} ${viewHeight}`;
    } else {
      return `0 0 ${this.canvasWidth()} ${this.canvasHeight()}`;
    }
  });

  contentTransform = computed(() => {
    const x = this.x();
    const y = this.y();
    return `translate(${x}, ${y})`;
  });

  gridConfig = computed(() => {
    const x = this.x();
    const y = this.y();
    const zoom = this.zoom();
    const offsetX = x % 100;
    const offsetY = y % 100;
    return {
      transform: `translate(${offsetX}, ${offsetY})`,
      width: (this.canvasWidth() + 100) / zoom,
      height: (this.canvasHeight() + 100) / zoom,
    };
  });

  cursor = computed(() => this.toolsService.cursor());

  types = ElementType;
  tools = ToolType;

  ngAfterViewInit() {
    this.apiService.initializeWhiteboard(this.svgContainer.nativeElement);
  }
}
