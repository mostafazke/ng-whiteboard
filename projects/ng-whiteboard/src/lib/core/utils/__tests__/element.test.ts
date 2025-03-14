import { getElementBbox } from '../element';
import { WhiteboardElement, ElementType } from '../../types';
import { ITEM_PREFIX } from '../../constants';

describe('getElementBbox', () => {
  let svgContainer: SVGSVGElement;
  let mockElement: WhiteboardElement;
  let mockSvgElement: SVGGraphicsElement;

  beforeEach(() => {
    svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    mockElement = {
      id: '123',
      type: ElementType.Ellipse,
      x: 0,
      y: 0,
    } as WhiteboardElement;
    mockSvgElement = {
      getBBox: jest.fn(),
      setAttribute: jest.fn(),
    } as unknown as SVGGraphicsElement;
  });

  it('should return bounding box when element exists', () => {
    const mockBBox = {
      x: 10,
      y: 20,
      width: 100,
      height: 50,
    } as DOMRect;

    jest.spyOn(mockSvgElement, 'getBBox').mockReturnValue(mockBBox);
    jest.spyOn(svgContainer, 'querySelector').mockReturnValue(mockSvgElement);

    const result = getElementBbox(svgContainer, mockElement);

    expect(result).toBe(mockBBox);
    expect(svgContainer.querySelector).toHaveBeenCalledWith(`#${ITEM_PREFIX}${mockElement.id}`);
    expect(mockSvgElement.getBBox).toHaveBeenCalled();
  });

  it('should throw error when element is not found', () => {
    jest.spyOn(svgContainer, 'querySelector').mockReturnValue(null);

    expect(() => getElementBbox(svgContainer, mockElement)).toThrow(
      `Element with id ${ITEM_PREFIX}${mockElement.id} not found`
    );
  });

  it('should handle elements with special characters in id', () => {
    mockElement.id = 'test-123_456';
    mockSvgElement.setAttribute('id', `${ITEM_PREFIX}${mockElement.id}`);

    const mockBBox = { x: 0, y: 0, width: 10, height: 10 } as DOMRect;

    jest.spyOn(mockSvgElement, 'getBBox').mockReturnValue(mockBBox);
    jest.spyOn(svgContainer, 'querySelector').mockReturnValue(mockSvgElement);

    const result = getElementBbox(svgContainer, mockElement);

    expect(result).toBe(mockBBox);
    expect(svgContainer.querySelector).toHaveBeenCalledWith(`#${ITEM_PREFIX}${mockElement.id}`);
  });
});
