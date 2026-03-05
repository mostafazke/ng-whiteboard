import { TestBed } from '@angular/core/testing';
import { ConnectionPointsService } from './connection-points.service';
import { ElementType, Point } from '../types';
import { RectangleElement } from './rectangle-element';
import { EllipseElement } from './ellipse-element';
import { createElement } from './element.utils';

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
      // cx global = 50 + 100 = 150, cy global = 50 + 75 = 125
      expect(top!.position.x).toBe(150);
      expect(top!.position.y).toBe(125 - 75); // cy - ry
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

      // Pointer near the top center (200, 100 + a little offset)
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

    it('should return false for pen elements', () => {
      const pen = createElement(ElementType.Pen, {});
      expect(service.isConnectable(pen)).toBe(false);
    });

    it('should return false for arrow elements', () => {
      const arrow = createElement(ElementType.Arrow, {});
      expect(service.isConnectable(arrow)).toBe(false);
    });
  });
});
