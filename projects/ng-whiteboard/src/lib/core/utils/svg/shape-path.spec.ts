import { normalizeShapePath, scaleShapePath } from './shape-path';

const numbersIn = (path: string): number[] =>
  (path.match(/[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/g) ?? []).map(Number);

describe('normalizeShapePath', () => {
  it('normalizes the issue pentagon', () => {
    const result = normalizeShapePath(
      'm0.99791,0.9981l162.54547,0l135.45454,149.40899l-135.45454,149.40898l-162.54547,0z'
    );

    expect(result).not.toBeNull();
    expect(result?.path.startsWith('M0 0')).toBe(true);
    for (const n of numbersIn(result?.path ?? '')) {
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(1);
    }
    expect(result?.aspectRatio).toBeCloseTo(297.99 / 298.82, 3);
  });

  it('handles H V S T and relative commands', () => {
    expect(normalizeShapePath('M10 10 h20 v20 H10 Z')?.path).toBe('M0 0 L1 0 L1 1 L0 1 Z');
  });

  it('expands S and T by reflecting the previous control point', () => {
    const cubic = normalizeShapePath('M0 0 C0 10 10 10 10 0 S20 -10 20 0');
    expect(cubic?.path).toBe('M0 0.5 C0 1.1667 0.5 1.1667 0.5 0.5 C0.5 -0.1667 1 -0.1667 1 0.5');

    const quad = normalizeShapePath('M0 0 Q5 10 10 0 T20 0');
    expect(quad?.path).toBe('M0 0.5 Q0.25 1.5 0.5 0.5 Q0.75 -0.5 1 0.5');
  });

  it('tight bbox for curves', () => {
    const result = normalizeShapePath('M0 0 C0 -10 10 -10 10 0 Z');
    expect(result).not.toBeNull();
    expect(result?.aspectRatio).toBeCloseTo(10 / 7.5, 3);
  });

  it('converts arcs to cubics', () => {
    const result = normalizeShapePath('M0 50 A50 50 0 0 1 100 50 Z');
    expect(result).not.toBeNull();
    expect(result?.path).not.toContain('A');
    expect(result?.path).toContain('C');
    expect(result?.aspectRatio).toBeCloseTo(2, 3);
  });

  it('parses packed arc flags', () => {
    const result = normalizeShapePath('M0 50a50 50 0 01100 0z');
    expect(result).not.toBeNull();
    expect(result?.aspectRatio).toBeCloseTo(2, 3);
  });

  it('parses compact syntax', () => {
    const result = normalizeShapePath('m0 0l10-5.5.5 1e1z');
    expect(result).not.toBeNull();
    for (const n of numbersIn(result?.path ?? '')) {
      expect(Number.isFinite(n)).toBe(true);
    }
    expect(Number.isFinite(result?.aspectRatio)).toBe(true);
  });

  it('rejects degenerate and invalid', () => {
    expect(normalizeShapePath('M0 0 L10 0')).toBeNull();
    expect(normalizeShapePath('')).toBeNull();
    expect(normalizeShapePath('garbage')).toBeNull();
    expect(normalizeShapePath('M0 0 Z')).toBeNull();
    expect(normalizeShapePath('M0 0 L1e999 10')).toBeNull();
    expect(normalizeShapePath('L10 10 L20 20')).toBeNull();
  });
});

describe('scaleShapePath', () => {
  it('scaleShapePath', () => {
    expect(scaleShapePath('M0 0 L1 0 L1 1 Z', 200, 50)).toBe('M0 0 L200 0 L200 50 Z');
  });

  it('scales every point of curve commands', () => {
    expect(scaleShapePath('M0 0 Q0.5 1 1 0 C0 0 0.5 0.5 1 1 Z', 10, 20)).toBe('M0 0 Q5 20 10 0 C0 0 5 10 10 20 Z');
  });
});
