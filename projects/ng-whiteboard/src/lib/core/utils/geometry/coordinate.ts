import { Point, WhiteboardConfig } from '../../types';

/** Coordinate transformation utilities for screen ↔ canvas conversion with zoom, pan, and grid snapping. */

/** Converts screen coordinates to canvas coordinates accounting for zoom and pan. */
export function getCanvasCoordinates(config: WhiteboardConfig, point: Point): Point {
  const { zoom, x, y, canvasX, canvasY, fullScreen } = config;

  if (fullScreen) {
    const realX = point.x / zoom - x;
    const realY = point.y / zoom - y;
    return { x: realX, y: realY };
  }

  const relativeToInnerX = point.x - canvasX;
  const relativeToInnerY = point.y - canvasY;
  const realX = relativeToInnerX / zoom - x;
  const realY = relativeToInnerY / zoom - y;

  return { x: realX, y: realY };
}

/** Snaps a point to the closest 45-degree angle relative to an origin point. */
export function snapToAngle(x1: number, y1: number, x2: number, y2: number): { x: number; y: number; a: number } {
  const SNAP_ANGLE = Math.PI / 4;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const distance = Math.sqrt(dx * dx + dy * dy);

  const snappedAngle = Math.round(angle / SNAP_ANGLE) * SNAP_ANGLE;

  const x = x1 + distance * Math.cos(snappedAngle);
  const y = y1 + distance * Math.sin(snappedAngle);

  return { x, y, a: snappedAngle };
}

/** Snaps a single numeric value to the nearest grid point. */
export function snapToGrid(n: number, gridSize: number): number {
  return Math.round(n / gridSize) * gridSize;
}

/** Snaps a 2D point to the nearest grid intersection. */
export function snapPointToGrid(point: Point, gridSize: number): Point {
  return {
    x: snapToGrid(point.x, gridSize),
    y: snapToGrid(point.y, gridSize),
  };
}
