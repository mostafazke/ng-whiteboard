export type EditorLayout = 'wide' | 'medium' | 'compact';

export const COMPACT_MAX_WIDTH = 640;
export const COMPACT_MAX_HEIGHT = 500;
export const WIDE_MIN_WIDTH = 1024;

export function layoutFor(width: number, height: number): EditorLayout {
  if (width < COMPACT_MAX_WIDTH || height < COMPACT_MAX_HEIGHT) return 'compact';
  return width >= WIDE_MIN_WIDTH ? 'wide' : 'medium';
}

/**
 * Whether undo/redo and zoom fit beside the centred bottom toolbar. `start`/`end` are how far each side bar reaches
 * in from its edge; `gap` is the spacing they must keep from the toolbar.
 */
export function bottomRowFits(width: number, toolbar: number, start: number, end: number, gap: number): boolean {
  const side = (width - toolbar) / 2;
  return start + gap <= side && end + gap <= side;
}
