import { ArrowheadType } from '../../../elements';
import { ArrowPathType, ElementType, LineCap, WhiteboardElement } from '../../../types';
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

  it('reads the text color from style.color for text elements', () => {
    const result = mergeSelectedProperties([
      el('a', ElementType.Text, { color: '#333333', strokeColor: 'transparent' }),
    ]);
    expect(result?.strokeColor).toBe('#333333');
  });

  it('does not mark text and a shape MIXED when their colors match', () => {
    const result = mergeSelectedProperties([
      el('a', ElementType.Text, { color: '#333333', strokeColor: 'transparent' }),
      el('b', ElementType.Rectangle, { strokeColor: '#333333' }),
    ]);
    expect(result?.strokeColor).toBe('#333333');
  });

  it('reports a real opacity of 0 instead of defaulting it', () => {
    const result = mergeSelectedProperties([el('a', ElementType.Rectangle, {}, { opacity: 0 })]);
    expect(result?.opacity).toBe(0);
  });

  it('keeps a missing or none fill distinct from a black fill', () => {
    expect(mergeSelectedProperties([el('a', ElementType.Rectangle, {})])?.fillColor).toBe('transparent');
    expect(mergeSelectedProperties([el('a', ElementType.Rectangle, { fill: 'none' })])?.fillColor).toBe('transparent');
    const result = mergeSelectedProperties([
      el('a', ElementType.Rectangle, {}),
      el('b', ElementType.Rectangle, { fill: '#000000' }),
    ]);
    expect(result?.fillColor).toBe(MIXED);
  });

  it('reports the effective opacity including a style opacity', () => {
    const result = mergeSelectedProperties([el('a', ElementType.Pen, { opacity: 0.4 })]);
    expect(result?.opacity).toBe(40);
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

describe('mergeSelectedProperties shape-specific values', () => {
  const arrow = (
    id: string,
    startHead: ArrowheadType,
    endHead: ArrowheadType,
    pathType: ArrowPathType = { type: 'straight' }
  ) => el(id, ElementType.Arrow, {}, { startHead: { type: startHead }, endHead: { type: endHead }, pathType });

  it('merges arrow heads and path', () => {
    const result = mergeSelectedProperties([
      arrow('a', ArrowheadType.None, ArrowheadType.Arrow, { type: 'elbow', midRatio: 0.5 }),
      arrow('b', ArrowheadType.None, ArrowheadType.Circle, { type: 'elbow', midRatio: 0.3 }),
    ]);
    expect(result?.startHead).toBe(ArrowheadType.None);
    expect(result?.endHead).toBe(MIXED);
    expect(result?.arrowPath).toBe('elbow');
    expect(result?.lineCap).toBe(LineCap.Round);
  });

  it('merges corner radius', () => {
    const rect = (id: string, rx: number) => el(id, ElementType.Rectangle, {}, { rx });
    expect(mergeSelectedProperties([rect('a', 0), rect('b', 12)])?.cornerRadius).toBe(MIXED);
    expect(mergeSelectedProperties([rect('a', 12), rect('b', 12)])?.cornerRadius).toBe(12);
  });

  it('omits unsupported values for mixed types', () => {
    const result = mergeSelectedProperties([
      arrow('a', ArrowheadType.None, ArrowheadType.Arrow),
      el('b', ElementType.Rectangle, {}, { rx: 5 }),
    ]);
    expect(result?.startHead).toBeUndefined();
    expect(result?.cornerRadius).toBeUndefined();
    expect(result?.lineCap).toBeUndefined();
  });

  it('merges line cap for lines and arrows', () => {
    const result = mergeSelectedProperties([
      el('a', ElementType.Line, { lineCap: LineCap.Square }),
      arrow('b', ArrowheadType.None, ArrowheadType.Arrow),
    ]);
    expect(result?.lineCap).toBe(MIXED);
  });
});
