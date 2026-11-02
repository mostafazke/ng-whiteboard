import { ElementType, WhiteboardElement } from '../../../types';
import { getElementBounds } from '../../../utils/dom/element';
import { computeAlignmentUpdates } from './alignment';

const rect = (id: string, x: number, y: number, width: number, height: number): WhiteboardElement =>
  ({
    id,
    type: ElementType.Rectangle,
    x,
    y,
    width,
    height,
    rx: 0,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: false,
    style: {},
  }) as WhiteboardElement;

const A = () => rect('a', 0, 0, 10, 10);
const B = () => rect('b', 50, 20, 20, 40);
const C = () => rect('c', 100, 5, 10, 10);

function applyAndBounds(elements: WhiteboardElement[], updates: { id: string; x: number; y: number }[]) {
  return elements.map((e) => {
    const u = updates.find((up) => up.id === e.id);
    return getElementBounds({ ...e, x: u?.x ?? e.x, y: u?.y ?? e.y } as WhiteboardElement);
  });
}

describe('computeAlignmentUpdates', () => {
  const els = () => [A(), B(), C()];

  it('align-left sets all minX to the leftmost', () => {
    const e = els();
    applyAndBounds(e, computeAlignmentUpdates(e, 'align-left')).forEach((b) => expect(b.minX).toBe(0));
  });

  it('align-right sets all maxX to the rightmost', () => {
    const e = els();
    applyAndBounds(e, computeAlignmentUpdates(e, 'align-right')).forEach((b) => expect(b.maxX).toBe(110));
  });

  it('align-center equalizes center X at the mean of centers', () => {
    const e = els();
    applyAndBounds(e, computeAlignmentUpdates(e, 'align-center')).forEach((b) =>
      expect((b.minX + b.maxX) / 2).toBeCloseTo(56.67, 1)
    );
  });

  it('align-top sets all minY to the topmost', () => {
    const e = els();
    applyAndBounds(e, computeAlignmentUpdates(e, 'align-top')).forEach((b) => expect(b.minY).toBe(0));
  });

  it('align-bottom sets all maxY to the bottommost', () => {
    const e = els();
    applyAndBounds(e, computeAlignmentUpdates(e, 'align-bottom')).forEach((b) => expect(b.maxY).toBe(60));
  });

  it('align-middle equalizes center Y at the mean of centers', () => {
    const e = els();
    applyAndBounds(e, computeAlignmentUpdates(e, 'align-middle')).forEach((b) =>
      expect((b.minY + b.maxY) / 2).toBeCloseTo((5 + 40 + 10) / 3, 1)
    );
  });

  it('distribute-horizontal keeps ends and equalizes gaps', () => {
    const e = els();
    const updates = computeAlignmentUpdates(e, 'distribute-horizontal');
    expect(updates.find((u) => u.id === 'a')).toEqual({ id: 'a', x: 0, y: 0 });
    expect(updates.find((u) => u.id === 'c')).toEqual({ id: 'c', x: 100, y: 5 });
    const [a, b, c] = applyAndBounds(e, updates);
    expect(b.minX - a.maxX).toBeCloseTo(c.minX - b.maxX);
  });

  it('distribute-vertical keeps ends and equalizes gaps', () => {
    const e = [rect('a', 0, 0, 10, 10), rect('b', 5, 30, 10, 20), rect('c', 0, 100, 10, 10)];
    const updates = computeAlignmentUpdates(e, 'distribute-vertical');
    expect(updates.find((u) => u.id === 'a')).toEqual({ id: 'a', x: 0, y: 0 });
    expect(updates.find((u) => u.id === 'c')).toEqual({ id: 'c', x: 0, y: 100 });
    const [a, b, c] = applyAndBounds(e, updates);
    expect(b.minY - a.maxY).toBeCloseTo(c.minY - b.maxY);
  });

  it('ellipse and text use real bounds', () => {
    const ellipse = {
      id: 'e',
      type: ElementType.Ellipse,
      x: 30,
      y: 30,
      cx: 20,
      cy: 20,
      rx: 20,
      ry: 20,
      rotation: 0,
      opacity: 100,
      zIndex: 1,
      style: {},
    } as unknown as WhiteboardElement;
    const text = {
      id: 't',
      type: ElementType.Text,
      x: 70,
      y: 70,
      text: 'hello',
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      opacity: 100,
      zIndex: 1,
      style: {},
    } as unknown as WhiteboardElement;
    const e = [A(), ellipse, text];
    applyAndBounds(e, computeAlignmentUpdates(e, 'align-left')).forEach((b) => expect(b.minX).toBeCloseTo(0));
  });

  it('returns [] for one element', () => {
    expect(computeAlignmentUpdates([A()], 'align-left')).toEqual([]);
  });

  it('distribute returns [] for two elements', () => {
    expect(computeAlignmentUpdates([A(), B()], 'distribute-horizontal')).toEqual([]);
  });
});
