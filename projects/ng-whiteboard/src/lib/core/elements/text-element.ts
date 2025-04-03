import { BaseElement, Bounds, Direction, ElementType, ElementUtil, Point, defaultTextElementStyle } from '../types';
import { hitTestBoundingBox } from '../utils/hit-test';
import { generateId } from '../utils/utils';

export interface TextElement extends BaseElement {
  type: ElementType.Text;
  text: string;
  selection?: { start: number; end: number };
  scaleX: number;
  scaleY: number;
}
export class TextElementUtil implements ElementUtil<TextElement> {
  create(props: Partial<TextElement>): TextElement {
    return {
      type: ElementType.Text,
      id: generateId(),
      x: 0,
      y: 0,
      text: '',
      rotation: 0,
      opacity: 100,
      scaleX: 1,
      scaleY: 1,
      ...props,
      style: {
        ...defaultTextElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: TextElement, direction: Direction, dx: number, dy: number): TextElement {
    const MIN_SCALE = 0.1;
    const SCALE_FACTOR = 0.016;

    const scaleXChange = dx * SCALE_FACTOR;
    const scaleYChange = dy * SCALE_FACTOR;

    switch (direction) {
      case Direction.NW:
        element.x += dx;
        element.y += dy;
        element.scaleX = Math.max(MIN_SCALE, element.scaleX - scaleXChange);
        element.scaleY = Math.max(MIN_SCALE, element.scaleY - scaleYChange);
        break;
      case Direction.N:
        element.y += dy;
        element.scaleY = Math.max(MIN_SCALE, element.scaleY - scaleYChange);
        break;
      case Direction.NE:
        element.y += dy;
        element.scaleX = Math.max(MIN_SCALE, element.scaleX + scaleXChange);
        element.scaleY = Math.max(MIN_SCALE, element.scaleY - scaleYChange);
        break;
      case Direction.E:
        element.scaleX = Math.max(MIN_SCALE, element.scaleX + scaleXChange);
        break;
      case Direction.SE:
        element.scaleX = Math.max(MIN_SCALE, element.scaleX + scaleXChange);
        element.scaleY = Math.max(MIN_SCALE, element.scaleY + scaleYChange);
        break;
      case Direction.S:
        element.scaleY = Math.max(MIN_SCALE, element.scaleY + scaleYChange);
        break;
      case Direction.SW:
        element.x += dx;
        element.scaleX = Math.max(MIN_SCALE, element.scaleX - scaleXChange);
        element.scaleY = Math.max(MIN_SCALE, element.scaleY + scaleYChange);
        break;
      case Direction.W:
        element.x += dx;
        element.scaleX = Math.max(MIN_SCALE, element.scaleX - scaleXChange);
        break;
    }

    return element;
  }

  getBounds(element: TextElement): Bounds {
    const width = element.text.length * 10 * element.scaleX;
    const height = 20 * element.scaleY;
    return {
      minX: element.x,
      minY: element.y,
      maxX: element.x + width,
      maxY: element.y + height,
      width,
      height,
    };
  }

  hitTest(element: TextElement, pointA: Point, pointB: Point, threshold: number): boolean {
    const bounds = this.getBounds(element);
    return hitTestBoundingBox(bounds, pointA, pointB, threshold);
  }
}
