import { getCanvasCoordinates } from '../coordinate';
import { Point, WhiteboardConfig } from '../../types';

describe('getCanvasCoordinates', () => {
  it('should return correct canvas coordinates for given screen coordinates', () => {
    const config = {
      zoom: 2,
      x: 100,
      y: 100,
      elementsTranslation: { x: 10, y: 20 },
    } as WhiteboardConfig;

    const screenCoordinates: Point = { x: 200, y: 300 };
    const expectedCanvasCoordinates: Point = { x: 40, y: 80 };

    const result = getCanvasCoordinates(config, screenCoordinates);

    expect(result).toEqual(expectedCanvasCoordinates);
  });
  it('should handle negative coordinates', () => {
    const config = {
      zoom: 1,
      x: 100,
      y: 100,
      elementsTranslation: { x: 10, y: 20 },
    } as WhiteboardConfig;

    const screenCoordinates: Point = { x: -50, y: -50 };
    const expectedCanvasCoordinates: Point = { x: -160, y: -170 };

    const result = getCanvasCoordinates(config, screenCoordinates);

    expect(result).toEqual(expectedCanvasCoordinates);
  });
});
