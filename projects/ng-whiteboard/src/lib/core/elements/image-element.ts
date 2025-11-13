import { BaseElement, Bounds, Direction, ElementType, ElementUtil, Point, defaultElementStyle } from '../types';
import { generateId } from '../utils/common';
import { hitTestBoundingBox } from '../utils/drawing';

export interface ImageElement extends BaseElement {
  type: ElementType.Image;
  width: number;
  height: number;
  src: string | ArrayBuffer;
}

export class ImageElementUtil implements ElementUtil<ImageElement> {
  create(props: Partial<ImageElement>): ImageElement {
    return {
      type: ElementType.Image,
      id: generateId(),
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      src: '',
      rotation: 0,
      opacity: 100,
      zIndex: 1, // Default zIndex, will be overridden by tools
      selectAfterDraw: true, // Images should be selected after drawing by default
      ...props,
      style: {
        ...defaultElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: ImageElement, direction: Direction, dx: number, dy: number): ImageElement {
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

  getBounds(element: ImageElement): Bounds {
    return {
      minX: element.x,
      minY: element.y,
      maxX: element.x + element.width,
      maxY: element.y + element.height,
      width: element.width,
      height: element.height,
    };
  }

  hitTest(element: ImageElement, pointA: Point, pointB: Point, threshold: number): boolean {
    const bounds = this.getBounds(element);
    return hitTestBoundingBox(bounds, pointA, pointB, threshold);
  }
}
