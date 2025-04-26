import { GripCursorPipe } from './grip-cursor.pipe';

describe('GripCursorPipe', () => {
  let pipe: GripCursorPipe;

  beforeEach(() => {
    pipe = new GripCursorPipe();
  });

  it('should return CURSOR_GRAB for rotate grip', () => {
    expect(pipe.transform('rotate', 0)).toBe('grab');
  });

  it('should return CURSOR_NW_RESIZE for nw grip in horizontal orientation', () => {
    expect(pipe.transform('nw', 0)).toBe('nw-resize');
  });

  it('should return CURSOR_NE_RESIZE for nw grip in vertical orientation', () => {
    expect(pipe.transform('nw', 90)).toBe('ne-resize');
  });

  it('should return CURSOR_NS_RESIZE for n grip in horizontal orientation', () => {
    expect(pipe.transform('n', 0)).toBe('ns-resize');
  });

  it('should return CURSOR_EW_RESIZE for n grip in vertical orientation', () => {
    expect(pipe.transform('n', 90)).toBe('ew-resize');
  });

  it('should return CURSOR_DEFAULT for unknown grip', () => {
    expect(pipe.transform('unknown', 0)).toBe('default');
  });

  it('should return CURSOR_NE_RESIZE for SW grip in horizontal orientation', () => {
    expect(pipe.transform('sw', 0)).toBe('ne-resize');
  });

  it('should return CURSOR_NE_RESIZE for se grip in vertical orientation', () => {
    expect(pipe.transform('se', 90)).toBe('ne-resize');
  });
});
