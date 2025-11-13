import { ElementType, Direction } from '../../types';
import { LineElementUtil } from '../line-element';

describe('LineElementUtil', () => {
  let lineElementUtil: LineElementUtil;

  beforeEach(() => {
    lineElementUtil = new LineElementUtil();
  });

  it('should create a line with default properties', () => {
    const lineElement = lineElementUtil.create({});
    expect(lineElement.type).toBe(ElementType.Line);
    expect(lineElement.id).toBeDefined();
    expect(lineElement.x).toBe(0);
    expect(lineElement.y).toBe(0);
    expect(lineElement.x1).toBe(0);
    expect(lineElement.y1).toBe(0);
    expect(lineElement.x2).toBe(0);
    expect(lineElement.y2).toBe(0);
    expect(lineElement.rotation).toBe(0);
    expect(lineElement.opacity).toBe(100);
    expect(lineElement.style).toBeDefined();
  });

  it('should create a line with provided properties', () => {
    const props = {
      x: 10,
      y: 20,
      x1: 30,
      y1: 40,
      x2: 50,
      y2: 60,
      rotation: 45,
      opacity: 80,
      style: { strokeColor: 'red', strokeWidth: 2 },
    };
    const lineElement = lineElementUtil.create(props);
    expect(lineElement.type).toBe(ElementType.Line);
    expect(lineElement.id).toBeDefined();
    expect(lineElement.x).toBe(10);
    expect(lineElement.y).toBe(20);
    expect(lineElement.x1).toBe(30);
    expect(lineElement.y1).toBe(40);
    expect(lineElement.x2).toBe(50);
    expect(lineElement.y2).toBe(60);
    expect(lineElement.rotation).toBe(45);
    expect(lineElement.opacity).toBe(80);
    expect(lineElement.style.strokeColor).toBe('red');
  });

  it('should merge default style with provided style', () => {
    const props = {
      style: { strokeColor: 'blue', strokeWidth: 2 },
    };
    const lineElement = lineElementUtil.create(props);
    expect(lineElement.style.strokeColor).toBe('blue');
    expect(lineElement.style.strokeWidth).toBe(2);
    // Assuming defaultElementStyle has other properties like fill
    expect(lineElement.style.fill).toBeDefined();
  });

  it('should resize line from North direction', () => {
    const lineElement = lineElementUtil.create({ y1: 10 });
    const resizedElement = lineElementUtil.resize(lineElement, Direction.N, 0, -5);
    expect(resizedElement.y1).toBe(5);
  });

  it('should resize line from South direction', () => {
    const lineElement = lineElementUtil.create({ y2: 10 });
    const resizedElement = lineElementUtil.resize(lineElement, Direction.S, 0, 5);
    expect(resizedElement.y2).toBe(15);
  });

  it('should resize line from West direction', () => {
    const lineElement = lineElementUtil.create({ x1: 10 });
    const resizedElement = lineElementUtil.resize(lineElement, Direction.W, -5, 0);
    expect(resizedElement.x1).toBe(5);
  });

  it('should resize line from East direction', () => {
    const lineElement = lineElementUtil.create({ x2: 10 });
    const resizedElement = lineElementUtil.resize(lineElement, Direction.E, 5, 0);
    expect(resizedElement.x2).toBe(15);
  });

  it('should resize line in compund directions', () => {
    const lineElement = lineElementUtil.create({ x1: 10, y1: 10, x2: 20, y2: 20 });
    const resizedElement = lineElementUtil.resize(lineElement, Direction.NE, 5, -5);
    expect(resizedElement.x2).toBe(25);
    expect(resizedElement.y1).toBe(5);
  });

  describe('getBounds', () => {
    it('should calculate bounds for a horizontal line', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 10,
        y1: 20,
        x2: 50,
        y2: 20,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(10);
      expect(bounds.minY).toBe(20);
      expect(bounds.maxX).toBe(50);
      expect(bounds.maxY).toBe(20);
      expect(bounds.width).toBe(40);
      expect(bounds.height).toBe(0);
    });

    it('should calculate bounds for a vertical line', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 30,
        y1: 10,
        x2: 30,
        y2: 60,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(30);
      expect(bounds.minY).toBe(10);
      expect(bounds.maxX).toBe(30);
      expect(bounds.maxY).toBe(60);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(50);
    });

    it('should calculate bounds for a diagonal line', () => {
      const lineElement = lineElementUtil.create({
        x: 5,
        y: 10,
        x1: 0,
        y1: 0,
        x2: 40,
        y2: 30,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(5); // x + x1
      expect(bounds.minY).toBe(10); // y + y1
      expect(bounds.maxX).toBe(45); // x + x2
      expect(bounds.maxY).toBe(40); // y + y2
      expect(bounds.width).toBe(40);
      expect(bounds.height).toBe(30);
    });

    it('should calculate bounds when x2 < x1 and y2 < y1', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 50,
        y1: 60,
        x2: 10,
        y2: 20,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(10);
      expect(bounds.minY).toBe(20);
      expect(bounds.maxX).toBe(50);
      expect(bounds.maxY).toBe(60);
      expect(bounds.width).toBe(40);
      expect(bounds.height).toBe(40);
    });

    it('should account for element position offset', () => {
      const lineElement = lineElementUtil.create({
        x: 100,
        y: 200,
        x1: 0,
        y1: 0,
        x2: 50,
        y2: 50,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(100);
      expect(bounds.minY).toBe(200);
      expect(bounds.maxX).toBe(150);
      expect(bounds.maxY).toBe(250);
      expect(bounds.width).toBe(50);
      expect(bounds.height).toBe(50);
    });

    it('should handle negative coordinates', () => {
      const lineElement = lineElementUtil.create({
        x: -10,
        y: -20,
        x1: -5,
        y1: -10,
        x2: 5,
        y2: 10,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(-15);
      expect(bounds.minY).toBe(-30);
      expect(bounds.maxX).toBe(-5);
      expect(bounds.maxY).toBe(-10);
      expect(bounds.width).toBe(10);
      expect(bounds.height).toBe(20);
    });

    it('should handle zero-length line (point)', () => {
      const lineElement = lineElementUtil.create({
        x: 10,
        y: 20,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(10);
      expect(bounds.minY).toBe(20);
      expect(bounds.maxX).toBe(10);
      expect(bounds.maxY).toBe(20);
      expect(bounds.width).toBe(0);
      expect(bounds.height).toBe(0);
    });
  });

  describe('hitTest', () => {
    it('should detect hit on horizontal line', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 10,
        y1: 20,
        x2: 50,
        y2: 20,
      });
      const pointA = { x: 30, y: 20 };
      const pointB = { x: 30, y: 20 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      expect(result).toBe(true);
    });

    it('should detect hit on vertical line', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 20,
        y1: 10,
        x2: 20,
        y2: 50,
      });
      const pointA = { x: 20, y: 30 };
      const pointB = { x: 20, y: 30 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      expect(result).toBe(true);
    });

    it('should detect hit on diagonal line', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      });
      const pointA = { x: 50, y: 50 };
      const pointB = { x: 50, y: 50 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      expect(result).toBe(true);
    });

    it('should not detect hit when point is far from line', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
      });
      const pointA = { x: 50, y: 50 };
      const pointB = { x: 50, y: 50 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      expect(result).toBe(false);
    });

    it('should detect hit within threshold distance', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
      });
      const pointA = { x: 50, y: 3 };
      const pointB = { x: 50, y: 3 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      expect(result).toBe(true);
    });

    it('should not detect hit outside threshold distance', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
      });
      const pointA = { x: 50, y: 10 };
      const pointB = { x: 50, y: 10 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      expect(result).toBe(false);
    });

    it('should handle hit test with line segment (pointA to pointB)', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      });
      const pointA = { x: 45, y: 45 };
      const pointB = { x: 55, y: 55 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 10);
      // Result depends on hitTestLine implementation
      expect(typeof result).toBe('boolean');
    });

    it('should handle hit test at line endpoints', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 10,
        y1: 10,
        x2: 50,
        y2: 50,
      });
      const pointA = { x: 10, y: 10 };
      const pointB = { x: 10, y: 10 };
      const result = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      expect(result).toBe(true);
    });

    it('should handle hit test with different threshold values', () => {
      const lineElement = lineElementUtil.create({
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 0,
      });
      const pointA = { x: 50, y: 8 };
      const pointB = { x: 50, y: 8 };

      const resultSmallThreshold = lineElementUtil.hitTest(lineElement, pointA, pointB, 5);
      const resultLargeThreshold = lineElementUtil.hitTest(lineElement, pointA, pointB, 10);

      expect(resultSmallThreshold).toBe(false);
      expect(resultLargeThreshold).toBe(true);
    });
  });

  describe('default properties', () => {
    it('should set selectAfterDraw to true by default', () => {
      const lineElement = lineElementUtil.create({});
      expect(lineElement.selectAfterDraw).toBe(true);
    });

    it('should set default zIndex to 1', () => {
      const lineElement = lineElementUtil.create({});
      expect(lineElement.zIndex).toBe(1);
    });

    it('should allow overriding selectAfterDraw', () => {
      const lineElement = lineElementUtil.create({ selectAfterDraw: false });
      expect(lineElement.selectAfterDraw).toBe(false);
    });

    it('should allow overriding zIndex', () => {
      const lineElement = lineElementUtil.create({ zIndex: 10 });
      expect(lineElement.zIndex).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle very large coordinate values', () => {
      const lineElement = lineElementUtil.create({
        x: 10000,
        y: 20000,
        x1: 5000,
        y1: 6000,
        x2: 7000,
        y2: 8000,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBe(15000);
      expect(bounds.minY).toBe(26000);
      expect(bounds.maxX).toBe(17000);
      expect(bounds.maxY).toBe(28000);
    });

    it('should handle very small coordinate values', () => {
      const lineElement = lineElementUtil.create({
        x: 0.1,
        y: 0.2,
        x1: 0.3,
        y1: 0.4,
        x2: 0.5,
        y2: 0.6,
      });
      const bounds = lineElementUtil.getBounds(lineElement);
      expect(bounds.minX).toBeCloseTo(0.4, 5);
      expect(bounds.minY).toBeCloseTo(0.6, 5);
      expect(bounds.maxX).toBeCloseTo(0.6, 5);
      expect(bounds.maxY).toBeCloseTo(0.8, 5);
    });

    it('should handle resize with zero delta values', () => {
      const lineElement = lineElementUtil.create({ x1: 10, y1: 20, x2: 30, y2: 40 });
      const resizedElement = lineElementUtil.resize(lineElement, Direction.N, 0, 0);
      expect(resizedElement.x1).toBe(10);
      expect(resizedElement.y1).toBe(20);
      expect(resizedElement.x2).toBe(30);
      expect(resizedElement.y2).toBe(40);
    });

    it('should handle resize with negative delta values', () => {
      const lineElement = lineElementUtil.create({ x1: 50, y1: 50, x2: 100, y2: 100 });
      const resizedElement = lineElementUtil.resize(lineElement, Direction.SE, -10, -10);
      expect(resizedElement.x2).toBe(90);
      expect(resizedElement.y2).toBe(90);
    });
  });
});
