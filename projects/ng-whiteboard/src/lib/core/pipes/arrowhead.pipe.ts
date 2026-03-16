import { Pipe, PipeTransform } from '@angular/core';
import { ArrowElement, ArrowheadConfig, ArrowheadType } from '../elements';
// ArrowPathType is accessed via element.pathType

export interface ArrowheadRenderItem {
  /** SVG path `d` attribute */
  d: string;
  /** Whether the shape should be filled (true) or stroked outline only (false) */
  filled: boolean;
  /** SVG transform for positioning, rotation, and scaling */
  transform: string;
  /** For stroked heads: stroke-width divided by the scale factor so the visual weight matches the line body */
  strokeWidth?: number;
}

export interface ArrowRenderData {
  /** Adjusted line start (pulled back if startHead present) */
  lineX1: number;
  lineY1: number;
  /** Adjusted line end (pulled back if endHead present) */
  lineX2: number;
  lineY2: number;
  /** SVG path items for each head */
  heads: ArrowheadRenderItem[];
  /** SVG `d` attribute for the arrow body (line or curve) */
  pathD: string;
  /** Whether this is a curved arrow (use <path> instead of <line>) */
  isCurved: boolean;
}

/* ------------------------------------------------------------------ */
/*  Predefined arrowhead paths                                        */
/*  All paths are authored pointing RIGHT (+X), tip at (0, 0).       */
/*  baseSize = 10: all coordinates are in a 10-unit space.           */
/*  At render time: translate(px py) rotate(angleDeg) scale(size/10) */
/* ------------------------------------------------------------------ */

interface ArrowheadPathDef {
  /** SVG path `d` in native coordinates */
  d: string;
  /** Reference size — all paths authored at this scale */
  baseSize: number;
  /** Whether this head type should be filled (true) or stroked (false) */
  filled: boolean;
  /** How far back to inset the line end, in baseSize units */
  baseInset: number;
}

/**
 * Filled triangle. Tip at (0,0), base at x=-10, half-width=5.
 * Rendered filled, no stroke needed.
 */
const ARROW_PATH: ArrowheadPathDef = {
  d: 'M 0 0 L -10 -5 L -10 5 Z',
  baseSize: 10,
  filled: true,
  baseInset: 10,
};

/**
 * Open chevron / V-arrow. Tip at (0,0), arms reach to (-8, ±5).
 * Rendered as stroke, no fill.
 */
const OPEN_ARROW_PATH: ArrowheadPathDef = {
  d: 'M -8 -5 L 0 0 L -8 5',
  baseSize: 10,
  filled: false,
  baseInset: 3,
};

/**
 * Filled diamond. Tip at (0,0), tail at (-14,0), half-height=5.
 * Rendered filled.
 */
const DIAMOND_PATH: ArrowheadPathDef = {
  d: 'M 0 0 L -7 -5 L -14 0 L -7 5 Z',
  baseSize: 10,
  filled: true,
  baseInset: 14,
};

/**
 * Open diamond. Same shape as filled diamond but stroked only.
 */
const OPEN_DIAMOND_PATH: ArrowheadPathDef = {
  d: 'M 0 0 L -7 -5 L -14 0 L -7 5 Z',
  baseSize: 10,
  filled: false,
  baseInset: 14,
};

/**
 * Filled circle. Tip at (0,0) = right edge of circle. Radius=5, center at (-5,0).
 * Rendered filled.
 */
const CIRCLE_PATH: ArrowheadPathDef = {
  d: 'M 0 0 A 5 5 0 1 0 0 0.001 Z',
  baseSize: 10,
  filled: true,
  baseInset: 10,
};

/**
 * Open circle. Same as circle but stroked only.
 */
const OPEN_CIRCLE_PATH: ArrowheadPathDef = {
  d: 'M 0 0 A 5 5 0 1 0 0 0.001 Z',
  baseSize: 10,
  filled: false,
  baseInset: 10,
};

/**
 * Perpendicular bar. A vertical line at x=0, from y=-5 to y=5.
 * Rendered as stroke.
 */
const BAR_PATH: ArrowheadPathDef = {
  d: 'M 0 -5 L 0 5',
  baseSize: 10,
  filled: false,
  baseInset: 0,
};

