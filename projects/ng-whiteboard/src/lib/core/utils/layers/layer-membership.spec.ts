import { WhiteboardElement, WhiteboardLayer } from '../../types';
import { effectiveLayerId, elementIdsByLayer } from './layer-membership';

const layer = (id: string, zIndex: number): WhiteboardLayer => ({
  id,
  name: id,
  visible: true,
  locked: false,
  zIndex,
  elements: [],
});

const el = (id: string, layerId?: string) => ({ id, layerId }) as WhiteboardElement;

describe('layer membership', () => {
  const layers = [layer('a', 0), layer('b', 1)];

  describe('effectiveLayerId', () => {
    it('returns the element layer when it exists', () => {
      expect(effectiveLayerId({ layerId: 'b' }, layers)).toBe('b');
    });

    it('falls back to the lowest layer when layerId is missing', () => {
      expect(effectiveLayerId({}, layers)).toBe('a');
    });

    it('falls back to the lowest layer when layerId is unknown', () => {
      expect(effectiveLayerId({ layerId: 'gone' }, layers)).toBe('a');
    });

    it('picks the lowest zIndex regardless of array order', () => {
      expect(effectiveLayerId({}, [layer('top', 5), layer('bottom', -1)])).toBe('bottom');
    });

    it('returns undefined when there are no layers', () => {
      expect(effectiveLayerId({ layerId: 'a' }, [])).toBeUndefined();
    });
  });

  describe('elementIdsByLayer', () => {
    it('groups elements by effective layer', () => {
      const result = elementIdsByLayer([el('b1', 'b'), el('none'), el('gone', 'gone')], layers);
      expect(result.get('a')).toEqual(['none', 'gone']);
      expect(result.get('b')).toEqual(['b1']);
    });

    it('includes empty layers', () => {
      expect(elementIdsByLayer([], layers).get('b')).toEqual([]);
    });
  });
});
