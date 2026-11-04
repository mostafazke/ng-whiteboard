import type { StrokeOptions } from './stroke-types';
import { dist } from './vector';

const RATE_OF_PRESSURE_CHANGE = 0.275;
const CAP_SEGMENTS = 8;
const MAX_TAPER_SIZE_RATIO = 8;

/**
 * Builds a closed polygon around stroke points whose width varies with
 * (simulated) pressure and tapers at the ends.
 */
export function getStrokeOutlinePoints(points: number[][], options: StrokeOptions = {}): number[][] {
  const {
    size = 8,
    thinning = 0.5,
    simulatePressure = true,
    easing = (t: number) => t,
    start = {},
    end = {},
  } = options;

  if (points.length === 0) return [];
  if (points.length === 1) return circle(points[0], size / 2);

  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + dist(points[i], points[i - 1]));
  }
  const total = lengths[lengths.length - 1];
  if (total === 0) return circle(points[0], size / 2);

  const taperStart = resolveTaper(start.taper, total, size);
  const taperEnd = resolveTaper(end.taper, total, size);
  const easeStart = start.easing ?? ((t: number) => t * (2 - t));
  const easeEnd = end.easing ?? ((t: number) => --t * t * t + 1);

  let prevPressure = 0.5;
  const radii = points.map((point, i) => {
    let pressure: number;
    if (simulatePressure) {
      // Fast movement thins the line, slow movement thickens it.
      const speed = Math.min(1, (i === 0 ? 0 : lengths[i] - lengths[i - 1]) / size);
      pressure = Math.min(1, prevPressure + (1 - speed - prevPressure) * (speed * RATE_OF_PRESSURE_CHANGE));
    } else {
      pressure = point[2] ?? 0.5;
    }
    prevPressure = pressure;

    const radius = thinning ? size * easing(0.5 - thinning * (0.5 - pressure)) : size / 2;
    const ts = taperStart ? easeStart(Math.min(1, lengths[i] / taperStart)) : 1;
    const te = taperEnd ? easeEnd(Math.min(1, (total - lengths[i]) / taperEnd)) : 1;
    return Math.max(0.01, radius * Math.min(ts, te));
  });

  const left: number[][] = [];
  const right: number[][] = [];
  const normals: number[][] = [];

  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const [x, y] = points[i];
    const r = radii[i];
    normals.push([nx, ny]);
    left.push([x + nx * r, y + ny * r]);
    right.push([x - nx * r, y - ny * r]);
  }

  const last = points.length - 1;
  const endCap = end.cap === false ? [] : arc(points[last], radii[last], normals[last], -1);
  const startCap = start.cap === false ? [] : arc(points[0], radii[0], normals[0], 1);

  return [...left, ...endCap, ...right.reverse(), ...startCap];
}

function resolveTaper(taper: number | boolean | undefined, total: number, size: number): number {
  if (taper === true) return Math.max(size, total);
  if (typeof taper !== 'number' || taper <= 0) return 0;
  // Values up to 1 are a fraction of the stroke length, larger values are pixels.
  return taper <= 1 ? Math.min(total * taper, size * MAX_TAPER_SIZE_RATIO) : taper;
}

/** Semicircle between the two sides of a stroke end; direction -1 sweeps forward, 1 backward. */
function arc(center: number[], r: number, normal: number[], direction: 1 | -1): number[][] {
  const base = Math.atan2(normal[1], normal[0]) + (direction === 1 ? Math.PI : 0);
  const pts: number[][] = [];
  for (let k = 1; k < CAP_SEGMENTS; k++) {
    const a = base - (k * Math.PI) / CAP_SEGMENTS;
    pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r]);
  }
  return pts;
}

function circle(center: number[], r: number): number[][] {
  const pts: number[][] = [];
  for (let k = 0; k < CAP_SEGMENTS * 2; k++) {
    const a = (k * Math.PI) / CAP_SEGMENTS;
    pts.push([center[0] + Math.cos(a) * r, center[1] + Math.sin(a) * r]);
  }
  return pts;
}
