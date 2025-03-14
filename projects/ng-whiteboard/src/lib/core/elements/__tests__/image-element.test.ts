import { ElementType, Direction } from '../../types';
import { ImageElementUtil } from '../image-element';

describe('ImageElementUtil', () => {
  let imageElementUtil: ImageElementUtil;

  beforeEach(() => {
    imageElementUtil = new ImageElementUtil();
  });

  it('should create an image with default properties', () => {
    const element = imageElementUtil.create({});
    expect(element.type).toBe(ElementType.Image);
    expect(element.id).toBeDefined();
    expect(element.x).toBe(0);
    expect(element.y).toBe(0);
    expect(element.width).toBe(1);
    expect(element.height).toBe(1);
    expect(element.src).toBe('');
    expect(element.rotation).toBe(0);
    expect(element.opacity).toBe(100);
    expect(element.style).toEqual(expect.objectContaining({}));
  });

  it('should create an image with given properties', () => {
    const props = { width: 100, height: 200, src: 'image.png' };
    const element = imageElementUtil.create(props);
    expect(element.width).toBe(100);
    expect(element.height).toBe(200);
    expect(element.src).toBe('image.png');
  });

  it('should resize image to the north direction', () => {
    const imageElement = imageElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = imageElementUtil.resize(imageElement, Direction.N, 0, -10);

    expect(resizedElement.y).toBe(40);
    expect(resizedElement.height).toBe(110);
  });

  it('should resize image to the south direction', () => {
    const imageElement = imageElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = imageElementUtil.resize(imageElement, Direction.S, 0, 10);

    expect(resizedElement.height).toBe(110);
  });

  it('should resize image to the west direction', () => {
    const imageElement = imageElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = imageElementUtil.resize(imageElement, Direction.W, -10, 0);

    expect(resizedElement.x).toBe(40);
    expect(resizedElement.width).toBe(110);
  });

  it('should resize image to the east direction', () => {
    const imageElement = imageElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = imageElementUtil.resize(imageElement, Direction.E, 10, 0);

    expect(resizedElement.width).toBe(110);
  });

  it('should resize image in compound directions', () => {
    const imageElement = imageElementUtil.create({ width: 100, height: 100, x: 50, y: 50 });
    const resizedElement = imageElementUtil.resize(imageElement, Direction.NE, 10, -10);

    expect(resizedElement.y).toBe(40);
    expect(resizedElement.width).toBe(110);
    expect(resizedElement.height).toBe(110);
  });
});
