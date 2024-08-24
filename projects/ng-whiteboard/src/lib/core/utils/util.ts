import { Bounds } from '../types/types';
import Vec from './vec';

export class Util {
  static uniqueId(a = ''): string {
    return a
      ? ((Number(a) ^ (Math.random() * 16)) >> (Number(a) / 4)).toString(16)
      : `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, Util.uniqueId);
  }

  static getPoint(e: PointerEvent | Touch | WheelEvent, bounds: any): [number, number] {
    return [+e.clientX.toFixed(2) - bounds.minX, +e.clientY.toFixed(2) - bounds.minY];
  }

  static getPressure(e: PointerEvent | Touch | WheelEvent) {
    return 'pressure' in e ? +e.pressure.toFixed(2) || 0.5 : 0.5;
  }
  static getBoundsCenter(bounds: Bounds): number[] {
    return [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2];
  }

  static getBoundsFromPoints(points: number[][], rotation = 0): Bounds {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    if (points.length < 2) {
      minX = 0;
      minY = 0;
      maxX = 1;
      maxY = 1;
    } else {
      for (const [x, y] of points) {
        minX = Math.min(x, minX);
        minY = Math.min(y, minY);
        maxX = Math.max(x, maxX);
        maxY = Math.max(y, maxY);
      }
    }

    if (rotation !== 0) {
      return Util.getBoundsFromPoints(
        points.map((pt) => Vec.rotWith(pt, [(minX + maxX) / 2, (minY + maxY) / 2], rotation))
      );
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY),
    };
  }
  static translateBounds(bounds: Bounds, delta: number[]): Bounds {
    return {
      minX: bounds.minX + delta[0],
      minY: bounds.minY + delta[1],
      maxX: bounds.maxX + delta[0],
      maxY: bounds.maxY + delta[1],
      width: bounds.width,
      height: bounds.height,
    };
  }
  // static isDoubleClick() {
  //   if (!this.pointer) return false

  //   const { origin, point } = this.pointer

  //   return Date.now() - this.pointerUpTime < DOUBLE_CLICK_DURATION && Vec.dist(origin, point) < 4
  // }

  static debounce<T extends (...args: any[]) => void>(fn: T, ms = 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let timeoutId: number | any;
    return function (...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(args), ms);
    };
  }
}
