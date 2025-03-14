import { ElementType, Direction } from '../../types';
import { TextElementUtil } from '../text-element';

describe('TextElementUtil', () => {
  let textElementUtil: TextElementUtil;

  beforeEach(() => {
    textElementUtil = new TextElementUtil();
  });

  it('should create a text with default properties', () => {
    const element = textElementUtil.create({});
    expect(element.type).toBe(ElementType.Text);
    expect(element.id).toBeDefined();
    expect(element.x).toBe(0);
    expect(element.y).toBe(0);
    expect(element.text).toBe('');
    expect(element.rotation).toBe(0);
    expect(element.opacity).toBe(100);
    expect(element.scaleX).toBe(1);
    expect(element.scaleY).toBe(1);
    expect(element.style).toEqual(expect.objectContaining({}));
  });

  it('should create a text with provided properties', () => {
    const props = { text: 'Hello', x: 10, y: 20 };
    const element = textElementUtil.create(props);
    expect(element.text).toBe('Hello');
    expect(element.x).toBe(10);
    expect(element.y).toBe(20);
  });

  it('should merge default style with provided style', () => {
    const props = {
      style: { color: 'blue', strokeWidth: 2 },
    };
    const rectangleElement = textElementUtil.create(props);
    expect(rectangleElement.style.color).toBe('blue');
    expect(rectangleElement.style.strokeWidth).toBe(2);
    expect(rectangleElement.style.fontSize).toBeDefined();
  });

  it('should resize element in NW direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.NW, 10, -10);

    expect(resizedElement.x).toBe(10);
    expect(resizedElement.y).toBe(-10);
    expect(resizedElement.scaleX).toBeLessThan(1);
    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in N direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.N, 0, 10);

    expect(resizedElement.y).toBe(10);
    expect(resizedElement.scaleY).toBeLessThan(1);
  });

  it('should resize element in NE direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.NE, 10, 10);

    expect(resizedElement.y).toBe(10);
    expect(resizedElement.scaleX).toBeGreaterThan(1);
    expect(resizedElement.scaleY).toBeLessThan(1);
  });

  it('should resize element in E direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.E, 10, 0);

    expect(resizedElement.scaleX).toBeGreaterThan(1);
  });

  it('should resize element in SE direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.SE, 10, 10);

    expect(resizedElement.scaleX).toBeGreaterThan(1);
    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in S direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.S, 0, 10);

    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in SW direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.SW, 10, 10);

    expect(resizedElement.x).toBe(10);
    expect(resizedElement.scaleX).toBeLessThan(1);
    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in W direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.W, 10, 0);

    expect(resizedElement.x).toBe(10);
    expect(resizedElement.scaleX).toBeLessThan(1);
  });
});
