import { BaseElement, ElementType, ElementUtil, defaultElementStyle } from '../types';
import { calculateBoundingBox, calculatePath } from '../utils';
import { generateId } from '../utils/utils';

export interface PenElement extends BaseElement {
  type: ElementType.Pen;
  points: number[][];
  path: string;
}

export class PenElementUtil implements ElementUtil<PenElement> {
  create(props: Partial<PenElement>): PenElement {
    return {
      type: ElementType.Pen,
      id: generateId(),
      x: 0,
      y: 0,
      points: [],
      path: '',
      rotation: 0,
      opacity: 100,
      ...props,
      style: {
        ...defaultElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: PenElement, direction: string, dx: number, dy: number): PenElement {
    const bbox = calculateBoundingBox(element.points);
    const { points, position } = this.getScaleFactors(direction, bbox, dx, dy);
    const centerX = bbox.x + bbox.width / 2;
    const centerY = bbox.y + bbox.height / 2;
    const [scaleX, scaleY] = points;

    if (bbox.width * scaleX < 10 || bbox.height * scaleY < 10) {
      return element;
    }

    element.x += position.x;
    element.y += position.y;
    element.points = element.points.map((point) => [
      centerX + (point[0] - centerX) * scaleX,
      centerY + (point[1] - centerY) * scaleY,
    ]);
    element.path = calculatePath(element.points);

    return element;
  }

  private getScaleFactors(
    direction: string,
    bbox: { width: number; height: number; x: number; y: number },
    dx: number,
    dy: number
  ) {
    const points = [1, 1];
    const position = { x: 0, y: 0 };

    if (direction.includes('w')) {
      points[0] = (bbox.width - dx) / bbox.width;
      position.x += dx / 2;
    }
    if (direction.includes('n')) {
      points[1] = (bbox.height - dy) / bbox.height;
      position.y += dy / 2;
    }
    if (direction.includes('e')) {
      points[0] = (bbox.width + dx) / bbox.width;
      position.x += dx / 2;
    }
    if (direction.includes('s')) {
      points[1] = (bbox.height + dy) / bbox.height;
      position.y += dy / 2;
    }

    return { points, position };
  }
}
