import { TestBed } from '@angular/core/testing';
import { ConnectionPointsService } from './connection-points.service';
import { ElementType, Point } from '../types';
import { RectangleElement } from './rectangle-element';
import { EllipseElement } from './ellipse-element';
import { createElement, getElementUtil } from './element.utils';

describe('ConnectionPointsService', () => {
  let service: ConnectionPointsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConnectionPointsService],
    });
    service = TestBed.inject(ConnectionPointsService);
  });

  describe('getConnectionPoints', () => {
    it('should return 8 connection points for a rectangle', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const points = service.getConnectionPoints(rect);
      expect(points.length).toBe(8);

      const top = points.find((p) => p.id === 'top');
      expect(top).toBeTruthy();
      expect(top!.position.x).toBe(200); // x + width/2
      expect(top!.position.y).toBe(100); // y (top edge)
    });

    it('should return 8 connection points for an ellipse', () => {
      const ellipse = createElement(ElementType.Ellipse, {
        x: 50,
        y: 50,
        cx: 100,
        cy: 75,
        rx: 100,
        ry: 75,
      }) as EllipseElement;

      const points = service.getConnectionPoints(ellipse);
      expect(points.length).toBe(8);

      const top = points.find((p) => p.id === 'top');
      expect(top).toBeTruthy();
      expect(top!.position.x).toBe(150);
      expect(top!.position.y).toBe(125 - 75);
    });

    it('should return 4 connection points for an image', () => {
      const image = createElement(ElementType.Image, {
        x: 10,
        y: 20,
        width: 100,
        height: 80,
      });

      const points = service.getConnectionPoints(image);
      expect(points.length).toBe(4);

      const top = points.find((p) => p.id === 'top');
      expect(top).toBeTruthy();
      expect(top!.position.x).toBe(60); // 10 + 100/2
      expect(top!.position.y).toBe(20);

      const right = points.find((p) => p.id === 'right');
      expect(right!.position.x).toBe(110); // 10 + 100
      expect(right!.position.y).toBe(60); // 20 + 80/2

      const bottom = points.find((p) => p.id === 'bottom');
      expect(bottom!.position.y).toBe(100); // 20 + 80

      const left = points.find((p) => p.id === 'left');
      expect(left!.position.x).toBe(10);
    });

    it('should return bounds-based connection points for text', () => {
      const text = createElement(ElementType.Text, {
        x: 0,
        y: 0,
        text: 'Hello',
      });

      const points = service.getConnectionPoints(text);
      expect(points.length).toBe(4);
      expect(points.map((p) => p.id)).toEqual(['top', 'right', 'bottom', 'left']);
    });

    it('should fall back to bounds-based connection points for unknown types', () => {
      const pen = createElement(ElementType.Pen, {
        x: 0,
        y: 0,
        points: [
          [0, 0],
          [100, 100],
        ],
      });

      const points = service.getConnectionPoints(pen);
      expect(points.length).toBe(4);
      expect(points.map((p) => p.id)).toEqual(['top', 'right', 'bottom', 'left']);
    });
  });

  describe('findSnapTarget', () => {
    it('should find nearest connection point within snap radius', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const pointer: Point = { x: 205, y: 105 };
      const result = service.findSnapTarget(pointer, [rect], new Set(), 20);

      expect(result).toBeTruthy();
      expect(result!.elementId).toBe(rect.id);
    });

    it('should return null when no shape is within snap radius', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const pointer: Point = { x: 0, y: 0 };
      const result = service.findSnapTarget(pointer, [rect], new Set(), 20);

      expect(result).toBeNull();
    });

    it('should exclude specified element IDs', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const pointer: Point = { x: 200, y: 100 };
      const result = service.findSnapTarget(pointer, [rect], new Set([rect.id]), 20);

      expect(result).toBeNull();
    });

    it('should skip non-connectable elements', () => {
      const arrow = createElement(ElementType.Arrow, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      });

      const pointer: Point = { x: 50, y: 50 };
      const result = service.findSnapTarget(pointer, [arrow], new Set(), 50);

      expect(result).toBeNull();
    });

    it('should snap to closest edge when no named point is closer', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      }) as RectangleElement;

      // Point near the top edge between named points
      const pointer: Point = { x: 60, y: 5 };
      const result = service.findSnapTarget(pointer, [rect], new Set(), 30);

      expect(result).toBeTruthy();
      expect(result!.elementId).toBe(rect.id);
    });

    it('should prefer closer snap result', () => {
      const rect1 = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;
      const rect2 = createElement(ElementType.Rectangle, {
        x: 200,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      // Near top of rect1
      const pointer: Point = { x: 50, y: 2 };
      const result = service.findSnapTarget(pointer, [rect1, rect2], new Set(), 20);

      expect(result).toBeTruthy();
      expect(result!.elementId).toBe(rect1.id);
    });

    it('should snap to ellipse edge points', () => {
      const ellipse = createElement(ElementType.Ellipse, {
        x: 0,
        y: 0,
        cx: 100,
        cy: 100,
        rx: 100,
        ry: 100,
      }) as EllipseElement;

      // Right of the ellipse center, near the edge
      const pointer: Point = { x: 195, y: 100 };
      const result = service.findSnapTarget(pointer, [ellipse], new Set(), 20);

      expect(result).toBeTruthy();
      expect(result!.elementId).toBe(ellipse.id);
    });

    it('should use default snap radius', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const pointer: Point = { x: 200, y: 115 };
      const result = service.findSnapTarget(pointer, [rect], new Set());

      expect(result).toBeTruthy();
    });

    it('should handle fallback element types for edge point', () => {
      const text = createElement(ElementType.Text, {
        x: 0,
        y: 0,
        text: 'Hello',
      });

      // Pointer near the text bounds
      const pointer: Point = { x: 2, y: 2 };
      const result = service.findSnapTarget(pointer, [text], new Set(), 30);

      expect(result).toBeTruthy();
    });
  });

  describe('resolveBindingPoint', () => {
    it('should resolve to named connection point with gap offset', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const result = service.resolveBindingPoint(rect, 'top', { x: 100, y: -50 }, 5);

      // top point: (100, 0) with normal (0, -1), gap 5 → (100, -5)
      expect(result.x).toBe(100);
      expect(result.y).toBe(-5);
    });

    it('should resolve to named connection point with zero gap', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const result = service.resolveBindingPoint(rect, 'right', { x: 300, y: 50 }, 0);

      // right point: (200, 50) with normal (1, 0), gap 0 → (200, 50)
      expect(result.x).toBe(200);
      expect(result.y).toBe(50);
    });

    it('should fallback to closest edge when pointId is null', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const result = service.resolveBindingPoint(rect, null, { x: 300, y: 50 }, 5);

      // Should find the closest edge point from center toward (300, 50)
      expect(result).toBeDefined();
      expect(typeof result.x).toBe('number');
      expect(typeof result.y).toBe('number');
    });

    it('should fallback when pointId does not match any connection point', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 200,
        height: 100,
      }) as RectangleElement;

      const result = service.resolveBindingPoint(rect, 'nonexistent', { x: 300, y: 50 }, 5);

      expect(result).toBeDefined();
    });

    it('should return element center when edge point is null', () => {
      // Use an element type whose getClosestEdgePoint returns null if possible
      // For fallback, force it through a mock scenario
      const line = createElement(ElementType.Line, {
        x: 50,
        y: 50,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      });

      const result = service.resolveBindingPoint(line, null, { x: 100, y: 100 }, 0);
      expect(result).toBeDefined();
    });
  });

  describe('getElementCenter', () => {
    it('should return the center of a rectangle', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 100,
        y: 200,
        width: 50,
        height: 80,
      }) as RectangleElement;

      const center = service.getElementCenter(rect);
      expect(center.x).toBe(125); // 100 + 50/2
      expect(center.y).toBe(240); // 200 + 80/2
    });

    it('should return the center of an ellipse', () => {
      const ellipse = createElement(ElementType.Ellipse, {
        x: 10,
        y: 20,
        cx: 50,
        cy: 40,
        rx: 50,
        ry: 40,
      }) as EllipseElement;

      const center = service.getElementCenter(ellipse);
      expect(typeof center.x).toBe('number');
      expect(typeof center.y).toBe('number');
    });
  });

  describe('isConnectable', () => {
    it('should return true for rectangles', () => {
      const rect = createElement(ElementType.Rectangle, {}) as RectangleElement;
      expect(service.isConnectable(rect)).toBe(true);
    });

    it('should return true for ellipses', () => {
      const ellipse = createElement(ElementType.Ellipse, {}) as EllipseElement;
      expect(service.isConnectable(ellipse)).toBe(true);
    });

    it('should return true for images', () => {
      const image = createElement(ElementType.Image, {});
      expect(service.isConnectable(image)).toBe(true);
    });

    it('should return true for text', () => {
      const text = createElement(ElementType.Text, {});
      expect(service.isConnectable(text)).toBe(true);
    });

    it('should return false for pen elements', () => {
      const pen = createElement(ElementType.Pen, {});
      expect(service.isConnectable(pen)).toBe(false);
    });

    it('should return false for arrow elements', () => {
      const arrow = createElement(ElementType.Arrow, {});
      expect(service.isConnectable(arrow)).toBe(false);
    });

    it('should return false for line elements', () => {
      const line = createElement(ElementType.Line, {});
      expect(service.isConnectable(line)).toBe(false);
    });
  });

  describe('edge point helpers (via findSnapTarget / resolveBindingPoint)', () => {
    it('should handle closestRectEdgePoint with dx=0 and dy=0 (center target)', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      // Target exactly at center → should return top edge point (x:50, y:0)
      const result = service.resolveBindingPoint(rect, null, { x: 50, y: 50 }, 0);
      expect(result).toEqual({ x: 50, y: 0 });
    });

    it('should handle closestRectEdgePoint projecting to right edge', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      }) as RectangleElement;

      const result = service.resolveBindingPoint(rect, null, { x: 200, y: 50 }, 0);
      expect(result.x).toBeCloseTo(100, 1);
      expect(result.y).toBeCloseTo(50, 1);
    });

    it('should handle closestRectEdgePoint projecting to bottom edge', () => {
      const rect = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      }) as RectangleElement;

      const result = service.resolveBindingPoint(rect, null, { x: 50, y: 200 }, 0);
      expect(result.y).toBeCloseTo(50, 1);
    });

    it('should handle closestEllipseEdgePoint', () => {
      const ellipse = createElement(ElementType.Ellipse, {
        x: 0,
        y: 0,
        cx: 100,
        cy: 100,
        rx: 100,
        ry: 50,
      }) as EllipseElement;

      // Target to the right
      const result = service.resolveBindingPoint(ellipse, null, { x: 300, y: 100 }, 0);
      expect(result.x).toBeCloseTo(200, 0); // cx + rx
      expect(result.y).toBeCloseTo(100, 0);
    });

    it('should handle closestBoundsEdgePoint with center target (dx=0, dy=0)', () => {
      // Use a Line element which goes through the default branch of getClosestEdgePoint
      const line = createElement(ElementType.Line, {
        x: 0,
        y: 0,
        x1: 0,
        y1: 0,
        x2: 100,
        y2: 100,
      });

      // Get exact bounds center
      const util = getElementUtil(ElementType.Line);
      const bounds = util.getBounds(line);
      const exactCenter: Point = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      };
      const resolved = service.resolveBindingPoint(line, null, exactCenter, 0);
      expect(resolved).toBeDefined();
    });

    it('should handle closestBoundsEdgePoint with non-center target', () => {
      const pen = createElement(ElementType.Pen, {
        x: 0,
        y: 0,
        points: [
          [0, 0],
          [100, 100],
        ],
      });

      const result = service.resolveBindingPoint(pen, null, { x: 200, y: 50 }, 0);
      expect(result).toBeDefined();
      expect(typeof result.x).toBe('number');
    });
  });
});
