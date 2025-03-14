import { BaseElement, Direction, ElementType, ElementUtil, defaultElementStyle } from '../types';
import { generateId } from '../utils/utils';

export interface LineElement extends BaseElement {
  type: ElementType.Line;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class LineElementUtil implements ElementUtil<LineElement> {
  create(props: Partial<LineElement>): LineElement {
    return {
      type: ElementType.Line,
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

  resize(element: LineElement, direction: Direction, dx: number, dy: number): LineElement {
    if (direction.includes(Direction.N)) element.y1 += dy;
    if (direction.includes(Direction.S)) element.y2 += dy;
    if (direction.includes(Direction.W)) element.x1 += dx;
    if (direction.includes(Direction.E)) element.x2 += dx;
    return element;
  }
}
