export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dashdot';

/** Dash pattern for each style in multiples of the stroke width. */
const PATTERNS: Record<Exclude<LineStyle, 'solid'>, readonly number[]> = {
  dashed: [3, 3],
  dotted: [1, 2],
  dashdot: [5, 2, 1, 2],
};

export function buildDasharray(lineStyle: string, width: number): string {
  const pattern = PATTERNS[lineStyle as keyof typeof PATTERNS];
  return pattern ? pattern.map((unit) => unit * width).join(',') : '';
}

/**
 * Recognizes the style a dash pattern was built from, whatever width it was built at,
 * so the style survives stroke width changes. Returns undefined for custom patterns.
 */
export function lineStyleOf(dasharray: string | undefined): LineStyle | undefined {
  const values = (dasharray ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (values.length === 0 || values.every((v) => v === 0)) return 'solid';
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return undefined;

  const unit = values[0];
  return (Object.keys(PATTERNS) as (keyof typeof PATTERNS)[]).find((style) => {
    const pattern = PATTERNS[style];
    const scale = unit / pattern[0];
    return (
      pattern.length === values.length && pattern.every((p, i) => Math.abs(p * scale - values[i]) < 0.01 * scale + 1e-6)
    );
  });
}

/** Rebuilds a recognized dash pattern for a new width; custom patterns are kept as they are. */
export function rescaleDasharray(dasharray: string | undefined, width: number): string | undefined {
  const style = lineStyleOf(dasharray);
  if (!style || style === 'solid') return dasharray;
  return buildDasharray(style, width);
}
