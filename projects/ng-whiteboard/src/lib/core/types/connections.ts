import { Point } from './types';

/**
 * Represents a named connection point on a shape's edge.
 * `position` is the absolute world-coordinate of the point;
 * `normal` is an outward-facing unit vector used for arrowhead orientation.
 */
export interface ConnectionPoint {
  id: string; // e.g. 'top', 'bottom-left', '0.35'
  position: Point;
  normal: Point; // unit vector pointing outward from the shape
}

/**
 * Where on a shape the arrow is anchored.
 *
 * - `elementId`  – the shape this end is bound to
 * - `pointId`    – which connection point (optional; `null` → closest edge)
 * - `focus`      – normalised position [0-1] along a specific edge, for fine-tuning
 */
export interface ArrowBinding {
  elementId: string;
  pointId: string | null;
  /** 0 = start of edge, 1 = end of edge. Only used when pointId is set. */
  focus: number;
  /** Gap (in px) between shape edge and arrow endpoint */
  gap: number;
}

/**
 * Describes an arrow's curvature between its two endpoints.
 *
 * - `type: 'straight'` – simple line
 * - `type: 'quadratic'` – single control point (cx, cy)
 * - `type: 'cubic'` – two control points
 * - `type: 'elbow'`    – right-angle segments with a configurable bend position
 */
export type ArrowPathType =
  | { type: 'straight' }
  | { type: 'quadratic'; cx: number; cy: number }
  | { type: 'cubic'; cx1: number; cy1: number; cx2: number; cy2: number }
  | { type: 'elbow'; midRatio: number };

/**
 * The default straight arrow path.
 */
export const defaultArrowPath: ArrowPathType = { type: 'straight' };

/**
 * Snap detection result when hovering near a connectable shape.
 */
export interface SnapResult {
  /** The shape we're snapping to */
  elementId: string;
  /** The specific connection point (may be null for closest-edge) */
  pointId: string | null;
  /** The snapped world-coordinate */
  point: Point;
  /** Distance from the pointer to the snap point */
  distance: number;
}
