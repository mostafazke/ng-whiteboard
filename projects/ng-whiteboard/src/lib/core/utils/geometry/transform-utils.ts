import { Point, Bounds, Direction, WhiteboardElement } from '../../types';
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

/**
 * World-space position of the resize anchor — the corner/edge that must stay pinned
 * while dragging `handle` (i.e. the one opposite the dragged handle).
 *
 * The element renders rotated around its fill-box (geometry) center, which equals the
 * center of `bounds`. So the anchor is the opposite corner rotated around that center —
 * matching the render model `world(p) = center + R·(p − center)`. Computing it this way
 * (rather than rotating around the element origin) keeps the anchor fixed in world space
 * when the box dimensions change, so resizing a rotated element no longer drifts.
 */
/**
 * Scale factors to apply to a rotated child's local width/height when a multi-selection
 * group is resized by world-axis scale `(scaleX, scaleY)`.
 *
 * Applying the group's X-scale directly to a rotated child's local width stretches it
 * along the child's own (rotated) axis, so a 45°-rotated box grows diagonally and spills
 * out of the selection. Projecting the group scale onto the child's local axes instead
 * scales each side by how much that side actually stretches in world space — shear-free,
 * stays inside the box, reduces to `(scaleX, scaleY)` when unrotated and swaps at 90°.
 */
export function getRotatedChildScale(
  scaleX: number,
  scaleY: number,
  rotationDegrees: number
): { scaleX: number; scaleY: number } {
  const rad = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return {
    scaleX: Math.hypot(scaleX * cos, scaleY * sin),
    scaleY: Math.hypot(scaleX * sin, scaleY * cos),
  };
}

export function getRotatedResizeAnchor(bounds: Bounds, handle: Direction, rotationDegrees: number): Point {
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;

  const anchorX = handle.includes(Direction.W) ? bounds.maxX : handle.includes(Direction.E) ? bounds.minX : centerX;
  const anchorY = handle.includes(Direction.N) ? bounds.maxY : handle.includes(Direction.S) ? bounds.minY : centerY;

  return rotatePointAroundCenter({ x: anchorX, y: anchorY }, { x: centerX, y: centerY }, rotationDegrees);
}
