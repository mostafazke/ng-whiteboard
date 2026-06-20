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

  const centerX = globalBounds.minX + globalBounds.width / 2;
  const centerY = globalBounds.minY + globalBounds.height / 2;

  const corners: Point[] = [
    { x: globalBounds.minX, y: globalBounds.minY },
    { x: globalBounds.maxX, y: globalBounds.minY },
    { x: globalBounds.maxX, y: globalBounds.maxY },
    { x: globalBounds.minX, y: globalBounds.maxY },
  ];

  const rotation = (element.rotation || 0) * (Math.PI / 180);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  const rotatedCorners = corners.map((corner) => {
    const dx = corner.x - centerX;
    const dy = corner.y - centerY;
    return {
      x: centerX + dx * cos - dy * sin,
      y: centerY + dx * sin + dy * cos,
    };
  });

  const xs = rotatedCorners.map((p) => p.x);
  const ys = rotatedCorners.map((p) => p.y);

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
