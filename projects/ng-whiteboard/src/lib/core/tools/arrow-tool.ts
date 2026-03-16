import { ArrowElement, ArrowheadType } from '../elements';
import { ArrowBindingService } from '../elements/arrow-binding.service';
import { ConnectionPointsService } from '../elements/connection-points.service';
import { ConnectionUIService } from '../elements/connection-ui.service';
import { createElement } from '../elements/element.utils';
import {
  ArrowHeadStyle,
  ElementType,
  Point,
  PointerInfo,
  SnapResult,
  ToolType,
  WhiteboardElementStyle,
} from '../types';
import { snapToAngle, snapToGrid } from '../utils/geometry';
import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';

export class ArrowTool extends BaseTool {
  type = ToolType.Arrow;
  override baseCursor = CursorType.Crosshair;
  element: ArrowElement | null = null;
  startPoint: Point | null = null;
  private lastX = 0;
  private lastY = 0;
  private readonly MIN_LENGTH = 2;
  private readonly SNAP_RADIUS = 20;

  // Connection snapping state
  private startSnap: SnapResult | null = null;
  private endSnap: SnapResult | null = null;

  // Injected via setter from ToolFactory
  private connectionPointsService!: ConnectionPointsService;
  private arrowBindingService!: ArrowBindingService;
  private connectionUIService!: ConnectionUIService;

  setConnectionServices(cp: ConnectionPointsService, ab: ArrowBindingService, ui: ConnectionUIService): void {
    this.connectionPointsService = cp;
    this.arrowBindingService = ab;
    this.connectionUIService = ui;
  }

  override onDeactivate(): void {
    this.connectionUIService?.clearAll();
  }

  override handlePointerDown(event: PointerInfo): void {
    if (!this.active) return;

    const coordinates = this.getPointerPosition(event);
    let { x, y } = coordinates;

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }

    // Try to snap the start point to a shape
    this.startSnap = null;
    if (this.connectionPointsService) {
      const allElements = this.apiService.getElements();
      const snap = this.connectionPointsService.findSnapTarget(
        { x, y },
        allElements,
        new Set(), // no exclusions at start
        this.SNAP_RADIUS
      );
      if (snap) {
        x = snap.point.x;
        y = snap.point.y;
        this.startSnap = snap;
        this.connectionUIService?.setSnapIndicator(snap.point);
      }
    }

    this.startPoint = { x, y };
    this.lastX = x;
    this.lastY = y;

    this.element = createElement(
      ElementType.Arrow,
      {
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        style: this.getElementStyle(),
        zIndex: this.apiService.getNextZIndex(),
        startHead: {
          type: this.mapHeadStyle(this.whiteboardConfig.arrowConfig?.startHeadStyle),
        },
        endHead: {
          type: this.mapHeadStyle(this.whiteboardConfig.arrowConfig?.endHeadStyle),
        },
        pathType:
          this.whiteboardConfig.arrowConfig?.lineStyle === 'curve'
            ? { type: 'quadratic' as const, cx: x, cy: y }
            : this.whiteboardConfig.arrowConfig?.lineStyle === 'elbow'
            ? { type: 'elbow' as const, midRatio: 0.5 }
            : { type: 'straight' as const },
        startBinding: this.startSnap
          ? this.arrowBindingService.createBinding(this.startSnap.elementId, this.startSnap.pointId)
          : null,
      },
      this.apiService.getActiveLayerId()
    );

