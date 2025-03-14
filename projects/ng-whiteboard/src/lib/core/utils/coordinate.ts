import { WhiteboardConfig } from '../types';

/**
 * Get the canvas coordinates from screen coordinates.
 * @param config - The whiteboard configuration.
 * @param coordinates - The screen coordinates.
 * @returns The canvas coordinates.
 */
export function getCanvasCoordinates(config: WhiteboardConfig, [x, y]: [number, number]): [number, number] {
  const { zoom, x: configX, y: configY, elementsTranslation } = config;
  const translatedX = (x - configX) / zoom - elementsTranslation.x;
  const translatedY = (y - configY) / zoom - elementsTranslation.y;
  return [translatedX, translatedY];
}
