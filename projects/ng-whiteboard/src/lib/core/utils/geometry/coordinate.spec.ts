import { Point, WhiteboardConfig } from '../../types';
import { getCanvasCoordinates, snapPointToGrid, snapToAngle, snapToGrid } from './coordinate';

describe('Coordinate Utils', () => {
  describe('getCanvasCoordinates', () => {
    const config: WhiteboardConfig = {
      zoom: 2,
      x: 100,
      y: 100,
      elementsTranslation: { x: 10, y: 10 },
    } as WhiteboardConfig;

    it('should transform screen coordinates to canvas coordinates', () => {
      const screenPoint: Point = { x: 200, y: 200 };
      const result = getCanvasCoordinates(config, screenPoint);
      expect(result).toEqual({ x: 40, y: 40 }); // ((200 - 100) / 2) - 10
    });

    it('should handle negative coordinates', () => {
      const screenPoint: Point = { x: 0, y: 0 };
      const result = getCanvasCoordinates(config, screenPoint);
      expect(result).toEqual({ x: -60, y: -60 }); // ((0 - 100) / 2) - 10
    });
  });

  describe('snapToAngle', () => {
    it('should snap to 45-degree angle', () => {
      const result = snapToAngle(0, 0, 10, 8);
      expect(Math.round(result.a * (180 / Math.PI))).toBe(45);
    });

    it('should maintain distance when snapping', () => {
      const x1 = 0,
        y1 = 0;
      const x2 = 10,
        y2 = 10;
      const result = snapToAngle(x1, y1, x2, y2);
      const originalDist = Math.sqrt(200); // sqrt((10-0)^2 + (10-0)^2)
      const newDist = Math.sqrt((result.x - x1) ** 2 + (result.y - y1) ** 2);
      expect(Math.round(newDist)).toBe(Math.round(originalDist));
    });

    it('should handle horizontal movement', () => {
      const result = snapToAngle(0, 0, 10, 1);
      expect(Math.round(result.a * (180 / Math.PI))).toBe(0);
    });

    it('should handle vertical movement', () => {
      const result = snapToAngle(0, 0, 1, 10);
      expect(Math.round(result.a * (180 / Math.PI))).toBe(90);
    });
  });

  describe('snapToGrid', () => {
    it('should snap to nearest grid point', () => {
      expect(snapToGrid(14, 10)).toBe(10);
      expect(snapToGrid(16, 10)).toBe(20);
    });

    it('should handle negative numbers', () => {
      expect(snapToGrid(-14, 10)).toBe(-10);
      expect(snapToGrid(-16, 10)).toBe(-20);
    });

    it('should handle zero', () => {
      expect(snapToGrid(0, 10)).toBe(0);
    });

    it('should handle different grid sizes', () => {
      expect(snapToGrid(13, 5)).toBe(15);
      expect(snapToGrid(22, 25)).toBe(25);
    });
  });

  describe('snapPointToGrid', () => {
    it('should snap point to grid', () => {
      const point: Point = { x: 14, y: 16 };
      const result = snapPointToGrid(point, 10);
      expect(result).toEqual({ x: 10, y: 20 });
    });

    it('should handle negative coordinates', () => {
      const point: Point = { x: -14, y: -16 };
      const result = snapPointToGrid(point, 10);
      expect(result).toEqual({ x: -10, y: -20 });
    });

    it('should handle zero coordinates', () => {
      const point: Point = { x: 0, y: 0 };
      const result = snapPointToGrid(point, 10);
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should handle different grid sizes', () => {
      const point: Point = { x: 13, y: 22 };
      const result = snapPointToGrid(point, 5);
      expect(result).toEqual({ x: 15, y: 20 });
    });
  });
});
