import { Point, WhiteboardConfig } from '../../types';

/**
 * Get the canvas coordinates from screen coordinates.
 * @param config - The whiteboard configuration.
 * @param coordinates - The screen coordinates.
 * @returns The canvas coordinates.
 */
export function getCanvasCoordinates(config: WhiteboardConfig, { x, y }: Point): Point {
  const { zoom, x: configX, y: configY, elementsTranslation } = config;
  const translatedX = (x - configX) / zoom - elementsTranslation.x;
  const translatedY = (y - configY) / zoom - elementsTranslation.y;
  return { x: translatedX, y: translatedY };
}

/**
 * Snaps a point (x2, y2) to the closest 45-degree angle relative to (x1, y1).
 */
export function snapToAngle(x1: number, y1: number, x2: number, y2: number): { x: number; y: number; a: number } {
  const snap = Math.PI / 4; // 45 degrees
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const snapangle = Math.round(angle / snap) * snap;
  const x = x1 + dist * Math.cos(snapangle);
  const y = y1 + dist * Math.sin(snapangle);
  return { x, y, a: snapangle };
}

/**
 * Snaps a given number to the nearest grid point.
 */
export function snapToGrid(n: number, gridSize: number): number {
  return Math.round(n / gridSize) * gridSize;
}

/**
 * Snaps a point to the nearest grid intersection.
 */
export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}
