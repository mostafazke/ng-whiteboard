import { Point } from '../../types';
import {
  calculateAngle,
  crossProduct,
  findNearestSnapAngle,
  getSnappedOffset,
  lineSegmentsIntersect,
  normalizeAngle,
  pointToLineDistance,
} from './geometry';

describe('Geometry Utils', () => {
  describe('crossProduct', () => {
    it('should calculate cross product correctly', () => {
      const a: Point = { x: 2, y: 3 };
      const b: Point = { x: 4, y: 5 };
      expect(crossProduct(a, b)).toBe(-2); // (2 * 5) - (4 * 3)
    });

    it('should return 0 for parallel vectors', () => {
      const a: Point = { x: 2, y: 2 };
      const b: Point = { x: 4, y: 4 };
      expect(crossProduct(a, b)).toBe(0);
    });
  });

  describe('calculateAngle', () => {
    it('should calculate angle correctly', () => {
      const center: Point = { x: 0, y: 0 };
      const point: Point = { x: 1, y: 1 };
      expect(calculateAngle(center, point)).toBe(45);
    });

    it('should handle negative angles', () => {
      const center: Point = { x: 0, y: 0 };
      const point: Point = { x: -1, y: -1 };
      expect(calculateAngle(center, point)).toBe(-135);
    });
  });

  describe('normalizeAngle', () => {
    it('should normalize positive angles', () => {
      expect(normalizeAngle(400)).toBe(40);
    });

    it('should normalize negative angles', () => {
      expect(normalizeAngle(-45)).toBe(315);
    });
  });

  describe('findNearestSnapAngle', () => {
    it('should find nearest snap angle within threshold', () => {
      const snapAngles = [0, 45, 90, 135, 180];
      expect(findNearestSnapAngle(47, snapAngles, 5)).toBe(45);
    });

    it('should return original angle if no snap angle within threshold', () => {
      const snapAngles = [0, 45, 90, 135, 180];
      expect(findNearestSnapAngle(67, snapAngles, 5)).toBe(67);
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
  });
});
