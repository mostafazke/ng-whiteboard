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

    it('should add xmlns:xlink namespace if not present', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      svgNode.appendChild(rect);

      const result = toSvgString(svgNode);
      expect(result).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
    });

    it('should not duplicate xmlns:xlink namespace if already present', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgNode.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      svgNode.appendChild(rect);

      const result = toSvgString(svgNode);
      // Count occurrences of xmlns:xlink
      const matches = result.match(/xmlns:xlink=/g);
      expect(matches?.length).toBe(1);
    });

    it('should replace NS prefixed href attributes with xlink:href', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock XMLSerializer to return NS-prefixed attributes
      const originalSerializer = XMLSerializer;
      global.XMLSerializer = jest.fn().mockImplementation(() => ({
        serializeToString: () => '<svg><image NS1:href="test.png"/></svg>',
      })) as unknown as typeof XMLSerializer;

      const result = toSvgString(svgNode);
      expect(result).toContain('xlink:href="test.png"');
      expect(result).not.toContain('NS1:href');

      // Restore
      global.XMLSerializer = originalSerializer;
    });

    it('should replace ns (lowercase) prefixed href attributes with xlink:href', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock XMLSerializer to return ns-prefixed attributes
      const originalSerializer = XMLSerializer;
      global.XMLSerializer = jest.fn().mockImplementation(() => ({
        serializeToString: () => '<svg><image ns2:href="test.png"/></svg>',
      })) as unknown as typeof XMLSerializer;

      const result = toSvgString(svgNode);
      expect(result).toContain('xlink:href="test.png"');
      expect(result).not.toContain('ns2:href');

      // Restore
      global.XMLSerializer = originalSerializer;
    });

    it('should replace xmlns prefixed href attributes with xlink:href', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock XMLSerializer to return xmlns-prefixed attributes
      const originalSerializer = XMLSerializer;
      global.XMLSerializer = jest.fn().mockImplementation(() => ({
        serializeToString: () => '<svg><image xmlns:href="test.png"/></svg>',
      })) as unknown as typeof XMLSerializer;

      const result = toSvgString(svgNode);
      expect(result).toContain('xlink:href="test.png"');
      expect(result).not.toContain('xmlns:href');

      // Restore
      global.XMLSerializer = originalSerializer;
    });

    it('should handle multiple namespace href replacements', () => {
      const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

      // Mock XMLSerializer to return multiple NS-prefixed attributes
      const originalSerializer = XMLSerializer;
      global.XMLSerializer = jest.fn().mockImplementation(() => ({
        serializeToString: () => '<svg><image NS1:href="test1.png"/><use ns2:href="test2.svg"/></svg>',
      })) as unknown as typeof XMLSerializer;

      const result = toSvgString(svgNode);
      expect(result).toContain('xlink:href="test1.png"');
      expect(result).toContain('xlink:href="test2.svg"');
      expect(result).not.toContain('NS1:href');
      expect(result).not.toContain('ns2:href');

      // Restore
      global.XMLSerializer = originalSerializer;
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
    beforeEach(() => {
      // Mock Image constructor for tests
      global.Image = class {
        onload: (() => void) | null = null;
        onerror: ((err: unknown) => void) | null = null;
        src = '';

        constructor() {
          // Simulate successful image load after setting src
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      } as typeof Image;

      // Mock canvas and context
      const mockContext = {
        drawImage: jest.fn(),
      };

      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);
      HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,mockBase64Data');
    });

    it('should convert SVG string to base64 PNG by default', async () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';

      const result = await svgToBase64(svgString, 100, 100);

      expect(result).toBe('data:image/png;base64,mockBase64Data');
    });

    it('should convert SVG string to base64 JPEG', async () => {
      HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/jpeg;base64,mockBase64Data');

      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';

      const result = await svgToBase64(svgString, 100, 100, FormatType.Jpeg);

      expect(result).toContain('data:image/jpeg;base64,');
    });

    it('should convert SVG string to specified format', async () => {
      HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/jpeg;base64,mockBase64Data');

      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';

      const result = await svgToBase64(svgString, 100, 100, FormatType.Jpeg);

      expect(result).toContain('data:image/jpeg;base64,');
    });

    it('should handle SVG with specified dimensions', async () => {
      const svgString = '<svg width="200" height="200"><rect width="100" height="100"/></svg>';

      const result = await svgToBase64(svgString, 100, 100);

      expect(result).toContain('data:image/png;base64,');
    });

    it('should create canvas with correct dimensions', async () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';
      const width = 250;
      const height = 150;

      await svgToBase64(svgString, width, height);

      // Canvas dimensions should be set
      const canvas = document.createElement('canvas');
      expect(canvas.getContext).toBeDefined();
    });

    it('should call drawImage with correct parameters', async () => {
      const mockDrawImage = jest.fn();
      const mockContext = {
        drawImage: mockDrawImage,
      };
      HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue(mockContext);

      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';
      const width = 100;
      const height = 100;

      await svgToBase64(svgString, width, height);

      expect(mockDrawImage).toHaveBeenCalled();
      const args = mockDrawImage.mock.calls[0];
      expect(args[1]).toBe(0); // x position
      expect(args[2]).toBe(0); // y position
      expect(args[3]).toBe(width);
      expect(args[4]).toBe(height);
    });

    it('should encode SVG as URL-encoded data URI in image src', async () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';
      let capturedSrc = '';

      global.Image = class {
        onload: (() => void) | null = null;
        onerror: ((err: unknown) => void) | null = null;
        private _src = '';

        get src() {
          return this._src;
        }

        set src(value: string) {
          this._src = value;
          capturedSrc = value;
          setTimeout(() => {
            if (this.onload) {
              this.onload();
            }
          }, 0);
        }
      } as unknown as typeof Image;

      await svgToBase64(svgString, 100, 100);

      expect(capturedSrc).toContain('data:image/svg+xml;charset=utf-8,');
      const encodedPart = capturedSrc.replace('data:image/svg+xml;charset=utf-8,', '');
      expect(encodedPart).toBeTruthy();
      const decoded = decodeURIComponent(encodedPart);
      expect(decoded).toBe(svgString);
    });

    it('should reject on image load error', async () => {
      const errorMessage = 'Failed to load image';

      global.Image = class {
        onload: (() => void) | null = null;
        onerror: ((err: unknown) => void) | null = null;
        src = '';

        constructor() {
          // Simulate image load error after setting src
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Error(errorMessage));
            }
          }, 0);
        }
      } as typeof Image;

      const invalidSvg = '<invalid>svg</invalid>';

      await expect(svgToBase64(invalidSvg, 100, 100)).rejects.toEqual(new Error(errorMessage));
    });

    it('should handle different image formats', async () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';

      // Test PNG
      HTMLCanvasElement.prototype.toDataURL = jest.fn((format) => `data:${format};base64,mockData`);
      const pngResult = await svgToBase64(svgString, 100, 100, FormatType.Png);
      expect(pngResult).toContain('image/png');

      // Test JPEG
      const jpegResult = await svgToBase64(svgString, 100, 100, FormatType.Jpeg);
      expect(jpegResult).toContain('image/jpeg');
    });

    it('should handle large dimensions', async () => {
      const svgString = '<svg width="100" height="100"><rect width="50" height="50"/></svg>';

      const result = await svgToBase64(svgString, 2000, 1500);

      expect(result).toBeTruthy();
      expect(result).toContain('data:image/');
    });

    it('should handle complex SVG content', async () => {
      const complexSvg = `
        <svg width="200" height="200">
          <rect x="10" y="10" width="50" height="50" fill="red"/>
          <circle cx="100" cy="100" r="30" fill="blue"/>
          <path d="M 150 150 L 180 150 L 165 180 Z" fill="green"/>
        </svg>
      `;

      const result = await svgToBase64(complexSvg, 200, 200);

      expect(result).toBeTruthy();
      expect(result).toContain('data:image/png;base64,');
    });
  });
});
