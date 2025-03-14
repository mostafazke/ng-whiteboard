import { WhiteboardElement } from '../types';
import { ITEM_PREFIX } from '../constants';

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
