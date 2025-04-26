import { WhiteboardElement, ElementType } from '../../types';
import { getElementBbox, getElementBounds } from './element';
import { ITEM_PREFIX } from '../../constants';
import { getElementUtil } from '../../elements/element.utils';

jest.mock('../../elements/element.utils');

describe('Element Utils', () => {
  describe('getElementBbox', () => {
    let svgContainer: SVGSVGElement;
    let element: WhiteboardElement;

    beforeEach(() => {
      svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      element = {
        id: '123',
        type: ElementType.Rectangle,
      } as WhiteboardElement;
    });

    it('should get bounding box of element', () => {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect') as SVGRectElement;
      rect.id = `${ITEM_PREFIX}123`;
      rect.setAttribute('width', '100');
      rect.setAttribute('height', '100');
      svgContainer.appendChild(rect);
      const mockBBox = { x: 0, y: 0, width: 100, height: 100 } as DOMRect;

      rect.getBBox = jest.fn().mockReturnValue(mockBBox);

      const bbox = getElementBbox(svgContainer, element);
      expect(bbox).toBeDefined();
      expect(bbox.width).toBe(100);
      expect(bbox.height).toBe(100);
    });

    it('should throw error if element not found', () => {
      expect(() => getElementBbox(svgContainer, element)).toThrow(`Element with id ${ITEM_PREFIX}123 not found`);
    });
  });

  describe('getElementBounds', () => {
    it('should get bounds from element util', () => {
      const element: WhiteboardElement = {
        id: '123',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        style: {},
        rotation: 0,
        opacity: 1,
        width: 100,
        height: 100,
        rx: 0,
      } as WhiteboardElement;

      const mockBounds = {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
        width: 100,
        height: 100,
      };

      const mockElementUtil = {
        getBounds: jest.fn().mockReturnValue(mockBounds),
      };

      (getElementUtil as jest.Mock).mockReturnValue(mockElementUtil);

      const bounds = getElementBounds(element);
      expect(bounds).toEqual(mockBounds);
      expect(getElementUtil).toHaveBeenCalledWith(ElementType.Rectangle);
      expect(mockElementUtil.getBounds).toHaveBeenCalledWith(element);
    });
  });
});
