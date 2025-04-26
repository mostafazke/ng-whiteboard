import getStroke, { StrokeOptions } from 'perfect-freehand';

// Default stroke options for drawing paths
export const defaultStrokeOptions: StrokeOptions = {
  size: 1,
  smoothing: 1,
  thinning: 0,
  streamline: 1,
};

/**
 * Calculates the SVG path data for a given set of points using stroke options.
 */
export function calculatePath(points: number[][], size = 1): string {
  const outlinePoints = getStroke(points, { ...defaultStrokeOptions, size });
  return getSvgPathFromStroke(outlinePoints);
}

/**
 * Generates SVG path data from a set of stroke points.
 */
export function getSvgPathFromStroke(points: number[][], closed = true): string {
  const len = points.length;

  if (len < 4) {
    return '';
  }

  let a = points[0];
  let b = points[1];
  const c = points[2];

  let result = `M${a[0].toFixed(2)},${a[1].toFixed(2)} Q${b[0].toFixed(2)},${b[1].toFixed(2)} ${(
    (b[0] + c[0]) /
    2
  ).toFixed(2)},${((b[1] + c[1]) / 2).toFixed(2)} T`;

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += `${((a[0] + b[0]) / 2).toFixed(2)},${((a[1] + b[1]) / 2).toFixed(2)} `;
  }

  if (closed) {
    result += 'Z';
  }

  return result;
}
