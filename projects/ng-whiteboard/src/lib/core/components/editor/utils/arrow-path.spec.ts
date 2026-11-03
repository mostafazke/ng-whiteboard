import { toArrowPath } from './arrow-path';

describe('toArrowPath', () => {
  it('returns a straight path', () => {
    expect(toArrowPath('straight', { x1: 0, y1: 0, x2: 100, y2: 0 })).toEqual({ type: 'straight' });
  });

  it('returns an elbow path with a centered mid ratio', () => {
    expect(toArrowPath('elbow', { x1: 0, y1: 0, x2: 100, y2: 50 })).toEqual({ type: 'elbow', midRatio: 0.5 });
  });

  it('offsets the curve control point perpendicular by 20% of the length', () => {
    expect(toArrowPath('curve', { x1: 0, y1: 0, x2: 100, y2: 0 })).toEqual({ type: 'quadratic', cx: 50, cy: 20 });
  });

  it('offsets a vertical curve sideways', () => {
    const path = toArrowPath('curve', { x1: 0, y1: 0, x2: 0, y2: 100 });
    expect(path).toEqual({ type: 'quadratic', cx: -20, cy: 50 });
  });

  it('puts the control point on the endpoint for a zero-length arrow', () => {
    const path = toArrowPath('curve', { x1: 30, y1: 40, x2: 30, y2: 40 });
    expect(path).toEqual({ type: 'quadratic', cx: 30, cy: 40 });
  });
});
