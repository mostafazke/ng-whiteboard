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
});
