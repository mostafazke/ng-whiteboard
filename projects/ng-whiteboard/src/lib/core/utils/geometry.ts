import { Bounds, Point } from '../types';

export type LineSegment = {
  first: Point;
  second: Point;
};

export const EPSILON = 0.000001;

/**
 * Gets the bounding box of a line segment
 * @param segment The line segment
 * @return A tuple of points representing the bounding box [min, max]
 */
export function getBoundingBox(segment: LineSegment): [Point, Point] {
  return [
    {
      x: Math.min(segment.first.x, segment.second.x),
      y: Math.min(segment.first.y, segment.second.y),
    },
    {
      x: Math.max(segment.first.x, segment.second.x),
      y: Math.max(segment.first.y, segment.second.y),
    },
  ];
}

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
 * Check if bounding boxes do intersect. If one bounding box
 * touches the other, they do intersect.
 * @param a first bounding box
 * @param b second bounding box
 * @return true if they intersect, false otherwise.
 */
export function doBoundingBoxesIntersect(a: [Point, Point], b: [Point, Point]): boolean {
  return a[0].x <= b[1].x && a[1].x >= b[0].x && a[0].y <= b[1].y && a[1].y >= b[0].y;
}

/**
 * Checks if a Point is on a line
 * @param a line (interpreted as line, although given as line segment)
 * @param b point
 * @return true if point is on line, otherwise false
 */
export function isPointOnLine(a: LineSegment, b: Point): boolean {
  // Move the image, so that a.first is on (0|0)
  const aTmp: LineSegment = {
    first: { x: 0, y: 0 },
    second: { x: a.second.x - a.first.x, y: a.second.y - a.first.y },
  };
  const bTmp: Point = { x: b.x - a.first.x, y: b.y - a.first.y };
  const r = crossProduct(aTmp.second, bTmp);
  return Math.abs(r) < EPSILON;
}

/**
 * Checks if a point is right of a line. If the point is on the
 * line, it is not right of the line.
 * @param a line segment interpreted as a line
 * @param b the point
 * @return true if the point is right of the line, false otherwise
 */
export function isPointRightOfLine(a: LineSegment, b: Point): boolean {
  // Move the image, so that a.first is on (0|0)
  const aTmp: LineSegment = {
    first: { x: 0, y: 0 },
    second: { x: a.second.x - a.first.x, y: a.second.y - a.first.y },
  };
  const bTmp: Point = { x: b.x - a.first.x, y: b.y - a.first.y };
  return crossProduct(aTmp.second, bTmp) < 0;
}

/**
 * Check if line segment first touches or crosses the line that is
 * defined by line segment second.
 *
 * @param a first line segment interpreted as line
 * @param b second line segment
 * @return true if line segment first touches or crosses line second,
 *         false otherwise.
 */
export function lineSegmentTouchesOrCrossesLine(a: LineSegment, b: LineSegment): boolean {
  return (
    isPointOnLine(a, b.first) ||
    isPointOnLine(a, b.second) ||
    isPointRightOfLine(a, b.first) !== isPointRightOfLine(a, b.second)
  );
}

/**
 * Check if line segments intersect
 * @param a first line segment
 * @param b second line segment
 * @return true if lines do intersect, false otherwise
 */
export function doLinesIntersect(a: LineSegment, b: LineSegment): boolean {
  const box1 = getBoundingBox(a);
  const box2 = getBoundingBox(b);
  return (
    doBoundingBoxesIntersect(box1, box2) &&
    lineSegmentTouchesOrCrossesLine(a, b) &&
    lineSegmentTouchesOrCrossesLine(b, a)
  );
}

export function lineSegmentsIntersect(p1: Point, p2: Point, q1: Point, q2: Point, threshold = EPSILON): boolean {
  const cross = (v1: Point, v2: Point) => v1.x * v2.y - v1.y * v2.x;
  const subtract = (v1: Point, v2: Point): Point => ({ x: v1.x - v2.x, y: v1.y - v2.y });
  const r = subtract(p2, p1);
  const s = subtract(q2, q1);
  const qp = subtract(q1, p1);
  const rsCross = cross(r, s);
  const qpCrossR = cross(qp, r);

  if (Math.abs(rsCross) < threshold) {
    // Lines are parallel or collinear
    return Math.abs(qpCrossR) < threshold;
  }

  const t = cross(qp, s) / rsCross;
  const u = cross(qp, r) / rsCross;

  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/**
 * Calculates the shortest distance from a point to a line segment.
 * @param px - X coordinate of the point.
 * @param py - Y coordinate of the point.
 * @param lineStart - Start point of the line segment { x, y }.
 * @param lineEnd - End point of the line segment { x, y }.
 * @returns The shortest distance from the point to the line segment.
 */
export function pointToLineDistance(px: number, py: number, lineStart: Point, lineEnd: Point): number {
  const x1 = lineStart.x;
  const y1 = lineStart.y;
  const x2 = lineEnd.x;
  const y2 = lineEnd.y;

  const lineLengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

  if (lineLengthSquared === 0) {
    // Line segment is a point
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Project the point onto the line segment, clamping to the segment bounds
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Find the closest point on the line segment
  const closestX = x1 + t * (x2 - x1);
  const closestY = y1 + t * (y2 - y1);

  // Calculate the distance from the point to the closest point
  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

/**
 * Generalized hit test for line segments against an element's bounding box.
 * @param bounds - The bounding box of the element.
 * @param pointA - Start point of the line segment { x, y }.
 * @param pointB - End point of the line segment { x, y }.
 * @param threshold - The threshold distance for intersection.
 * @returns True if the line segment intersects the bounding box, false otherwise.
 */
export function hitTestLineSegmentWithBounds(bounds: Bounds, pointA: Point, pointB: Point, threshold: number): boolean {
  // Define the edges of the bounding box
  const edges: [Point, Point][] = [
    [
      { x: bounds.minX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.minY },
    ], // Top edge
    [
      { x: bounds.maxX, y: bounds.minY },
      { x: bounds.maxX, y: bounds.maxY },
    ], // Right edge
    [
      { x: bounds.maxX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.maxY },
    ], // Bottom edge
    [
      { x: bounds.minX, y: bounds.maxY },
      { x: bounds.minX, y: bounds.minY },
    ], // Left edge
  ];

  // Check if the line segment intersects any edge of the bounding box
  for (const [edgeStart, edgeEnd] of edges) {
    if (lineSegmentsIntersect(pointA, pointB, edgeStart, edgeEnd, threshold)) {
      return true;
    }
  }

  return false;
}
