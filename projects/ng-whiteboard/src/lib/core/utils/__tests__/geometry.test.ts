import { Point, Bounds } from '../../types';
import {
  LineSegment,
  getBoundingBox,
  crossProduct,
  doBoundingBoxesIntersect,
  isPointOnLine,
  isPointRightOfLine,
  lineSegmentTouchesOrCrossesLine,
  doLinesIntersect,
  lineSegmentsIntersect,
  pointToLineDistance,
  hitTestLineSegmentWithBounds,
  EPSILON,
} from '../geometry';

describe('Geometry Utilities', () => {
  describe('getBoundingBox', () => {
    it('should return the correct bounding box for a line segment', () => {
      const segment: LineSegment = {
        first: { x: 1, y: 2 },
        second: { x: 3, y: 4 },
      };
      expect(getBoundingBox(segment)).toEqual([
        { x: 1, y: 2 },
        { x: 3, y: 4 },
      ]);
    });
  });

  describe('crossProduct', () => {
    it('should calculate the correct cross product of two points', () => {
      const a: Point = { x: 1, y: 2 };
      const b: Point = { x: 3, y: 4 };
      expect(crossProduct(a, b)).toBe(-2);
    });
  });

  describe('doBoundingBoxesIntersect', () => {
    it('should return true if bounding boxes intersect', () => {
      const box1: [Point, Point] = [
        { x: 1, y: 1 },
        { x: 3, y: 3 },
      ];
      const box2: [Point, Point] = [
        { x: 2, y: 2 },
        { x: 4, y: 4 },
      ];
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(true);
    });

    it('should return false if bounding boxes do not intersect', () => {
      const box1: [Point, Point] = [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];
      const box2: [Point, Point] = [
        { x: 3, y: 3 },
        { x: 4, y: 4 },
      ];
      expect(doBoundingBoxesIntersect(box1, box2)).toBe(false);
    });
  });

  describe('isPointOnLine', () => {
    it('should return true if a point is on the line', () => {
      const line: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 4, y: 4 },
      };
      const point: Point = { x: 2, y: 2 };
      expect(isPointOnLine(line, point)).toBe(true);
    });

    it('should return false if a point is not on the line', () => {
      const line: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 4, y: 4 },
      };
      const point: Point = { x: 2, y: 3 };
      expect(isPointOnLine(line, point)).toBe(false);
    });
  });

  describe('isPointRightOfLine', () => {
    it('should return true if a point is right of the line', () => {
      const line: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 4, y: 4 },
      };
      const point: Point = { x: 3, y: 2 };
      expect(isPointRightOfLine(line, point)).toBe(true);
    });

    it('should return false if a point is not right of the line', () => {
      const line: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 4, y: 4 },
      };
      const point: Point = { x: 2, y: 3 };
      expect(isPointRightOfLine(line, point)).toBe(false);
    });
  });

  describe('lineSegmentTouchesOrCrossesLine', () => {
    it('should return false if a line segment does not touch or cross another line', () => {
      const line1: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 4, y: 4 },
      };
      const line2: LineSegment = {
        first: { x: 0, y: 4 },
        second: { x: 4, y: 0 },
      };
      expect(lineSegmentTouchesOrCrossesLine(line1, line2)).toBe(true);
    });

    it('should return true if a line segment touches or crosses another line', () => {
      const line1: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 2, y: 2 },
      };
      const line2: LineSegment = {
        first: { x: 3, y: 3 },
        second: { x: 4, y: 4 },
      };
      expect(lineSegmentTouchesOrCrossesLine(line1, line2)).toBe(true);
    });
  });

  describe('doLinesIntersect', () => {
    it('should return true if two lines intersect', () => {
      const line1: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 4, y: 4 },
      };
      const line2: LineSegment = {
        first: { x: 0, y: 4 },
        second: { x: 4, y: 0 },
      };
      expect(doLinesIntersect(line1, line2)).toBe(true);
    });

    it('should return false if two lines do not intersect', () => {
      const line1: LineSegment = {
        first: { x: 0, y: 0 },
        second: { x: 2, y: 2 },
      };
      const line2: LineSegment = {
        first: { x: 3, y: 3 },
        second: { x: 4, y: 4 },
      };
      expect(doLinesIntersect(line1, line2)).toBe(false);
    });
  });

  describe('lineSegmentsIntersect', () => {
    it('should return true if two line segments intersect', () => {
      const p1: Point = { x: 0, y: 0 };
      const p2: Point = { x: 2, y: 2 };
      const q1: Point = { x: 3, y: 3 };
      const q2: Point = { x: 4, y: 4 };
      expect(lineSegmentsIntersect(p1, p2, q1, q2)).toBe(true);
    });
  });

  describe('pointToLineDistance', () => {
    it('should calculate the shortest distance from a point to a line segment', () => {
      const px = 3;
      const py = 3;
      const lineStart: Point = { x: 0, y: 0 };
      const lineEnd: Point = { x: 4, y: 0 };
      expect(pointToLineDistance(px, py, lineStart, lineEnd)).toBeCloseTo(3);
    });
  });

  describe('hitTestLineSegmentWithBounds', () => {
    it('should return true if a line segment intersects a bounding box', () => {
      const bounds: Bounds = { minX: 1, minY: 1, maxX: 3, maxY: 3, width: 2, height: 2 };
      const pointA: Point = { x: 0, y: 0 };
      const pointB: Point = { x: 4, y: 4 };
      expect(hitTestLineSegmentWithBounds(bounds, pointA, pointB, EPSILON)).toBe(true);
    });

    it('should return false if a line segment does not intersect a bounding box', () => {
      const bounds: Bounds = { minX: 1, minY: 1, maxX: 3, maxY: 3, width: 2, height: 2 };
      const pointA: Point = { x: 0, y: 0 };
      const pointB: Point = { x: 0, y: 4 };
      expect(hitTestLineSegmentWithBounds(bounds, pointA, pointB, EPSILON)).toBe(false);
    });
  });
});
