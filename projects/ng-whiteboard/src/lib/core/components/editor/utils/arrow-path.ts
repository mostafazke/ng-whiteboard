import { ArrowElement } from '../../../elements';
import { ArrowLineStyle, ArrowPathType } from '../../../types';

const FLAT_CURVE_THRESHOLD = 5;

export function isFlatCurve(arrow: Pick<ArrowElement, 'x1' | 'y1' | 'x2' | 'y2' | 'pathType'>): boolean {
  const path = arrow.pathType;
  if (path?.type !== 'quadratic') return false;
  const mx = (arrow.x1 + arrow.x2) / 2;
  const my = (arrow.y1 + arrow.y2) / 2;
  return Math.hypot(path.cx - mx, path.cy - my) < FLAT_CURVE_THRESHOLD;
}

export function toArrowPath(kind: ArrowLineStyle, arrow: Pick<ArrowElement, 'x1' | 'y1' | 'x2' | 'y2'>): ArrowPathType {
  if (kind === 'elbow') return { type: 'elbow', midRatio: 0.5 };
  if (kind === 'curve') {
    const dx = arrow.x2 - arrow.x1;
    const dy = arrow.y2 - arrow.y1;
    return {
      type: 'quadratic',
      cx: (arrow.x1 + arrow.x2) / 2 - dy * 0.2,
      cy: (arrow.y1 + arrow.y2) / 2 + dx * 0.2,
    };
  }
  return { type: 'straight' };
}
