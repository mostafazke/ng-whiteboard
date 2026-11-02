import { Layer } from '../editor-state.service';
import { WhiteboardLayer } from '../panels/layer-panel/layer-panel.component';

export function toWhiteboardLayers(layers: Layer[]): WhiteboardLayer[] {
  return layers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity ?? 1,
    zIndex: layer.zIndex,
    type: 'drawing' as const,
    elements: [],
    blendMode: layer.blendMode || 'normal',
  }));
}
