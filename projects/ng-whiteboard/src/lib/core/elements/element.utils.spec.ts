import {
  getElementUtil,
  createElement,
  setActiveLayerProvider,
  getLineWorldEndpoints,
  LineEndpointInput,
} from './element.utils';
import { ElementType } from '../types';
import { ArrowElementUtil } from './arrow-element';
import { EllipseElementUtil } from './ellipse-element';
import { ImageElementUtil } from './image-element';
import { LineElementUtil } from './line-element';
import { PenElementUtil } from './pen-element';
import { RectangleElementUtil } from './rectangle-element';
import { TextElementUtil } from './text-element';

describe('Element Utils', () => {
  describe('getElementUtil()', () => {
    it('should return ArrowElementUtil for Arrow type', () => {
      const util = getElementUtil(ElementType.Arrow);
      expect(util).toBeInstanceOf(ArrowElementUtil);
    });

    it('should return EllipseElementUtil for Ellipse type', () => {
      const util = getElementUtil(ElementType.Ellipse);
      expect(util).toBeInstanceOf(EllipseElementUtil);
    });

    it('should return ImageElementUtil for Image type', () => {
      const util = getElementUtil(ElementType.Image);
      expect(util).toBeInstanceOf(ImageElementUtil);
    });

    it('should return LineElementUtil for Line type', () => {
      const util = getElementUtil(ElementType.Line);
      expect(util).toBeInstanceOf(LineElementUtil);
    });

    it('should return PenElementUtil for Pen type', () => {
      const util = getElementUtil(ElementType.Pen);
      expect(util).toBeInstanceOf(PenElementUtil);
    });

    it('should return RectangleElementUtil for Rectangle type', () => {
      const util = getElementUtil(ElementType.Rectangle);
      expect(util).toBeInstanceOf(RectangleElementUtil);
    });

    it('should return TextElementUtil for Text type', () => {
      const util = getElementUtil(ElementType.Text);
      expect(util).toBeInstanceOf(TextElementUtil);
    });

    it('should return the same instance for multiple calls', () => {
      const util1 = getElementUtil(ElementType.Arrow);
      const util2 = getElementUtil(ElementType.Arrow);
      expect(util1).toBe(util2);
    });
  });

  describe('createElement()', () => {
    beforeEach(() => {
      // Reset active layer provider before each test
      setActiveLayerProvider(() => '');
    });

    it('should create an arrow element', () => {
      const element = createElement(ElementType.Arrow, {
        x: 10,
        y: 20,
        x2: 100,
        y2: 200,
      });

      expect(element.type).toBe(ElementType.Arrow);
      expect(element.x).toBe(10);
      expect(element.y).toBe(20);
      expect(element.id).toBeDefined();
    });

    it('should create an ellipse element', () => {
      const element = createElement(ElementType.Ellipse, {
        x: 50,
        y: 50,
        cx: 75,
        cy: 90,
        rx: 50,
        ry: 40,
      });

      expect(element.type).toBe(ElementType.Ellipse);
      expect(element.x).toBe(50);
      expect(element.y).toBe(50);
      expect(element.cx).toBe(75);
      expect(element.cy).toBe(90);
      expect(element.rx).toBe(50);
      expect(element.ry).toBe(40);
    });

    it('should create an image element', () => {
      const element = createElement(ElementType.Image, {
        x: 0,
        y: 0,
        width: 200,
        height: 150,
        src: 'https://example.com/image.png',
      });

      expect(element.type).toBe(ElementType.Image);
      expect(element.src).toBe('https://example.com/image.png');
      expect(element.width).toBe(200);
      expect(element.height).toBe(150);
    });

    it('should create a line element', () => {
      const element = createElement(ElementType.Line, {
        x: 0,
        y: 0,
        x2: 100,
        y2: 100,
      });

      expect(element.type).toBe(ElementType.Line);
      expect(element.x2).toBe(100);
      expect(element.y2).toBe(100);
    });

    it('should create a pen element', () => {
      const element = createElement(ElementType.Pen, {
        x: 10,
        y: 10,
        points: [
          [10, 10],
          [20, 20],
          [30, 15],
        ],
      });

      expect(element.type).toBe(ElementType.Pen);
      expect(element.points).toHaveLength(3);
      expect(element.points[0]).toEqual([10, 10]);
      expect(element.points[1]).toEqual([20, 20]);
      expect(element.points[2]).toEqual([30, 15]);
    });

    it('should create a rectangle element', () => {
      const element = createElement(ElementType.Rectangle, {
        x: 25,
        y: 25,
        width: 150,
        height: 100,
      });

      expect(element.type).toBe(ElementType.Rectangle);
      expect(element.width).toBe(150);
      expect(element.height).toBe(100);
    });

    it('should create a text element', () => {
      const element = createElement(ElementType.Text, {
        x: 100,
        y: 100,
        text: 'Hello World',
        scaleX: 1,
        scaleY: 1,
      });

      expect(element.type).toBe(ElementType.Text);
      expect(element.text).toBe('Hello World');
      expect(element.scaleX).toBe(1);
      expect(element.scaleY).toBe(1);
    });

    it('should assign explicit layerId when provided', () => {
      const element = createElement(
        ElementType.Rectangle,
        {
          x: 0,
          y: 0,
          width: 50,
          height: 50,
        },
        'layer-123'
      );

      expect(element.layerId).toBe('layer-123');
    });

    it('should use active layer provider when no layerId provided', () => {
      const mockLayerId = 'active-layer-456';
      setActiveLayerProvider(() => mockLayerId);

      const element = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });

      expect(element.layerId).toBe(mockLayerId);
    });

    it('should prefer explicit layerId over active layer provider', () => {
      setActiveLayerProvider(() => 'active-layer');

      const element = createElement(
        ElementType.Rectangle,
        {
          x: 0,
          y: 0,
          width: 50,
          height: 50,
        },
        'explicit-layer'
      );

      expect(element.layerId).toBe('explicit-layer');
    });

    it('should use empty string when no layerId and no provider', () => {
      // Reset provider to null so the ternary fallback to '' is exercised
      setActiveLayerProvider(null as unknown as () => string);
      const element = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });

      expect(element.layerId).toBe('');
    });

    it('should generate unique IDs for each element', () => {
      const element1 = createElement(ElementType.Rectangle, { x: 0, y: 0, width: 50, height: 50 });
      const element2 = createElement(ElementType.Rectangle, { x: 0, y: 0, width: 50, height: 50 });
      const element3 = createElement(ElementType.Rectangle, { x: 0, y: 0, width: 50, height: 50 });

      expect(element1.id).not.toBe(element2.id);
      expect(element1.id).not.toBe(element3.id);
      expect(element2.id).not.toBe(element3.id);
    });

    it('should preserve custom properties', () => {
      const element = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        opacity: 50,
        rotation: 45,
        rx: 10,
      });

      expect(element.opacity).toBe(50);
      expect(element.rotation).toBe(45);
      expect(element.rx).toBe(10);
    });

    it('should create elements with default properties from util', () => {
      const element = createElement(ElementType.Rectangle, {
        x: 10,
        y: 10,
      });

      // Check that default properties are set by the util
      expect(element.width).toBeDefined();
      expect(element.height).toBeDefined();
      expect(element.style).toBeDefined();
    });
  });

  describe('setActiveLayerProvider()', () => {
    it('should set the active layer provider', () => {
      const mockProvider = jest.fn(() => 'test-layer');
      setActiveLayerProvider(mockProvider);

      const element = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });

      expect(mockProvider).toHaveBeenCalled();
      expect(element.layerId).toBe('test-layer');
    });

    it('should override previous provider', () => {
      setActiveLayerProvider(() => 'layer-1');
      setActiveLayerProvider(() => 'layer-2');

      const element = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });

      expect(element.layerId).toBe('layer-2');
    });

    it('should handle provider changes', () => {
      setActiveLayerProvider(() => 'some-layer');

      const element1 = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });

      expect(element1.layerId).toBe('some-layer');

      setActiveLayerProvider(() => 'another-layer');

      const element2 = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
      });

      expect(element2.layerId).toBe('another-layer');
    });
  });

  describe('Integration', () => {
    it('should work with all element types', () => {
      const types = [
        ElementType.Arrow,
        ElementType.Ellipse,
        ElementType.Image,
        ElementType.Line,
        ElementType.Pen,
        ElementType.Rectangle,
        ElementType.Text,
      ];

      types.forEach((type) => {
        const util = getElementUtil(type);
        expect(util).toBeDefined();
        expect(util.create).toBeDefined();
      });
    });

    it('should create elements that can be used with their utils', () => {
      const rectangle = createElement(ElementType.Rectangle, {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      });

      const util = getElementUtil(ElementType.Rectangle);
      const bounds = util.getBounds(rectangle);

      expect(bounds).toBeDefined();
      expect(bounds.minX).toBe(0);
      expect(bounds.minY).toBe(0);
    });
  });

  describe('getLineWorldEndpoints()', () => {
    it('should return simple translation when rotation is 0', () => {
      const el: LineEndpointInput = { x: 10, y: 20, x1: 0, y1: 0, x2: 100, y2: 50, rotation: 0 };
      const result = getLineWorldEndpoints(el);
      expect(result.sx).toBe(10);
      expect(result.sy).toBe(20);
      expect(result.ex).toBe(110);
      expect(result.ey).toBe(70);
    });

    it('should apply scale when scaleX and scaleY are provided', () => {
      const el: LineEndpointInput = { x: 0, y: 0, x1: 10, y1: 10, x2: 30, y2: 30, rotation: 0, scaleX: 2, scaleY: 3 };
      const result = getLineWorldEndpoints(el);
      expect(result.sx).toBe(20); // 10 * 2
      expect(result.sy).toBe(30); // 10 * 3
      expect(result.ex).toBe(60); // 30 * 2
      expect(result.ey).toBe(90); // 30 * 3
    });

    it('should default scaleX and scaleY to 1', () => {
      const el: LineEndpointInput = { x: 0, y: 0, x1: 10, y1: 20, x2: 30, y2: 40, rotation: 0 };
      const result = getLineWorldEndpoints(el);
      expect(result.sx).toBe(10);
      expect(result.sy).toBe(20);
      expect(result.ex).toBe(30);
      expect(result.ey).toBe(40);
    });

    it('should rotate endpoints around fill-box center when rotation is non-zero', () => {
      // A horizontal line rotated 90 degrees should become vertical
      const el: LineEndpointInput = { x: 0, y: 0, x1: 0, y1: 0, x2: 100, y2: 0, rotation: 90 };
      const result = getLineWorldEndpoints(el);

      // Fill-box center: (50, 0). After 90° rotation around (50, 0):
      // (0, 0) → relative to pivot: (-50, 0) → rotated: (0, -50) → world: (50+0, 0-50) = (50, -50)
      // (100, 0) → relative to pivot: (50, 0) → rotated: (0, 50) → world: (50, 50)
      expect(result.sx).toBeCloseTo(50, 5);
      expect(result.sy).toBeCloseTo(-50, 5);
      expect(result.ex).toBeCloseTo(50, 5);
      expect(result.ey).toBeCloseTo(50, 5);
    });

    it('should handle 180-degree rotation', () => {
      const el: LineEndpointInput = { x: 0, y: 0, x1: 0, y1: 0, x2: 100, y2: 0, rotation: 180 };
      const result = getLineWorldEndpoints(el);

      // Fill-box center: (50, 0). After 180° rotation:
      // (0, 0) → relative: (-50, 0) → rotated: (50, 0) → world: (100, 0)
      // (100, 0) → relative: (50, 0) → rotated: (-50, 0) → world: (0, 0)
      expect(result.sx).toBeCloseTo(100, 5);
      expect(result.sy).toBeCloseTo(0, 5);
      expect(result.ex).toBeCloseTo(0, 5);
      expect(result.ey).toBeCloseTo(0, 5);
    });

    it('should handle rotation with translation offset', () => {
      const el: LineEndpointInput = { x: 50, y: 100, x1: 0, y1: 0, x2: 100, y2: 0, rotation: 90 };
      const result = getLineWorldEndpoints(el);

      // Same as 90° test but shifted by (50, 100)
      expect(result.sx).toBeCloseTo(100, 5); // 50 + 50
      expect(result.sy).toBeCloseTo(50, 5); // 100 + (-50)
      expect(result.ex).toBeCloseTo(100, 5); // 50 + 50
      expect(result.ey).toBeCloseTo(150, 5); // 100 + 50
    });

    it('should handle rotation with scale', () => {
      const el: LineEndpointInput = { x: 0, y: 0, x1: 0, y1: 0, x2: 50, y2: 0, rotation: 90, scaleX: 2, scaleY: 1 };
      const result = getLineWorldEndpoints(el);

      // Scaled: lx1=0, ly1=0, lx2=100, ly2=0
      // Fill-box center: (50, 0). 90° rotation:
      // (0,0) → rel(-50,0) → rot(0,-50) → world(50,-50)
      expect(result.sx).toBeCloseTo(50, 5);
      expect(result.sy).toBeCloseTo(-50, 5);
      expect(result.ex).toBeCloseTo(50, 5);
      expect(result.ey).toBeCloseTo(50, 5);
    });

    it('should handle 45-degree rotation', () => {
      const el: LineEndpointInput = { x: 0, y: 0, x1: 0, y1: 0, x2: 100, y2: 0, rotation: 45 };
      const result = getLineWorldEndpoints(el);

      const cos45 = Math.cos(Math.PI / 4);
      const sin45 = Math.sin(Math.PI / 4);

      // Fill-box center: (50, 0)
      // Start: rel(-50, 0) → rot(-50*cos, -50*sin) → world(50 - 50cos, -50sin)
      expect(result.sx).toBeCloseTo(50 - 50 * cos45, 5);
      expect(result.sy).toBeCloseTo(-50 * sin45, 5);
      // End: rel(50, 0) → rot(50*cos, 50*sin) → world(50 + 50cos, 50sin)
      expect(result.ex).toBeCloseTo(50 + 50 * cos45, 5);
      expect(result.ey).toBeCloseTo(50 * sin45, 5);
    });

    it('should handle negative coordinates', () => {
      const el: LineEndpointInput = { x: -10, y: -20, x1: -50, y1: -30, x2: 50, y2: 30, rotation: 0 };
      const result = getLineWorldEndpoints(el);
      expect(result.sx).toBe(-60);
      expect(result.sy).toBe(-50);
      expect(result.ex).toBe(40);
      expect(result.ey).toBe(10);
    });

    it('should treat undefined rotation as 0', () => {
      const el = { x: 5, y: 10, x1: 0, y1: 0, x2: 20, y2: 30, rotation: undefined } as unknown as LineEndpointInput;
      const result = getLineWorldEndpoints(el);
      expect(result.sx).toBe(5);
      expect(result.sy).toBe(10);
      expect(result.ex).toBe(25);
      expect(result.ey).toBe(40);
    });
  });
});
