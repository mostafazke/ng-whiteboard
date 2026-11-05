import { bottomRowFits, layoutFor } from './editor-layout';

describe('layoutFor', () => {
  it.each([
    [390, 844, 'compact'],
    [844, 390, 'compact'],
    [820, 1180, 'medium'],
    [1440, 900, 'wide'],
    [1024, 500, 'wide'],
    [639, 900, 'compact'],
  ])('(%i, %i) -> %s', (width, height, expected) => {
    expect(layoutFor(width, height)).toBe(expected);
  });
});

describe('bottomRowFits', () => {
  it.each([
    [850, 410, 102, 138, 16, true],
    [700, 410, 102, 138, 16, false],
    [639, 607, 102, 138, 8, false],
    [1440, 410, 102, 138, 16, true],
  ])('(%i, toolbar %i, %i, %i, gap %i) -> %s', (width, toolbar, start, end, gap, expected) => {
    expect(bottomRowFits(width, toolbar, start, end, gap)).toBe(expected);
  });
});
