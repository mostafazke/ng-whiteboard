import { getSvgPathFromStroke } from './path';

describe('Path Utils', () => {
  describe('getSvgPathFromStroke', () => {
    it('should return circle path for single point', () => {
      const points: number[][] = [[5, 10]];
      const result = getSvgPathFromStroke(points);
      expect(result).toBeTruthy();
      expect(result).toContain('M 5 10');
      expect(result).toContain('a'); // Arc command for circle
    });

    it('should return line for two points', () => {
      const points: number[][] = [
        [0, 0],
        [10, 10],
      ];
      const result = getSvgPathFromStroke(points);
      expect(result).toBeTruthy();
      expect(result).toContain('M');
      expect(result).toContain('L');
    });

    it('should generate path data for sufficient points', () => {
      const points: number[][] = [
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
      const points: number[][] = [
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
      const points: number[][] = [
        [0.123456, 0.123456],
        [5.123456, 5.123456],
        [10.123456, 10.123456],
        [15.123456, 15.123456],
      ];
      const result = getSvgPathFromStroke(points);
      const numbers = result.match(/\d+\.\d+/g);
      numbers?.forEach((num) => {
        const decimals = num.split('.')[1];
        expect(decimals.length).toBeLessThanOrEqual(4);
      });
    });

    it('should handle three points correctly', () => {
      const points: number[][] = [
        [0, 0],
        [5, 5],
        [10, 10],
      ];
      const result = getSvgPathFromStroke(points);
      expect(result).toBeTruthy();
      expect(result).toContain('M');
      expect(result).toContain('Q');
    });
  });
});
