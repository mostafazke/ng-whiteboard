import { ElementType, Direction } from '../../types';
import { ArrowElementUtil } from '../arrow-element';

describe('ArrowElementUtil', () => {
  let arrowElementUtil: ArrowElementUtil;

  beforeEach(() => {
    arrowElementUtil = new ArrowElementUtil();
  });

  it('should create an arrow with default properties', () => {
    const arrowElement = arrowElementUtil.create({});
    expect(arrowElement.type).toBe(ElementType.Arrow);
    expect(arrowElement.id).toBeDefined();
    expect(arrowElement.x).toBe(0);
    expect(arrowElement.y).toBe(0);
    expect(arrowElement.x1).toBe(0);
    expect(arrowElement.y1).toBe(0);
    expect(arrowElement.x2).toBe(0);
    expect(arrowElement.y2).toBe(0);
    expect(arrowElement.rotation).toBe(0);
    expect(arrowElement.opacity).toBe(100);
    expect(arrowElement.style).toBeDefined();
  });

  it('should create an arrow with provided properties', () => {
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
    const arrowElement = arrowElementUtil.create(props);
    expect(arrowElement.type).toBe(ElementType.Arrow);
    expect(arrowElement.id).toBeDefined();
    expect(arrowElement.x).toBe(10);
    expect(arrowElement.y).toBe(20);
    expect(arrowElement.x1).toBe(30);
    expect(arrowElement.y1).toBe(40);
    expect(arrowElement.x2).toBe(50);
    expect(arrowElement.y2).toBe(60);
    expect(arrowElement.rotation).toBe(45);
    expect(arrowElement.opacity).toBe(80);
    expect(arrowElement.style.strokeColor).toBe('red');
  });

  it('should merge default style with provided style', () => {
    const props = {
      style: { strokeColor: 'blue', strokeWidth: 2 },
    };
    const arrowElement = arrowElementUtil.create(props);
    expect(arrowElement.style.strokeColor).toBe('blue');
    expect(arrowElement.style.strokeWidth).toBe(2);
    // Assuming defaultElementStyle has other properties like fill
    expect(arrowElement.style.fill).toBeDefined();
  });

  it('should resize arrow from North direction', () => {
    const arrowElement = arrowElementUtil.create({ y1: 10 });
    const resizedElement = arrowElementUtil.resize(arrowElement, Direction.N, 0, -5);
    expect(resizedElement.y1).toBe(10);
  });

  it('should resize arrow from South direction', () => {
    const arrowElement = arrowElementUtil.create({ y2: 10 });
    const resizedElement = arrowElementUtil.resize(arrowElement, Direction.S, 0, 5);
    expect(resizedElement.y2).toBe(10);
  });

  it('should resize arrow from West direction', () => {
    const arrowElement = arrowElementUtil.create({ x1: 10 });
    const resizedElement = arrowElementUtil.resize(arrowElement, Direction.W, -5, 0);
    expect(resizedElement.x1).toBe(5);
  });

  it('should resize arrow from East direction', () => {
    const arrowElement = arrowElementUtil.create({ x2: 10 });
    const resizedElement = arrowElementUtil.resize(arrowElement, Direction.E, 5, 0);
    expect(resizedElement.x2).toBe(15);
  });

  it('should resize arrow in compund directions', () => {
    const arrowElement = arrowElementUtil.create({ x1: 10, y1: 10, x2: 20, y2: 20 });
    const resizedElement = arrowElementUtil.resize(arrowElement, Direction.NE, 5, -5);
    expect(resizedElement.x2).toBe(25);
    expect(resizedElement.y1).toBe(10);
  });
});
