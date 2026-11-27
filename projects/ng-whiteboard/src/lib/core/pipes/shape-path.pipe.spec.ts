import { ShapePathPipe } from './shape-path.pipe';

describe('ShapePathPipe', () => {
  const pipe = new ShapePathPipe();

  it('scales a normalized path to the given size', () => {
    expect(pipe.transform('M0 0 L1 1 Z', 10, 20)).toBe('M0 0 L10 20 Z');
  });

  it('returns an empty string for an empty path', () => {
    expect(pipe.transform('', 10, 20)).toBe('');
  });

  it('returns an empty string for an undefined path', () => {
    expect(pipe.transform(undefined, 10, 20)).toBe('');
  });
});
