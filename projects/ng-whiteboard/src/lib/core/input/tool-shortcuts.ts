import { ToolType } from '../types';

export interface ToolShortcut {
  tool: ToolType;
  label: string;
  /** Letter keys, lowercase. The first one is shown in the toolbar tooltip. */
  keys: string[];
  /** Digit key from the tool's position among the visible numbered tools; unset when it has none. */
  digit?: string;
}

interface ToolDef {
  tool: ToolType;
  label: string;
  keys: string[];
  numbered: boolean;
}

export const SHAPE_TOOLS: readonly ToolType[] = [ToolType.Rectangle, ToolType.Ellipse, ToolType.Line, ToolType.Arrow];

const GROUPS: readonly (readonly ToolDef[])[] = [
  [
    { tool: ToolType.Hand, label: 'Pan', keys: ['h'], numbered: true },
    { tool: ToolType.Select, label: 'Select', keys: ['v'], numbered: true },
    { tool: ToolType.Pen, label: 'Pen', keys: ['p', 'd'], numbered: true },
    { tool: ToolType.Eraser, label: 'Eraser', keys: ['e'], numbered: true },
  ],
  [
    { tool: ToolType.Rectangle, label: 'Rectangle', keys: ['r'], numbered: true },
    { tool: ToolType.Ellipse, label: 'Ellipse', keys: ['o'], numbered: true },
    { tool: ToolType.Line, label: 'Line', keys: ['l'], numbered: true },
    { tool: ToolType.Arrow, label: 'Arrow', keys: ['a'], numbered: true },
  ],
  [
    { tool: ToolType.Text, label: 'Text', keys: ['t'], numbered: true },
    { tool: ToolType.Image, label: 'Image', keys: ['i'], numbered: true },
    { tool: ToolType.ZoomArea, label: 'Zoom to area', keys: ['z'], numbered: false },
  ],
];

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

/** Toolbar groups in display order, limited to `visible` (all tools when unset), with digits assigned. */
export function toolGroups(visible?: readonly ToolType[]): ToolShortcut[][] {
  let n = 0;
  return GROUPS.map((group) =>
    group
      .filter((def) => !visible || visible.includes(def.tool))
      .map(({ tool, label, keys, numbered }) => ({
        tool,
        label,
        keys,
        digit: numbered && n < DIGITS.length ? DIGITS[n++] : undefined,
      }))
  ).filter((group) => group.length > 0);
}

export function toolForKey(key: string, visible?: readonly ToolType[]): ToolType | undefined {
  return toolGroups(visible)
    .flat()
    .find((t) => t.digit === key || t.keys.includes(key))?.tool;
}
