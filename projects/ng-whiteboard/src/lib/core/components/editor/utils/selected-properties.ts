import { ArrowElement, ArrowheadType, RectangleElement } from '../../../elements';
import { ArrowLineStyle, ElementType, LineCap, WhiteboardElement } from '../../../types';
import { arrowPathKind } from './shape-capabilities';

export const MIXED = Symbol('mixed');
export type Mixed<T> = T | typeof MIXED;

export interface SelectedProperties {
  strokeColor: Mixed<string>;
  fillColor: Mixed<string>;
  strokeWidth: Mixed<number>;
  dasharray: Mixed<string>;
  opacity: Mixed<number>;
  fontSize?: Mixed<number>;
  fontFamily?: Mixed<string>;
  lineCap?: Mixed<LineCap>;
  cornerRadius?: Mixed<number>;
  startHead?: Mixed<ArrowheadType>;
  endHead?: Mixed<ArrowheadType>;
  arrowPath?: Mixed<ArrowLineStyle>;
}

const DEFAULT_OPACITY = 100;
const DEFAULT_CORNER_RADIUS = 5;

function normalizeFill(fill: string | undefined): string {
  return !fill || fill === 'none' ? 'transparent' : fill;
}

function effectiveOpacity(el: WhiteboardElement): number {
  const base = el.opacity ?? DEFAULT_OPACITY;
  return el.style?.opacity === undefined ? base : Math.round(base * el.style.opacity);
}

function merge<T>(values: T[]): Mixed<T> {
  const first = values[0];
  return values.every((value) => value === first) ? first : MIXED;
}

export function mergeSelectedProperties(elements: WhiteboardElement[]): SelectedProperties | null {
  if (elements.length === 0) return null;

  const result: SelectedProperties = {
    strokeColor: merge(elements.map((el) => el.style?.strokeColor || '#000000')),
    fillColor: merge(elements.map((el) => normalizeFill(el.style?.fill))),
    strokeWidth: merge(elements.map((el) => el.style?.strokeWidth || 1)),
    dasharray: merge(elements.map((el) => el.style?.dasharray || '')),
    opacity: merge(elements.map((el) => effectiveOpacity(el))),
  };

  if (elements.every((el) => el.type === ElementType.Text)) {
    result.fontSize = merge(elements.map((el) => el.style?.fontSize || 16));
    result.fontFamily = merge(elements.map((el) => el.style?.fontFamily || 'Arial'));
  }

  if (elements.every((el) => el.type === ElementType.Line || el.type === ElementType.Arrow)) {
    result.lineCap = merge(elements.map((el) => el.style?.lineCap ?? LineCap.Round));
  }

  if (elements.every((el) => el.type === ElementType.Rectangle)) {
    result.cornerRadius = merge(elements.map((el) => (el as RectangleElement).rx ?? DEFAULT_CORNER_RADIUS));
  }

  if (elements.every((el) => el.type === ElementType.Arrow)) {
    const arrows = elements as ArrowElement[];
    result.startHead = merge(arrows.map((el) => el.startHead?.type ?? ArrowheadType.None));
    result.endHead = merge(arrows.map((el) => el.endHead?.type ?? ArrowheadType.None));
    result.arrowPath = merge(arrows.map((el) => arrowPathKind(el.pathType)));
  }

  return result;
}
