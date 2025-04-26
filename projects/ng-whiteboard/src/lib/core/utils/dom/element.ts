import { Bounds, WhiteboardElement } from '../../types';
import { ITEM_PREFIX } from '../../constants';
import { getElementUtil } from '../../elements/element.utils';

/**
 * Get the bounding box of an element.
 */
export function getElementBbox(svgContainer: SVGSVGElement, element: WhiteboardElement): DOMRect {
  const elementId = `${ITEM_PREFIX}${element.id}`;
  const el = svgContainer.querySelector(`#${elementId}`) as SVGGraphicsElement;
  if (el) {
    return el.getBBox();
  }
  throw new Error(`Element with id ${elementId} not found`);
}

/**
 * Get the bounds of an element.
 */
export function getElementBounds(element: WhiteboardElement): Bounds {
  return getElementUtil(element.type).getBounds(element);
}
