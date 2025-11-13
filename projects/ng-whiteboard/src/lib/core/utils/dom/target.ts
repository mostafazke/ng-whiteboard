import { PointerInfo, WhiteboardElement } from '../../types';
import {
  SELECTOR_GROUP_ID,
  ITEM_PREFIX,
  SELECTOR_GRIP_PREFIX,
  SELECTOR_BOX,
  SVG_ROOT_ID,
  DATA_ID,
} from '../../constants';

/** Get the target element from a pointer event. */
export function getTargetElement(info: PointerInfo, data: WhiteboardElement[]): WhiteboardElement | null {
  const mouseTarget = getMouseTarget(info);
  if (mouseTarget) {
    if (mouseTarget.id === SELECTOR_GROUP_ID) {
      return null;
    }
    const id = mouseTarget.getAttribute(DATA_ID);
    const element = data.find((el) => el.id === id);
    return element || null;
  }
  return null;
}

/** Get the mouse target element from a pointer event. */
export function getMouseTarget(info: PointerInfo): SVGGraphicsElement | null {
  if (!info?.target) {
    return null;
  }

  let mouseTarget = info.target as SVGGraphicsElement;

  while (mouseTarget) {
    if (mouseTarget.id === SVG_ROOT_ID) {
      return null;
    }
    if (
      mouseTarget.id.includes(ITEM_PREFIX) ||
      mouseTarget.id.includes(SELECTOR_GRIP_PREFIX) ||
      mouseTarget.id.includes(SELECTOR_BOX)
    ) {
      return mouseTarget;
    }
    if (mouseTarget.parentNode) {
      mouseTarget = mouseTarget.parentNode as SVGGraphicsElement;
    } else {
      break;
    }
  }

  return null;
}
