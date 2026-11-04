import { ArrowLineStyle, ArrowPathType, ElementType, ToolType } from '../../../types';

export type PropertySection =
  | 'stroke'
  | 'fill'
  | 'strokeWidth'
  | 'strokeStyle'
  | 'lineEnds'
  | 'cornerRadius'
  | 'arrowHeads'
  | 'arrowPath'
  | 'font'
  | 'opacity'
  | 'brush';

const ELEMENT_SECTIONS: Record<ElementType, readonly PropertySection[]> = {
  [ElementType.Pen]: ['stroke', 'strokeWidth', 'strokeStyle', 'opacity'],
  [ElementType.Rectangle]: ['stroke', 'fill', 'strokeWidth', 'strokeStyle', 'cornerRadius', 'opacity'],
  [ElementType.Ellipse]: ['stroke', 'fill', 'strokeWidth', 'strokeStyle', 'opacity'],
  [ElementType.Line]: ['stroke', 'strokeWidth', 'strokeStyle', 'lineEnds', 'opacity'],
  [ElementType.Arrow]: ['stroke', 'strokeWidth', 'strokeStyle', 'lineEnds', 'arrowHeads', 'arrowPath', 'opacity'],
  [ElementType.Text]: ['stroke', 'font', 'opacity'],
  [ElementType.Image]: ['opacity'],
};

const TOOL_SECTIONS: Partial<Record<ToolType, readonly PropertySection[]>> = {
  [ToolType.Pen]: ['stroke', 'strokeWidth', 'strokeStyle', 'brush'],
  [ToolType.Rectangle]: ['stroke', 'fill', 'strokeWidth', 'strokeStyle', 'cornerRadius'],
  [ToolType.Ellipse]: ['stroke', 'fill', 'strokeWidth', 'strokeStyle'],
  [ToolType.Line]: ['stroke', 'strokeWidth', 'strokeStyle', 'lineEnds'],
  [ToolType.Arrow]: ['stroke', 'strokeWidth', 'strokeStyle', 'lineEnds', 'arrowHeads', 'arrowPath'],
  [ToolType.Text]: ['stroke', 'font'],
};

const DEFAULT_TOOL_SECTIONS: readonly PropertySection[] = ['stroke', 'strokeWidth', 'strokeStyle'];

export function sectionsForElements(types: ElementType[]): ReadonlySet<PropertySection> {
  if (types.length === 0) return new Set();
  const [first, ...rest] = types.map((type) => new Set(ELEMENT_SECTIONS[type]));
  return new Set([...first].filter((section) => rest.every((set) => set.has(section))));
}

export function sectionsForTool(tool: ToolType): ReadonlySet<PropertySection> {
  return new Set(TOOL_SECTIONS[tool] ?? DEFAULT_TOOL_SECTIONS);
}

export function arrowPathKind(pathType: ArrowPathType | undefined): ArrowLineStyle {
  if (pathType?.type === 'quadratic' || pathType?.type === 'cubic') return 'curve';
  if (pathType?.type === 'elbow') return 'elbow';
  return 'straight';
}
