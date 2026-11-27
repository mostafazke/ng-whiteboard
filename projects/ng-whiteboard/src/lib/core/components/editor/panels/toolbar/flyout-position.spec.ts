import { clampCenter } from './flyout-position';

describe('clampCenter', () => {
  it('keeps a centre that already fits', () => {
    expect(clampCenter(200, 190, 440)).toBe(200);
  });

  it('pulls a menu that would overflow the far edge back inside', () => {
    expect(clampCenter(425, 190, 440)).toBe(345);
  });

  it('pulls a menu that would overflow the near edge back inside', () => {
    expect(clampCenter(30, 190, 440)).toBe(95);
  });

  it('centres a menu wider than the container', () => {
    expect(clampCenter(425, 500, 440)).toBe(220);
  });
});
