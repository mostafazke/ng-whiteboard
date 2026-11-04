import { Pipe, PipeTransform } from '@angular/core';
import { WhiteboardElement, WhiteboardLayer } from '../types';
import { effectiveLayerId } from '../utils';

@Pipe({
  name: 'elementOpacity',
  standalone: true,
})
export class ElementOpacityPipe implements PipeTransform {
  /**
   * Calculate the effective opacity combining element, style, and layer opacity.
   */
  transform(element: WhiteboardElement, layers: WhiteboardLayer[]): number {
    if (element.isDeleting) {
      return 0.1;
    }

    let opacity = (element.opacity ?? 100) / 100;

    if (element.style?.opacity !== undefined) {
      opacity *= element.style.opacity;
    }

    const layerId = effectiveLayerId(element, layers);
    const layer = layerId ? layers.find((l) => l.id === layerId) : undefined;
    if (layer && layer.opacity !== undefined) {
      opacity *= layer.opacity;
    }

    return opacity;
  }
}
