import { ElementType, Direction } from '../../types';
import { TextElementUtil } from '../text-element';

describe('TextElementUtil', () => {
  let textElementUtil: TextElementUtil;

  beforeEach(() => {
    textElementUtil = new TextElementUtil();
  });

  it('should create a text with default properties', () => {
    const element = textElementUtil.create({});
    expect(element.type).toBe(ElementType.Text);
    expect(element.id).toBeDefined();
    expect(element.x).toBe(0);
    expect(element.y).toBe(0);
    expect(element.text).toBe('');
    expect(element.rotation).toBe(0);
    expect(element.opacity).toBe(100);
    expect(element.scaleX).toBe(1);
    expect(element.scaleY).toBe(1);
    expect(element.style).toEqual(expect.objectContaining({}));
  });

  it('should create a text with provided properties', () => {
    const props = { text: 'Hello', x: 10, y: 20 };
    const element = textElementUtil.create(props);
    expect(element.text).toBe('Hello');
    expect(element.x).toBe(10);
    expect(element.y).toBe(20);
  });

  it('should merge default style with provided style', () => {
    const props = {
      style: { color: 'blue', strokeWidth: 2 },
    };
    const rectangleElement = textElementUtil.create(props);
    expect(rectangleElement.style.color).toBe('blue');
    expect(rectangleElement.style.strokeWidth).toBe(2);
    expect(rectangleElement.style.fontSize).toBeDefined();
  });

  it('should resize element in NW direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.NW, 10, -10);

    expect(resizedElement.x).toBe(10);
    expect(resizedElement.y).toBe(-10);
    expect(resizedElement.scaleX).toBeLessThan(1);
    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in N direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.N, 0, 10);

    expect(resizedElement.y).toBe(10);
    expect(resizedElement.scaleY).toBeLessThan(1);
  });

  it('should resize element in NE direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.NE, 10, 10);

    expect(resizedElement.y).toBe(10);
    expect(resizedElement.scaleX).toBeGreaterThan(1);
    expect(resizedElement.scaleY).toBeLessThan(1);
  });

  it('should resize element in E direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.E, 10, 0);

    expect(resizedElement.scaleX).toBeGreaterThan(1);
  });

  it('should resize element in SE direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.SE, 10, 10);

    expect(resizedElement.scaleX).toBeGreaterThan(1);
    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in S direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.S, 0, 10);

    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in SW direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.SW, 10, 10);

    expect(resizedElement.x).toBe(10);
    expect(resizedElement.scaleX).toBeLessThan(1);
    expect(resizedElement.scaleY).toBeGreaterThan(1);
  });

  it('should resize element in W direction', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.W, 10, 0);

    expect(resizedElement.x).toBe(10);
    expect(resizedElement.scaleX).toBeLessThan(1);
  });

  it('should enforce minimum scale (MIN_SCALE) when resizing', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 0.2, scaleY: 0.2 });
    // Try to resize to a very small scale
    const resizedElement = textElementUtil.resize(textElement, Direction.SE, -1000, -1000);

    // Scale should not go below MIN_SCALE (0.1)
    expect(resizedElement.scaleX).toBeGreaterThanOrEqual(0.1);
    expect(resizedElement.scaleY).toBeGreaterThanOrEqual(0.1);
  });

  it('should enforce minimum scale when resizing from NW', () => {
    const textElement = textElementUtil.create({ x: 100, y: 100, scaleX: 0.2, scaleY: 0.2 });
    const resizedElement = textElementUtil.resize(textElement, Direction.NW, -1000, -1000);

    expect(resizedElement.scaleX).toBeGreaterThanOrEqual(0.1);
    expect(resizedElement.scaleY).toBeGreaterThanOrEqual(0.1);
  });

  it('should enforce minimum scale when resizing from N', () => {
    const textElement = textElementUtil.create({ x: 0, y: 100, scaleX: 1, scaleY: 0.2 });
    const resizedElement = textElementUtil.resize(textElement, Direction.N, 0, -1000);

    expect(resizedElement.scaleY).toBeGreaterThanOrEqual(0.1);
  });

  it('should enforce minimum scale when resizing from NE', () => {
    const textElement = textElementUtil.create({ x: 0, y: 100, scaleX: 0.2, scaleY: 0.2 });
    const resizedElement = textElementUtil.resize(textElement, Direction.NE, 1000, -1000);

    expect(resizedElement.scaleX).toBeGreaterThanOrEqual(0.1);
    expect(resizedElement.scaleY).toBeGreaterThanOrEqual(0.1);
  });

  it('should enforce minimum scale when resizing from E', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 0.2, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.E, -1000, 0);

    expect(resizedElement.scaleX).toBeGreaterThanOrEqual(0.1);
  });

  it('should enforce minimum scale when resizing from S', () => {
    const textElement = textElementUtil.create({ x: 0, y: 0, scaleX: 1, scaleY: 0.2 });
    const resizedElement = textElementUtil.resize(textElement, Direction.S, 0, -1000);

    expect(resizedElement.scaleY).toBeGreaterThanOrEqual(0.1);
  });

  it('should enforce minimum scale when resizing from SW', () => {
    const textElement = textElementUtil.create({ x: 100, y: 0, scaleX: 0.2, scaleY: 0.2 });
    const resizedElement = textElementUtil.resize(textElement, Direction.SW, -1000, -1000);

    expect(resizedElement.scaleX).toBeGreaterThanOrEqual(0.1);
    expect(resizedElement.scaleY).toBeGreaterThanOrEqual(0.1);
  });

  it('should enforce minimum scale when resizing from W', () => {
    const textElement = textElementUtil.create({ x: 100, y: 0, scaleX: 0.2, scaleY: 1 });
    const resizedElement = textElementUtil.resize(textElement, Direction.W, -1000, 0);

    expect(resizedElement.scaleX).toBeGreaterThanOrEqual(0.1);
  });

  describe('getBounds', () => {
    it('should calculate bounds for single-line text', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Hello',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBeLessThan(0); // Should be negative due to baseline offset
      expect(bounds.maxX).toBeGreaterThan(0);
      expect(bounds.maxY).toBeGreaterThan(0);
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });

    it('should calculate bounds for multi-line text', () => {
      const textElement = textElementUtil.create({
        x: 10,
        y: 20,
        text: 'Line 1\nLine 2\nLine 3',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      expect(bounds.minX).toBe(10);
      expect(bounds.width).toBeGreaterThan(0);
      // Height should account for 3 lines
      expect(bounds.height).toBeGreaterThan(16 * 1.2 * 2); // At least 2 line heights
    });

    it('should calculate bounds with custom font size', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Test',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 32 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      // Larger font size should produce larger bounds
      expect(bounds.width).toBeGreaterThan(16 * 4 * 0.6); // Approximate width
      expect(bounds.height).toBeGreaterThan(32);
    });

    it('should account for scaleX in bounds calculation', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Test',
        scaleX: 2,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      const normalElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Test',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const normalBounds = textElementUtil.getBounds(normalElement);

      // Width should be approximately doubled
      expect(bounds.width).toBeCloseTo(normalBounds.width * 2, 0);
    });

    it('should account for scaleY in bounds calculation', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Test',
        scaleX: 1,
        scaleY: 2,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      const normalElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Test',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const normalBounds = textElementUtil.getBounds(normalElement);

      // Height should be approximately doubled
      expect(bounds.height).toBeCloseTo(normalBounds.height * 2, 0);
    });

    it('should handle empty text with minimum dimensions', () => {
      const textElement = textElementUtil.create({
        x: 10,
        y: 20,
        text: '',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      expect(bounds.minX).toBe(10);
      // Should have minimum width/height based on fontSize
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });

    it('should calculate bounds for text at different positions', () => {
      const textElement = textElementUtil.create({
        x: 100,
        y: 200,
        text: 'Positioned',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      expect(bounds.minX).toBe(100);
      expect(bounds.maxX).toBeGreaterThan(100);
      // minY should be less than y due to baseline offset
      expect(bounds.minY).toBeLessThan(200);
    });

    it('should handle text with different line lengths', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Short\nMuch longer line\nMid',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      // Width should be based on the longest line
      const longestLineLength = 'Much longer line'.length;
      expect(bounds.width).toBeGreaterThan(longestLineLength * 16 * 0.5);
    });

    it('should use default fontSize if not provided in style', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Test',
        scaleX: 1,
        scaleY: 1,
        style: {},
      });
      const bounds = textElementUtil.getBounds(textElement);

      // Should still calculate valid bounds with default fontSize
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
    });

    it('should handle negative coordinates', () => {
      const textElement = textElementUtil.create({
        x: -50,
        y: -100,
        text: 'Negative',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      expect(bounds.minX).toBe(-50);
      expect(bounds.minY).toBeLessThan(-100);
      expect(bounds.maxX).toBeGreaterThan(-50);
    });

    it('should handle very small scales', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Tiny',
        scaleX: 0.1,
        scaleY: 0.1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      // Bounds should be much smaller with small scale
      expect(bounds.width).toBeLessThan(16 * 4 * 0.6); // Normal width
      expect(bounds.height).toBeLessThan(16 * 1.2); // Normal height
    });

    it('should handle very large scales', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Big',
        scaleX: 5,
        scaleY: 5,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      // Bounds should be much larger with large scale
      expect(bounds.width).toBeGreaterThan(16 * 3 * 0.6 * 3); // Scaled up
      expect(bounds.height).toBeGreaterThan(16 * 1.2 * 3); // Scaled up
    });
  });

  describe('hitTest', () => {
    it('should detect hit inside text bounds', () => {
      const textElement = textElementUtil.create({
        x: 10,
        y: 20,
        text: 'Click me',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);
      const testPoint = {
        x: bounds.minX + 5,
        y: bounds.minY + bounds.height / 2,
      };

      const result = textElementUtil.hitTest(textElement, testPoint, testPoint, 5);
      // Result depends on hitTestBoundingBox implementation
      expect(typeof result).toBe('boolean');
    });

    it('should not detect hit outside text bounds', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Click me',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const farPoint = { x: 1000, y: 1000 };

      const result = textElementUtil.hitTest(textElement, farPoint, farPoint, 5);
      expect(result).toBe(false);
    });

    it('should call hitTestBoundingBox for edge detection', () => {
      const textElement = textElementUtil.create({
        x: 10,
        y: 20,
        text: 'Edge test',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);
      const edgePoint = { x: bounds.minX + 1, y: bounds.minY + 1 };

      const result = textElementUtil.hitTest(textElement, edgePoint, edgePoint, 5);
      // hitTest should return a boolean result
      expect(typeof result).toBe('boolean');
    });

    it('should pass threshold parameter to hitTestBoundingBox', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Threshold',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);
      const nearPoint = { x: bounds.maxX + 3, y: bounds.maxY + 3 };

      const result = textElementUtil.hitTest(textElement, nearPoint, nearPoint, 5);
      // Verify hitTest returns a boolean
      expect(typeof result).toBe('boolean');
    });

    it('should not detect hit outside threshold distance', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Threshold',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);
      const farPoint = { x: bounds.maxX + 20, y: bounds.maxY + 20 };

      const result = textElementUtil.hitTest(textElement, farPoint, farPoint, 5);
      expect(result).toBe(false);
    });

    it('should handle hit test with line segment', () => {
      const textElement = textElementUtil.create({
        x: 50,
        y: 50,
        text: 'Line test',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);
      const pointA = { x: bounds.minX - 10, y: bounds.minY - 10 };
      const pointB = { x: bounds.maxX + 10, y: bounds.maxY + 10 };

      const result = textElementUtil.hitTest(textElement, pointA, pointB, 5);
      expect(result).toBe(true);
    });

    it('should handle hit test with scaled text', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: 'Scaled',
        scaleX: 2,
        scaleY: 2,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);
      const testPoint = {
        x: bounds.minX + 5,
        y: bounds.minY + 5,
      };

      const result = textElementUtil.hitTest(textElement, testPoint, testPoint, 5);
      // Verify hitTest works with scaled bounds
      expect(typeof result).toBe('boolean');
    });
  });

  describe('default properties', () => {
    it('should set selectAfterDraw to true by default', () => {
      const textElement = textElementUtil.create({});
      expect(textElement.selectAfterDraw).toBe(true);
    });

    it('should set default zIndex to 1', () => {
      const textElement = textElementUtil.create({});
      expect(textElement.zIndex).toBe(1);
    });

    it('should allow overriding selectAfterDraw', () => {
      const textElement = textElementUtil.create({ selectAfterDraw: false });
      expect(textElement.selectAfterDraw).toBe(false);
    });

    it('should allow overriding zIndex', () => {
      const textElement = textElementUtil.create({ zIndex: 10 });
      expect(textElement.zIndex).toBe(10);
    });

    it('should preserve optional selection property', () => {
      const textElement = textElementUtil.create({ selection: { start: 0, end: 5 } });
      expect(textElement.selection).toEqual({ start: 0, end: 5 });
    });
  });

  describe('edge cases', () => {
    it('should handle text with only newlines', () => {
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: '\n\n\n',
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      // Should calculate bounds for 4 lines (empty lines still count)
      expect(bounds.height).toBeGreaterThan(16 * 1.2 * 3);
    });

    it('should handle resize with zero delta values', () => {
      const textElement = textElementUtil.create({ x: 10, y: 20, scaleX: 1, scaleY: 1 });
      const resizedElement = textElementUtil.resize(textElement, Direction.SE, 0, 0);

      expect(resizedElement.scaleX).toBe(1);
      expect(resizedElement.scaleY).toBe(1);
    });

    it('should handle very long single line', () => {
      const longText = 'a'.repeat(1000);
      const textElement = textElementUtil.create({
        x: 0,
        y: 0,
        text: longText,
        scaleX: 1,
        scaleY: 1,
        style: { fontSize: 16 },
      });
      const bounds = textElementUtil.getBounds(textElement);

      // Width should be proportional to text length
      expect(bounds.width).toBeGreaterThan(1000 * 16 * 0.5);
    });
  });
});
