import { ArrowPathType, ElementType, ToolType } from '../../../types';
import { arrowPathKind, sectionsForElements, sectionsForTool } from './shape-capabilities';

describe('sectionsForElements', () => {
  it('returns arrow sections without fill', () => {
    const sections = sectionsForElements([ElementType.Arrow]);
    expect(sections.has('arrowHeads')).toBe(true);
    expect(sections.has('arrowPath')).toBe(true);
    expect(sections.has('lineEnds')).toBe(true);
    expect(sections.has('fill')).toBe(false);
  });

  it('returns only opacity for images', () => {
    expect(new Set(sectionsForElements([ElementType.Image]))).toEqual(new Set(['opacity']));
  });

  it('returns stroke, font and opacity for text', () => {
    expect(new Set(sectionsForElements([ElementType.Text]))).toEqual(new Set(['stroke', 'font', 'opacity']));
  });

  it('intersects sections across mixed types', () => {
    expect(new Set(sectionsForElements([ElementType.Arrow, ElementType.Rectangle]))).toEqual(
      new Set(['stroke', 'strokeWidth', 'strokeStyle', 'opacity'])
    );
  });

  it('returns an empty set for no elements', () => {
    expect(sectionsForElements([]).size).toBe(0);
  });

  it('never includes brush', () => {
    expect(sectionsForElements([ElementType.Pen]).has('brush')).toBe(false);
  });
});

describe('sectionsForTool', () => {
  it('returns pen sections', () => {
    expect(new Set(sectionsForTool(ToolType.Pen))).toEqual(new Set(['stroke', 'strokeWidth', 'brush']));
  });

  it('returns rectangle sections', () => {
    expect(new Set(sectionsForTool(ToolType.Rectangle))).toEqual(
      new Set(['stroke', 'fill', 'strokeWidth', 'strokeStyle', 'cornerRadius'])
    );
  });

  it('returns arrow sections', () => {
    expect(new Set(sectionsForTool(ToolType.Arrow))).toEqual(
      new Set(['stroke', 'strokeWidth', 'strokeStyle', 'lineEnds', 'arrowHeads', 'arrowPath'])
    );
  });

  it('returns text sections', () => {
    expect(new Set(sectionsForTool(ToolType.Text))).toEqual(new Set(['stroke', 'font']));
  });

  it('has no opacity for non-drawing tools', () => {
    for (const tool of [ToolType.Select, ToolType.Hand, ToolType.Eraser, ToolType.Image, ToolType.ZoomArea]) {
      const sections = sectionsForTool(tool);
      expect(sections.has('opacity')).toBe(false);
      expect(new Set(sections)).toEqual(new Set(['stroke', 'strokeWidth', 'strokeStyle']));
    }
  });
});

describe('arrowPathKind', () => {
  it('maps path types to line styles', () => {
    expect(arrowPathKind({ type: 'cubic', cx1: 0, cy1: 0, cx2: 1, cy2: 1 })).toBe('curve');
    expect(arrowPathKind({ type: 'quadratic', cx: 0, cy: 0 })).toBe('curve');
    expect(arrowPathKind({ type: 'elbow', midRatio: 0.5 })).toBe('elbow');
    expect(arrowPathKind({ type: 'straight' } as ArrowPathType)).toBe('straight');
    expect(arrowPathKind(undefined)).toBe('straight');
  });
});
