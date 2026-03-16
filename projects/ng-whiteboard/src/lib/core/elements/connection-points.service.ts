import { Injectable } from '@angular/core';
import { ConnectionPoint, Point, SnapResult, WhiteboardElement, ElementType, Bounds } from '../types';
import { getElementUtil } from './element.utils';
// ArrowElement type not needed directly in this service
import { RectangleElement } from './rectangle-element';
import { EllipseElement } from './ellipse-element';

/** Snap radius in canvas pixels */
const DEFAULT_SNAP_RADIUS = 20;

/**
 * Computes connection points on shapes and provides snap-to-shape logic
 * for arrow endpoints during drawing and reconnecting.
 */
@Injectable({ providedIn: 'root' })
export class ConnectionPointsService {
  /**
   * Get all named connection points for a given element.
   *
   * Connection points are returned in **world coordinates** (accounting for
   * the element's position offset).
   */
  getConnectionPoints(element: WhiteboardElement): ConnectionPoint[] {
    switch (element.type) {
      case ElementType.Rectangle:
        return this.getRectangleConnectionPoints(element as RectangleElement);
      case ElementType.Ellipse:
        return this.getEllipseConnectionPoints(element as EllipseElement);
      case ElementType.Image:
        return this.getImageConnectionPoints(element);
      case ElementType.Text:
        return this.getTextConnectionPoints(element);
      default:
        // Fallback: use bounding box corners and edge centers
        return this.getBoundsConnectionPoints(element);
    }
  }

  /**
   * Find the closest connection point on any connectable element near the given position.
   *
   * @param position  - current pointer world coordinates
   * @param elements  - all elements to consider
   * @param excludeIds - element IDs to exclude (e.g. the arrow itself)
   * @param snapRadius - maximum snapping distance in canvas px
   */
  findSnapTarget(
    position: Point,
    elements: WhiteboardElement[],
    excludeIds: Set<string>,
    snapRadius = DEFAULT_SNAP_RADIUS
  ): SnapResult | null {
    let best: SnapResult | null = null;

    for (const element of elements) {
      if (excludeIds.has(element.id)) continue;
      if (!this.isConnectable(element)) continue;

      // First check if pointer is near the element's bounding box at all (fast reject)
      const util = getElementUtil(element.type);
      const bounds = util.getBounds(element);
      if (!this.isNearBounds(position, bounds, snapRadius * 2)) continue;

      const points = this.getConnectionPoints(element);
      for (const cp of points) {
        const dist = this.distance(position, cp.position);
        if (dist <= snapRadius && (!best || dist < best.distance)) {
          best = {
            elementId: element.id,
            pointId: cp.id,
            point: cp.position,
            distance: dist,
          };
        }
      }

      // Also consider the closest point on the shape edge
      const closestEdge = this.getClosestEdgePoint(element, position);
      if (closestEdge) {
        const dist = this.distance(position, closestEdge);
        if (dist <= snapRadius && (!best || dist < best.distance)) {
          best = {
            elementId: element.id,
            pointId: null, // closest edge, no named point
            point: closestEdge,
            distance: dist,
          };
        }
      }
    }

    return best;
  }

  /**
   * Compute the point on a shape's edge where a bound arrow should connect,
   * given a binding and the current state of the target element.
   */
  resolveBindingPoint(
    element: WhiteboardElement,
    pointId: string | null,
    fallbackDirection: Point,
    gap: number
  ): Point {
    if (pointId) {
      const points = this.getConnectionPoints(element);
      const cp = points.find((p) => p.id === pointId);
      if (cp) {
        return {
          x: cp.position.x + cp.normal.x * gap,
          y: cp.position.y + cp.normal.y * gap,
        };
      }
    }

    // Fallback: project from the element center toward the fallback direction
    return this.getClosestEdgePoint(element, fallbackDirection) ?? this.getElementCenter(element);
  }

  // ────────────────── Shape-specific connection points ──────────────────

  private getRectangleConnectionPoints(el: RectangleElement): ConnectionPoint[] {
    const { x, y, width, height } = el;
    const cx = x + width / 2;
    const cy = y + height / 2;
    return [
      { id: 'top', position: { x: cx, y }, normal: { x: 0, y: -1 } },
      { id: 'right', position: { x: x + width, y: cy }, normal: { x: 1, y: 0 } },
      { id: 'bottom', position: { x: cx, y: y + height }, normal: { x: 0, y: 1 } },
      { id: 'left', position: { x, y: cy }, normal: { x: -1, y: 0 } },
      { id: 'top-left', position: { x, y }, normal: { x: -0.707, y: -0.707 } },
      { id: 'top-right', position: { x: x + width, y }, normal: { x: 0.707, y: -0.707 } },
      { id: 'bottom-right', position: { x: x + width, y: y + height }, normal: { x: 0.707, y: 0.707 } },
      { id: 'bottom-left', position: { x, y: y + height }, normal: { x: -0.707, y: 0.707 } },
    ];
  }

