import { ShapeDefinition } from '../../types/config';

/** Hand-authored shapes, each drawn in a 100×100 box. */
export const BUILT_IN_SHAPES: readonly ShapeDefinition[] = [
  { id: 'triangle', name: 'Triangle', path: 'M50 0 L100 100 L0 100 Z' },
  { id: 'right-triangle', name: 'Right triangle', path: 'M0 0 L100 100 L0 100 Z' },
  { id: 'diamond', name: 'Diamond', path: 'M50 0 L100 50 L50 100 L0 50 Z' },
  {
    id: 'pentagon',
    name: 'Pentagon',
    path: 'M50 4.8 L97.6 39.3 L79.4 95.3 L20.6 95.3 L2.4 39.3 Z',
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    path: 'M0 50 L25 6.7 L75 6.7 L100 50 L75 93.3 L25 93.3 Z',
  },
  {
    id: 'octagon',
    name: 'Octagon',
    path: 'M29.3 0 L70.7 0 L100 29.3 L100 70.7 L70.7 100 L29.3 100 L0 70.7 L0 29.3 Z',
  },
  {
    id: 'star',
    name: 'Star',
    path:
      'M50 4.8 L61.2 39.3 L97.6 39.3 L68.2 60.7 L79.4 95.3 L50 73.9 L20.6 95.3 L31.8 60.7 L2.4 39.3 L38.8 39.3 Z',
  },
  {
    id: 'heart',
    name: 'Heart',
    path:
      'M50 100 C20 78 0 58 0 30 C0 12 13 0 29 0 C39 0 46 6 50 15 C54 6 61 0 71 0 C87 0 100 12 100 30 C100 58 80 78 50 100 Z',
  },
  {
    id: 'cross',
    name: 'Cross',
    path: 'M35 0 L65 0 L65 35 L100 35 L100 65 L65 65 L65 100 L35 100 L35 65 L0 65 L0 35 L35 35 Z',
  },
  { id: 'parallelogram', name: 'Parallelogram', path: 'M25 0 L100 0 L75 100 L0 100 Z' },
  { id: 'trapezoid', name: 'Trapezoid', path: 'M25 0 L75 0 L100 100 L0 100 Z' },
  {
    id: 'speech-bubble',
    name: 'Speech bubble',
    path:
      'M10 0 L90 0 Q100 0 100 10 L100 65 Q100 75 90 75 L50 75 L25 100 L30 75 L10 75 Q0 75 0 65 L0 10 Q0 0 10 0 Z',
  },
];
