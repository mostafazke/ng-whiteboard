import { Bounds, Point } from '../../types';
import { lineSegmentsIntersect, pointToLineDistance } from '../geometry/geometry';

/**
 * Tests if a line segment intersects with a bounding box
 */
export function hitTestBoundingBox(bounds: Bounds, pointA: Point, pointB: Point, threshold: number): boolean {
  const edges: [Point, Point][] = [
    [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
    ],
    [
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
    ],
    [
      { x: bounds.maxX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY },
    ],
    [
      { x: bounds.minX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.minY },
    ],
  ];

  for (const [edgeStart, edgeEnd] of edges) {
    if (lineSegmentsIntersect(pointA, pointB, edgeStart, edgeEnd, threshold)) {
      return true;
    }
  }

  return false;
}

/**
 * Tests if a line segment intersects with an ellipse
 */
export function hitTestEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  pointA: Point,
  pointB: Point,
  threshold: number
): boolean {
  return pointToLineDistance(cx, cy, pointA, pointB) <= Math.max(rx, ry) + threshold;
}

/**
 * Tests if a line segment intersects with another line segment
 */
export function hitTestLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pointA: Point,
  pointB: Point,
  threshold: number
): boolean {
  const lineStart: Point = { x: x1, y: y1 };
  const lineEnd: Point = { x: x2, y: y2 };

  return (
    pointToLineDistance(pointA.x, pointA.y, lineStart, lineEnd) <= threshold ||
    pointToLineDistance(pointB.x, pointB.y, lineStart, lineEnd) <= threshold
  );
}

/**
 * Tests if a line segment intersects with a pen stroke
 */
export function hitTestPen(points: [number, number][], pointA: Point, pointB: Point, threshold: number): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const segmentStart: Point = { x: points[i][0], y: points[i][1] };
    const segmentEnd: Point = { x: points[i + 1][0], y: points[i + 1][1] };
    if (
      pointToLineDistance(pointA.x, pointA.y, segmentStart, segmentEnd) <= threshold ||
      pointToLineDistance(pointB.x, pointB.y, segmentStart, segmentEnd) <= threshold
    ) {
      return true;
    }
  }

  return false;
}
