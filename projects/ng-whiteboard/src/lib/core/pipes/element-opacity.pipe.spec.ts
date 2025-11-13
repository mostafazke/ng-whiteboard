import { ElementOpacityPipe } from './element-opacity.pipe';
import { WhiteboardElement, WhiteboardLayer } from '../types';

describe('ElementOpacityPipe', () => {
  let pipe: ElementOpacityPipe;

  beforeEach(() => {
    pipe = new ElementOpacityPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return 0.1 for deleting element', () => {
    const element = { id: '1', isDeleting: true } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [];
    expect(pipe.transform(element, layers)).toBe(0.1);
  });

  it('should return 1 for element with no opacity set', () => {
    const element = { id: '1' } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [];
    expect(pipe.transform(element, layers)).toBe(1);
  });

  it('should apply element opacity', () => {
    const element = { id: '1', opacity: 50 } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [];
    expect(pipe.transform(element, layers)).toBe(0.5);
  });

  it('should apply style opacity', () => {
    const element = { id: '1', style: { opacity: 0.5 } } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [];
    expect(pipe.transform(element, layers)).toBe(0.5);
  });

  it('should combine element and style opacity', () => {
    const element = { id: '1', opacity: 50, style: { opacity: 0.5 } } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [];
    expect(pipe.transform(element, layers)).toBe(0.25);
  });

  it('should apply layer opacity', () => {
    const element = { id: '1', layerId: 'layer1' } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [
      {
        id: 'layer1',
        name: 'Layer 1',
        visible: true,
        locked: false,
        zIndex: 1,
        elements: ['1'],
        opacity: 0.5,
      },
    ];
    expect(pipe.transform(element, layers)).toBe(0.5);
  });

  it('should combine element, style, and layer opacity', () => {
    const element = {
      id: '1',
      opacity: 80,
      style: { opacity: 0.5 },
      layerId: 'layer1',
    } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [
      {
        id: 'layer1',
        name: 'Layer 1',
        visible: true,
        locked: false,
        zIndex: 1,
        elements: ['1'],
        opacity: 0.5,
      },
    ];
    // 0.8 (element) * 0.5 (style) * 0.5 (layer) = 0.2
    expect(pipe.transform(element, layers)).toBe(0.2);
  });

  it('should handle missing layerId gracefully', () => {
    const element = { id: '1', opacity: 50 } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [
      {
        id: 'layer-1',
        name: 'Layer 1',
        visible: true,
        locked: false,
        zIndex: 0,
        elements: ['1'],
        opacity: 0.5,
      },
    ];
    // Element has no layerId, so layer opacity is not applied
    expect(pipe.transform(element, layers)).toBe(0.5);
  });

  it('should handle missing layer gracefully', () => {
    const element = { id: '1', opacity: 50, layerId: 'nonexistent' } as WhiteboardElement;
    const layers: WhiteboardLayer[] = [];
    expect(pipe.transform(element, layers)).toBe(0.5);
  });
});
