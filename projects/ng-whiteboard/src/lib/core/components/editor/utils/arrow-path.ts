import { ArrowElement } from '../../../elements';
import { ArrowLineStyle, ArrowPathType } from '../../../types';

export function toArrowPath(
  kind: ArrowLineStyle,
  arrow: Pick<ArrowElement, 'x1' | 'y1' | 'x2' | 'y2'>
): ArrowPathType {
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
