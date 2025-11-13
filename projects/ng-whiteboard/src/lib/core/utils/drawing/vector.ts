/**
 * Vector math utilities for stroke generation.
 */

/** Add vectors. */
export function add(A: number[], B: number[]) {
  return [A[0] + B[0], A[1] + B[1]];
}

/** Subtract vectors. */
export function sub(A: number[], B: number[]) {
  return [A[0] - B[0], A[1] - B[1]];
}

/** Vector multiplication by scalar. */
export function mul(A: number[], n: number) {
  return [A[0] * n, A[1] * n];
}

/** Vector division by scalar. */
export function div(A: number[], n: number) {
  return [A[0] / n, A[1] / n];
}

/** Length of the vector squared. */
function len2(A: number[]) {
  return A[0] * A[0] + A[1] * A[1];
}

/** Length from A to B squared. */
export function dist2(A: number[], B: number[]) {
  return len2(sub(A, B));
}

/** Distance from A to B. */
export function dist(A: number[], B: number[]) {
  return Math.hypot(A[1] - B[1], A[0] - B[0]);
}

/** Interpolate vector A to B with a scalar t. */
export function lrp(A: number[], B: number[], t: number) {
  return add(A, mul(sub(B, A), t));
}

export function toPoint(arr: number[]): number[] {
  const x = arr[0] !== undefined ? arr[0] : 0;
  const y = arr[1] !== undefined ? arr[1] : 0;
  const pressure = arr[2] !== undefined ? arr[2] : 1;
  return [x, y, pressure];
}

export function equals(a: number[], b: number[]): boolean {
  return Math.abs(a[0] - b[0]) < 0.0001 && Math.abs(a[1] - b[1]) < 0.0001;
}
