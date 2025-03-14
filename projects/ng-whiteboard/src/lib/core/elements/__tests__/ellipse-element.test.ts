import { ElementType, Direction } from '../../types';
import { EllipseElementUtil } from '../ellipse-element';

describe('EllipseElementUtil', () => {
  let ellipseElementUtil: EllipseElementUtil;

  beforeEach(() => {
    ellipseElementUtil = new EllipseElementUtil();
  });

  it('should create an ellipse with default properties', () => {
    const ellipseElement = ellipseElementUtil.create({});
    expect(ellipseElement.type).toBe(ElementType.Ellipse);
    expect(ellipseElement.id).toBeDefined();
    expect(ellipseElement.x).toBe(0);
    expect(ellipseElement.y).toBe(0);
    expect(ellipseElement.cx).toBe(0);
    expect(ellipseElement.cy).toBe(0);
    expect(ellipseElement.rx).toBe(1);
    expect(ellipseElement.ry).toBe(1);
    expect(ellipseElement.rotation).toBe(0);
    expect(ellipseElement.opacity).toBe(100);
    expect(ellipseElement.style).toBeDefined();
  });

  it('should create an ellipse with provided properties', () => {
    const props = {
      x: 10,
      y: 20,
      cx: 30,
      cy: 40,
      rx: 50,
      ry: 60,
      rotation: 45,
      opacity: 80,
      style: { strokeColor: 'red', strokeWidth: 2 },
    };
    const ellipseElement = ellipseElementUtil.create(props);
    expect(ellipseElement.type).toBe(ElementType.Ellipse);
    expect(ellipseElement.id).toBeDefined();
    expect(ellipseElement.x).toBe(10);
    expect(ellipseElement.y).toBe(20);
    expect(ellipseElement.cx).toBe(30);
    expect(ellipseElement.cy).toBe(40);
    expect(ellipseElement.rx).toBe(50);
    expect(ellipseElement.ry).toBe(60);
    expect(ellipseElement.rotation).toBe(45);
    expect(ellipseElement.opacity).toBe(80);
    expect(ellipseElement.style.strokeColor).toBe('red');
  });

  it('should merge default style with provided style', () => {
    const props = {
      style: { strokeColor: 'blue', strokeWidth: 2 },
    };
    const ellipseElement = ellipseElementUtil.create(props);
    expect(ellipseElement.style.strokeColor).toBe('blue');
    expect(ellipseElement.style.strokeWidth).toBe(2);
    // Assuming defaultElementStyle has other properties like fill
    expect(ellipseElement.style.fill).toBeDefined();
  });

  it('should resize ellipse from North direction', () => {
    const ellipseElement = ellipseElementUtil.create({ cy: 10, ry: 10 });
    const resizedElement = ellipseElementUtil.resize(ellipseElement, Direction.N, 0, -5);
    expect(resizedElement.cy).toBe(7.5);
    expect(resizedElement.ry).toBe(12.5);
  });

  it('should resize ellipse from South direction', () => {
    const ellipseElement = ellipseElementUtil.create({ cy: 10, ry: 10 });
    const resizedElement = ellipseElementUtil.resize(ellipseElement, Direction.S, 0, 5);
    expect(resizedElement.cy).toBe(12.5);
    expect(resizedElement.ry).toBe(12.5);
  });

  it('should resize ellipse from West direction', () => {
    const ellipseElement = ellipseElementUtil.create({ cx: 10, rx: 10 });
    const resizedElement = ellipseElementUtil.resize(ellipseElement, Direction.W, -5, 0);
    expect(resizedElement.cx).toBe(7.5);
    expect(resizedElement.rx).toBe(12.5);
  });

  it('should resize ellipse from East direction', () => {
    const ellipseElement = ellipseElementUtil.create({ cx: 10, rx: 10 });
    const resizedElement = ellipseElementUtil.resize(ellipseElement, Direction.E, 5, 0);
    expect(resizedElement.cx).toBe(12.5);
    expect(resizedElement.rx).toBe(12.5);
  });

  it('should resize ellipse in compound directions', () => {
    const ellipseElement = ellipseElementUtil.create({ cx: 10, cy: 10, rx: 10, ry: 10 });
    const resizedElement = ellipseElementUtil.resize(ellipseElement, Direction.NE, 5, -5);
    expect(resizedElement.cx).toBe(12.5);
    expect(resizedElement.cy).toBe(7.5);
    expect(resizedElement.rx).toBe(12.5);
    expect(resizedElement.ry).toBe(12.5);
  });
});
