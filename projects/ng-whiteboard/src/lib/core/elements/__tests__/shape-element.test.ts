import { ElementType, Direction } from '../../types';
import { ShapeElementUtil } from '../shape-element';

describe('ShapeElementUtil', () => {
  let util: ShapeElementUtil;

  beforeEach(() => {
    util = new ShapeElementUtil();
  });

  it('should create a shape with default properties', () => {
    const el = util.create({});
    expect(el.type).toBe(ElementType.Shape);
    expect(el.id).toBeDefined();
    expect(el.x).toBe(0);
    expect(el.y).toBe(0);
    expect(el.width).toBe(1);
    expect(el.height).toBe(1);
    expect(el.shapeId).toBe('');
    expect(el.path).toBe('');
    expect(el.rotation).toBe(0);
    expect(el.opacity).toBe(100);
    expect(el.selectAfterDraw).toBe(true);
    expect(el.style).toBeDefined();
  });

  it('should create a shape with provided properties', () => {
    const el = util.create({
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      rotation: 45,
      opacity: 80,
      style: { strokeColor: 'red', strokeWidth: 2 },
    });
    expect(el.x).toBe(10);
    expect(el.y).toBe(20);
    expect(el.width).toBe(30);
    expect(el.height).toBe(40);
    expect(el.rotation).toBe(45);
    expect(el.opacity).toBe(80);
    expect(el.style.strokeColor).toBe('red');
    expect(el.style.fill).toBeDefined();
  });

  it('should keep shapeId and path', () => {
    const el = util.create({ shapeId: 'star', path: 'M0 0 L1 1 Z' });
    expect(el.shapeId).toBe('star');
    expect(el.path).toBe('M0 0 L1 1 Z');
  });

  it('should resize to the north direction', () => {
    const el = util.resize(util.create({ width: 100, height: 100, x: 50, y: 50 }), Direction.N, 0, -10);
    expect(el.y).toBe(40);
    expect(el.height).toBe(110);
  });

  it('should resize to the south direction', () => {
    const el = util.resize(util.create({ width: 100, height: 100, x: 50, y: 50 }), Direction.S, 0, 10);
    expect(el.height).toBe(110);
  });

  it('should resize to the west direction', () => {
    const el = util.resize(util.create({ width: 100, height: 100, x: 50, y: 50 }), Direction.W, -10, 0);
    expect(el.x).toBe(40);
    expect(el.width).toBe(110);
  });

  it('should resize to the east direction', () => {
    const el = util.resize(util.create({ width: 100, height: 100, x: 50, y: 50 }), Direction.E, 10, 0);
    expect(el.width).toBe(110);
  });

  it('should resize in compound directions', () => {
    const ne = util.resize(util.create({ width: 100, height: 100, x: 50, y: 50 }), Direction.NE, 10, -10);
    expect(ne.y).toBe(40);
    expect(ne.width).toBe(110);
    expect(ne.height).toBe(110);

    const sw = util.resize(util.create({ width: 100, height: 100, x: 50, y: 50 }), Direction.SW, -10, 10);
    expect(sw.x).toBe(40);
    expect(sw.width).toBe(110);
    expect(sw.height).toBe(110);
  });

  it('should compute bounds', () => {
    const bounds = util.getBounds(util.create({ x: 10, y: 20, width: 30, height: 40 }));
    expect(bounds).toEqual({ minX: 10, minY: 20, maxX: 40, maxY: 60, width: 30, height: 40 });
  });

  it('should hit test a segment crossing the shape edge', () => {
    const el = util.create({ x: 0, y: 0, width: 100, height: 100 });
    expect(util.hitTest(el, { x: -10, y: 50 }, { x: 10, y: 50 }, 1)).toBe(true);
  });

  it('should not hit test a segment far from the shape', () => {
    const el = util.create({ x: 0, y: 0, width: 100, height: 100 });
    expect(util.hitTest(el, { x: 300, y: 300 }, { x: 320, y: 320 }, 1)).toBe(false);
  });
});
