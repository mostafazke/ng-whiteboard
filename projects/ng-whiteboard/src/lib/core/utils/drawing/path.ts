/** Generates SVG path data from a set of stroke points. */
export function getSvgPathFromStroke(points: number[][], closed = false): string {
  const len = points.length;

  if (len === 0) {
    return '';
  }

  if (len === 1) {
    const point = points[0];
    if (!point || point.length < 2 || isNaN(point[0]) || isNaN(point[1])) {
      return '';
    }
    const r = 2;
    return `M ${point[0]} ${point[1]} m -${r}, 0 a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
  }

  let a = points[0];
  let b = points[1];

  if (len === 2) {
    // If only two points, just draw a line
    return `M${precise(a)}L${precise(b)}`;
  }

  let result = '';

  for (let i = 2, max = len - 1; i < max; i++) {
    a = points[i];
    b = points[i + 1];
    result += average(a, b);
  }

  if (closed) {
    // If closed, draw a curve from the last point to the first
    return `M${average(points[0], points[1])}Q${precise(points[1])}${average(points[1], points[2])}T${result}${average(
      points[len - 1],
      points[0]
    )}${average(points[0], points[1])}Z`;
  } else {
    // If not closed, draw a curve starting at the first point and
    // ending at the midpoint of the last and second-last point, then
    // complete the curve with a line segment to the last point.
    return `M${precise(points[0])}Q${precise(points[1])}${average(points[1], points[2])}${
      points.length > 3 ? 'T' : ''
    }${result}L${precise(points[len - 1])}`;
  }
}

function precise(A: number[]) {
  return `${toDomPrecision(A[0])},${toDomPrecision(A[1])} `;
}

function average(A: number[], B: number[]) {
  return `${toDomPrecision((A[0] + B[0]) / 2)},${toDomPrecision((A[1] + B[1]) / 2)} `;
}

function toDomPrecision(v: number) {
  return Math.round(v * 1e4) / 1e4;
}
