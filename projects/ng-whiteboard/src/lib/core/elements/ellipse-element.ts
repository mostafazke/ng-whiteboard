import { BaseElement, Direction, ElementType, ElementUtil, defaultElementStyle } from '../types';
import { generateId } from '../utils/utils';

export interface EllipseElement extends BaseElement {
  type: ElementType.Ellipse;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export class EllipseElementUtil implements ElementUtil<EllipseElement> {
  create(props: Partial<EllipseElement>): EllipseElement {
    return {
      type: ElementType.Ellipse,
      id: generateId(),
      x: 0,
      y: 0,
      cx: 0,
      cy: 0,
      rx: 1,
      ry: 1,
      rotation: 0,
      opacity: 100,
      ...props,
      style: {
        ...defaultElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: EllipseElement, direction: Direction, dx: number, dy: number): EllipseElement {
    if (direction.includes(Direction.N)) {
      const newRy = element.ry - dy / 2;
      if (newRy > 0) {
        element.ry = newRy;
        element.cy += dy / 2;
      }
    }
    if (direction.includes(Direction.S)) {
      const newRy = element.ry + dy / 2;
      if (newRy > 0) {
        element.ry = newRy;
        element.cy += dy / 2;
      }
    }
    if (direction.includes(Direction.W)) {
      const newRx = element.rx - dx / 2;
      if (newRx > 0) {
        element.rx = newRx;
        element.cx += dx / 2;
      }
    }
    if (direction.includes(Direction.E)) {
      const newRx = element.rx + dx / 2;
      if (newRx > 0) {
        element.rx = newRx;
        element.cx += dx / 2;
      }
    }

    return element;
  }
}
