import { GestureFrame, GestureTracker } from './gesture-tracker';

function frameOf(frame: GestureFrame | null): GestureFrame {
  if (!frame) throw new Error('expected a gesture frame');
  return frame;
}

describe('GestureTracker', () => {
  let tracker: GestureTracker;

  beforeEach(() => {
    tracker = new GestureTracker();
  });

  it('single pointer is single', () => {
    expect(tracker.down(1, 10, 10)).toBe('single');
    expect(tracker.isGesturing).toBe(false);
    expect(tracker.move(1, 20, 20)).toBeNull();
    expect(tracker.up(1)).toBe('single');
  });

  it('second pointer starts gesture', () => {
    tracker.down(1, 0, 0);
    expect(tracker.down(2, 100, 0)).toBe('start-gesture');
    expect(tracker.isGesturing).toBe(true);
  });

  it('pinch apart scale > 1', () => {
    tracker.down(1, 100, 100);
    tracker.down(2, 200, 100);

    tracker.move(1, 50, 100);
    const frame = frameOf(tracker.move(2, 250, 100));

    expect(frame).not.toBeNull();
    // Product of per-move scales: 100 → 150 → 200
    const first = 150 / 100;
    expect(first * frame.scale).toBeCloseTo(2);
    expect(frame.centerX).toBeCloseTo(150);
    expect(frame.centerY).toBeCloseTo(100);
  });

  it('pinch apart reports scale 2 when distance doubles in one move', () => {
    tracker.down(1, 100, 100);
    tracker.down(2, 200, 100);

    const frame = frameOf(tracker.move(2, 300, 100));

    expect(frame.scale).toBeCloseTo(2);
  });

  it('two-finger drag gives dx/dy', () => {
    tracker.down(1, 0, 0);
    tracker.down(2, 100, 0);

    const a = frameOf(tracker.move(1, 10, 5));
    const b = frameOf(tracker.move(2, 110, 5));

    expect(a.dx + b.dx).toBeCloseTo(10);
    expect(a.dy + b.dy).toBeCloseTo(5);
    expect(a.scale * b.scale).toBeCloseTo(1);
    expect(b.centerX).toBeCloseTo(60);
    expect(b.centerY).toBeCloseTo(5);
  });

  it('remaining pointer ignored after gesture until all up', () => {
    tracker.down(1, 0, 0);
    tracker.down(2, 100, 0);

    expect(tracker.up(2)).toBe('end-gesture');
    expect(tracker.isGesturing).toBe(false);
    expect(tracker.move(1, 50, 50)).toBeNull();
    expect(tracker.up(1)).toBe('ignore');

    expect(tracker.down(3, 0, 0)).toBe('single');
  });

  it('resumes the gesture when a second finger lands again', () => {
    tracker.down(1, 0, 0);
    tracker.down(2, 100, 0);
    tracker.up(2);

    expect(tracker.down(3, 100, 0)).toBe('start-gesture');
    expect(tracker.isGesturing).toBe(true);
  });

  it('ignores extra fingers and does not jump when one of the pair lifts', () => {
    tracker.down(1, 0, 0);
    tracker.down(2, 100, 0);
    expect(tracker.down(3, 500, 500)).toBe('ignore');
    expect(tracker.move(3, 600, 600)).toBeNull();

    expect(tracker.up(2)).toBe('ignore');
    expect(tracker.isGesturing).toBe(true);

    const frame = frameOf(tracker.move(1, 0, 0));
    expect(frame.scale).toBeCloseTo(1);
    expect(frame.dx).toBeCloseTo(0);
    expect(frame.dy).toBeCloseTo(0);
  });

  it('ignores up/move for unknown pointers', () => {
    expect(tracker.up(42)).toBe('ignore');
    expect(tracker.move(42, 1, 1)).toBeNull();
  });
});
