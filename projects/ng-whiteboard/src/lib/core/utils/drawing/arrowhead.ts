/** Arrowheads grow with the stroke width, 3x keeps them proportional without eating the line body. */
export function arrowheadSize(strokeWidth: number): number {
  return Math.max(12, strokeWidth * 3);
}
