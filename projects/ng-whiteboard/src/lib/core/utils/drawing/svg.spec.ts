import { FormatType } from '../../types';
import { toSvgString, svgToBase64 } from './svg';

describe('SVG Utils', () => {
  describe('toSvgString', () => {
    it('should convert SVG node to string', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '100');
      svgNode.appendChild(rect);

      const result = toSvgString(svgNode);
      expect(result).toContain('<svg');
      expect(result).toContain('<rect');
      expect(result).toContain('width="100"');
      expect(result).toContain('height="100"');
    });

    it('should handle xlink attributes', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
      image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', 'test.png');
      svgNode.appendChild(image);

      const result = toSvgString(svgNode);
      expect(result).toContain('xmlns:xlink=');
      expect(result).toContain('xlink:href="test.png"');
    });
  });

  describe('svgToBase64', () => {
    it('should convert SVG string to base64 PNG', () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';

      svgToBase64(svgString, 100, 100, FormatType.Jpeg).then((result) => {
        expect(result).toContain('data:image/jpeg;base64,');
      });
    });

    it('should convert SVG string to specified format', () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';

      svgToBase64(svgString, 100, 100, FormatType.Jpeg).then((result) => {
        expect(result).toContain('data:image/jpeg;base64,');
      });
    });

    it('should handle SVG with specified dimensions', () => {
      const svgString = '<svg width="200" height="200"><rect width="100" height="100"/></svg>';

      svgToBase64(svgString, 100, 100).then((result) => {
        expect(result).toContain('data:image/png;base64,');
      });
    });

    it('should reject on invalid SVG', () => {
      const invalidSvg = '<invalid>svg</invalid>';
      svgToBase64(invalidSvg, 100, 100).then((result) => {
        expect(result).rejects.toBeTruthy();
      });
    });
  });
});
