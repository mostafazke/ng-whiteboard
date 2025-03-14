import { ConfigService } from '../config/config.service';
import { WhiteboardElement } from '../types';

/**
 * Show grips around the selected element.
 * @param configService - The configuration service.
 * @param bbox - The bounding box of the element.
 * @param currentElement - The current whiteboard element.
 */
export function showGrips(configService: ConfigService, bbox: DOMRect, currentElement: WhiteboardElement) {
  configService.updateConfig({
    rubberBox: {
      x: bbox.x - ((currentElement.style.strokeWidth as number) || 0) * 0.5,
      y: bbox.y - ((currentElement.style.strokeWidth as number) || 0) * 0.5,
      width: bbox.width + (currentElement.style.strokeWidth as number) || 0,
      height: bbox.height + (currentElement.style.strokeWidth as number) || 0,
      display: 'block',
    },
  });
}

/**
 * Reset the grips to their default state.
 * @param configService - The configuration service.
 */
export function resetGrips(configService: ConfigService): void {
  configService.updateConfig({
    rubberBox: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      display: 'none',
    },
  });
}
