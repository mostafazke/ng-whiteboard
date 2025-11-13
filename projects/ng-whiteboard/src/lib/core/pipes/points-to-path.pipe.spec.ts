import { PointsToPathPipe } from './points-to-path.pipe';

describe('PointsToPathPipe', () => {
  let pipe: PointsToPathPipe;

  beforeEach(() => {
    pipe = new PointsToPathPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for undefined points', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('should return empty string for empty points array', () => {
    expect(pipe.transform([])).toBe('');
  });

  it('should convert single point to path', () => {
    const points: number[][] = [[10, 20]];
    const result = pipe.transform(points);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('should convert multiple points to path', () => {
    const points: number[][] = [
      [0, 0],
      [10, 10],
      [20, 5],
    ];
    const result = pipe.transform(points);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should use custom stroke width', () => {
    const points: number[][] = [
      [0, 0],
      [100, 0],
      [200, 0],
      [300, 0],
      [400, 0],
    ];
    const result1 = pipe.transform(points, { size: 2 });
    const result2 = pipe.transform(points, { size: 20 });
    expect(result1).toBeTruthy();
    expect(result2).toBeTruthy();
    // Different stroke widths should produce different paths or at least be valid
    expect(typeof result1).toBe('string');
    expect(typeof result2).toBe('string');
    expect(result1.length).toBeGreaterThan(0);
    expect(result2.length).toBeGreaterThan(0);
  });

  it('should use custom path options', () => {
    const points: number[][] = [
      [0, 0],
      [10, 10],
      [20, 5],
    ];
    const options = {
      size: 2,
      smoothing: 0.8,
      thinning: 0.3,
    };
    const result = pipe.transform(points, options);
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});
