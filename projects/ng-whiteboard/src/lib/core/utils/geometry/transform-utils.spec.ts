import { WhiteboardElement } from '../../types';
import { getCombinedScreenBounds, rotatePointAroundCenter } from './transform-utils';

function createMockElement(overrides: Partial<WhiteboardElement> = {}): WhiteboardElement {
  return {
    id: 'test-id',
    type: 'rectangle',
    x: 0,
    y: 0,
    width: 100,
    height: 50,
    rotation: 0,
    ...overrides,
  } as WhiteboardElement;
}

describe('Transform Utils', () => {
  describe('rotatePointAroundCenter', () => {
    it('should rotate a point 90 degrees clockwise', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAroundCenter(point, center, 90);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(10, 5);
    });

    it('should rotate a point 180 degrees', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAroundCenter(point, center, 180);
      expect(result.x).toBeCloseTo(-10, 5);
      expect(result.y).toBeCloseTo(0, 5);
    });

    it('should rotate a point 270 degrees', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAroundCenter(point, center, 270);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(-10, 5);
    });

    it('should rotate a point 360 degrees (full circle)', () => {
      const point = { x: 10, y: 5 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAroundCenter(point, center, 360);
      expect(result.x).toBeCloseTo(10, 5);
      expect(result.y).toBeCloseTo(5, 5);
    });

    it('should rotate a point 45 degrees', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAroundCenter(point, center, 45);
      const expectedX = 10 * Math.cos((45 * Math.PI) / 180);
      const expectedY = 10 * Math.sin((45 * Math.PI) / 180);
      expect(result.x).toBeCloseTo(expectedX, 5);
      expect(result.y).toBeCloseTo(expectedY, 5);
    });

    it('should handle rotation around a non-origin center', () => {
      const point = { x: 20, y: 10 };
      const center = { x: 10, y: 10 };
      const result = rotatePointAroundCenter(point, center, 90);
      expect(result.x).toBeCloseTo(10, 5);
      expect(result.y).toBeCloseTo(20, 5);
    });

    it('should handle negative angles', () => {
      const point = { x: 10, y: 0 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAroundCenter(point, center, -90);
      expect(result.x).toBeCloseTo(0, 5);
      expect(result.y).toBeCloseTo(-10, 5);
    });

    it('should handle zero rotation', () => {
      const point = { x: 10, y: 5 };
      const center = { x: 0, y: 0 };
      const result = rotatePointAroundCenter(point, center, 0);
      expect(result.x).toBeCloseTo(10, 5);
      expect(result.y).toBeCloseTo(5, 5);
    });

    it('should rotate a point at the center (no movement)', () => {
      const point = { x: 5, y: 5 };
      const center = { x: 5, y: 5 };
      const result = rotatePointAroundCenter(point, center, 90);
      expect(result.x).toBeCloseTo(5, 5);
      expect(result.y).toBeCloseTo(5, 5);
    });
  });

  describe('getCombinedScreenBounds', () => {
    it('should return null for empty array', () => {
      const result = getCombinedScreenBounds([]);
      expect(result).toBeNull();
    });

    it('should return bounds for a single element without rotation', () => {
      const element = createMockElement({ x: 10, y: 20, width: 100, height: 50 });
      const result = getCombinedScreenBounds([element]);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBe(10);
        expect(result.minY).toBe(20);
        expect(result.maxX).toBe(110);
        expect(result.maxY).toBe(70);
        expect(result.width).toBe(100);
        expect(result.height).toBe(50);
      }
    });

    it('should return bounds for a single element with rotation', () => {
      const element = createMockElement({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        rotation: 90,
      });
      const result = getCombinedScreenBounds([element]);
      expect(result).not.toBeNull();
      if (result) {
        // A 100x50 rectangle rotated 90 degrees should become 50x100
        expect(result.width).toBeCloseTo(50, 1);
        expect(result.height).toBeCloseTo(100, 1);
      }
    });

    it('should return bounds for a single element with 45 degree rotation', () => {
      const element = createMockElement({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 45,
      });
      const result = getCombinedScreenBounds([element]);
      expect(result).not.toBeNull();
      if (result) {
        // A 100x100 square rotated 45 degrees should have width/height of ~141.4
        const expectedSize = Math.sqrt(2) * 100;
        expect(result.width).toBeCloseTo(expectedSize, 1);
        expect(result.height).toBeCloseTo(expectedSize, 1);
      }
    });

    it('should return bounds for multiple non-rotated elements', () => {
      const elements = [
        createMockElement({ x: 0, y: 0, width: 50, height: 50 }),
        createMockElement({ x: 100, y: 100, width: 50, height: 50 }),
      ];
      const result = getCombinedScreenBounds(elements);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBe(0);
        expect(result.minY).toBe(0);
        expect(result.maxX).toBe(150);
        expect(result.maxY).toBe(150);
        expect(result.width).toBe(150);
        expect(result.height).toBe(150);
      }
    });

    it('should return bounds for multiple rotated elements', () => {
      const elements = [
        createMockElement({ x: 0, y: 0, width: 100, height: 50, rotation: 0 }),
        createMockElement({ x: 200, y: 0, width: 100, height: 50, rotation: 90 }),
      ];
      const result = getCombinedScreenBounds(elements);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBeCloseTo(0, 1);
        expect(result.minY).toBeCloseTo(-25, 1);
        expect(result.maxX).toBeCloseTo(275, 1); // 200 + 100/2 + 50/2
        expect(result.maxY).toBeCloseTo(75, 1);
      }
    });

    it('should handle elements with various rotations', () => {
      const elements = [
        createMockElement({ x: 0, y: 0, width: 50, height: 50, rotation: 0 }),
        createMockElement({ x: 100, y: 0, width: 50, height: 50, rotation: 45 }),
        createMockElement({ x: 200, y: 0, width: 50, height: 50, rotation: 90 }),
        createMockElement({ x: 300, y: 0, width: 50, height: 50, rotation: 180 }),
      ];
      const result = getCombinedScreenBounds(elements);
      expect(result).not.toBeNull();
      if (result) {
        // Bounds should encompass all rotated elements
        expect(result.minX).toBeLessThanOrEqual(0);
        expect(result.minY).toBeLessThanOrEqual(0);
        expect(result.maxX).toBeGreaterThan(300);
        expect(result.maxY).toBeGreaterThan(50);
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      }
    });

    it('should handle negative positions', () => {
      const elements = [
        createMockElement({ x: -50, y: -50, width: 100, height: 100 }),
        createMockElement({ x: 50, y: 50, width: 100, height: 100 }),
      ];
      const result = getCombinedScreenBounds(elements);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBe(-50);
        expect(result.minY).toBe(-50);
        expect(result.maxX).toBe(150);
        expect(result.maxY).toBe(150);
        expect(result.width).toBe(200);
        expect(result.height).toBe(200);
      }
    });

    it('should handle overlapping elements', () => {
      const elements = [
        createMockElement({ x: 0, y: 0, width: 100, height: 100 }),
        createMockElement({ x: 50, y: 50, width: 100, height: 100 }),
      ];
      const result = getCombinedScreenBounds(elements);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBe(0);
        expect(result.minY).toBe(0);
        expect(result.maxX).toBe(150);
        expect(result.maxY).toBe(150);
      }
    });

    it('should handle elements with zero rotation explicitly set', () => {
      const element = createMockElement({
        x: 10,
        y: 20,
        width: 100,
        height: 50,
        rotation: 0,
      });
      const result = getCombinedScreenBounds([element]);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBe(10);
        expect(result.minY).toBe(20);
        expect(result.maxX).toBe(110);
        expect(result.maxY).toBe(70);
      }
    });

    it('should handle element with 180 degree rotation', () => {
      const element = createMockElement({
        x: 100,
        y: 100,
        width: 100,
        height: 50,
        rotation: 180,
      });
      const result = getCombinedScreenBounds([element]);
      expect(result).not.toBeNull();
      if (result) {
        // 180 degree rotation should maintain the same width/height dimensions
        expect(result.width).toBeCloseTo(100, 1);
        expect(result.height).toBeCloseTo(50, 1);
      }
    });

    it('should handle element with 270 degree rotation', () => {
      const element = createMockElement({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        rotation: 270,
      });
      const result = getCombinedScreenBounds([element]);
      expect(result).not.toBeNull();
      if (result) {
        // A 100x50 rectangle rotated 270 degrees should become 50x100
        expect(result.width).toBeCloseTo(50, 1);
        expect(result.height).toBeCloseTo(100, 1);
      }
    });

    it('should handle very small elements', () => {
      const elements = [
        createMockElement({ x: 0, y: 0, width: 1, height: 1 }),
        createMockElement({ x: 10, y: 10, width: 1, height: 1 }),
      ];
      const result = getCombinedScreenBounds(elements);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBe(0);
        expect(result.minY).toBe(0);
        expect(result.maxX).toBe(11);
        expect(result.maxY).toBe(11);
      }
    });

    it('should handle very large elements', () => {
      const elements = [
        createMockElement({ x: 0, y: 0, width: 10000, height: 10000 }),
        createMockElement({ x: 5000, y: 5000, width: 10000, height: 10000 }),
      ];
      const result = getCombinedScreenBounds(elements);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.minX).toBe(0);
        expect(result.minY).toBe(0);
        expect(result.maxX).toBe(15000);
        expect(result.maxY).toBe(15000);
      }
    });

    it('should handle elements at origin with rotation', () => {
      const element = createMockElement({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        rotation: 30,
      });
      const result = getCombinedScreenBounds([element]);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.width).toBeGreaterThan(0);
        expect(result.height).toBeGreaterThan(0);
      }
    });
  });
});
