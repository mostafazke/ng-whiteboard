import { Bounds, Point } from '../../types';

/**
 * Calculates the bounding box of a set of points.
 */
export function calculateBoundingBox(points: number[][]): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Checks if two bounding boxes intersect.
 */
export function doBoundingBoxesIntersect(box1: Bounds, box2: Bounds): boolean {
  return box1.minX <= box2.maxX && box1.maxX >= box2.minX && box1.minY <= box2.maxY && box1.maxY >= box2.minY;
}

/**
 * Converts a SelectionBox to a Bounds object.
 */
export function boxToBounds(box: { x: number; y: number; width: number; height: number }): Bounds {
  return {
    minX: box.x,
    minY: box.y,
    maxX: box.x + box.width,
    maxY: box.y + box.height,
    width: box.width,
    height: box.height,
  };
}

/**
 * Checks if a point is within a rectangular boundary.
 */
export function isPointInBounds(bounds: Bounds, point: Point): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}

/**
 * Calculates the center point of a bounding box.
 */
export function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.minX + bounds.width / 2,
    y: bounds.minY + bounds.height / 2,
  };
}

/**
 * Determines if a line segment intersects with a rectangular boundary.
 */
export function isBoundsIntersect(bounds: Bounds, p1: Point, p2: Point, margin: number): boolean {
  return (
    bounds.minX - margin <= Math.max(p1.x, p2.x) &&
    bounds.maxX + margin >= Math.min(p1.x, p2.x) &&
    bounds.minY - margin <= Math.max(p1.y, p2.y) &&
    bounds.maxY + margin >= Math.min(p1.y, p2.y)
  );
}
