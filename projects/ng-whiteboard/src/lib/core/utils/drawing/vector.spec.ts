import { add, sub, mul, div, dist, dist2, lrp, toPoint, equals } from './vector';

describe('Vector Utils', () => {
  describe('add', () => {
    it('should add two vectors', () => {
      const result = add([1, 2], [3, 4]);
      expect(result).toEqual([4, 6]);
    });

    it('should handle negative values', () => {
      const result = add([1, -2], [-3, 4]);
      expect(result).toEqual([-2, 2]);
    });

    it('should handle zero vectors', () => {
      const result = add([0, 0], [5, 5]);
      expect(result).toEqual([5, 5]);
    });
  });

  describe('sub', () => {
    it('should subtract two vectors', () => {
      const result = sub([5, 7], [2, 3]);
      expect(result).toEqual([3, 4]);
    });

    it('should handle negative results', () => {
      const result = sub([1, 2], [3, 4]);
      expect(result).toEqual([-2, -2]);
    });

    it('should handle zero result', () => {
      const result = sub([5, 5], [5, 5]);
      expect(result).toEqual([0, 0]);
    });
  });

  describe('mul', () => {
    it('should multiply vector by scalar', () => {
      const result = mul([3, 4], 2);
      expect(result).toEqual([6, 8]);
    });

    it('should handle negative scalar', () => {
      const result = mul([3, 4], -2);
      expect(result).toEqual([-6, -8]);
    });

    it('should handle zero scalar', () => {
      const result = mul([3, 4], 0);
      expect(result).toEqual([0, 0]);
    });

    it('should handle fractional scalar', () => {
      const result = mul([4, 6], 0.5);
      expect(result).toEqual([2, 3]);
    });
  });

  describe('div', () => {
    it('should divide vector by scalar', () => {
      const result = div([6, 8], 2);
      expect(result).toEqual([3, 4]);
    });

    it('should handle fractional results', () => {
      const result = div([5, 7], 2);
      expect(result).toEqual([2.5, 3.5]);
    });

    it('should handle negative divisor', () => {
      const result = div([6, 8], -2);
      expect(result).toEqual([-3, -4]);
    });
  });

  describe('dist2', () => {
    it('should calculate squared distance between two points', () => {
      const result = dist2([0, 0], [3, 4]);
      expect(result).toBe(25);
    });

    it('should return zero for same point', () => {
      const result = dist2([5, 5], [5, 5]);
      expect(result).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const result = dist2([-1, -1], [2, 3]);
      expect(result).toBe(25);
    });
  });

  describe('dist', () => {
    it('should calculate distance between two points', () => {
      const result = dist([0, 0], [3, 4]);
      expect(result).toBe(5);
    });

    it('should return zero for same point', () => {
      const result = dist([5, 5], [5, 5]);
      expect(result).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const result = dist([0, 0], [-3, -4]);
      expect(result).toBe(5);
    });

    it('should calculate horizontal distance', () => {
      const result = dist([0, 0], [10, 0]);
      expect(result).toBe(10);
    });

    it('should calculate vertical distance', () => {
      const result = dist([0, 0], [0, 10]);
      expect(result).toBe(10);
    });
  });

  describe('lrp', () => {
    it('should interpolate at t=0 (returns A)', () => {
      const result = lrp([0, 0], [10, 10], 0);
      expect(result).toEqual([0, 0]);
    });

    it('should interpolate at t=1 (returns B)', () => {
      const result = lrp([0, 0], [10, 10], 1);
      expect(result).toEqual([10, 10]);
    });

    it('should interpolate at t=0.5 (midpoint)', () => {
      const result = lrp([0, 0], [10, 10], 0.5);
      expect(result).toEqual([5, 5]);
    });

    it('should interpolate at t=0.25', () => {
      const result = lrp([0, 0], [100, 100], 0.25);
      expect(result).toEqual([25, 25]);
    });

    it('should handle negative coordinates', () => {
      const result = lrp([-10, -10], [10, 10], 0.5);
      expect(result).toEqual([0, 0]);
    });
  });

  describe('toPoint', () => {
    it('should convert array with all values', () => {
      const result = toPoint([1, 2, 0.5]);
      expect(result).toEqual([1, 2, 0.5]);
    });

    it('should handle missing pressure (default to 1)', () => {
      const result = toPoint([3, 4]);
      expect(result).toEqual([3, 4, 1]);
    });

    it('should handle missing y and pressure', () => {
      const result = toPoint([5]);
      expect(result).toEqual([5, 0, 1]);
    });

    it('should handle empty array', () => {
      const result = toPoint([]);
      expect(result).toEqual([0, 0, 1]);
    });

    it('should preserve pressure value', () => {
      const result = toPoint([10, 20, 0.75]);
      expect(result[2]).toBe(0.75);
    });
  });

  describe('equals', () => {
    it('should return true for equal vectors', () => {
      const result = equals([3, 4], [3, 4]);
      expect(result).toBe(true);
    });

    it('should return false for different vectors', () => {
      const result = equals([3, 4], [3, 5]);
      expect(result).toBe(false);
    });

    it('should return true for very close values (within epsilon)', () => {
      const result = equals([3, 4], [3.00001, 4.00001]);
      expect(result).toBe(true);
    });

    it('should return false for values outside epsilon', () => {
      const result = equals([3, 4], [3.01, 4]);
      expect(result).toBe(false);
    });

    it('should handle negative coordinates', () => {
      expect(equals([-3, -4], [-3, -4])).toBe(true);
      expect(equals([-3, -4], [-3, -5])).toBe(false);
    });

    it('should handle zero vectors', () => {
      expect(equals([0, 0], [0, 0])).toBe(true);
      expect(equals([0, 0], [0.00001, 0])).toBe(true);
    });
  });
});
