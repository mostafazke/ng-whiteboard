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
  });
});
