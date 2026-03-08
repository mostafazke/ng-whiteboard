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
import { ConnectionUIService, SelectionService } from '../../elements';
import { ArrowElement } from '../../elements/arrow-element';
import { LineElement } from '../../elements/line-element';
import { GripCursorPipe, ElementOpacityPipe, PointsToPathPipe, ArrowheadPipe } from '../../pipes';
import { ToolsService } from '../../tools';

@Component({
  selector: 'ng-whiteboard-canvas',
  standalone: true,
  imports: [
    CommonModule,
    GripCursorPipe,
    ElementOpacityPipe,
    PointsToPathPipe,
    ArrowheadPipe,
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
  connectionUIService = inject(ConnectionUIService);

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

  // ────────── Arrow / Line selection ──────────
  /** True when only line-type elements (Arrow, Line) are selected */
  readonly isLineOnlySelection = this.selectionService.isLineOnlySelectionSignal;

  /**
   * Endpoint handles for all selected line-type elements (Arrow / Line).
   * Each entry describes one endpoint in world coordinates.
   */
  readonly lineEndpointHandles = computed(() => {
    // Depend on the selection signal to re-evaluate when selection changes
    const ids = this.selectionService.selectedIdsSignal();
    if (ids.length === 0) return [];

    const elements = this.apiService.allElements();
    const handles: {
      elementId: string;
      end: 'start' | 'end';
      x: number;
      y: number;
      bound: boolean; // true when attached to a shape
      elementType: ElementType;
    }[] = [];

    for (const id of ids) {
      const el = elements.find((e) => e.id === id);
      if (!el) continue;

      if (el.type === ElementType.Arrow) {
        const arrow = el as ArrowElement;
        // World coords: element origin + local endpoint, then rotation
        const { sx, sy, ex, ey } = this.getLineWorldEndpoints(arrow);
        handles.push({ elementId: arrow.id, end: 'start', x: sx, y: sy, bound: !!arrow.startBinding, elementType: ElementType.Arrow });
        handles.push({ elementId: arrow.id, end: 'end', x: ex, y: ey, bound: !!arrow.endBinding, elementType: ElementType.Arrow });
      } else if (el.type === ElementType.Line) {
        const line = el as LineElement;
        const { sx, sy, ex, ey } = this.getLineWorldEndpoints(line);
        handles.push({ elementId: line.id, end: 'start', x: sx, y: sy, bound: false, elementType: ElementType.Line });
        handles.push({ elementId: line.id, end: 'end', x: ex, y: ey, bound: false, elementType: ElementType.Line });
      }
    }

    return handles;
  });

  /**
   * Middle curve handle for selected arrows.
   * Provides a draggable control point for adjusting the curve.
   */
  readonly curveHandles = computed(() => {
    const ids = this.selectionService.selectedIdsSignal();
    if (ids.length === 0) return [];

    const elements = this.apiService.allElements();
    const handles: {
      elementId: string;
      x: number;
      y: number;
      isCurved: boolean;
    }[] = [];

    for (const id of ids) {
      const el = elements.find((e) => e.id === id);
      if (!el || el.type !== ElementType.Arrow) continue;

      const arrow = el as ArrowElement;
      const { sx, sy, ex, ey } = this.getLineWorldEndpoints(arrow);
      const midX = (sx + ex) / 2;
      const midY = (sy + ey) / 2;

      if (arrow.pathType?.type === 'quadratic') {
        // The control point cx/cy is stored in local (pre-rotate) space.
        // Apply the same fill-box-centered rotation used by the browser.
        const rot = (arrow.rotation ?? 0) * Math.PI / 180;
        const scaleX = arrow.scaleX ?? 1;
        const scaleY = arrow.scaleY ?? 1;
        let cx = arrow.pathType.cx * scaleX;
        let cy = arrow.pathType.cy * scaleY;
        if (rot !== 0) {
          // Pivot = fill-box center in local (post-scale) space
          const pivotX = (arrow.x1 * scaleX + arrow.x2 * scaleX) / 2;
          const pivotY = (arrow.y1 * scaleY + arrow.y2 * scaleY) / 2;
          const dx = cx - pivotX;
          const dy = cy - pivotY;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          cx = pivotX + dx * cos - dy * sin;
          cy = pivotY + dx * sin + dy * cos;
        }
        handles.push({
          elementId: arrow.id,
          x: arrow.x + cx,
          y: arrow.y + cy,
          isCurved: true,
        });
      } else if (arrow.pathType?.type === 'elbow') {
        // Compute handle at the elbow mid-point in local (post-scale) space, then apply
        // fill-box-centered rotation + translate.
        const scaleX = arrow.scaleX ?? 1;
        const scaleY = arrow.scaleY ?? 1;
        const midRatio = arrow.pathType.midRatio ?? 0.5;
        const localX = arrow.x1 * scaleX + (arrow.x2 - arrow.x1) * scaleX * midRatio;
        const localY = (arrow.y1 * scaleY + arrow.y2 * scaleY) / 2;
        const rot = (arrow.rotation ?? 0) * Math.PI / 180;
        let bendX: number, bendY: number;
        if (rot === 0) {
          bendX = arrow.x + localX;
          bendY = arrow.y + localY;
        } else {
          const pivotX = (arrow.x1 * scaleX + arrow.x2 * scaleX) / 2;
          const pivotY = (arrow.y1 * scaleY + arrow.y2 * scaleY) / 2;
          const dx = localX - pivotX;
          const dy = localY - pivotY;
          const cos = Math.cos(rot);
          const sin = Math.sin(rot);
          bendX = arrow.x + pivotX + dx * cos - dy * sin;
          bendY = arrow.y + pivotY + dx * sin + dy * cos;
        }
        handles.push({
          elementId: arrow.id,
          x: bendX,
          y: bendY,
          isCurved: true,
        });
      } else {
        // For straight arrows, show the handle at the midpoint
        handles.push({
          elementId: arrow.id,
          x: midX,
          y: midY,
          isCurved: false,
        });
      }
    }

    return handles;
  });

  /** Compute world-space endpoints for an arrow or line element.
   *
   *  The element <g> uses the SVG transform `translate(x,y) rotate(rotation)` together
   *  with CSS `transform-box: fill-box; transform-origin: center`.  In modern browsers this
   *  makes the rotation pivot the fill-box center (midpoint of the local geometry) rather
   *  than the local origin (0,0).  We replicate that here:
   *
   *    world = translate(x,y) * rotate_around_fill_center(rotation) * scale(scaleX,scaleY)
   *
   *  Fill-box center in local space: cx = (x1+x2)/2, cy = (y1+y2)/2.
   */
  private getLineWorldEndpoints(el: {
    x: number; y: number;
    x1: number; y1: number;
    x2: number; y2: number;
    rotation: number;
    scaleX?: number; scaleY?: number;
  }): { sx: number; sy: number; ex: number; ey: number } {
    const scaleX = el.scaleX ?? 1;
    const scaleY = el.scaleY ?? 1;

    // Apply scale in local space first
    const lx1 = el.x1 * scaleX;
    const ly1 = el.y1 * scaleY;
    const lx2 = el.x2 * scaleX;
    const ly2 = el.y2 * scaleY;

    const rot = (el.rotation ?? 0) * Math.PI / 180;
    if (rot === 0) {
      return { sx: el.x + lx1, sy: el.y + ly1, ex: el.x + lx2, ey: el.y + ly2 };
    }

    // Rotation pivot = fill-box center in local (post-scale) space
    const pivotX = (lx1 + lx2) / 2;
    const pivotY = (ly1 + ly2) / 2;

    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    // Rotate each endpoint around pivot, then translate by element (x,y)
    const rx1 = lx1 - pivotX;
    const ry1 = ly1 - pivotY;
    const rx2 = lx2 - pivotX;
    const ry2 = ly2 - pivotY;

    return {
      sx: el.x + pivotX + rx1 * cos - ry1 * sin,
      sy: el.y + pivotY + rx1 * sin + ry1 * cos,
      ex: el.x + pivotX + rx2 * cos - ry2 * sin,
      ey: el.y + pivotY + rx2 * sin + ry2 * cos,
    };
  }

  // ────────── Arrow connection signals (from ConnectionUIService) ──────────
  readonly snapIndicator = this.connectionUIService.snapIndicator;
  readonly visibleConnectionPoints = this.connectionUIService.visibleConnectionPoints;

  /** Check if an arrow is currently selected (for showing endpoint handles) */
  isArrowSelected(elementId: string): boolean {
    return this.selectionService.isSelected(elementId);
  }

  types = ElementType;
  tools = ToolType;

  ngAfterViewInit() {
    this.apiService.initializeWhiteboard(this.svgContainer.nativeElement);
  }
}
