import { Pipe, PipeTransform } from '@angular/core';
import { LineCap, LineJoin, PenType } from '../types';
import { getPenTypeStyle } from '../types/pen-presets';
import { StrokeOptions } from '../utils/drawing';
import { getStrokeOutlinePoints } from '../utils/drawing/stroke-outline';
import { getStrokePoints } from '../utils/drawing/stroke-points';
import { getSvgPathFromStroke } from '../utils/drawing/path';

export interface PenRender {
  d: string;
  filled: boolean;
  strokeWidth?: number;
  lineCap?: LineCap;
  lineJoin?: LineJoin;
  blendMode?: string;
  filter?: string;
  /** The pen type's own opacity; canvas strokes carry it in their element style instead. */
  opacity?: number;
  /** Dash pattern scaled to the rendered thickness. */
  dasharray?: string;
  /** Centerline of a filled stroke, used to mask it into dashes. */
  dashMask?: { d: string; width: number };
}

@Pipe({
  name: 'penRender',
  standalone: true,
})
export class PenRenderPipe implements PipeTransform {
  /**
   * Resolves the SVG path and presentation for a pen stroke based on its pen type.
   * Strokes without a pen type keep the legacy centerline rendering.
   */
  transform(
    points: number[][] | undefined,
    penType: PenType | undefined,
    strokeWidth: number | undefined,
    dasharray?: string,
    legacyOptions?: StrokeOptions
  ): PenRender {
    if (!points || points.length === 0) return { d: '', filled: false };

    if (!penType) {
      return {
        d: getSvgPathFromStroke(getStrokePoints(points, legacyOptions)),
        filled: false,
        strokeWidth,
        dasharray: dasharray || undefined,
      };
    }

    const style = getPenTypeStyle(penType);
    const size = Math.max(style.minSize, (strokeWidth ?? 2) * style.sizeFactor);
    const options: StrokeOptions = { ...style.strokeOptions, size };
    const strokePoints = getStrokePoints(points, options);
    const filter = style.filter ? `url(#${style.filter})` : undefined;
    // Line styles are built from the configured width; stretch them to the width actually drawn.
    const dashes = scaleDasharray(dasharray, size / (strokeWidth || 2));

    if (style.render === 'outline') {
      return {
        d: closedSmoothPath(getStrokeOutlinePoints(strokePoints, options)),
        filled: true,
        blendMode: style.blendMode,
        filter,
        opacity: style.opacity,
        dasharray: dashes,
        dashMask: dashes ? { d: strokeCenterline(strokePoints), width: size * 2 } : undefined,
      };
    }

    return {
      d: strokeCenterline(strokePoints),
      filled: false,
      strokeWidth: size,
      lineCap: style.lineCap,
      lineJoin: style.lineJoin,
      blendMode: style.blendMode,
      filter,
      opacity: style.opacity,
      dasharray: dashes,
    };
  }
}

function scaleDasharray(dasharray: string | undefined, factor: number): string | undefined {
  const values = (dasharray ?? '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .map(Number);
  if (values.length === 0 || values.some((v) => !Number.isFinite(v)) || values.every((v) => v === 0)) return undefined;
  return values.map((v) => round(v * factor)).join(',');
}

/**
 * Quadratic curves through outline midpoints with each vertex as control point.
 * Explicit Q controls avoid the edge ripple that reflected (T) controls cause on dense outlines.
 */
function closedSmoothPath(points: number[][]): string {
  const n = points.length;
  if (n < 3) return '';
  const mid = (a: number[], b: number[]) => `${round((a[0] + b[0]) / 2)},${round((a[1] + b[1]) / 2)}`;
  let d = `M${mid(points[n - 1], points[0])}`;
  for (let i = 0; i < n; i++) {
    const p = points[i];
    d += `Q${round(p[0])},${round(p[1])} ${mid(p, points[(i + 1) % n])}`;
  }
  return d + 'Z';
}

function round(v: number): number {
  return Math.round(v * 100) / 100;
}

/** A single point is drawn as a zero-length segment so the line cap renders it at stroke width. */
function strokeCenterline(points: number[][]): string {
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M${x},${y} L${x},${y}`;
  }
  return getSvgPathFromStroke(points);
}
