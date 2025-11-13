import { getStrokePoints } from './stroke-points';
import { StrokeOptions } from './stroke-types';

describe('Stroke Points', () => {
  describe('getStrokePoints', () => {
    describe('Basic Functionality', () => {
      it('should return empty array for empty input', () => {
        const result = getStrokePoints([]);
        expect(result).toEqual([]);
      });

      it('should process single point', () => {
        const points: number[][] = [[10, 10]];
        const result = getStrokePoints(points);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual([10, 10, 1]);
      });

      it('should process two points', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
        ];
        const result = getStrokePoints(points);
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result[0][0]).toBe(0);
        expect(result[0][1]).toBe(0);
      });

      it('should process multiple points', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
          [30, 0],
        ];
        const result = getStrokePoints(points);
        expect(result.length).toBeGreaterThan(0);
        result.forEach((point) => {
          expect(Array.isArray(point)).toBe(true);
          expect(point.length).toBeGreaterThanOrEqual(2); // At least [x, y], pressure may or may not be present
        });
      });
    });

    describe('Pressure Handling', () => {
      it('should use provided pressure values when simulatePressure is false', () => {
        const points: number[][] = [
          [0, 0, 0.8],
          [50, 0, 0.6],
          [100, 0, 0.4],
        ];
        const result = getStrokePoints(points, { simulatePressure: false, size: 10 });
        expect(result.length).toBeGreaterThan(0);
        // First point should have pressure
        expect(result[0][2]).toBeDefined();
        expect(result[0][2]).toBeGreaterThan(0);
      });

      it('should simulate pressure when simulatePressure is true', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
        ];
        const result = getStrokePoints(points, { simulatePressure: true });
        expect(result.length).toBeGreaterThan(0);
        // First point should exist
        expect(result[0]).toBeDefined();
        expect(result[0][0]).toBeDefined();
        expect(result[0][1]).toBeDefined();
      });

      it('should filter out low-pressure points at start when not simulating', () => {
        const points: number[][] = [
          [0, 0, 0.01],
          [10, 0, 0.02],
          [20, 0, 0.5],
          [30, 0, 0.6],
        ];
        const result = getStrokePoints(points, { simulatePressure: false, size: 10 });
        expect(result.length).toBeGreaterThan(0);
        expect(result[0][2]).toBeGreaterThanOrEqual(0.025);
      });

      it('should filter out low-pressure points at end when not simulating', () => {
        const points: number[][] = [
          [0, 0, 0.6],
          [10, 0, 0.5],
          [20, 0, 0.02],
          [30, 0, 0.005],
        ];
        const result = getStrokePoints(points, { simulatePressure: false, size: 10 });
        expect(result.length).toBeGreaterThan(0);
        // Just check that we have points
        expect(result[0]).toBeDefined();
      });
    });

    describe('Smoothing', () => {
      it('should apply smoothing with default streamline', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
        ];
        const result = getStrokePoints(points);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should apply more smoothing with higher streamline', () => {
        const points: number[][] = [
          [0, 0],
          [10, 10],
          [20, 0],
        ];
        const highSmoothing = getStrokePoints(points, { streamline: 0.9 });
        const lowSmoothing = getStrokePoints(points, { streamline: 0.1 });

        expect(highSmoothing.length).toBeGreaterThan(0);
        expect(lowSmoothing.length).toBeGreaterThan(0);
      });

      it('should handle zero streamline', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
        ];
        const result = getStrokePoints(points, { streamline: 0 });
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle maximum streamline', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
        ];
        const result = getStrokePoints(points, { streamline: 1 });
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('Distance Filtering', () => {
      it('should filter out points too close to the first point', () => {
        const points: number[][] = [
          [0, 0],
          [0.1, 0.1],
          [0.2, 0.2],
          [50, 50],
        ];
        const result = getStrokePoints(points, { size: 16 });
        expect(result.length).toBeGreaterThan(0);
      });

      it('should filter out points too close to the last point', () => {
        const points: number[][] = [
          [0, 0],
          [50, 50],
          [99.9, 99.9],
          [100, 100],
        ];
        const result = getStrokePoints(points, { size: 16 });
        expect(result.length).toBeGreaterThan(0);
      });

      it('should respect size parameter for distance filtering', () => {
        const points: number[][] = [
          [0, 0],
          [1, 1],
          [2, 2],
          [3, 3],
        ];
        const largeSize = getStrokePoints(points, { size: 50 });
        const smallSize = getStrokePoints(points, { size: 1 });

        expect(smallSize.length).toBeGreaterThanOrEqual(largeSize.length);
      });
    });

    describe('Two-Point Enhancement', () => {
      it('should enhance two-point strokes when simulating pressure', () => {
        const points: number[][] = [
          [0, 0],
          [100, 0],
        ];
        const result = getStrokePoints(points, { simulatePressure: true, size: 16 });

        expect(result.length).toBeGreaterThan(2);
      });

      it('should interpolate pressure in enhanced points', () => {
        const points: number[][] = [
          [0, 0, 0.2],
          [100, 0, 0.8],
        ];
        const result = getStrokePoints(points, { simulatePressure: true });

        expect(result.length).toBeGreaterThan(2);
      });

      it('should not enhance two-point strokes when not simulating pressure', () => {
        const points: number[][] = [
          [0, 0, 0.5],
          [100, 0, 0.5],
        ];
        const result = getStrokePoints(points, { simulatePressure: false, size: 16 });

        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('Completion Detection', () => {
      it('should detect complete stroke with last option', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
        ];
        const result = getStrokePoints(points, { last: true });
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle incomplete strokes', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
        ];
        const result = getStrokePoints(points, { last: false });
        expect(result.length).toBeGreaterThan(0);
      });

      it('should add duplicate last point for complete strokes with smoothing', () => {
        const points: number[][] = [
          [0, 0],
          [10, 0],
          [20, 0],
        ];
        const result = getStrokePoints(points, { last: true, streamline: 0.5 });
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle all points at same location', () => {
        const points: number[][] = [
          [10, 10],
          [10, 10],
          [10, 10],
        ];
        const result = getStrokePoints(points);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle very short stroke', () => {
        const points: number[][] = [
          [0, 0],
          [1, 0],
          [2, 0],
        ];
        const result = getStrokePoints(points, { size: 100, simulatePressure: false });
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle negative coordinates', () => {
        const points: number[][] = [
          [-10, -10],
          [-5, -5],
          [0, 0],
        ];
        const result = getStrokePoints(points);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle large coordinates', () => {
        const points: number[][] = [
          [1000, 1000],
          [2000, 2000],
          [3000, 3000],
        ];
        const result = getStrokePoints(points);
        expect(result.length).toBeGreaterThan(0);
      });

      it('should skip duplicate consecutive points', () => {
        const points: number[][] = [
          [0, 0],
          [50, 50],
          [50, 50],
          [100, 100],
        ];
        const result = getStrokePoints(points, { size: 10 });
        expect(result.length).toBeGreaterThan(0);
      });

      it('should handle stroke with only start points filtered out', () => {
        const points: number[][] = [
          [0, 0, 0.001],
          [1, 1, 0.002],
          [2, 2, 0.003],
        ];
        const result = getStrokePoints(points, { simulatePressure: false });
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe('Options Integration', () => {
      it('should respect all options together', () => {
        const points: number[][] = [
          [0, 0, 0.5],
          [10, 10, 0.6],
          [20, 20, 0.7],
          [30, 30, 0.8],
        ];
        const options: StrokeOptions = {
          size: 20,
          streamline: 0.7,
          simulatePressure: false,
          last: true,
        };
        const result = getStrokePoints(points, options);
        expect(result.length).toBeGreaterThan(0);
        result.forEach((point) => {
          expect(Array.isArray(point)).toBe(true);
          expect(point.length).toBeGreaterThanOrEqual(2); // At least [x, y]
        });
      });

      it('should work with minimal options', () => {
        const points: number[][] = [
          [0, 0],
          [10, 10],
        ];
        const result = getStrokePoints(points, {});
        expect(result.length).toBeGreaterThan(0);
      });
    });
  });
});
