import { ElementType, WhiteboardElement } from '../../types';
import { getTargetElement, getMouseTarget } from './target';
import {
  SELECTOR_GROUP_ID,
  ITEM_PREFIX,
  SELECTOR_GRIP_PREFIX,
  SELECTOR_BOX,
  SVG_ROOT_ID,
  DATA_ID,
} from '../../constants';

describe('Target Utils', () => {
  describe('getTargetElement', () => {
    let mockEvent: PointerEvent;
    let mockData: WhiteboardElement[];

    beforeEach(() => {
      mockData = [{ id: '123', type: ElementType.Rectangle } as WhiteboardElement];
    });

    it('should return null if no mouse target', () => {
      mockEvent = new PointerEvent('pointerdown');
      expect(getTargetElement(mockEvent, mockData)).toBeNull();
    });

    it('should return null if target is selector group', () => {
      const target = document.createElement('div');
      target.id = SELECTOR_GROUP_ID;
      mockEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: target });
      expect(getTargetElement(mockEvent, mockData)).toBeNull();
    });

    it('should return element if target matches data', () => {
      const target = document.createElement('div');
      target.id = `${ITEM_PREFIX}123`;
      target.setAttribute(DATA_ID, '123');
      mockEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: target });
      expect(getTargetElement(mockEvent, mockData)).toEqual(mockData[0]);
    });

    it('should return null if target id not in data', () => {
      const target = document.createElement('div');
      target.id = `${ITEM_PREFIX}456`;
      target.setAttribute(DATA_ID, '456');
      mockEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: target });
      expect(getTargetElement(mockEvent, mockData)).toBeNull();
    });
  });

  describe('getMouseTarget', () => {
    let mockEvent: PointerEvent;

    it('should return null if no target', () => {
      mockEvent = new PointerEvent('pointerdown');
      expect(getMouseTarget(mockEvent)).toBeNull();
    });

    it('should return null if target is SVG root', () => {
      const target = document.createElement('div');
      target.id = SVG_ROOT_ID;
      mockEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: target });
      expect(getMouseTarget(mockEvent)).toBeNull();
    });

    it('should return target if it has item prefix', () => {
      const target = document.createElement('div');
      target.id = `${ITEM_PREFIX}123`;
      mockEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: target });
      expect(getMouseTarget(mockEvent)).toBe(target);
    });

    it('should return target if it has selector grip prefix', () => {
      const target = document.createElement('div');
      target.id = `${SELECTOR_GRIP_PREFIX}123`;
      mockEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: target });
      expect(getMouseTarget(mockEvent)).toBe(target);
    });

    it('should return target if it has selector box id', () => {
      const target = document.createElement('div');
      target.id = SELECTOR_BOX;
      mockEvent = new PointerEvent('pointerdown', { bubbles: true });
      Object.defineProperty(mockEvent, 'target', { value: target });
      expect(getMouseTarget(mockEvent)).toBe(target);
    });

    it('should traverse up DOM tree to find valid target', () => {
      const parent = document.createElement('div');
      parent.id = `${ITEM_PREFIX}123`;
      const child = document.createElement('div');
      parent.appendChild(child);
      mockEvent = new PointerEvent('pointerdown');
      Object.defineProperty(mockEvent, 'target', { value: child });
      expect(getMouseTarget(mockEvent)).toBe(parent);
    });
  });
});
