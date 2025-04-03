import { hitTestBoundingBox, hitTestEllipse, hitTestLine, hitTestPen } from '../hit-test';
import { lineSegmentsIntersect, pointToLineDistance } from '../geometry';
import { Bounds, Point } from '../../types';

jest.mock('../geometry', () => ({
  lineSegmentsIntersect: jest.fn(),
  pointToLineDistance: jest.fn(),
}));

describe('hitTestBoundingBox', () => {
  it('should return true if a line segment intersects with the bounding box', () => {
    const bounds: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10, width: 10, height: 10 };
    const pointA: Point = { x: -5, y: 5 };
    const pointB: Point = { x: 15, y: 5 };
    const threshold = 1;

    (lineSegmentsIntersect as jest.Mock).mockReturnValueOnce(true);

    const result = hitTestBoundingBox(bounds, pointA, pointB, threshold);

    expect(result).toBe(true);
    expect(lineSegmentsIntersect).toHaveBeenCalled();
  });

  it('should return false if no line segment intersects with the bounding box', () => {
    const bounds: Bounds = { minX: 0, minY: 0, maxX: 10, maxY: 10, width: 10, height: 10 };
    const pointA: Point = { x: -5, y: -5 };
    const pointB: Point = { x: -10, y: -10 };
    const threshold = 1;

    (lineSegmentsIntersect as jest.Mock).mockReturnValue(false);

    const result = hitTestBoundingBox(bounds, pointA, pointB, threshold);

    expect(result).toBe(false);
    expect(lineSegmentsIntersect).toHaveBeenCalled();
  });
});

describe('hitTestEllipse', () => {
  it('should return true if the distance from the line to the ellipse center is within the threshold', () => {
    const cx = 5,
      cy = 5,
      rx = 3,
      ry = 3;
    const pointA: Point = { x: 0, y: 0 };
    const pointB: Point = { x: 10, y: 10 };
    const threshold = 1;

    (pointToLineDistance as jest.Mock).mockReturnValue(3);

    const result = hitTestEllipse(cx, cy, rx, ry, pointA, pointB, threshold);

    expect(result).toBe(true);
    expect(pointToLineDistance).toHaveBeenCalled();
  });

  it('should return false if the distance from the line to the ellipse center exceeds the threshold', () => {
    const cx = 5,
      cy = 5,
      rx = 3,
      ry = 3;
    const pointA: Point = { x: 0, y: 0 };
    const pointB: Point = { x: 10, y: 10 };
    const threshold = 1;

    (pointToLineDistance as jest.Mock).mockReturnValue(10);

    const result = hitTestEllipse(cx, cy, rx, ry, pointA, pointB, threshold);

    expect(result).toBe(false);
    expect(pointToLineDistance).toHaveBeenCalled();
  });
});

describe('hitTestLine', () => {
  it('should return true if either endpoint of the line is within the threshold distance', () => {
    const x1 = 0,
      y1 = 0,
      x2 = 10,
      y2 = 10;
    const pointA: Point = { x: 5, y: 5 };
    const pointB: Point = { x: 15, y: 15 };
    const threshold = 1;

    (pointToLineDistance as jest.Mock).mockReturnValueOnce(0.5).mockReturnValueOnce(2);

    const result = hitTestLine(x1, y1, x2, y2, pointA, pointB, threshold);

    expect(result).toBe(true);
    expect(pointToLineDistance).toHaveBeenCalledTimes(3);
  });

  it('should return false if neither endpoint of the line is within the threshold distance', () => {
    const x1 = 0,
      y1 = 0,
      x2 = 10,
      y2 = 10;
    const pointA: Point = { x: 20, y: 20 };
    const pointB: Point = { x: 30, y: 30 };
    const threshold = 1;

    (pointToLineDistance as jest.Mock).mockReturnValue(5);

    const result = hitTestLine(x1, y1, x2, y2, pointA, pointB, threshold);

    expect(result).toBe(false);
    expect(pointToLineDistance).toHaveBeenCalledTimes(5);
  });
});

describe('hitTestPen', () => {
  it('should return true if any segment of the pen is within the threshold distance', () => {
    const points: [number, number][] = [
      [0, 0],
      [10, 10],
      [20, 20],
    ];
    const pointA: Point = { x: 5, y: 5 };
    const pointB: Point = { x: 15, y: 15 };
    const threshold = 1;

    (pointToLineDistance as jest.Mock).mockReturnValueOnce(0.5);

    const result = hitTestPen(points, pointA, pointB, threshold);

    expect(result).toBe(true);
    expect(pointToLineDistance).toHaveBeenCalled();
  });

  it('should return false if no segment of the pen is within the threshold distance', () => {
    const points: [number, number][] = [
      [0, 0],
      [10, 10],
      [20, 20],
    ];
    const pointA: Point = { x: 30, y: 30 };
    const pointB: Point = { x: 40, y: 40 };
    const threshold = 1;

    (pointToLineDistance as jest.Mock).mockReturnValue(5);

    const result = hitTestPen(points, pointA, pointB, threshold);

    expect(result).toBe(false);
    expect(pointToLineDistance).toHaveBeenCalled();
  });
});
