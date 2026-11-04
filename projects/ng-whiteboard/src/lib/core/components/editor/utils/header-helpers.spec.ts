import { Layer } from '../editor-state.service';
import { toWhiteboardLayers } from './whiteboard-layers';

describe('toWhiteboardLayers', () => {
  it('maps editor layers to layer panel rows with opacity and blend mode defaults', () => {
    const layers = [
      { id: 'a', name: 'A', visible: true, locked: false, zIndex: 0 },
      { id: 'b', name: 'B', visible: false, locked: true, zIndex: 1, opacity: 0.4, blendMode: 'multiply' },
    ] as Layer[];

    expect(toWhiteboardLayers(layers)).toEqual([
      { id: 'a', name: 'A', visible: true, locked: false, opacity: 1, zIndex: 0, type: 'drawing', elements: [], blendMode: 'normal' },
      { id: 'b', name: 'B', visible: false, locked: true, opacity: 0.4, zIndex: 1, type: 'drawing', elements: [], blendMode: 'multiply' },
    ]);
  });
});
