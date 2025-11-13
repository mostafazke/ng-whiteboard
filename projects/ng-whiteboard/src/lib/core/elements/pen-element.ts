import { BaseElement, Bounds, ElementType, ElementUtil, Point, defaultElementStyle } from '../types';
import { generateId } from '../utils/common';
import { hitTestPen, StrokeOptions } from '../utils/drawing';
import { calculateBoundingBox } from '../utils/geometry/bounds';

export interface PenElement extends BaseElement {
  type: ElementType.Pen;
  points: [number, number][];
  pathOptions?: StrokeOptions;
  isComplete?: boolean;
  isClosed?: boolean;
}

export class PenElementUtil implements ElementUtil<PenElement> {
  create(props: Partial<PenElement>): PenElement {
    return {
      type: ElementType.Pen,
      id: generateId(),
      x: 0,
      y: 0,
      points: [],
      rotation: 0,
      opacity: 100,
      zIndex: 1, // Default zIndex, will be overridden by tools
      selectAfterDraw: false, // Pen strokes should NOT be selected after drawing by default
      ...props,
      style: {
        ...defaultElementStyle,
        ...props.style,
      },
    };
  }

  resize(element: PenElement, direction: string, dx: number, dy: number): PenElement {
    const bounds = calculateBoundingBox(element.points);
    const { points, position } = this.getScaleFactors(direction, bounds, dx, dy);
    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    const [scaleX, scaleY] = points;

    if (bounds.width * scaleX < 10 || bounds.height * scaleY < 10) {
      return element;
    }

    element.x += position.x;
    element.y += position.y;
    element.points = element.points.map((point) => [
      centerX + (point[0] - centerX) * scaleX,
      centerY + (point[1] - centerY) * scaleY,
    ]);

    return element;
  }

  private getScaleFactors(direction: string, bounds: Bounds, dx: number, dy: number) {
    const points = [1, 1];
    const position = { x: 0, y: 0 };

    if (direction.includes('w')) {
      points[0] = (bounds.width - dx) / bounds.width;
      position.x += dx / 2;
    }
    if (direction.includes('n')) {
      points[1] = (bounds.height - dy) / bounds.height;
      position.y += dy / 2;
    }
    if (direction.includes('e')) {
      points[0] = (bounds.width + dx) / bounds.width;
      position.x += dx / 2;
    }
    if (direction.includes('s')) {
      points[1] = (bounds.height + dy) / bounds.height;
      position.y += dy / 2;
    }

    return { points, position };
  }

  getBounds(element: PenElement): Bounds {
    const { minX, minY, maxX, maxY, width, height } = calculateBoundingBox(element.points);
    return {
      minX: minX + element.x,
      minY: minY + element.y,
      maxX: maxX + element.x,
      maxY: maxY + element.y,
      width,
      height,
    };
  }

  hitTest(element: PenElement, pointA: Point, pointB: Point, threshold: number): boolean {
    return hitTestPen(element.points, pointA, pointB, threshold);
  }
}
