import { BaseElement, Bounds, Direction, ElementType, ElementUtil, Point, defaultElementStyle } from '../types';
import { hitTestBoundingBox } from '../utils/hit-test';
import { generateId } from '../utils/utils';

export interface RectangleElement extends BaseElement {
  type: ElementType.Rectangle;
  width: number;
  height: number;
  rx: number;
}

export class RectangleElementUtil implements ElementUtil<RectangleElement> {
  create(props: Partial<RectangleElement>): RectangleElement {
    return {
      type: ElementType.Rectangle,
      id: generateId(),
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      rx: 5,
      rotation: 0,
      opacity: 100,
      ...props,
      style: {
        ...defaultElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: RectangleElement, direction: Direction, dx: number, dy: number): RectangleElement {
    if (direction.includes(Direction.N)) {
      const newHeight = element.height - dy;
      if (newHeight > 0) {
        element.y += dy;
        element.height = newHeight;
      }
    }
    if (direction.includes(Direction.S)) {
      const newHeight = element.height + dy;
      if (newHeight > 0) {
        element.height = newHeight;
      }
    }
    if (direction.includes(Direction.W)) {
      const newWidth = element.width - dx;
      if (newWidth > 0) {
        element.x += dx;
        element.width = newWidth;
      }
    }
    if (direction.includes(Direction.E)) {
      const newWidth = element.width + dx;
      if (newWidth > 0) {
        element.width = newWidth;
      }
    }
    return element;
  }

  getBounds(element: RectangleElement): Bounds {
    return {
      minX: element.x,
      minY: element.y,
      maxX: element.x + element.width,
      maxY: element.y + element.height,
      width: element.width,
      height: element.height,
    };
  }

  hitTest(element: RectangleElement, pointA: Point, pointB: Point, threshold: number): boolean {
    const bounds = this.getBounds(element);
    return hitTestBoundingBox(bounds, pointA, pointB, threshold);
  }
}
