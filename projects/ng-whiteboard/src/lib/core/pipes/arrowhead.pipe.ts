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
/*  All paths are authored pointing RIGHT (+X), with the tip/anchor   */
/*  at the coordinate given by tipX/tipY.  At render time we apply    */
/*  translate · rotate · scale · translate(-tip) so the tip lands on  */
/*  the endpoint at the correct angle.                                */
/* ------------------------------------------------------------------ */

interface ArrowheadPathDef {
  /** SVG path `d` in native coordinates */
  d: string;
  /** X of the tip/anchor in native coordinates */
  tipX: number;
  /** Y of the tip/anchor in native coordinates */
  tipY: number;
  /** Reference size (scale = size / baseSize) */
  baseSize: number;
}

/** Closed triangle – tip at origin, arm length = 1 */
const TRIANGLE_PATH: ArrowheadPathDef = {
  d: 'M 0 0 L -0.866 0.5 L -0.866 -0.5 Z',
  tipX: 0,
  tipY: 0,
  baseSize: 1,
};

/** Rounded open-arrow / chevron */
const OPEN_ARROW_PATH: ArrowheadPathDef = {
  d: 'M0 0-.5725.5725a.1026.1026 90 00.0107.1621.1134.1134 90 00.1459-.0107L.2267.0758a.1026.1026 90 000-.1512L-.4158-.7234a.1134.1134 90 00-.1459-.0107.1026.1026 90 00-.0107.1621Z',
  tipX: 0,
  tipY: 0,
  baseSize: 1,
};

/** Diamond (4-point rhombus), depth = 2 at base scale */
const DIAMOND_PATH: ArrowheadPathDef = {
  d: 'M 0 0 L -1 -0.5 L -2 0 L -1 0.5 Z',
  tipX: 0,
  tipY: 0,
  baseSize: 1,
};

/** Circle, radius 0.5 at base scale, tip at forward edge */
const CIRCLE_PATH: ArrowheadPathDef = {
  d: 'M -1 0 A 0.5 0.5 0 1 0 0 0 A 0.5 0.5 0 1 0 -1 0 Z',
  tipX: 0,
  tipY: 0,
  baseSize: 1,
};

/** Perpendicular bar at the tip */
const BAR_PATH: ArrowheadPathDef = {
  d: 'M 0 -0.5 L 0 0.5',
  tipX: 0,
  tipY: 0,
  baseSize: 1,
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

    // Pull line endpoints back so the stroke doesn't bleed through heads
    const endInset = endResult?.inset ?? 0;
    const startInset = startResult?.inset ?? 0;

    let lineX1: number, lineY1: number, lineX2: number, lineY2: number;

    if (pathType?.type === 'elbow') {
      // Elbow: start leaves horizontally, end arrives horizontally
      lineX1 = x1 + startInset * Math.cos(startAngle);
      lineY1 = y1 + startInset * Math.sin(startAngle);
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
    strokeWidth: number,
  ): { item: ArrowheadRenderItem; inset: number } | null {
    if (!config || config.type === ArrowheadType.None) {
      return null;
    }

    const size = Math.max(8, strokeWidth * config.size);
    const halfStroke = strokeWidth / 2;

    let def: ArrowheadPathDef;
    let filled: boolean;
    let inset: number;

    switch (config.type) {
      case ArrowheadType.Arrow:
        def = TRIANGLE_PATH;
        filled = true;
        inset = size * Math.cos(Math.PI / 6);
        break;
      case ArrowheadType.OpenArrow:
        def = OPEN_ARROW_PATH;
        filled = true;
        inset = size * 0.3;
        break;
      case ArrowheadType.Diamond:
        def = DIAMOND_PATH;
        filled = true;
        inset = size;
        break;
      case ArrowheadType.OpenDiamond:
        def = DIAMOND_PATH;
        filled = false;
        inset = halfStroke;
        break;
      case ArrowheadType.Circle:
        def = CIRCLE_PATH;
        filled = true;
        inset = size;
        break;
      case ArrowheadType.OpenCircle:
        def = CIRCLE_PATH;
        filled = false;
        inset = halfStroke;
        break;
      case ArrowheadType.Bar:
        def = BAR_PATH;
        filled = false;
        inset = halfStroke;
        break;
      default:
        return null;
    }

    const transform = this.buildTransform(def, px, py, angle, size);
    return { item: { d: def.d, filled, transform }, inset };
  }

  /** Build an SVG transform that places a predefined path at (px, py) with the given angle and size */
  private buildTransform(
    def: ArrowheadPathDef,
    px: number,
    py: number,
    angle: number,
    size: number,
  ): string {
    const angleDeg = (angle * 180) / Math.PI;
    const scale = size / def.baseSize;
    return `translate(${px} ${py}) rotate(${angleDeg}) scale(${scale}) translate(${-def.tipX} ${-def.tipY})`;
  }
}
