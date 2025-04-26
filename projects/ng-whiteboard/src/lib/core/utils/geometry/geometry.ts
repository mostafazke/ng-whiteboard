import { Point, Direction } from '../../types';

export const EPSILON = 0.000001;

export type LineSegment = {
  first: Point;
  second: Point;
};

/**
 * Calculate the cross product of two points.
 * @param a first point
 * @param b second point
 * @return the value of the cross product
 */
export function crossProduct(a: Point, b: Point): number {
  return a.x * b.y - b.x * a.y;
}

/**
 * Calculates the angle between two points relative to the center
 */
export function calculateAngle(center: Point, point: Point): number {
  return Math.atan2(point.y - center.y, point.x - center.x) * (180 / Math.PI);
}

/**
 * Normalizes an angle to be between 0 and 360 degrees
 */
export function normalizeAngle(angle: number): number {
  angle = angle % 360;
  return angle < 0 ? angle + 360 : angle;
}

/**
 * Finds the nearest angle from a list of snap angles
 * @returns The nearest snap angle if within threshold, or the original angle
 */
export function findNearestSnapAngle(angle: number, snapAngles: number[], threshold: number): number {
  const normalizedAngle = normalizeAngle(angle);
  const nearestSnapAngle = snapAngles.reduce((nearest, current) => {
    const currentDiff = Math.abs(normalizedAngle - current);
    const nearestDiff = Math.abs(normalizedAngle - nearest);
    return currentDiff < nearestDiff ? current : nearest;
  }, snapAngles[0]);

  const distanceToSnap = Math.abs(normalizedAngle - nearestSnapAngle);
  return distanceToSnap <= threshold ? nearestSnapAngle : angle;
}

/**
 * Gets a snapped offset for constrained movement (horizontal/vertical only)
 */
export function getSnappedOffset(dx: number, dy: number): Point {
  return Math.abs(dx) > Math.abs(dy) ? { x: dx, y: 0 } : { x: 0, y: dy };
}

/**
 * Calculates the shortest distance from a point to a line segment.
 */
export function pointToLineDistance(px: number, py: number, lineStart: Point, lineEnd: Point): number {
  const x1 = lineStart.x;
  const y1 = lineStart.y;
  const x2 = lineEnd.x;
  const y2 = lineEnd.y;

  const lineLengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

  if (lineLengthSquared === 0) {
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLengthSquared;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * (x2 - x1);
  const closestY = y1 + t * (y2 - y1);

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

/**
 * Checks if two line segments intersect
 */
export function lineSegmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point, threshold = EPSILON): boolean {
  const cross = (v1: Point, v2: Point) => v1.x * v2.y - v1.y * v2.x;
  const subtract = (v1: Point, v2: Point): Point => ({ x: v1.x - v2.x, y: v1.y - v2.y });

  const r = subtract(p2, p1);
  const s = subtract(q2, q1);
  const qp = subtract(q1, p1);
  const rsCross = cross(r, s);
  const qpCrossR = cross(qp, r);

  // If lines are parallel (cross product near zero)
  if (Math.abs(rsCross) < threshold) {
    // If lines are not collinear, they don't intersect
    if (Math.abs(qpCrossR) >= threshold) {
      return false;
    }

    // Lines are collinear, check if segments overlap
    const rdotr = r.x * r.x + r.y * r.y;
    const t0 = (qp.x * r.x + qp.y * r.y) / rdotr;
    const s_qp = subtract(q2, p1);
    const t1 = (s_qp.x * r.x + s_qp.y * r.y) / rdotr;

    return (t0 >= 0 && t0 <= 1) || (t1 >= 0 && t1 <= 1) || (t0 < 0 && t1 > 1) || (t0 > 1 && t1 < 0);
  }

  const t = qpCrossR / rsCross;
  const u = cross(qp, s) / rsCross;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Checks if an element's bounds are within a selection box
 */
export function isElementInSelectionBox(
  bounds: { minX: number; minY: number; maxX: number; maxY: number },
  selectionBox: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    bounds.minX <= selectionBox.x + selectionBox.width &&
    bounds.maxX >= selectionBox.x &&
    bounds.minY <= selectionBox.y + selectionBox.height &&
    bounds.maxY >= selectionBox.y
  );
}

/**
 * Gets the rotated direction based on the original direction and rotation angle
 */
export function getRotatedDirection(direction: Direction, rotation: number): Direction {
  const normalizedRotation = Math.round(normalizeAngle(rotation) / 45) % 8;
  const directionValues = Object.values(Direction);
  const currentIndex = directionValues.indexOf(direction);
  const newIndex = (currentIndex + normalizedRotation) % 8;
  return directionValues[newIndex];
}
