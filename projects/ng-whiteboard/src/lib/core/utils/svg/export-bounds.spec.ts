import { ElementType } from '../../types';
import { createElement } from '../../elements/element.utils';
import { exportBounds } from './export-bounds';

const rect = (x: number, y: number, width: number, height: number, extra: object = {}) =>
  createElement(ElementType.Rectangle, {
    x,
    y,
    width,
    height,
    style: { strokeWidth: 2 },
    ...extra,
  } as never);

describe('exportBounds', () => {
  it('returns null for no elements', () => {
    expect(exportBounds([], 16)).toBeNull();
  });

  it('expands by half the stroke width and then by padding', () => {
    expect(exportBounds([rect(10, 10, 100, 50)], 16)).toEqual({ x: -7, y: -7, width: 134, height: 84 });
  });

  it('includes rotated corners', () => {
    const result = exportBounds([rect(0, 0, 100, 100, { rotation: 45 })], 0)!;
    const half = (100 * Math.SQRT2) / 2;
    expect(result.x).toBeCloseTo(50 - half - 1);
    expect(result.width).toBeCloseTo(2 * half + 2);
  });

  it('unions several elements', () => {
    const result = exportBounds([rect(0, 0, 10, 10), rect(100, 100, 10, 10)], 0)!;
    expect(result).toEqual({ x: -1, y: -1, width: 112, height: 112 });
  });
});
