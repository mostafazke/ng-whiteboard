import { ElementType, WhiteboardElement } from '../../../types';
import { MIXED, mergeSelectedProperties } from './selected-properties';

const el = (id: string, type: ElementType, style = {}, extra = {}): WhiteboardElement =>
  ({ id, type, x: 0, y: 0, rotation: 0, opacity: 100, zIndex: 1, style, ...extra }) as WhiteboardElement;

describe('mergeSelectedProperties', () => {
  it('same values pass through', () => {
    const result = mergeSelectedProperties([
      el('a', ElementType.Rectangle, { strokeColor: '#000', strokeWidth: 2 }),
      el('b', ElementType.Rectangle, { strokeColor: '#000', strokeWidth: 2 }),
    ]);
    expect(result?.strokeColor).toBe('#000');
    expect(result?.strokeWidth).toBe(2);
    expect(result?.opacity).toBe(100);
  });

  it('differing values are MIXED', () => {
    const result = mergeSelectedProperties([
      el('a', ElementType.Rectangle, { strokeColor: '#000', strokeWidth: 2 }),
      el('b', ElementType.Rectangle, { strokeColor: '#f00', strokeWidth: 2 }, { opacity: 50 }),
    ]);
    expect(result?.strokeColor).toBe(MIXED);
    expect(result?.strokeWidth).toBe(2);
    expect(result?.opacity).toBe(MIXED);
  });

  it('reports a real opacity of 0 instead of defaulting it', () => {
    const result = mergeSelectedProperties([el('a', ElementType.Rectangle, {}, { opacity: 0 })]);
    expect(result?.opacity).toBe(0);
  });

  it('font fields only when all text', () => {
    const texts = mergeSelectedProperties([
      el('a', ElementType.Text, { fontSize: 20 }),
      el('b', ElementType.Text, { fontSize: 24 }),
    ]);
    expect(texts?.fontSize).toBe(MIXED);
    expect(texts?.fontFamily).toBe('Arial');

    const mixedTypes = mergeSelectedProperties([el('a', ElementType.Text), el('b', ElementType.Rectangle)]);
    expect(mixedTypes && 'fontSize' in mixedTypes).toBe(false);
    expect(mixedTypes && 'fontFamily' in mixedTypes).toBe(false);
  });

  it('null for empty', () => {
    expect(mergeSelectedProperties([])).toBeNull();
  });
});
