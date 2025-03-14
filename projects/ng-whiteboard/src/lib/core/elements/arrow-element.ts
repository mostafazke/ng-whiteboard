import { BaseElement, Direction, ElementType, ElementUtil, defaultElementStyle } from '../types';
import { generateId } from '../utils/utils';

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
}
