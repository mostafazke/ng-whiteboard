import { Point, Bounds, WhiteboardElement } from '../../types';
import { getElementBounds } from '../dom/element';

/**
 * Utilities for geometric transformations and bounding box calculations.
 */

/**
 * Calculates the screen-space bounding box for an element, accounting for rotation.
 */
function getElementScreenBounds(element: WhiteboardElement): Bounds {
  const globalBounds = getElementBounds(element);

  if (!element.rotation || element.rotation === 0) {
    return globalBounds;
  }

  const localCenterX = globalBounds.width / 2;
  const localCenterY = globalBounds.height / 2;

  const localCorners: Point[] = [
    { x: 0, y: 0 },
    { x: globalBounds.width, y: 0 },
    { x: globalBounds.width, y: globalBounds.height },
    { x: 0, y: globalBounds.height },
  ];

  const rotation = (element.rotation || 0) * (Math.PI / 180);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const rotatedCorners = localCorners.map((corner) => {
    const dx = corner.x - localCenterX;
    const dy = corner.y - localCenterY;
    const rotatedX = dx * cos - dy * sin;
    const rotatedY = dx * sin + dy * cos;

    return {
      x: rotatedX + localCenterX,
      y: rotatedY + localCenterY,
    };
  });

  const globalCorners = rotatedCorners.map((corner) => ({
    x: corner.x + element.x,
    y: corner.y + element.y,
  }));

  const xs = globalCorners.map((p) => p.x);
  const ys = globalCorners.map((p) => p.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Calculates the combined bounding box for multiple elements in screen space.
 */
export function getCombinedScreenBounds(elements: WhiteboardElement[]): Bounds | null {
  if (elements.length === 0) {
    return null;
  }

  const allBounds = elements.map((el) => getElementScreenBounds(el));

  const minX = Math.min(...allBounds.map((b) => b.minX));
  const minY = Math.min(...allBounds.map((b) => b.minY));
  const maxX = Math.max(...allBounds.map((b) => b.maxX));
  const maxY = Math.max(...allBounds.map((b) => b.maxY));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Rotates a point around a center point by a given angle.
 */
export function rotatePointAroundCenter(point: Point, center: Point, angleDegrees: number): Point {
  const angleRadians = angleDegrees * (Math.PI / 180);
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}
