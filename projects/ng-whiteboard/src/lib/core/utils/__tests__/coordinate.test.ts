import { getCanvasCoordinates } from '../coordinate';
import { WhiteboardConfig } from '../../types';

describe('getCanvasCoordinates', () => {
  it('should return correct canvas coordinates for given screen coordinates', () => {
    const config = {
      zoom: 2,
      x: 100,
      y: 100,
      elementsTranslation: { x: 10, y: 20 },
    } as WhiteboardConfig;

    const screenCoordinates: [number, number] = [200, 300];
    const expectedCanvasCoordinates: [number, number] = [40, 80];

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

    const screenCoordinates: [number, number] = [-50, -50];
    const expectedCanvasCoordinates: [number, number] = [-160, -170];

    const result = getCanvasCoordinates(config, screenCoordinates);

    expect(result).toEqual(expectedCanvasCoordinates);
  });
});
