import { ElementType, Direction } from '../../types';
import { PenElementUtil } from '../pen-element';

describe('PenElementUtil', () => {
  let penElementUtil: PenElementUtil;

  beforeEach(() => {
    penElementUtil = new PenElementUtil();
  });

  it('should create a PenElement with default properties', () => {
    const penElement = penElementUtil.create({});
    expect(penElement.type).toBe(ElementType.Pen);
    expect(penElement.id).toBeDefined();
    expect(penElement.x).toBe(0);
    expect(penElement.y).toBe(0);
    expect(penElement.points).toEqual([]);
    expect(penElement.path).toBe('');
    expect(penElement.rotation).toBe(0);
    expect(penElement.opacity).toBe(100);
    expect(penElement.style).toBeDefined();
  });

  it('should create a PenElement with provided properties', () => {
    const props = {
      x: 10,
      y: 20,
      points: [
        [0, 0],
        [10, 10],
      ],
      path: 'M0 0 L10 10',
      rotation: 45,
      opacity: 80,
      style: { strokeColor: 'red', strokeWidth: 2 },
    };
    const penElement = penElementUtil.create(props);
    expect(penElement.type).toBe(ElementType.Pen);
    expect(penElement.id).toBeDefined();
    expect(penElement.x).toBe(10);
    expect(penElement.y).toBe(20);
    expect(penElement.points).toEqual([
      [0, 0],
      [10, 10],
    ]);
    expect(penElement.path).toBe('M0 0 L10 10');
    expect(penElement.rotation).toBe(45);
    expect(penElement.opacity).toBe(80);
    expect(penElement.style.strokeColor).toBe('red');
  });

  it('should merge default style with provided style', () => {
    const props = {
      style: { strokeColor: 'blue', strokeWidth: 2 },
    };
    const penElement = penElementUtil.create(props);
    expect(penElement.style.strokeColor).toBe('blue');
    expect(penElement.style.strokeWidth).toBe(2);
    // Assuming defaultElementStyle has other properties like fill
    expect(penElement.style.fill).toBeDefined();
  });

  it('should resize pen from North direction', () => {
    const penElement = penElementUtil.create({
      points: [
        [0, 10],
        [10, 10],
        [20, 20],
      ],
    });
    const resizedElement = penElementUtil.resize(penElement, Direction.N, 0, -10);
    expect(resizedElement.points[0][1]).toBe(5);
  });

  it('should resize pen from South direction', () => {
    const penElement = penElementUtil.create({
      points: [
        [0, 0],
        [10, 10],
      ],
    });
    const resizedElement = penElementUtil.resize(penElement, Direction.S, 0, 10);
    expect(resizedElement.points[1][1]).toBe(15);
  });

  it('should resize pen from West direction', () => {
    const penElement = penElementUtil.create({
      points: [
        [10, 0],
        [10, 10],
        [20, 20],
      ],
    });
    const resizedElement = penElementUtil.resize(penElement, Direction.W, -10, 0);
    expect(resizedElement.points[0][0]).toBe(5);
  });

  it('should resize pen from East direction', () => {
    const penElement = penElementUtil.create({
      points: [
        [0, 0],
        [10, 10],
        [20, 20],
      ],
    });
    const resizedElement = penElementUtil.resize(penElement, Direction.E, 10, 0);
    expect(resizedElement.points[1][0]).toBe(10);
  });

  it('should resize pen in compound directions', () => {
    const penElement = penElementUtil.create({
      points: [
        [10, 10],
        [20, 20],
      ],
    });
    const resizedElement = penElementUtil.resize(penElement, Direction.NE, 10, -10);
    expect(resizedElement.points[1][0]).toBe(25);
    expect(resizedElement.points[0][1]).toBe(5);
  });
});
