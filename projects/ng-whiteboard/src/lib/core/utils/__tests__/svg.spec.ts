import { calculateBoundingBox, calculatePath, getSvgPathFromStroke, svgToBase64, toSvgString } from '../svg';
import { FormatType } from '../../types';

describe('SVG Utils', () => {
  describe('toSvgString', () => {
    it('should return valid svg element as string', () => {
      const namespaceURI = 'http://www.w3.org/2000/svg';
      const svgNode = document.createElementNS(namespaceURI, 'svg');
      svgNode.setAttribute('fill', '#333');
      const svgString = toSvgString(svgNode);

      expect(typeof svgString).toBe('string');
      expect(svgString).toContain('<svg');
      expect(svgString).toContain('fill="#333"');
      expect(svgString).toContain(namespaceURI);
    });
  });

  describe('calculateBoundingBox', () => {
    it('should return zero bounds for empty points array', () => {
      const result = calculateBoundingBox([]);
      expect(result).toEqual({ x: 0, y: 0, width: 0, height: 0 });
    });

    it('should calculate correct bounding box for single point', () => {
      const result = calculateBoundingBox([[10, 20]]);
      expect(result).toEqual({ x: 10, y: 20, width: 0, height: 0 });
    });

    it('should calculate correct bounding box for multiple points', () => {
      const points = [
        [10, 20],
        [30, 40],
        [15, 25],
      ];
      const result = calculateBoundingBox(points);
      expect(result).toEqual({ x: 10, y: 20, width: 20, height: 20 });
    });
  });

  describe('calculatePath', () => {
    it('should generate path data with default size', () => {
      const points = [
        [0, 0],
        [10, 10],
        [20, 20],
        [30, 30],
      ];
      const result = calculatePath(points);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
      expect(result.startsWith('M')).toBeTruthy();
      expect(result.endsWith('Z')).toBeTruthy();
    });

    it('should generate path data with custom size', () => {
      const points = [
        [0, 0],
        [10, 10],
        [20, 20],
        [30, 30],
      ];
      const result = calculatePath(points, 2);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });

  describe('getSvgPathFromStroke', () => {
    it('should return empty string for less than 4 points', () => {
      const points = [
        [0, 0],
        [10, 10],
        [20, 20],
      ];
      const result = getSvgPathFromStroke(points);
      expect(result).toBe('');
    });

    it('should generate path without closing when closed is false', () => {
      const points = [
        [0, 0],
        [10, 10],
        [20, 20],
        [30, 30],
      ];
      const result = getSvgPathFromStroke(points, false);
      expect(result).not.toContain('Z');
    });

    it('should generate closed path by default', () => {
      const points = [
        [0, 0],
        [10, 10],
        [20, 20],
        [30, 30],
      ];
      const result = getSvgPathFromStroke(points);
      expect(result).toContain('Z');
    });
  });

  describe('svgToBase64', () => {
    it('should convert SVG to base64 PNG by default', () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';
      svgToBase64(svgString, 100, 100).then((result) => {
        //assert
        expect(result).toContain('data:image/png;base64,');
      });
    });

    it('should handle conversion errors', () => {
      const invalidSvg = 'invalid svg string';
      svgToBase64(invalidSvg, 100, 100).then((result) => {
        //assert
        expect(result).rejects.toBeTruthy();
      });
    });

    it('should convert to specified format', () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';
      svgToBase64(svgString, 100, 100, FormatType.Jpeg).then((result) => {
        //assert
        expect(result).toContain('data:image/jpeg;base64,');
      });
    });
  });
});
