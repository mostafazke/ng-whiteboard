import { WhiteboardElement, WhiteboardLayer } from '../../types';

export function effectiveLayerId(
  element: Pick<WhiteboardElement, 'layerId'>,
  layers: readonly WhiteboardLayer[]
): string | undefined {
  if (layers.length === 0) return undefined;
  if (element.layerId && layers.some((l) => l.id === element.layerId)) {
    return element.layerId;
  }
  return layers.reduce((lowest, l) => (l.zIndex < lowest.zIndex ? l : lowest)).id;
}

export function elementIdsByLayer(
  elements: readonly WhiteboardElement[],
  layers: readonly WhiteboardLayer[]
): Map<string, string[]> {
  const result = new Map<string, string[]>(layers.map((l) => [l.id, []]));
  for (const element of elements) {
    const layerId = effectiveLayerId(element, layers);
    if (layerId) result.get(layerId)?.push(element.id);
  }
  return result;
}
