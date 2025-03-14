import { ElementType, Direction } from '../../types';
import { RectangleElementUtil } from '../rectangle-element';

describe('RectangleElementUtil', () => {
  let rectangleElementUtil: RectangleElementUtil;

  beforeEach(() => {
    rectangleElementUtil = new RectangleElementUtil();
  });

  it('should create a rectangle with default properties', () => {
    const rectangleElement = rectangleElementUtil.create({});
    expect(rectangleElement.type).toBe(ElementType.Rectangle);
    expect(rectangleElement.id).toBeDefined();
    expect(rectangleElement.x).toBe(0);
    expect(rectangleElement.y).toBe(0);
    expect(rectangleElement.width).toBe(1);
    expect(rectangleElement.height).toBe(1);
    expect(rectangleElement.rotation).toBe(0);
    expect(rectangleElement.opacity).toBe(100);
    expect(rectangleElement.style).toBeDefined();
  });

  it('should create a rectangle with provided properties', () => {
    const props = {
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      rotation: 45,
      opacity: 80,
      style: { strokeColor: 'red', strokeWidth: 2 },
    };
    const rectangleElement = rectangleElementUtil.create(props);
    expect(rectangleElement.type).toBe(ElementType.Rectangle);
    expect(rectangleElement.id).toBeDefined();
    expect(rectangleElement.x).toBe(10);
    expect(rectangleElement.y).toBe(20);
    expect(rectangleElement.width).toBe(30);
    expect(rectangleElement.height).toBe(40);
    expect(rectangleElement.rotation).toBe(45);
    expect(rectangleElement.opacity).toBe(80);
    expect(rectangleElement.style.strokeColor).toBe('red');
  });

  it('should merge default style with provided style', () => {
    const props = {
      style: { strokeColor: 'blue', strokeWidth: 2 },
    };
    const rectangleElement = rectangleElementUtil.create(props);
    expect(rectangleElement.style.strokeColor).toBe('blue');
    expect(rectangleElement.style.strokeWidth).toBe(2);
    // Assuming defaultElementStyle has other properties like fill
    expect(rectangleElement.style.fill).toBeDefined();
  });

  it('should resize rectangle to the north direction', () => {
    const rectangleElement = rectangleElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = rectangleElementUtil.resize(rectangleElement, Direction.N, 0, -10);

    expect(resizedElement.y).toBe(40);
    expect(resizedElement.height).toBe(110);
  });

  it('should resize rectangle to the south direction', () => {
    const rectangleElement = rectangleElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = rectangleElementUtil.resize(rectangleElement, Direction.S, 0, 10);

    expect(resizedElement.height).toBe(110);
  });

  it('should resize rectangle to the west direction', () => {
    const rectangleElement = rectangleElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = rectangleElementUtil.resize(rectangleElement, Direction.W, -10, 0);

    expect(resizedElement.x).toBe(40);
    expect(resizedElement.width).toBe(110);
  });

  it('should resize rectangle to the east direction', () => {
    const rectangleElement = rectangleElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = rectangleElementUtil.resize(rectangleElement, Direction.E, 10, 0);

    expect(resizedElement.width).toBe(110);
  });

  it('should resize rectangle in compound directions', () => {
    const rectangleElement = rectangleElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = rectangleElementUtil.resize(rectangleElement, Direction.NE, 10, -10);

    expect(resizedElement.y).toBe(40);
    expect(resizedElement.width).toBe(110);
    expect(resizedElement.height).toBe(110);
  });
});