  private getEllipseConnectionPoints(el: EllipseElement): ConnectionPoint[] {
    const cx = el.x + el.cx;
    const cy = el.y + el.cy;
    const { rx, ry } = el;
    return [
      { id: 'top', position: { x: cx, y: cy - ry }, normal: { x: 0, y: -1 } },
      { id: 'right', position: { x: cx + rx, y: cy }, normal: { x: 1, y: 0 } },
      { id: 'bottom', position: { x: cx, y: cy + ry }, normal: { x: 0, y: 1 } },
      { id: 'left', position: { x: cx - rx, y: cy }, normal: { x: -1, y: 0 } },
      // 45° points on the ellipse
      { id: 'top-right', position: { x: cx + rx * 0.707, y: cy - ry * 0.707 }, normal: { x: 0.707, y: -0.707 } },
      { id: 'bottom-right', position: { x: cx + rx * 0.707, y: cy + ry * 0.707 }, normal: { x: 0.707, y: 0.707 } },
      { id: 'bottom-left', position: { x: cx - rx * 0.707, y: cy + ry * 0.707 }, normal: { x: -0.707, y: 0.707 } },
      { id: 'top-left', position: { x: cx - rx * 0.707, y: cy - ry * 0.707 }, normal: { x: -0.707, y: -0.707 } },
    ];
  }

  private getImageConnectionPoints(el: WhiteboardElement): ConnectionPoint[] {
    // Image has width/height same as Rectangle
    const anyEl = el as unknown as { x: number; y: number; width: number; height: number };
    const { x, y, width, height } = anyEl;
    const cx = x + width / 2;
    const cy = y + height / 2;
    return [
      { id: 'top', position: { x: cx, y }, normal: { x: 0, y: -1 } },
      { id: 'right', position: { x: x + width, y: cy }, normal: { x: 1, y: 0 } },
      { id: 'bottom', position: { x: cx, y: y + height }, normal: { x: 0, y: 1 } },
      { id: 'left', position: { x, y: cy }, normal: { x: -1, y: 0 } },
    ];
  }

  private getTextConnectionPoints(el: WhiteboardElement): ConnectionPoint[] {
    return this.getBoundsConnectionPoints(el);
  }

  /** Fallback: bounding-box-based connection points */
  private getBoundsConnectionPoints(element: WhiteboardElement): ConnectionPoint[] {
    const util = getElementUtil(element.type);
    const bounds = util.getBounds(element);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    return [
      { id: 'top', position: { x: cx, y: bounds.minY }, normal: { x: 0, y: -1 } },
      { id: 'right', position: { x: bounds.maxX, y: cy }, normal: { x: 1, y: 0 } },
      { id: 'bottom', position: { x: cx, y: bounds.maxY }, normal: { x: 0, y: 1 } },
      { id: 'left', position: { x: bounds.minX, y: cy }, normal: { x: -1, y: 0 } },
    ];
  }

  // ────────────────── Edge intersection helpers ──────────────────

  /**
   * Get the closest point on an element's edge to a given world coordinate.
   */
  private getClosestEdgePoint(element: WhiteboardElement, target: Point): Point | null {
    switch (element.type) {
      case ElementType.Rectangle:
        return this.closestRectEdgePoint(element as RectangleElement, target);
      case ElementType.Ellipse:
        return this.closestEllipseEdgePoint(element as EllipseElement, target);
      default: {
        const util = getElementUtil(element.type);
        const b = util.getBounds(element);
        return this.closestBoundsEdgePoint(b, target);
      }
    }
  }

  private closestRectEdgePoint(el: RectangleElement, target: Point): Point {
    const { x, y, width, height } = el;
    const cx = x + width / 2;
    const cy = y + height / 2;

    // Clamp the target into the rectangle perimeter
    const dx = target.x - cx;
    const dy = target.y - cy;

    if (dx === 0 && dy === 0) return { x: cx, y };

    const halfW = width / 2;
    const halfH = height / 2;

    // Find intersection of ray from center toward target with rectangle edges
    const scaleX = halfW / Math.abs(dx || 0.001);
    const scaleY = halfH / Math.abs(dy || 0.001);
    const scale = Math.min(scaleX, scaleY);

    return {
      x: cx + dx * scale,
      y: cy + dy * scale,
    };
  }

  private closestEllipseEdgePoint(el: EllipseElement, target: Point): Point {
    const cx = el.x + el.cx;
    const cy = el.y + el.cy;
    const { rx, ry } = el;

    const dx = target.x - cx;
    const dy = target.y - cy;
    const angle = Math.atan2(dy, dx);

    return {
      x: cx + rx * Math.cos(angle),
      y: cy + ry * Math.sin(angle),
    };
  }

  private closestBoundsEdgePoint(bounds: Bounds, target: Point): Point {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = (bounds.minY + bounds.maxY) / 2;
    const halfW = bounds.width / 2;
    const halfH = bounds.height / 2;

    const dx = target.x - cx;
    const dy = target.y - cy;

    if (dx === 0 && dy === 0) return { x: cx, y: bounds.minY };

    const scaleX = halfW / Math.abs(dx || 0.001);
    const scaleY = halfH / Math.abs(dy || 0.001);
    const scale = Math.min(scaleX, scaleY);

    return { x: cx + dx * scale, y: cy + dy * scale };
  }

  // ────────────────── Utility helpers ──────────────────

  getElementCenter(element: WhiteboardElement): Point {
    const util = getElementUtil(element.type);
    const bounds = util.getBounds(element);
    return {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    };
  }

  isConnectable(element: WhiteboardElement): boolean {
    return (
      element.type === ElementType.Rectangle ||
      element.type === ElementType.Ellipse ||
      element.type === ElementType.Image ||
      element.type === ElementType.Text
    );
  }

  private isNearBounds(point: Point, bounds: Bounds, margin: number): boolean {
    return (
      point.x >= bounds.minX - margin &&
      point.x <= bounds.maxX + margin &&
      point.y >= bounds.minY - margin &&
      point.y <= bounds.maxY + margin
    );
  }

  private distance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
