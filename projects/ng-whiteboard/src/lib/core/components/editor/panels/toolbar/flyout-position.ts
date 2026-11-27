/** Moves the centre of a menu of `size` so the menu stays within a container of `extent`. */
export function clampCenter(center: number, size: number, extent: number): number {
  if (size >= extent) return extent / 2;
  return Math.min(Math.max(center, size / 2), extent - size / 2);
}
