import { ElementType, WhiteboardElement } from '../../../types';

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
}

const DEFAULT_OPACITY = 100;

function merge<T>(values: T[]): Mixed<T> {
  const first = values[0];
  return values.every((value) => value === first) ? first : MIXED;
}

export function mergeSelectedProperties(elements: WhiteboardElement[]): SelectedProperties | null {
  if (elements.length === 0) return null;

  const result: SelectedProperties = {
    strokeColor: merge(elements.map((el) => el.style?.strokeColor || '#000000')),
    fillColor: merge(elements.map((el) => el.style?.fill || '#000000')),
    strokeWidth: merge(elements.map((el) => el.style?.strokeWidth || 1)),
    dasharray: merge(elements.map((el) => el.style?.dasharray || '')),
    opacity: merge(elements.map((el) => el.opacity ?? DEFAULT_OPACITY)),
  };

  if (elements.every((el) => el.type === ElementType.Text)) {
    result.fontSize = merge(elements.map((el) => el.style?.fontSize || 16));
    result.fontFamily = merge(elements.map((el) => el.style?.fontFamily || 'Arial'));
  }

  return result;
}
