import { normalizeShapePath } from '../../utils/svg/shape-path';
import { BUILT_IN_SHAPES } from './built-in-shapes';

const shape = (id: string) => BUILT_IN_SHAPES.find((s) => s.id === id);
const toRad = (deg: number) => (deg * Math.PI) / 180;

// Regular pentagon and five-point star share the same outer vertices on a circle of radius R,
// one vertex pointing up: width = 2R·sin72°, height = R·(1 + cos36°).
const regularPentagonAspectRatio = (2 * Math.sin(toRad(72))) / (1 + Math.cos(toRad(36)));

describe('BUILT_IN_SHAPES', () => {
  it('lists the 12 built-in ids in order', () => {
    expect(BUILT_IN_SHAPES.map((s) => s.id)).toEqual([
      'triangle',
      'right-triangle',
      'diamond',
      'pentagon',
      'hexagon',
      'octagon',
      'star',
      'heart',
      'cross',
      'parallelogram',
      'trapezoid',
      'speech-bubble',
    ]);
  });

  it('has a name and a path that normalizes for every shape', () => {
    for (const s of BUILT_IN_SHAPES) {
      expect(s.name).toBeTruthy();
      expect(normalizeShapePath(s.path)).not.toBeNull();
    }
  });

  it('gives the pentagon and the star their geometric aspect ratio', () => {
    for (const id of ['pentagon', 'star']) {
      const aspectRatio = normalizeShapePath(shape(id)?.path ?? '')?.aspectRatio ?? 0;
      expect(Math.abs(aspectRatio - regularPentagonAspectRatio)).toBeLessThanOrEqual(0.05);
    }
  });
});
