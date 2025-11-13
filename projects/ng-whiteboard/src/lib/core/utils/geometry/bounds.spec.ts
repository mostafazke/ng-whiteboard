import { Bounds, Point } from '../../types';
import {
  boxToBounds,
  calculateBoundingBox,
  doBoundingBoxesIntersect,
  getBoundsCenter,
  isBoundsIntersect,
  isPointInBounds,
} from './bounds';

describe('Bounds Utils', () => {
  describe('calculateBoundingBox', () => {
    it('should calculate correct bounding box for points', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];
      const result = calculateBoundingBox(points);
      expect(result).toEqual({
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 10,
        width: 10,
        height: 10,
      });
    });

    it('should handle negative coordinates', () => {
      const points: [number, number][] = [
        [-5, -5],
        [5, -5],
        [5, 5],
        [-5, 5],
      ];
      const result = calculateBoundingBox(points);
      expect(result).toEqual({
        minX: -5,
        minY: -5,
        maxX: 5,
        maxY: 5,
        width: 10,
        height: 10,
      });
    });

    it('should throw error for empty points array', () => {
      expect(() => calculateBoundingBox([])).toThrow('Cannot calculate bounding box for empty points array');
    });

    it('should handle single point', () => {
      const points: [number, number][] = [[5, 5]];
      const result = calculateBoundingBox(points);
      expect(result).toEqual({
        minX: 5,
        minY: 5,
        maxX: 5,
        maxY: 5,
        width: 0,
        height: 0,
      });
    });

    it('should handle points with decimal values', () => {
      const points: number[][] = [
        [1.5, 2.3],
        [4.7, 8.9],
        [2.1, 5.6],
      ];
      const result = calculateBoundingBox(points);
      expect(result.minX).toBeCloseTo(1.5, 5);
      expect(result.minY).toBeCloseTo(2.3, 5);
      expect(result.maxX).toBeCloseTo(4.7, 5);
      expect(result.maxY).toBeCloseTo(8.9, 5);
      expect(result.width).toBeCloseTo(3.2, 5);
      expect(result.height).toBeCloseTo(6.6, 5);
    });

    it('should handle points forming a horizontal line', () => {
      const points: [number, number][] = [
        [0, 5],
        [10, 5],
        [20, 5],
      ];
      const result = calculateBoundingBox(points);
      expect(result).toEqual({
        minX: 0,
        minY: 5,
        maxX: 20,
        maxY: 5,
        width: 20,
        height: 0,
      });
    });

    it('should handle points forming a vertical line', () => {
      const points: [number, number][] = [
        [5, 0],
        [5, 10],
        [5, 20],
      ];
      const result = calculateBoundingBox(points);
      expect(result).toEqual({
        minX: 5,
        minY: 0,
        maxX: 5,
        maxY: 20,
        width: 0,
        height: 20,
      });
    });
  });

  describe('doBoundingBoxesIntersect', () => {
    const box1: Bounds = {
      minX: 0,
      minY: 0,
      maxX: 10,
      maxY: 10,
      width: 10,
      height: 10,
    };

    it('should detect intersecting boxes', () => {
      const box2: Bounds = {
        minX: 5,
        minY: 5,
        maxX: 15,
        maxY: 15,
        width: 10,
        height: 10,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(true);
    });

    it('should detect non-intersecting boxes', () => {
      const box2: Bounds = {
        minX: 20,
        minY: 20,
        maxX: 30,
        maxY: 30,
        width: 10,
        height: 10,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(false);
    });

    it('should detect touching boxes as intersecting', () => {
      const box2: Bounds = {
        minX: 10,
        minY: 0,
        maxX: 20,
        maxY: 10,
        width: 10,
        height: 10,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(true);
    });

    it('should detect complete overlap', () => {
      const box2: Bounds = {
        minX: 2,
        minY: 2,
        maxX: 8,
        maxY: 8,
        width: 6,
        height: 6,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(true);
    });

    it('should detect box1 containing box2', () => {
      const box2: Bounds = {
        minX: 3,
        minY: 3,
        maxX: 7,
        maxY: 7,
        width: 4,
        height: 4,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(true);
    });

    it('should detect box2 containing box1', () => {
      const box2: Bounds = {
        minX: -5,
        minY: -5,
        maxX: 15,
        maxY: 15,
        width: 20,
        height: 20,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(true);
    });

    it('should detect non-intersecting boxes on x-axis', () => {
      const box2: Bounds = {
        minX: 15,
        minY: 0,
        maxX: 25,
        maxY: 10,
        width: 10,
        height: 10,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(false);
    });

    it('should detect non-intersecting boxes on y-axis', () => {
      const box2: Bounds = {
        minX: 0,
        minY: 15,
        maxX: 10,
        maxY: 25,
        width: 10,
        height: 10,
      };
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(false);
    });
  });

  describe('boxToBounds', () => {
    it('should convert selection box to bounds', () => {
      const selectionBox = { x: 10, y: 20, width: 30, height: 40 };
      const result = boxToBounds(selectionBox);
      expect(result).toEqual({
        minX: 10,
        minY: 20,
        maxX: 40,
        maxY: 60,
        width: 30,
        height: 40,
      });
    });

    it('should handle box at origin', () => {
      const box = { x: 0, y: 0, width: 10, height: 10 };
      const result = boxToBounds(box);
      expect(result).toEqual({
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 10,
        width: 10,
        height: 10,
      });
    });

    it('should handle box with negative coordinates', () => {
      const box = { x: -10, y: -20, width: 5, height: 8 };
      const result = boxToBounds(box);
      expect(result).toEqual({
        minX: -10,
        minY: -20,
        maxX: -5,
        maxY: -12,
        width: 5,
        height: 8,
      });
    });

    it('should handle box with zero dimensions', () => {
      const box = { x: 5, y: 5, width: 0, height: 0 };
      const result = boxToBounds(box);
      expect(result).toEqual({
        minX: 5,
        minY: 5,
        maxX: 5,
        maxY: 5,
        width: 0,
        height: 0,
      });
    });
  });

  describe('isPointInBounds', () => {
    const bounds: Bounds = {
      minX: 0,
      minY: 0,
      maxX: 10,
      maxY: 10,
      width: 10,
      height: 10,
    };

    it('should detect point inside bounds', () => {
      const point: Point = { x: 5, y: 5 };
      expect(isPointInBounds(bounds, point)).toBe(true);
    });

    it('should detect point outside bounds', () => {
      const point: Point = { x: 15, y: 15 };
      expect(isPointInBounds(bounds, point)).toBe(false);
    });

    it('should detect point on bounds edge', () => {
      const point: Point = { x: 10, y: 5 };
      expect(isPointInBounds(bounds, point)).toBe(true);
    });

    it('should detect point at min corner', () => {
      const point: Point = { x: 0, y: 0 };
      expect(isPointInBounds(bounds, point)).toBe(true);
    });

    it('should detect point at max corner', () => {
      const point: Point = { x: 10, y: 10 };
      expect(isPointInBounds(bounds, point)).toBe(true);
    });

    it('should detect point just outside left edge', () => {
      const point: Point = { x: -0.1, y: 5 };
      expect(isPointInBounds(bounds, point)).toBe(false);
    });

    it('should detect point just outside right edge', () => {
      const point: Point = { x: 10.1, y: 5 };
      expect(isPointInBounds(bounds, point)).toBe(false);
    });

    it('should detect point just outside top edge', () => {
      const point: Point = { x: 5, y: -0.1 };
      expect(isPointInBounds(bounds, point)).toBe(false);
    });

    it('should detect point just outside bottom edge', () => {
      const point: Point = { x: 5, y: 10.1 };
      expect(isPointInBounds(bounds, point)).toBe(false);
    });
  });

  describe('getBoundsCenter', () => {
    it('should calculate center of bounds', () => {
      const bounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 10,
        maxY: 10,
        width: 10,
        height: 10,
      };
      const center = getBoundsCenter(bounds);
      expect(center).toEqual({ x: 5, y: 5 });
    });

    it('should handle negative coordinates', () => {
      const bounds: Bounds = {
        minX: -10,
        minY: -10,
        maxX: 10,
        maxY: 10,
        width: 20,
        height: 20,
      };
      const center = getBoundsCenter(bounds);
      expect(center).toEqual({ x: 0, y: 0 });
    });

    it('should calculate center for non-square bounds', () => {
      const bounds: Bounds = {
        minX: 0,
        minY: 0,
        maxX: 20,
        maxY: 10,
        width: 20,
        height: 10,
      };
      const center = getBoundsCenter(bounds);
      expect(center).toEqual({ x: 10, y: 5 });
    });

    it('should handle point-like bounds (zero size)', () => {
      const bounds: Bounds = {
        minX: 5,
        minY: 7,
        maxX: 5,
        maxY: 7,
        width: 0,
        height: 0,
      };
      const center = getBoundsCenter(bounds);
      expect(center).toEqual({ x: 5, y: 7 });
    });

    it('should handle bounds with decimal values', () => {
      const bounds: Bounds = {
        minX: 1.5,
        minY: 2.5,
        maxX: 4.5,
        maxY: 8.5,
        width: 3,
        height: 6,
      };
      const center = getBoundsCenter(bounds);
      expect(center).toEqual({ x: 3, y: 5.5 });
    });
  });

  describe('isBoundsIntersect', () => {
    const bounds: Bounds = {
      minX: 0,
      minY: 0,
      maxX: 10,
      maxY: 10,
      width: 10,
      height: 10,
    };

    it('should detect line segment intersecting bounds', () => {
      const p1: Point = { x: -5, y: -5 };
      const p2: Point = { x: 15, y: 15 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(true);
    });

    it('should detect line segment not intersecting bounds', () => {
      const p1: Point = { x: -5, y: -5 };
      const p2: Point = { x: -2, y: -2 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(false);
    });

    it('should consider margin in intersection test', () => {
      const p1: Point = { x: -5, y: 5 };
      const p2: Point = { x: -2, y: 5 };
      expect(isBoundsIntersect(bounds, p1, p2, 3)).toBe(true);
    });

    it('should detect horizontal line segment intersecting bounds', () => {
      const p1: Point = { x: -5, y: 5 };
      const p2: Point = { x: 15, y: 5 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(true);
    });

    it('should detect vertical line segment intersecting bounds', () => {
      const p1: Point = { x: 5, y: -5 };
      const p2: Point = { x: 5, y: 15 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(true);
    });

    it('should detect line segment completely inside bounds', () => {
      const p1: Point = { x: 2, y: 2 };
      const p2: Point = { x: 8, y: 8 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(true);
    });

    it('should detect line segment with one endpoint inside', () => {
      const p1: Point = { x: 5, y: 5 };
      const p2: Point = { x: 15, y: 15 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(true);
    });

    it('should not intersect with parallel line outside bounds', () => {
      const p1: Point = { x: 15, y: 0 };
      const p2: Point = { x: 15, y: 10 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(false);
    });

    it('should intersect with parallel line outside bounds with margin', () => {
      const p1: Point = { x: 12, y: 0 };
      const p2: Point = { x: 12, y: 10 };
      expect(isBoundsIntersect(bounds, p1, p2, 5)).toBe(true);
    });

    it('should handle zero margin correctly', () => {
      const p1: Point = { x: 10, y: 0 };
      const p2: Point = { x: 10, y: 10 };
      expect(isBoundsIntersect(bounds, p1, p2, 0)).toBe(true);
    });

    it('should handle negative margin (shrink bounds)', () => {
      const p1: Point = { x: 1, y: 5 };
      const p2: Point = { x: 9, y: 5 };
      expect(isBoundsIntersect(bounds, p1, p2, -2)).toBe(true);
    });
  });
});
