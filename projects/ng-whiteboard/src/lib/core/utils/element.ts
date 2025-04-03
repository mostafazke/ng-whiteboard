import { Bounds, Point, WhiteboardElement } from '../types';
import { ITEM_PREFIX } from '../constants';
import { getElementUtil } from '../elements/element.utils';

/**
 * Get the bounding box of an element.
 * @param svgContainer - The SVG container element.
 * @param element - The whiteboard element.
 * @returns The bounding box of the element.
 */
export function getElementBbox(svgContainer: SVGSVGElement, element: WhiteboardElement): DOMRect {
  const elementId = `${ITEM_PREFIX}${element.id}`;
  const el = svgContainer.querySelector(`#${elementId}`) as SVGGraphicsElement;
  if (el) {
    return el.getBBox();
  }
  throw new Error(`Element with id ${elementId} not found`);
}

export function isBoundsIntersect(bounds: Bounds, p1: Point, p2: Point, margin: number): boolean {
  return (
    bounds.minX - margin <= Math.max(p1.x, p2.x) &&
    bounds.maxX + margin >= Math.min(p1.x, p2.x) &&
    bounds.minY - margin <= Math.max(p1.y, p2.y) &&
    bounds.maxY + margin >= Math.min(p1.y, p2.y)
  );
}
