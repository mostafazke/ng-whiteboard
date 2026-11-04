import { ElementType, WhiteboardElement } from '../../types';
import { ArrowElement } from '../../elements/arrow-element';
import { getCombinedScreenBounds } from '../geometry/transform-utils';

export interface ExportBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function arrowExtent(arrow: ArrowElement): { minX: number; minY: number; maxX: number; maxY: number } {
  const { x, y, x1, y1, x2, y2, pathType, startHead, endHead } = arrow;
  const points: [number, number][] = [
    [x1, y1],
    [x2, y2],
  ];
  if (pathType?.type === 'quadratic') points.push([pathType.cx, pathType.cy]);
  if (pathType?.type === 'cubic') points.push([pathType.cx1, pathType.cy1], [pathType.cx2, pathType.cy2]);

  const strokeWidth = arrow.style?.strokeWidth || 2;
  const headReach = Math.max(12, strokeWidth * 3) * 1.4;
  const reach = (head: ArrowElement['endHead'] | undefined) => (head && head.type !== 'none' ? headReach : 0);
  const pad = [reach(startHead), reach(endHead)];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  points.forEach(([px, py], i) => {
    const r = i < 2 ? pad[i] : 0;
    minX = Math.min(minX, px + x - r);
    minY = Math.min(minY, py + y - r);
    maxX = Math.max(maxX, px + x + r);
    maxY = Math.max(maxY, py + y + r);
  });
  return { minX, minY, maxX, maxY };
}

export function exportBounds(elements: readonly WhiteboardElement[], padding: number): ExportBox | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const element of elements) {
    const bounds = getCombinedScreenBounds([element]);
    if (!bounds) continue;
    const half = (element.style?.strokeWidth ?? 0) / 2;
    const extra = element.type === ElementType.Arrow ? arrowExtent(element as ArrowElement) : null;
    minX = Math.min(minX, bounds.minX - half, extra?.minX ?? Infinity);
    minY = Math.min(minY, bounds.minY - half, extra?.minY ?? Infinity);
    maxX = Math.max(maxX, bounds.maxX + half, extra?.maxX ?? -Infinity);
    maxY = Math.max(maxY, bounds.maxY + half, extra?.maxY ?? -Infinity);
  }

  if (!Number.isFinite(minX)) return null;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
