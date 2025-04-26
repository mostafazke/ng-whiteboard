import { Bounds, Point } from '../../types';
import { hitTestBoundingBox, hitTestEllipse, hitTestLine, hitTestPen } from './hit-test';

describe('Hit Test Utils', () => {
  describe('hitTestBoundingBox', () => {
    const bounds: Bounds = {
      minX: 0,
      minY: 0,
      maxX: 10,
      maxY: 10,
      width: 10,
      height: 10,
    };

    it('should detect line intersecting box', () => {
      const pointA: Point = { x: -5, y: -5 };
      const pointB: Point = { x: 15, y: 15 };
      expect(hitTestBoundingBox(bounds, pointA, pointB, 0.1)).toBe(true);
    });

    it('should detect line not intersecting box', () => {
      const pointA: Point = { x: -5, y: -5 };
      const pointB: Point = { x: -2, y: -2 };
      expect(hitTestBoundingBox(bounds, pointA, pointB, 0.1)).toBe(false);
    });

    it('should handle line touching box edge', () => {
      const pointA: Point = { x: 0, y: -5 };
      const pointB: Point = { x: 0, y: 15 };
      expect(hitTestBoundingBox(bounds, pointA, pointB, 0.1)).toBe(true);
    });
  });

  describe('hitTestEllipse', () => {
    it('should detect line intersecting ellipse', () => {
      const cx = 5,
        cy = 5;
      const rx = 5,
        ry = 5;
      const pointA: Point = { x: 0, y: 0 };
      const pointB: Point = { x: 10, y: 10 };
      expect(hitTestEllipse(cx, cy, rx, ry, pointA, pointB, 0.1)).toBe(true);
    });

    it('should detect line not intersecting ellipse', () => {
      const cx = 5,
        cy = 5;
      const rx = 2,
        ry = 2;
      const pointA: Point = { x: 10, y: 10 };
      const pointB: Point = { x: 15, y: 15 };
      expect(hitTestEllipse(cx, cy, rx, ry, pointA, pointB, 0.1)).toBe(false);
    });

    it('should consider threshold in detection', () => {
      const cx = 5,
        cy = 5;
      const rx = 2,
        ry = 2;
      const pointA: Point = { x: 7, y: 5 };
      const pointB: Point = { x: 10, y: 5 };
      expect(hitTestEllipse(cx, cy, rx, ry, pointA, pointB, 1)).toBe(true);
    });
  });

  describe('hitTestLine', () => {
    it('should detect line intersection', () => {
      const x1 = 0,
        y1 = 0;
      const x2 = 10,
        y2 = 10;
      const pointA: Point = { x: 0, y: 10 };
      const pointB: Point = { x: 10, y: 0 };
      expect(hitTestLine(x1, y1, x2, y2, pointA, pointB, 0.1)).toBe(false);
    });

    it('should detect line not intersecting', () => {
      const x1 = 0,
        y1 = 0;
      const x2 = 10,
        y2 = 10;
      const pointA: Point = { x: 20, y: 20 };
      const pointB: Point = { x: 30, y: 30 };
      expect(hitTestLine(x1, y1, x2, y2, pointA, pointB, 0.1)).toBe(false);
    });

    it('should consider threshold in detection', () => {
      const x1 = 0,
        y1 = 0;
      const x2 = 10,
        y2 = 0;
      const pointA: Point = { x: 5, y: 1 };
      const pointB: Point = { x: 5, y: 2 };
      expect(hitTestLine(x1, y1, x2, y2, pointA, pointB, 2)).toBe(true);
    });
  });

  describe('hitTestPen', () => {
    it('should detect intersection with pen stroke', () => {
      const points: [number, number][] = [
        [0, 0],
        [5, 5],
        [10, 10],
      ];
      const pointA: Point = { x: 4, y: 4 };
      const pointB: Point = { x: 6, y: 6 };
      expect(hitTestPen(points, pointA, pointB, 0.1)).toBe(true);
    });

    it('should detect no intersection with pen stroke', () => {
      const points: [number, number][] = [
        [0, 0],
        [5, 5],
        [10, 10],
      ];
      const pointA: Point = { x: 20, y: 20 };
      const pointB: Point = { x: 25, y: 25 };
      expect(hitTestPen(points, pointA, pointB, 0.1)).toBe(false);
    });

    it('should consider threshold in detection', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 0],
      ];
      const pointA: Point = { x: 5, y: 1 };
      const pointB: Point = { x: 5, y: 2 };
      expect(hitTestPen(points, pointA, pointB, 2)).toBe(true);
    });
  });
});
