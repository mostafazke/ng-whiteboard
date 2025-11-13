import { Bounds, Point } from '../../types';

/** Utilities for working with axis-aligned bounding boxes (AABB). */

/** Calculates the axis-aligned bounding box for a set of 2D points. */
export function calculateBoundingBox(points: number[][]): Bounds {
  if (points.length === 0) {
    throw new Error('Cannot calculate bounding box for empty points array');
  }

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

/** Checks if two axis-aligned bounding boxes intersect or overlap. */
export function doBoundingBoxesIntersect(box1: Bounds, box2: Bounds): boolean {
  return box1.minX <= box2.maxX && box1.maxX >= box2.minX && box1.minY <= box2.maxY && box1.maxY >= box2.minY;
}

/** Converts a box representation (x, y, width, height) to a Bounds object. */
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

/** Tests if a point is contained within a bounding box. */
export function isPointInBounds(bounds: Bounds, point: Point): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
}

/** Calculates the center point of a bounding box. */
export function getBoundsCenter(bounds: Bounds): Point {
  return {
    x: bounds.minX + bounds.width / 2,
    y: bounds.minY + bounds.height / 2,
  };
}

/** Tests if a line segment potentially intersects with a bounding box. */
export function isBoundsIntersect(bounds: Bounds, p1: Point, p2: Point, margin: number): boolean {
  return (
    bounds.minX - margin <= Math.max(p1.x, p2.x) &&
    bounds.maxX + margin >= Math.min(p1.x, p2.x) &&
    bounds.minY - margin <= Math.max(p1.y, p2.y) &&
    bounds.maxY + margin >= Math.min(p1.y, p2.y)
  );
}
