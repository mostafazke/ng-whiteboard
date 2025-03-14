import {
  SVG_ROOT_ID,
  SELECTOR_GROUP_ID,
  ITEM_PREFIX,
  SELECTOR_GRIP_PREFIX,
  SELECTOR_BOX_PREFIX,
} from '../../constants';
import { ElementType, WhiteboardElement } from '../../types';
import { getMouseTarget, getTargetElement } from '../target';
import * as targetUtils from '../target';

describe('Target Utils', () => {
  let svgContainer: SVGSVGElement;
  let mockData: WhiteboardElement[];

  beforeEach(() => {
    svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgContainer.id = SVG_ROOT_ID;
    mockData = [
      { id: ITEM_PREFIX + '1', type: ElementType.Rectangle, x: 0, y: 0, width: 100, height: 100 } as WhiteboardElement,
      { id: 'test-2', type: ElementType.Ellipse, cx: 50, cy: 50, rx: 25, ry: 25 } as WhiteboardElement,
    ];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTargetElement', () => {
    it('should return correct target element', () => {
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = ITEM_PREFIX + '1';
      target.setAttribute('data-wb-id', ITEM_PREFIX + '1');
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });
      jest.spyOn(targetUtils, 'getMouseTarget').mockReturnValueOnce({
        id: ITEM_PREFIX + '1',
        getAttribute: () => ITEM_PREFIX + '1',
      } as unknown as SVGGraphicsElement);

      const targetElement = getTargetElement(pointerEvent, mockData);
      expect(targetElement).toEqual(mockData[0]);
    });

    it('should return null if target is the selectorGroup', () => {
      // Arrange
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = 'selectorGroup';
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getTargetElement(pointerEvent, mockData);

      // Assert
      expect(result).toBeNull();
    });
    it('should return the WhiteboardElement if target matches an element', () => {
      // Arrange
      const data = [{ id: '2', type: ElementType.Rectangle }] as WhiteboardElement[];

      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = ITEM_PREFIX + '123';
      target.setAttribute('data-wb-id', '2');
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getTargetElement(pointerEvent, data);

      // Assert
      expect(result).toEqual({ id: '2', type: ElementType.Rectangle });
    });

    it('should return null if target is the selectorGroup', () => {
      // Arrange
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = SELECTOR_GROUP_ID;
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getTargetElement(pointerEvent, mockData);

      // Assert
      expect(result).toBeNull();
    });
    it('should return null if target is not found in data', () => {
      // Arrange
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = ITEM_PREFIX + '123';
      target.setAttribute('data-wb-id', '999');
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getTargetElement(pointerEvent, []);

      // Assert
      expect(result).toBeNull();
    });
    it('should return null if mouse target is null', () => {
      // Arrange
      const info: PointerEvent = { target: null } as PointerEvent;

      // Act
      const result = getTargetElement(info, mockData);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getMouseTarget', () => {
    it('should return null when info.target is null', () => {
      // Arrange
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;

      // Act
      const result = getMouseTarget(pointerEvent);

      // Assert
      expect(result).toBeNull();
    });
    it('should return the target when it matches the ITEM_PREFIX', () => {
      // Arrange
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = ITEM_PREFIX + '123';
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });
      // Act
      const result = getMouseTarget(pointerEvent);

      // Assert
      expect(result).toBe(target);
    });

    it('should return the target when it matches the SELECTOR_GRIP_PREFIX', () => {
      // Arrange
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = SELECTOR_GRIP_PREFIX + '456';
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getMouseTarget(pointerEvent);

      // Assert
      expect(result).toBe(target);
    });

    it('should return the target when it matches the SELECTOR_BOX_PREFIX', () => {
      // Arrange
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = SELECTOR_BOX_PREFIX + '789';
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getMouseTarget(pointerEvent);

      // Assert
      expect(result).toBe(target);
    });

    it('should return the target if it has a matching parent node', () => {
      // Arrange
      const parent: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      parent.id = ITEM_PREFIX + '456';

      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = '123';
      parent.appendChild(target);

      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getMouseTarget(pointerEvent);

      // Assert
      expect(result).toBe(parent);
    });

    it('should return null if the target is the SVG root element', () => {
      // Arrange
      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = SVG_ROOT_ID;
      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getMouseTarget(pointerEvent);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if the target and all parents do not match the prefixes', () => {
      // Arrange
      const parent: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      parent.id = 'non-matching-id';

      const target: SVGGraphicsElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      target.id = 'child-non-matching';
      parent.appendChild(target);

      const pointerEvent = new MouseEvent('pointerdown', { bubbles: true, cancelable: true }) as PointerEvent;
      Object.defineProperty(pointerEvent, 'target', { value: target, writable: false });

      // Act
      const result = getMouseTarget(pointerEvent);

      // Assert
      expect(result).toBeNull();
    });
  });
});
