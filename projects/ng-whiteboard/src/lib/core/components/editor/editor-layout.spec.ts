import { layoutFor } from './editor-layout';

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