@Pipe({
  name: 'arrowhead',
  standalone: true,
})
export class ArrowheadPipe implements PipeTransform {
  transform(element: ArrowElement): ArrowRenderData {
    const { x1, y1, x2, y2, style, startHead, endHead, pathType } = element;
    const strokeWidth = style.strokeWidth || 2;

    const isCurved = pathType && pathType.type !== 'straight';

    // Compute angles at each end based on path type
    let endAngle: number;
    let startAngle: number;

    if (pathType?.type === 'elbow') {
      // Elbow: start leaves horizontally, end arrives horizontally
      startAngle = x2 > x1 ? Math.PI : 0;
      endAngle = x2 > x1 ? 0 : Math.PI;
    } else if (pathType?.type === 'quadratic') {
      // Tangent at end = direction from control point to endpoint
      endAngle = Math.atan2(y2 - pathType.cy, x2 - pathType.cx);
      // Tangent at start = direction from control point to start point (reversed)
      startAngle = Math.atan2(y1 - pathType.cy, x1 - pathType.cx);
    } else if (pathType?.type === 'cubic') {
      endAngle = Math.atan2(y2 - pathType.cy2, x2 - pathType.cx2);
      startAngle = Math.atan2(y1 - pathType.cy1, x1 - pathType.cx1);
    } else {
      endAngle = Math.atan2(y2 - y1, x2 - x1);
      startAngle = endAngle + Math.PI;
    }

    const heads: ArrowheadRenderItem[] = [];

    const endResult = this.buildHead(endHead, x2, y2, endAngle, strokeWidth);
    const startResult = this.buildHead(startHead, x1, y1, startAngle, strokeWidth);

    if (endResult) {
      heads.push(endResult.item);
    }
    if (startResult) {
      heads.push(startResult.item);
    }

    // Pull line endpoints back so the stroke doesn't bleed through heads.
    // Clamp so both insets together never consume more than 80% of the straight-line
    // distance — this prevents the body from disappearing on short arrows.
    let endInset = endResult?.inset ?? 0;
    let startInset = startResult?.inset ?? 0;
    const arrowLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const totalInset = startInset + endInset;
    if (arrowLen > 0 && totalInset > arrowLen * 0.8) {
      const ratio = (arrowLen * 0.8) / totalInset;
      startInset *= ratio;
      endInset *= ratio;
    }

    let lineX1: number, lineY1: number, lineX2: number, lineY2: number;

    if (pathType?.type === 'elbow') {
      // Elbow: start leaves horizontally toward the path, end arrives horizontally.
      // startAngle points BACKWARD (away from the path), so inset must move FORWARD
      // which is the opposite direction: startAngle + π.
      const startFwdAngle = startAngle + Math.PI;
      lineX1 = x1 + startInset * Math.cos(startFwdAngle);
      lineY1 = y1 + startInset * Math.sin(startFwdAngle);
      lineX2 = x2 - endInset * Math.cos(endAngle);
      lineY2 = y2 - endInset * Math.sin(endAngle);
    } else if (pathType?.type === 'quadratic') {
      const startDir = Math.atan2(pathType.cy - y1, pathType.cx - x1);
      lineX1 = x1 + startInset * Math.cos(startDir);
      lineY1 = y1 + startInset * Math.sin(startDir);
      lineX2 = x2 - endInset * Math.cos(endAngle);
      lineY2 = y2 - endInset * Math.sin(endAngle);
    } else if (pathType?.type === 'cubic') {
      const startDir = Math.atan2(pathType.cy1 - y1, pathType.cx1 - x1);
      lineX1 = x1 + startInset * Math.cos(startDir);
      lineY1 = y1 + startInset * Math.sin(startDir);
      lineX2 = x2 - endInset * Math.cos(endAngle);
      lineY2 = y2 - endInset * Math.sin(endAngle);
    } else {
      const straightAngle = Math.atan2(y2 - y1, x2 - x1);
      lineX1 = x1 + startInset * Math.cos(straightAngle);
      lineY1 = y1 + startInset * Math.sin(straightAngle);
      lineX2 = x2 - endInset * Math.cos(straightAngle);
      lineY2 = y2 - endInset * Math.sin(straightAngle);
    }

    // Build the SVG path `d` attribute for the arrow body
    let pathD: string;
    if (pathType?.type === 'elbow') {
      const midRatio = pathType.midRatio ?? 0.5;
      const bendX = lineX1 + (lineX2 - lineX1) * midRatio;
      pathD = `M ${lineX1} ${lineY1} L ${bendX} ${lineY1} L ${bendX} ${lineY2} L ${lineX2} ${lineY2}`;
    } else if (pathType?.type === 'quadratic') {
      pathD = `M ${lineX1} ${lineY1} Q ${pathType.cx} ${pathType.cy} ${lineX2} ${lineY2}`;
    } else if (pathType?.type === 'cubic') {
      pathD = `M ${lineX1} ${lineY1} C ${pathType.cx1} ${pathType.cy1} ${pathType.cx2} ${pathType.cy2} ${lineX2} ${lineY2}`;
    } else {
      pathD = `M ${lineX1} ${lineY1} L ${lineX2} ${lineY2}`;
    }

    return {
      lineX1,
      lineY1,
      lineX2,
      lineY2,
      heads,
      pathD,
      isCurved: !!isCurved,
    };
  }

  private buildHead(
    config: ArrowheadConfig | undefined,
    px: number,
    py: number,
    angle: number,
    strokeWidth: number
  ): { item: ArrowheadRenderItem; inset: number } | null {
    if (!config || config.type === ArrowheadType.None) {
      return null;
    }

    // Arrowhead size grows gently with stroke width (3× ratio keeps heads proportional
    // without aggressively shortening the line body)
    const size = Math.max(12, strokeWidth * 3);

    let def: ArrowheadPathDef;

    switch (config.type) {
      case ArrowheadType.Arrow:
        def = ARROW_PATH;
        break;
      case ArrowheadType.OpenArrow:
        def = OPEN_ARROW_PATH;
        break;
      case ArrowheadType.Diamond:
        def = DIAMOND_PATH;
        break;
      case ArrowheadType.OpenDiamond:
        def = OPEN_DIAMOND_PATH;
        break;
      case ArrowheadType.Circle:
        def = CIRCLE_PATH;
        break;
      case ArrowheadType.OpenCircle:
        def = OPEN_CIRCLE_PATH;
        break;
      case ArrowheadType.Bar:
        def = BAR_PATH;
        break;
      default:
        return null;
    }

    const scale = size / def.baseSize;
    const inset = def.baseInset * scale;
    const transform = this.buildTransform(px, py, angle, scale);
    const headStrokeWidth = def.filled ? undefined : strokeWidth / scale;
    return { item: { d: def.d, filled: def.filled, transform, strokeWidth: headStrokeWidth }, inset };
  }

  /** Build an SVG transform: translate to endpoint, rotate to angle, then scale */
  private buildTransform(px: number, py: number, angle: number, scale: number): string {
    const angleDeg = (angle * 180) / Math.PI;
    return `translate(${px} ${py}) rotate(${angleDeg}) scale(${scale})`;
  }
}
