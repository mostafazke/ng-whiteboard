import { Point, WhiteboardConfig } from '../../types';
import { getCanvasCoordinates, snapPointToGrid, snapToAngle, snapToGrid } from './coordinate';
import { createMockWhiteboardConfig } from '../../testing';

describe('Coordinate Utils', () => {
  describe('getCanvasCoordinates', () => {
    const config: WhiteboardConfig = createMockWhiteboardConfig({
      zoom: 2,
      x: 100,
      y: 100,
      canvasX: 0,
      canvasY: 0,
      fullScreen: true,
    });

    it('should transform screen coordinates to canvas coordinates in fullScreen mode', () => {
      const screenPoint: Point = { x: 200, y: 200 };
      const result = getCanvasCoordinates(config, screenPoint);
      // In fullScreen: realX = point.x / zoom - x = 200/2 - 100 = 0
      expect(result).toEqual({ x: 0, y: 0 });
    });

    it('should handle negative coordinates in fullScreen mode', () => {
      const screenPoint: Point = { x: 0, y: 0 };
      const result = getCanvasCoordinates(config, screenPoint);
      // In fullScreen: realX = point.x / zoom - x = 0/2 - 100 = -100
      expect(result).toEqual({ x: -100, y: -100 });
    });

    it('should transform screen coordinates to canvas coordinates in normal mode', () => {
      const normalConfig: WhiteboardConfig = createMockWhiteboardConfig({
        zoom: 2,
        x: 100,
        y: 100,
        canvasX: 50,
        canvasY: 50,
        fullScreen: false,
      });
      const screenPoint: Point = { x: 200, y: 200 };
      const result = getCanvasCoordinates(normalConfig, screenPoint);
      // In normal: relativeX = 200-50=150, realX = 150/2 - 100 = -25
      expect(result).toEqual({ x: -25, y: -25 });
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

    it('should handle exact grid values', () => {
      expect(snapToGrid(10, 10)).toBe(10);
      expect(snapToGrid(20, 10)).toBe(20);
    });

    it('should handle small grid sizes', () => {
      expect(snapToGrid(7, 2)).toBe(8);
      expect(snapToGrid(6, 2)).toBe(6);
    });

    it('should handle large grid sizes', () => {
      expect(snapToGrid(75, 100)).toBe(100);
      expect(snapToGrid(25, 100)).toBe(0);
    });

    it('should handle decimal grid sizes', () => {
      expect(snapToGrid(1.7, 0.5)).toBe(1.5);
      expect(snapToGrid(1.8, 0.5)).toBe(2);
    });

    it('should handle midpoint values (round to nearest even)', () => {
      expect(snapToGrid(15, 10)).toBe(20);
      expect(snapToGrid(25, 10)).toBe(30);
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

    it('should handle mixed positive and negative coordinates', () => {
      const point: Point = { x: -7, y: 13 };
      const result = snapPointToGrid(point, 5);
      expect(result).toEqual({ x: -5, y: 15 });
    });

    it('should handle decimal coordinates', () => {
      const point: Point = { x: 7.6, y: 3.2 };
      const result = snapPointToGrid(point, 2);
      expect(result).toEqual({ x: 8, y: 4 });
    });

    it('should snap independently on x and y axes', () => {
      const point: Point = { x: 14, y: 26 };
      const result = snapPointToGrid(point, 10);
      expect(result).toEqual({ x: 10, y: 30 });
    });

    it('should return new point object (not mutate original)', () => {
      const point: Point = { x: 14, y: 16 };
      const result = snapPointToGrid(point, 10);
      expect(result).not.toBe(point);
      expect(point).toEqual({ x: 14, y: 16 }); // Original unchanged
    });
  });
});
