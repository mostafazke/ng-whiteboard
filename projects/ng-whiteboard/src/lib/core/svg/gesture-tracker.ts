export interface GestureFrame {
  scale: number;
  dx: number;
  dy: number;
  centerX: number;
  centerY: number;
}

interface PairMetrics {
  distance: number;
  centerX: number;
  centerY: number;
}

/**
 * Tracks active touch pointers and turns two-finger movement into pinch/pan frames.
 * After a gesture ends, the remaining pointers are ignored until every pointer is up,
 * so a lifted finger never turns into a stray stroke.
 */
export class GestureTracker {
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private gesturing = false;
  private ignoring = false;
  private previous: PairMetrics | null = null;

  get isGesturing(): boolean {
    return this.gesturing;
  }

  down(id: number, x: number, y: number): 'start-gesture' | 'single' | 'ignore' {
    this.pointers.set(id, { x, y });

    if (this.gesturing) return 'ignore';

    if (this.pointers.size >= 2) {
      this.gesturing = true;
      this.ignoring = false;
      this.previous = this.measure();
      return 'start-gesture';
    }

    return this.ignoring ? 'ignore' : 'single';
  }

  move(id: number, x: number, y: number): GestureFrame | null {
    if (!this.pointers.has(id)) return null;
    this.pointers.set(id, { x, y });

    if (!this.gesturing || !this.isPairMember(id) || !this.previous) return null;

    const current = this.measure();
    const frame: GestureFrame = {
      scale: this.previous.distance > 0 ? current.distance / this.previous.distance : 1,
      dx: current.centerX - this.previous.centerX,
      dy: current.centerY - this.previous.centerY,
      centerX: current.centerX,
      centerY: current.centerY,
    };
    this.previous = current;
    return frame;
  }

  up(id: number): 'end-gesture' | 'single' | 'ignore' {
    if (!this.pointers.delete(id)) return 'ignore';

    if (this.gesturing) {
      if (this.pointers.size < 2) {
        this.gesturing = false;
        this.previous = null;
        this.ignoring = this.pointers.size > 0;
        return 'end-gesture';
      }
      // A third finger kept the gesture alive; re-measure so the new pair doesn't jump.
      this.previous = this.measure();
      return 'ignore';
    }

    if (this.ignoring) {
      this.ignoring = this.pointers.size > 0;
      return 'ignore';
    }

    return 'single';
  }

  private isPairMember(id: number): boolean {
    const [a, b] = this.pointers.keys();
    return id === a || id === b;
  }

  private measure(): PairMetrics {
    const [a, b] = this.pointers.values();
    return {
      distance: Math.hypot(b.x - a.x, b.y - a.y),
      centerX: (a.x + b.x) / 2,
      centerY: (a.y + b.y) / 2,
    };
  }
}
