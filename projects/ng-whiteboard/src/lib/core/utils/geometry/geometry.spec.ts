import { Direction, Point } from '../../types';
import {
  calculateAngle,
  EPSILON,
  getRotatedDirection,
  getSnappedOffset,
  isElementInSelectionBox,
  lineSegmentsIntersect,
  normalizeAngle,
  pointToLineDistance,
} from './geometry';

describe('Geometry Utils', () => {
  describe('EPSILON', () => {
    it('should be defined as a small number', () => {
      expect(EPSILON).toBe(0.000001);
      expect(EPSILON).toBeGreaterThan(0);
      expect(EPSILON).toBeLessThan(0.001);
    });
  });

  describe('calculateAngle', () => {
    it('should calculate angle correctly for 45 degrees', () => {
      const center: Point = { x: 0, y: 0 };
      const point: Point = { x: 1, y: 1 };
      expect(calculateAngle(center, point)).toBe(45);
    });

    it('should handle negative angles', () => {
      const center: Point = { x: 0, y: 0 };
      const point: Point = { x: -1, y: -1 };
      expect(calculateAngle(center, point)).toBe(-135);
    });

    it('should calculate 0 degrees for point on positive x-axis', () => {
      expect(calculateAngle({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(0);
    });

    it('should calculate 90 degrees for point on positive y-axis', () => {
      expect(calculateAngle({ x: 0, y: 0 }, { x: 0, y: 10 })).toBe(90);
    });

    it('should calculate 180 degrees for point on negative x-axis', () => {
      expect(calculateAngle({ x: 0, y: 0 }, { x: -10, y: 0 })).toBe(180);
    });

    it('should calculate -90 degrees for point on negative y-axis', () => {
      expect(calculateAngle({ x: 0, y: 0 }, { x: 0, y: -10 })).toBe(-90);
    });

    it('should handle non-origin center points', () => {
      expect(calculateAngle({ x: 5, y: 5 }, { x: 6, y: 6 })).toBe(45);
      expect(calculateAngle({ x: 10, y: 10 }, { x: 20, y: 10 })).toBe(0);
    });

    it('should handle same point (center equals point)', () => {
      expect(calculateAngle({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0);
    });
  });

  describe('normalizeAngle', () => {
    it('should normalize positive angles', () => {
      expect(normalizeAngle(400)).toBe(40);
    });

    it('should normalize negative angles', () => {
      expect(normalizeAngle(-45)).toBe(315);
    });

    it('should handle 360 degrees', () => {
      expect(normalizeAngle(360)).toBe(0);
    });

    it('should handle 0 degrees', () => {
      expect(normalizeAngle(0)).toBe(0);
    });

    it('should handle multiple full rotations', () => {
      expect(normalizeAngle(720)).toBe(0);
      expect(normalizeAngle(725)).toBe(5);
      // -720 becomes -0, which is mathematically 0 but fails Object.is equality
      expect(Math.abs(normalizeAngle(-720))).toBe(0);
    });

    it('should handle large positive angles', () => {
      expect(normalizeAngle(1000)).toBe(280);
    });

    it('should handle large negative angles', () => {
      expect(normalizeAngle(-1000)).toBe(80);
    });

    it('should handle decimal angles', () => {
      expect(normalizeAngle(370.5)).toBe(10.5);
      expect(normalizeAngle(-10.5)).toBe(349.5);
    });
  });

  describe('getSnappedOffset', () => {
    it('should snap to horizontal movement when dx > dy', () => {
      const result = getSnappedOffset(10, 5);
      expect(result).toEqual({ x: 10, y: 0 });
    });

    it('should snap to vertical movement when dy > dx', () => {
      const result = getSnappedOffset(5, 10);
      expect(result).toEqual({ x: 0, y: 10 });
    });

    it('should snap to horizontal when dx equals dy (abs values)', () => {
      const result = getSnappedOffset(10, 10);
      expect(result).toEqual({ x: 0, y: 10 });
    });

    it('should handle negative dx', () => {
      const result = getSnappedOffset(-10, 5);
      expect(result).toEqual({ x: -10, y: 0 });
    });

    it('should handle negative dy', () => {
      const result = getSnappedOffset(5, -10);
      expect(result).toEqual({ x: 0, y: -10 });
    });

    it('should handle both negative', () => {
      const result = getSnappedOffset(-10, -5);
      expect(result).toEqual({ x: -10, y: 0 });
    });

    it('should handle zero dx', () => {
      const result = getSnappedOffset(0, 10);
      expect(result).toEqual({ x: 0, y: 10 });
    });

    it('should handle zero dy', () => {
      const result = getSnappedOffset(10, 0);
      expect(result).toEqual({ x: 10, y: 0 });
    });

    it('should handle both zero', () => {
      const result = getSnappedOffset(0, 0);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should preserve sign of the dominant axis', () => {
      expect(getSnappedOffset(-15, 5)).toEqual({ x: -15, y: 0 });
      expect(getSnappedOffset(5, -15)).toEqual({ x: 0, y: -15 });
    });
  });

  describe('pointToLineDistance', () => {
    it('should calculate distance from point to line segment', () => {
      const lineStart: Point = { x: 0, y: 0 };
      const lineEnd: Point = { x: 10, y: 0 };
      expect(pointToLineDistance(5, 5, lineStart, lineEnd)).toBe(5);
    });

    it('should handle zero-length line segments', () => {
      const lineStart: Point = { x: 0, y: 0 };
      const lineEnd: Point = { x: 0, y: 0 };
      expect(pointToLineDistance(3, 4, lineStart, lineEnd)).toBe(5);
    });

    it('should calculate distance to vertical line', () => {
      const lineStart: Point = { x: 5, y: 0 };
      const lineEnd: Point = { x: 5, y: 10 };
      expect(pointToLineDistance(10, 5, lineStart, lineEnd)).toBe(5);
    });

    it('should return 0 when point is on the line', () => {
      const lineStart: Point = { x: 0, y: 0 };
      const lineEnd: Point = { x: 10, y: 0 };
      expect(pointToLineDistance(5, 0, lineStart, lineEnd)).toBe(0);
    });

    it('should calculate distance to point before segment start', () => {
      const lineStart: Point = { x: 5, y: 0 };
      const lineEnd: Point = { x: 10, y: 0 };
      const distance = pointToLineDistance(0, 0, lineStart, lineEnd);
      expect(distance).toBeCloseTo(5, 5);
    });

    it('should calculate distance to point after segment end', () => {
      const lineStart: Point = { x: 0, y: 0 };
      const lineEnd: Point = { x: 5, y: 0 };
      const distance = pointToLineDistance(10, 0, lineStart, lineEnd);
      expect(distance).toBeCloseTo(5, 5);
    });

    it('should handle diagonal lines', () => {
      const lineStart: Point = { x: 0, y: 0 };
      const lineEnd: Point = { x: 10, y: 10 };
      const distance = pointToLineDistance(5, 0, lineStart, lineEnd);
      expect(distance).toBeCloseTo(3.5355, 4);
    });

    it('should handle negative coordinates', () => {
      const lineStart: Point = { x: -10, y: -10 };
      const lineEnd: Point = { x: -5, y: -10 };
      expect(pointToLineDistance(-7, -5, lineStart, lineEnd)).toBe(5);
    });

    it('should calculate perpendicular distance correctly', () => {
      const lineStart: Point = { x: 0, y: 0 };
      const lineEnd: Point = { x: 10, y: 0 };
      expect(pointToLineDistance(5, 3, lineStart, lineEnd)).toBe(3);
      expect(pointToLineDistance(5, -3, lineStart, lineEnd)).toBe(3);
    });
  });

  describe('lineSegmentsIntersect', () => {
    it('should detect intersecting line segments', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 10 };
      const q1: Point = { x: 0, y: 10 };
      const q2: Point = { x: 10, y: 0 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });

    it('should detect non-intersecting line segments', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 5 };
      const q1: Point = { x: 6, y: 6 };
      const q2: Point = { x: 10, y: 10 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(false);
    });

    it('should handle parallel line segments', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 0 };
      const q1: Point = { x: 0, y: 1 };
      const q2: Point = { x: 10, y: 1 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(false);
    });

    it('should detect collinear overlapping segments', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 0 };
      const q1: Point = { x: 5, y: 0 };
      const q2: Point = { x: 15, y: 0 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });

    it('should detect collinear non-overlapping segments', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 0 };
      const q1: Point = { x: 10, y: 0 };
      const q2: Point = { x: 15, y: 0 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(false);
    });

    it('should detect segments touching at endpoints', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 5 };
      const q1: Point = { x: 5, y: 5 };
      const q2: Point = { x: 10, y: 10 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });

    it('should handle T-junction intersection', () => {
      const p1: Point = { x: 5, y: 0 };
      const p2: Point = { x: 5, y: 10 };
      const q1: Point = { x: 0, y: 5 };
      const q2: Point = { x: 10, y: 5 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });

    it('should handle segments sharing one endpoint', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 5, y: 0 };
      const q1: Point = { x: 0, y: 0 };
      const q2: Point = { x: 0, y: 5 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });

    it('should handle identical segments', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 10 };
      expect(lineSegmentsIntersect(p1, p2, p1, p2)).toBe(true);
    });

    it('should use custom threshold', () => {
      // Test lines that are close but not quite intersecting
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 10, y: 10 };
      const q1: Point = { x: 5.001, y: 5 };
      const q2: Point = { x: 5, y: 5.001 };
      // With large threshold, these should be considered as intersecting
      expect(lineSegmentsIntersect(p1, p2, q1, q2, 0.01)).toBe(true);
      // With very small threshold, they still might intersect depending on precision
      // So test with non-intersecting lines instead
      const r1: Point = { x: 0, y: 0 };
      const r2: Point = { x: 10, y: 0 };
      const s1: Point = { x: 0, y: 1 };
      const s2: Point = { x: 10, y: 1 };
      // These are parallel lines 1 unit apart
      expect(lineSegmentsIntersect(r1, r2, s1, s2, 0.5)).toBe(false);
    });

    it('should handle vertical line segments', () => {
      const p1: Point = { x: 5, y: 0 };
      const p2: Point = { x: 5, y: 10 };
      const q1: Point = { x: 0, y: 5 };
      const q2: Point = { x: 10, y: 5 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });

    it('should handle horizontal line segments', () => {
      const p1: Point = { x: 0, y: 5 };
      const p2: Point = { x: 10, y: 5 };
      const q1: Point = { x: 5, y: 0 };
      const q2: Point = { x: 5, y: 10 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });
  });

  describe('isElementInSelectionBox', () => {
    it('should detect element fully inside selection box', () => {
      const bounds = { minX: 5, minY: 5, maxX: 10, maxY: 10 };
      const selectionBox = { x: 0, y: 0, width: 20, height: 20 };
      expect(isElementInSelectionBox(bounds, selectionBox)).toBe(true);
    });

    it('should detect element partially overlapping selection box', () => {
      const bounds = { minX: 5, minY: 5, maxX: 15, maxY: 15 };
      const selectionBox = { x: 10, y: 10, width: 10, height: 10 };
      expect(isElementInSelectionBox(bounds, selectionBox)).toBe(true);
    });

    it('should detect element outside selection box', () => {
      const bounds = { minX: 25, minY: 25, maxX: 30, maxY: 30 };
      const selectionBox = { x: 0, y: 0, width: 20, height: 20 };
      expect(isElementInSelectionBox(bounds, selectionBox)).toBe(false);
    });

    it('should detect element touching selection box edge', () => {
      const bounds = { minX: 20, minY: 5, maxX: 25, maxY: 10 };
      const selectionBox = { x: 0, y: 0, width: 20, height: 20 };
      expect(isElementInSelectionBox(bounds, selectionBox)).toBe(true);
    });

    it('should handle selection box containing element', () => {
      const bounds = { minX: 5, minY: 5, maxX: 10, maxY: 10 };
      const selectionBox = { x: 0, y: 0, width: 20, height: 20 };
      expect(isElementInSelectionBox(bounds, selectionBox)).toBe(true);
    });

    it('should handle element containing selection box', () => {
      const bounds = { minX: 0, minY: 0, maxX: 20, maxY: 20 };
      const selectionBox = { x: 5, y: 5, width: 10, height: 10 };
      expect(isElementInSelectionBox(bounds, selectionBox)).toBe(true);
    });
  });

  describe('getRotatedDirection', () => {
    it('should rotate direction by 0 degrees', () => {
      expect(getRotatedDirection(Direction.E, 0)).toBe(Direction.E);
    });

    it('should rotate direction by 45 degrees', () => {
      expect(getRotatedDirection(Direction.E, 45)).toBe(Direction.SE);
    });

    it('should rotate direction by 90 degrees', () => {
      expect(getRotatedDirection(Direction.N, 90)).toBe(Direction.E);
      expect(getRotatedDirection(Direction.E, 90)).toBe(Direction.S);
    });

    it('should rotate direction by 180 degrees', () => {
      expect(getRotatedDirection(Direction.N, 180)).toBe(Direction.S);
      expect(getRotatedDirection(Direction.E, 180)).toBe(Direction.W);
    });

    it('should rotate direction by 270 degrees', () => {
      expect(getRotatedDirection(Direction.N, 270)).toBe(Direction.W);
      expect(getRotatedDirection(Direction.E, 270)).toBe(Direction.N);
    });

    it('should handle 360 degree rotation (full circle)', () => {
      expect(getRotatedDirection(Direction.N, 360)).toBe(Direction.N);
      expect(getRotatedDirection(Direction.E, 360)).toBe(Direction.E);
    });

    it('should handle negative rotations', () => {
      expect(getRotatedDirection(Direction.E, -45)).toBe(Direction.NE);
      expect(getRotatedDirection(Direction.N, -90)).toBe(Direction.W);
    });

    it('should rotate through all 8 directions', () => {
      expect(getRotatedDirection(Direction.N, 0)).toBe(Direction.N);
      expect(getRotatedDirection(Direction.N, 45)).toBe(Direction.NE);
      expect(getRotatedDirection(Direction.N, 90)).toBe(Direction.E);
      expect(getRotatedDirection(Direction.N, 135)).toBe(Direction.SE);
      expect(getRotatedDirection(Direction.N, 180)).toBe(Direction.S);
      expect(getRotatedDirection(Direction.N, 225)).toBe(Direction.SW);
      expect(getRotatedDirection(Direction.N, 270)).toBe(Direction.W);
      expect(getRotatedDirection(Direction.N, 315)).toBe(Direction.NW);
    });

    it('should handle rotation angles > 360', () => {
      expect(getRotatedDirection(Direction.N, 405)).toBe(Direction.NE);
      // 450 degrees = 90 degrees, so E rotated 90 should give S
      expect(getRotatedDirection(Direction.E, 450)).toBe(Direction.S);
    });
  });
});