    this.apiService.addDraftElements([this.element]);
  }

  override handlePointerMove(event: PointerInfo): void {
    if (!this.active || !this.element) return;

    const coordinates = this.getPointerPosition(event);
    let x2 = coordinates.x;
    let y2 = coordinates.y;

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      x2 = snapToGrid(x2, gridSize);
      y2 = snapToGrid(y2, gridSize);
    }

    if (event.shiftKey) {
      const x1 = this.element.x1;
      const y1 = this.element.y1;
      const { x, y } = snapToAngle(x1, y1, x2, y2);
      x2 = x;
      y2 = y;
    }

    // Try to snap end point to a shape
    this.endSnap = null;
    if (this.connectionPointsService) {
      const allElements = this.apiService.getElements();
      const excludeIds = new Set([this.element.id]);
      // Also exclude the shape we started from (to avoid self-connections initially)
      if (this.startSnap) {
        // Actually allow connecting back to same shape, just exclude the arrow itself
      }
      const snap = this.connectionPointsService.findSnapTarget(
        { x: x2, y: y2 },
        allElements,
        excludeIds,
        this.SNAP_RADIUS
      );
      if (snap) {
        x2 = snap.point.x;
        y2 = snap.point.y;
        this.endSnap = snap;
        this.connectionUIService?.setSnapIndicator(snap.point);
        // Show connection points on the hovered element
        const targetEl = allElements.find((el) => el.id === snap.elementId);
        if (targetEl) {
          this.connectionUIService?.setVisibleConnectionPoints(
            this.connectionPointsService.getConnectionPoints(targetEl)
          );
        }
      } else {
        this.connectionUIService?.setSnapIndicator(null);
        this.connectionUIService?.setVisibleConnectionPoints([]);
      }
    }

    if (Math.abs(x2 - this.lastX) > this.MIN_LENGTH || Math.abs(y2 - this.lastY) > this.MIN_LENGTH) {
      const draftUpdate: Partial<ArrowElement> = { id: this.element.id, x2, y2 } as Partial<ArrowElement> & {
        id: string;
      };

      // Auto-compute control point for curve arrows (midpoint between start and end)
      if (this.element.pathType?.type === 'quadratic') {
        draftUpdate.pathType = {
          type: 'quadratic',
          cx: (this.element.x1 + x2) / 2,
          cy: (this.element.y1 + y2) / 2,
        };
      }
      // Elbow keeps its midRatio; no auto-compute needed

      this.apiService.updateDraftElements([draftUpdate]);
      this.lastX = x2;
      this.lastY = y2;
    }
  }

  override handlePointerUp(): void {
    if (!this.active) return;

    if (this.element && this.startPoint) {
      const element = this.element;

      // Apply end binding if snapped
      if (this.endSnap && this.arrowBindingService) {
        this.apiService.updateDraftElements([
          {
            id: element.id,
            endBinding: this.arrowBindingService.createBinding(this.endSnap.elementId, this.endSnap.pointId),
            x2: this.endSnap.point.x,
            y2: this.endSnap.point.y,
          } as Partial<ArrowElement>,
        ]);
      }

      this.apiService.commitDraftElements();

      if (element.selectAfterDraw) {
        this.apiService.selectElements([element.id]);
      }

      this.startPoint = null;
      this.element = null;
      this.startSnap = null;
      this.endSnap = null;
    }

    this.connectionUIService?.clearAll();

    this.lastX = 0;
    this.lastY = 0;
  }

  private getElementStyle(): WhiteboardElementStyle {
    return {
      strokeColor: this.whiteboardConfig.strokeColor,
      strokeWidth: this.whiteboardConfig.strokeWidth,
      lineCap: this.whiteboardConfig.lineCap,
      dasharray: this.whiteboardConfig.dasharray,
      dashoffset: this.whiteboardConfig.dashoffset,
    };
  }

  /** Map a config ArrowHeadStyle string to the ArrowheadType enum value */
  private mapHeadStyle(style?: ArrowHeadStyle): ArrowheadType {
    if (!style) return ArrowheadType.None;
    switch (style) {
      case 'none':
        return ArrowheadType.None;
      case 'arrow':
        return ArrowheadType.Arrow;
      case 'open-arrow':
        return ArrowheadType.OpenArrow;
      case 'diamond':
        return ArrowheadType.Diamond;
      case 'open-diamond':
        return ArrowheadType.OpenDiamond;
      case 'circle':
        return ArrowheadType.Circle;
      case 'open-circle':
        return ArrowheadType.OpenCircle;
      case 'bar':
        return ArrowheadType.Bar;
      default:
        return ArrowheadType.None;
    }
  }
}
