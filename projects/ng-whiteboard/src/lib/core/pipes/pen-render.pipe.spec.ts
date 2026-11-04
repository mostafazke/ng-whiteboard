import { PenRenderPipe } from './pen-render.pipe';
import { LineCap, PenType } from '../types';
import { PENCIL_FILTER_ID, PEN_TYPE_STYLES } from '../types/pen-presets';
import { getStrokeOutlinePoints } from '../utils/drawing/stroke-outline';

const stroke: number[][] = Array.from({ length: 30 }, (_, i) => [i * 6, Math.sin(i / 4) * 20]);

function widthAt(outline: number[][], x: number): number {
  const ys = outline.filter((p) => Math.abs(p[0] - x) < 3).map((p) => p[1]);
  return Math.max(...ys) - Math.min(...ys);
}

describe('PenRenderPipe', () => {
  const pipe = new PenRenderPipe();

  it('returns an empty path without points', () => {
    expect(pipe.transform([], PenType.Pen, 2).d).toBe('');
  });

  it('keeps legacy centerline rendering for strokes without a pen type', () => {
    const result = pipe.transform(stroke, undefined, 3);
    expect(result).toMatchObject({ filled: false, strokeWidth: 3 });
    expect(result.d).toMatch(/^M/);
  });

  it.each([PenType.Marker, PenType.Highlighter, PenType.Pencil])(
    '%s draws the full stroke, not a single dot, from pressure-less points',
    (type) => {
      const result = pipe.transform(stroke, type, 2);
      expect(result.filled).toBe(false);
      expect(result.d).not.toContain(' a ');
      expect(result.d.match(/-?[\d.]+,-?[\d.]+/g)?.length).toBeGreaterThan(10);
    }
  );

  it.each([PenType.Pen, PenType.Brush])('%s renders a filled variable-width outline', (type) => {
    const result = pipe.transform(stroke, type, 2);
    expect(result.filled).toBe(true);
    expect(result.d).toMatch(/Z$/);
  });

  it('gives every pen type a distinct look', () => {
    const looks = Object.values(PenType).map((type) => {
      const r = pipe.transform(stroke, type, 2);
      return JSON.stringify([r.filled, r.strokeWidth, r.lineCap, r.blendMode, r.filter, r.filled && r.d.length]);
    });
    expect(new Set(looks).size).toBe(looks.length);
  });

  it('scales stroke width from the configured width', () => {
    expect(pipe.transform(stroke, PenType.Marker, 4).strokeWidth).toBe(4 * PEN_TYPE_STYLES[PenType.Marker].sizeFactor);
    expect(pipe.transform(stroke, PenType.Highlighter, 1).strokeWidth).toBe(
      PEN_TYPE_STYLES[PenType.Highlighter].minSize
    );
  });

  it('renders the highlighter flat-capped and blended', () => {
    expect(pipe.transform(stroke, PenType.Highlighter, 2)).toMatchObject({
      lineCap: LineCap.Butt,
      blendMode: 'multiply',
    });
  });

  it('applies the pencil texture filter', () => {
    expect(pipe.transform(stroke, PenType.Pencil, 2).filter).toBe(`url(#${PENCIL_FILTER_ID})`);
  });

  it('scales a line style to the drawn thickness for stroked types', () => {
    const factor = PEN_TYPE_STYLES[PenType.Marker].sizeFactor;
    expect(pipe.transform(stroke, PenType.Marker, 2, '6,6').dasharray).toBe(`${6 * factor},${6 * factor}`);
  });

  it('dashes filled types through a centerline mask', () => {
    const result = pipe.transform(stroke, PenType.Brush, 2, '6,6');
    expect(result.dasharray).toBeTruthy();
    expect(result.dashMask?.d).toMatch(/^M/);
    expect(result.dashMask?.width).toBe(2 * 2 * PEN_TYPE_STYLES[PenType.Brush].sizeFactor);
  });

  it.each(['', undefined, '0,0', 'none'])('treats %p as solid', (dasharray) => {
    expect(pipe.transform(stroke, PenType.Pen, 2, dasharray)).toMatchObject({
      dasharray: undefined,
      dashMask: undefined,
    });
  });

  it('passes legacy strokes their dash pattern unchanged', () => {
    expect(pipe.transform(stroke, undefined, 2, '4,4').dasharray).toBe('4,4');
  });

  it('renders a single-point marker tap as a dot at stroke width', () => {
    expect(pipe.transform([[5, 5]], PenType.Marker, 2).d).toBe('M5,5 L5,5');
  });
});

describe('getStrokeOutlinePoints', () => {
  it('returns a circle for a single point', () => {
    const outline = getStrokeOutlinePoints([[10, 10, 0.5]], { size: 8 });
    expect(outline.length).toBeGreaterThan(8);
    outline.forEach(([x, y]) => expect(Math.hypot(x - 10, y - 10)).toBeCloseTo(4));
  });

  it('tapers the ends thinner than the middle', () => {
    const line = Array.from({ length: 40 }, (_, i) => [i * 5, 0, 0.5]);
    const outline = getStrokeOutlinePoints(line, {
      size: 10,
      thinning: 0,
      start: { cap: false, taper: 0.3 },
      end: { cap: false, taper: 0.3 },
    });
    expect(widthAt(outline, 100)).toBeCloseTo(10);
    expect(widthAt(outline, 5)).toBeLessThan(5);
    expect(widthAt(outline, 190)).toBeLessThan(5);
  });

  it('thins the line where simulated pressure drops with speed', () => {
    const slowThenFast = [
      ...Array.from({ length: 20 }, (_, i) => [i, 0]),
      ...Array.from({ length: 20 }, (_, i) => [20 + i * 15, 0]),
    ];
    const outline = getStrokeOutlinePoints(slowThenFast, { size: 10, thinning: 0.9, simulatePressure: true });
    expect(widthAt(outline, 250)).toBeLessThan(widthAt(outline, 15));
  });
});
