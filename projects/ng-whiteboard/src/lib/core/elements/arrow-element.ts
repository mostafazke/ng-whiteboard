import { BaseElement, Bounds, Direction, ElementType, ElementUtil, Point, defaultElementStyle } from '../types';
import { generateId } from '../utils/common';
import { hitTestLine } from '../utils/drawing';

export interface ArrowElement extends BaseElement {
  type: ElementType.Arrow;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class ArrowElementUtil implements ElementUtil<ArrowElement> {
  create(props: Partial<ArrowElement>): ArrowElement {
    return {
      type: ElementType.Arrow,
      id: generateId(),
      x: 0,
      y: 0,
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 0,
      rotation: 0,
      opacity: 100,
      ...props,
      style: {
        ...defaultElementStyle,
        ...props.style,
      },
    };
  }
  resize(element: ArrowElement, direction: Direction, dx: number, dy: number): ArrowElement {
    if (direction.includes(Direction.N)) element.y2 += dy;
    if (direction.includes(Direction.S)) element.y1 += dy;
    if (direction.includes(Direction.W)) element.x1 += dx;
    if (direction.includes(Direction.E)) element.x2 += dx;
    return element;
  }

  getBounds(element: ArrowElement): Bounds {
    const x1 = element.x1 + element.x;
    const y1 = element.y1 + element.y;
    const x2 = element.x2 + element.x;
    const y2 = element.y2 + element.y;

    return {
      minX: Math.min(x1, x2),
      minY: Math.min(y1, y2),
      maxX: Math.max(x1, x2),
      maxY: Math.max(y1, y2),
      width: Math.abs(x2 - x1),
      height: Math.abs(y2 - y1),
    };
  }

  hitTest(element: ArrowElement, pointA: Point, pointB: Point, threshold: number): boolean {
    const { x1, y1, x2, y2 } = element;
    return hitTestLine(x1, y1, x2, y2, pointA, pointB, threshold);
  }
}
