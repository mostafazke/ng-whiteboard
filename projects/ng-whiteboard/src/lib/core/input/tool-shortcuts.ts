import { ToolType } from '../types';

export interface ToolShortcut {
  tool: ToolType;
  label: string;
  /** Letter keys, lowercase. The first one is shown in the toolbar tooltip. */
  keys: string[];
  /** Digit key, matching the tool's position in the toolbar. */
  digit: string;
}

/** Toolbar tools in display order, split into the toolbar's visual groups. */
export const TOOL_GROUPS: readonly (readonly ToolShortcut[])[] = [
  [
    { tool: ToolType.Hand, label: 'Pan', keys: ['h'], digit: '1' },
    { tool: ToolType.Select, label: 'Select', keys: ['v'], digit: '2' },
    { tool: ToolType.Pen, label: 'Pen', keys: ['p', 'd'], digit: '3' },
    { tool: ToolType.Eraser, label: 'Eraser', keys: ['e'], digit: '4' },
  ],
  [
    { tool: ToolType.Rectangle, label: 'Rectangle', keys: ['r'], digit: '5' },
    { tool: ToolType.Ellipse, label: 'Ellipse', keys: ['o'], digit: '6' },
    { tool: ToolType.Line, label: 'Line', keys: ['l'], digit: '7' },
    { tool: ToolType.Arrow, label: 'Arrow', keys: ['a'], digit: '8' },
  ],
  [
    { tool: ToolType.Text, label: 'Text', keys: ['t'], digit: '9' },
    { tool: ToolType.Image, label: 'Image', keys: ['i'], digit: '0' },
  ],
];

const TOOLS = TOOL_GROUPS.flat();

export function toolForKey(key: string): ToolType | undefined {
  return TOOLS.find((t) => t.digit === key || t.keys.includes(key))?.tool;
}
