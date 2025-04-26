import { calculatePath, getSvgPathFromStroke } from './path';

describe('Path Utils', () => {
  describe('calculatePath', () => {
    it('should generate path data for simple points', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];
      const result = calculatePath(points);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result).toContain('M'); // Move command
      expect(result).toContain('Q'); // Quadratic curve command
      expect(result).toContain('T'); // Smooth quadratic curve command
      expect(result).toContain('Z'); // Close path command
    });

    it('should handle custom size parameter', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ];
      const result = calculatePath(points, 2);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getSvgPathFromStroke', () => {
    it('should return empty string for too few points', () => {
      const points: [number, number][] = [
        [0, 0],
        [10, 10],
      ];
      const result = getSvgPathFromStroke(points);
      expect(result).toBe('');
    });

    it('should generate path data for sufficient points', () => {
      const points: [number, number][] = [
        [0, 0],
        [5, 5],
        [10, 10],
        [15, 15],
      ];
      const result = getSvgPathFromStroke(points);
      expect(result).toBeTruthy();
      expect(result).toContain('M');
      expect(result).toContain('Q');
      expect(result).toContain('T');
    });

    it('should handle closed path option', () => {
      const points: [number, number][] = [
        [0, 0],
        [5, 5],
        [10, 10],
        [15, 15],
      ];
      const closedResult = getSvgPathFromStroke(points, true);
      const openResult = getSvgPathFromStroke(points, false);

      expect(closedResult).toContain('Z');
      expect(openResult).not.toContain('Z');
    });

    it('should format numbers with fixed precision', () => {
      const points: [number, number][] = [
        [0.12345, 0.12345],
        [5.12345, 5.12345],
        [10.12345, 10.12345],
        [15.12345, 15.12345],
      ];
      const result = getSvgPathFromStroke(points);
      const numbers = result.match(/\d+\.\d+/g);
      numbers?.forEach((num) => {
        expect(num.split('.')[1].length).toBeLessThanOrEqual(2);
      });
    });
  });
});
