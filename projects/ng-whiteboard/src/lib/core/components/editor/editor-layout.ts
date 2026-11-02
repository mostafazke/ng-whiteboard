export type EditorLayout = 'wide' | 'medium' | 'compact';

export const COMPACT_MAX_WIDTH = 640;
export const COMPACT_MAX_HEIGHT = 500;
export const WIDE_MIN_WIDTH = 1024;

export function layoutFor(width: number, height: number): EditorLayout {
  if (width < COMPACT_MAX_WIDTH || height < COMPACT_MAX_HEIGHT) return 'compact';
  return width >= WIDE_MIN_WIDTH ? 'wide' : 'medium';
}
