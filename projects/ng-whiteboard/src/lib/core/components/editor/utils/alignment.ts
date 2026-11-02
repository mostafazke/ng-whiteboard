import { WhiteboardElement } from '../../../types';
import { getElementBounds } from '../../../utils/dom/element';
import { AlignmentType } from '../ui/alignment-controls/alignment-controls.component';

export interface AlignmentUpdate {
  id: string;
  x: number;
  y: number;
}

interface Item {
  element: WhiteboardElement;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function computeAlignmentUpdates(elements: WhiteboardElement[], alignment: AlignmentType): AlignmentUpdate[] {
  if (elements.length < 2) return [];
  const isDistribute = alignment === 'distribute-horizontal' || alignment === 'distribute-vertical';
  if (isDistribute && elements.length < 3) return [];

  const items: Item[] = elements.map((element) => {
    const { minX, minY, maxX, maxY } = getElementBounds(element);
    return { element, minX, minY, maxX, maxY };
  });

  const toUpdates = (targets: (item: Item) => { left?: number; top?: number }): AlignmentUpdate[] =>
    items.map((item) => {
      const { left, top } = targets(item);
      return {
        id: item.element.id,
        x: left === undefined ? item.element.x : item.element.x + (left - item.minX),
        y: top === undefined ? item.element.y : item.element.y + (top - item.minY),
      };
    });

  const minX = Math.min(...items.map((i) => i.minX));
  const maxX = Math.max(...items.map((i) => i.maxX));
  const minY = Math.min(...items.map((i) => i.minY));
  const maxY = Math.max(...items.map((i) => i.maxY));
  const meanCx = items.reduce((s, i) => s + (i.minX + i.maxX) / 2, 0) / items.length;
  const meanCy = items.reduce((s, i) => s + (i.minY + i.maxY) / 2, 0) / items.length;

  switch (alignment) {
    case 'align-left':
      return toUpdates(() => ({ left: minX }));
    case 'align-right':
      return toUpdates((i) => ({ left: maxX - (i.maxX - i.minX) }));
    case 'align-center':
      return toUpdates((i) => ({ left: meanCx - (i.maxX - i.minX) / 2 }));
    case 'align-top':
      return toUpdates(() => ({ top: minY }));
    case 'align-bottom':
      return toUpdates((i) => ({ top: maxY - (i.maxY - i.minY) }));
    case 'align-middle':
      return toUpdates((i) => ({ top: meanCy - (i.maxY - i.minY) / 2 }));
    case 'distribute-horizontal':
      return distribute(items, 'minX', 'maxX', 'x');
    case 'distribute-vertical':
      return distribute(items, 'minY', 'maxY', 'y');
    default:
      return [];
  }
}

function distribute(
  items: Item[],
  minKey: 'minX' | 'minY',
  maxKey: 'maxX' | 'maxY',
  axis: 'x' | 'y'
): AlignmentUpdate[] {
  const sorted = [...items].sort((a, b) => a[minKey] - b[minKey]);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const middle = sorted.slice(1, -1);
  const free = last[minKey] - first[maxKey] - middle.reduce((s, i) => s + (i[maxKey] - i[minKey]), 0);
  const gap = free / (middle.length + 1);

  const newMin = new Map<Item, number>();
  let cursor = first[maxKey] + gap;
  middle.forEach((item) => {
    newMin.set(item, cursor);
    cursor += item[maxKey] - item[minKey] + gap;
  });

  return items.map((item) => {
    const target = newMin.get(item);
    const base = { id: item.element.id, x: item.element.x, y: item.element.y };
    if (target !== undefined) base[axis] = base[axis] + (target - item[minKey]);
    return base;
  });
}
