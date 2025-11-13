import type { StrokeOptions } from './stroke-types';
import { dist, dist2, equals, lrp, toPoint } from './vector';

const MIN_START_PRESSURE = 0.025;
const MIN_END_PRESSURE = 0.01;

/**
 * Processes raw input points into optimized stroke points for rendering.
 * Applies streamlining, pressure simulation, and point filtering.
 */
export function getStrokePoints(rawInputPoints: number[][], options: StrokeOptions = {}): number[][] {
  const { streamline = 0.5, size = 16, simulatePressure = false } = options;

  if (rawInputPoints.length === 0) return [];

  const t = 0.15 + (1 - streamline) * 0.85;

  let pts = [...rawInputPoints];
  let pointsRemovedFromNearEnd = 0;

  if (!simulatePressure) {
    let pt = pts[0];
    while (pt) {
      if (pt[2] >= MIN_START_PRESSURE) break;
      pts.shift();
      pt = pts[0];
    }
  }

  if (!simulatePressure) {
    let pt = pts[pts.length - 1];
    while (pt) {
      if (pt[2] >= MIN_END_PRESSURE) break;
      pts.pop();
      pt = pts[pts.length - 1];
    }
  }

  if (pts.length === 0) {
    const firstPoint = rawInputPoints[0];
    if (
      firstPoint &&
      typeof firstPoint[0] === 'number' &&
      typeof firstPoint[1] === 'number' &&
      !isNaN(firstPoint[0]) &&
      !isNaN(firstPoint[1])
    ) {
      return [toPoint(firstPoint)];
    }
    return [];
  }

  let pt = pts[1];
  while (pt) {
    if (dist2(pt, pts[0]) > (size / 3) ** 2) break;
    pts[0][2] = Math.max(pts[0][2], pt[2]);
    pts.splice(1, 1);
    pt = pts[1];
  }

  const lastPoint = pts.pop();
  if (!lastPoint) {
    return [];
  }
  const last = lastPoint;
  pt = pts[pts.length - 1];
  while (pt) {
    if (dist2(pt, last) > (size / 3) ** 2) break;
    pts.pop();
    pt = pts[pts.length - 1];
    pointsRemovedFromNearEnd++;
  }
  pts.push(last);

  const isComplete =
    options.last ||
    !options.simulatePressure ||
    (pts.length > 1 && dist2(pts[pts.length - 1], pts[pts.length - 2]) < size ** 2) ||
    pointsRemovedFromNearEnd > 0;

  if (pts.length === 2 && options.simulatePressure) {
    const last = pts[1];
    pts = pts.slice(0, -1);
    for (let i = 1; i < 5; i++) {
      const next = lrp(pts[0], last, i / 4);
      next[2] = ((pts[0][2] + (last[2] - pts[0][2])) * i) / 4;
      pts.push(next);
    }
  }

  const strokePoints: number[][] = [pts[0]];

  let totalLength = 0;

  let prevPoint = strokePoints[0];

  let point: number[], distance: number;

  if (isComplete && streamline > 0) {
    pts.push(pts[pts.length - 1]);
  }

  for (let i = 1, n = pts.length; i < n; i++) {
    point = !t || (options.last && i === n - 1) ? pts[i] : lrp(pts[i], prevPoint, 1 - t);

    if (equals(prevPoint, point)) continue;

    distance = dist(point, prevPoint);

    totalLength += distance;

    if (i < 4 && totalLength < size) {
      continue;
    }

    prevPoint = point;

    strokePoints.push(point);
  }

  return strokePoints;
}
