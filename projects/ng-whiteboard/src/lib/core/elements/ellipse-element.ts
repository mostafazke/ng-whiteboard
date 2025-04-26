import { BaseElement, Bounds, Direction, ElementType, ElementUtil, Point, defaultElementStyle } from '../types';
import { generateId } from '../utils/common';
import { hitTestEllipse } from '../utils/drawing';

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

  getBounds(element: EllipseElement): Bounds {
    const globalCx = element.cx + element.x;
    const globalCy = element.cy + element.y;

    return {
      minX: globalCx - element.rx,
      minY: globalCy - element.ry,
      maxX: globalCx + element.rx,
      maxY: globalCy + element.ry,
      width: element.rx * 2,
      height: element.ry * 2,
    };
  }

  hitTest(element: EllipseElement, pointA: Point, pointB: Point, threshold: number): boolean {
    const { cx, cy, rx, ry } = element;
    return hitTestEllipse(cx, cy, rx, ry, pointA, pointB, threshold);
  }
}
