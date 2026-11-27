import { BaseElement, Bounds, Direction, ElementType, ElementUtil, Point, defaultElementStyle } from '../types';
import { generateId } from '../utils/common';
import { hitTestBoundingBox } from '../utils/drawing';
import { boxBounds, resizeBox } from './rectangle-element';

export interface ShapeElement extends BaseElement {
  type: ElementType.Shape;
  shapeId: string;
  path: string;
  width: number;
  height: number;
}

export class ShapeElementUtil implements ElementUtil<ShapeElement> {
  create(props: Partial<ShapeElement>): ShapeElement {
    return {
      type: ElementType.Shape,
      id: generateId(),
      x: 0,
      y: 0,
      shapeId: '',
      path: '',
      width: 1,
      height: 1,
      rotation: 0,
      opacity: 100,
      zIndex: 1,
      selectAfterDraw: true,
      ...props,
      style: {
        ...defaultElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: ShapeElement, direction: Direction, dx: number, dy: number): ShapeElement {
    return resizeBox(element, direction, dx, dy);
  }

  getBounds(element: ShapeElement): Bounds {
    return boxBounds(element);
  }

  hitTest(element: ShapeElement, pointA: Point, pointB: Point, threshold: number): boolean {
    return hitTestBoundingBox(this.getBounds(element), pointA, pointB, threshold);
  }
}
