import { WhiteboardElement } from '../../types';
import { getCombinedScreenBounds } from '../geometry/transform-utils';

export interface ExportBox {
  x: number;
  y: number;
  width: number;
  height: number;
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
    minX = Math.min(minX, bounds.minX - half);
    minY = Math.min(minY, bounds.minY - half);
    maxX = Math.max(maxX, bounds.maxX + half);
    maxY = Math.max(maxY, bounds.maxY + half);
  }

  if (!Number.isFinite(minX)) return null;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}
