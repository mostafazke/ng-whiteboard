import { isLightColor } from './color';

describe('isLightColor', () => {
  it.each(['#ffffff', '#FFF', '#fefc34', '  #f8fafc '])('treats %p as light', (color) => {
    expect(isLightColor(color)).toBe(true);
  });

  it.each(['#000000', '#2563eb', '#dc2626', '#facc15', 'red', 'rgb(255,255,255)', '', undefined])(
    'treats %p as not light',
    (color) => {
      expect(isLightColor(color)).toBe(false);
    }
  );
});
