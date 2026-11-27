import { ToolType } from '../types';
import { SHAPE_TOOLS, toolForKey, toolGroups } from './tool-shortcuts';

describe('tool shortcuts', () => {
  it('maps s to the shape tool', () => {
    expect(toolForKey('s')).toBe(ToolType.Shape);
  });

  it('keeps the digit assignments of the numbered tools', () => {
    const digits = toolGroups()
      .flat()
      .filter((t) => t.digit)
      .map((t) => [t.digit, t.tool]);

    expect(digits).toEqual([
      ['1', ToolType.Hand],
      ['2', ToolType.Select],
      ['3', ToolType.Pen],
      ['4', ToolType.Eraser],
      ['5', ToolType.Rectangle],
      ['6', ToolType.Ellipse],
      ['7', ToolType.Line],
      ['8', ToolType.Arrow],
      ['9', ToolType.Text],
      ['0', ToolType.Image],
    ]);
  });

  it('puts the shape tool alone in the last group, outside the shape flyout', () => {
    const groups = toolGroups();
    expect(groups[groups.length - 1].map((t) => [t.tool, t.label])).toEqual([[ToolType.Shape, 'More shapes']]);
    expect(SHAPE_TOOLS).toEqual([ToolType.Rectangle, ToolType.Ellipse, ToolType.Line, ToolType.Arrow]);
  });

  it('does not give the shape tool a digit', () => {
    const shape = toolGroups()
      .flat()
      .find((t) => t.tool === ToolType.Shape);
    expect(shape?.digit).toBeUndefined();
  });
});
