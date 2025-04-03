import { getElementUtil } from '../elements/element.utils';
import { Point, ToolType, WhiteboardElement } from '../types';
import { isBoundsIntersect } from '../utils';
import { BaseTool } from './base-tool';

export class EraserTool extends BaseTool {
  type = ToolType.Eraser;
  private isErasing = false;
  private hoveredElements: Set<WhiteboardElement> = new Set();
  private lastPosition: Point | null = null;

  override handlePointerDown(event: PointerEvent): void {
    if (!this.active) return;

    this.hoveredElements.clear();

    const position = this.getPointerPosition(event);
    this.isErasing = true;
    this.eraseElementsAt(position, position);
    this.lastPosition = position;
  }

  override handlePointerMove(event: PointerEvent): void {
    if (!this.active || !this.isErasing || !this.lastPosition) return;

    const position = this.getPointerPosition(event);
    this.eraseElementsAt(this.lastPosition, position, event.altKey);
    this.lastPosition = position;
  }

  override handlePointerUp(): void {
    if (!this.active) return;

    if (this.hoveredElements.size > 0) {
      const elementsToRemove = Array.from(this.hoveredElements);

      elementsToRemove.forEach((element) => {
        element.isDeleting = false;
      });

      this.dataService.patchElements(elementsToRemove, false);
      this.dataService.removeElements(elementsToRemove.map((element) => element.id));
    }

    // Clear state
    this.hoveredElements.clear();
    this.isErasing = false;
    this.lastPosition = null;
  }
  private eraseElementsAt(lastPosition: Point, position: Point, isAltPressed = false): void {
    const elements = this.dataService.getData();
    const zoom = this.dataService.getConfig()?.zoom || 1;
    const distance = Math.hypot(position.x - lastPosition.x, position.y - lastPosition.y);

    const baseThreshold = 10 / zoom;
    const speedFactor = Math.log2(distance + 1) * 0.5;
    const dynamicThreshold = baseThreshold + distance * speedFactor;

    for (const element of elements) {
      const bounds = getElementUtil(element.type).getBounds(element);
      if (!isBoundsIntersect(bounds, lastPosition, position, dynamicThreshold)) continue;

      if (this.isPointInElement(element, lastPosition, position, dynamicThreshold)) {
        if (isAltPressed) {
          this.hoveredElements.delete(element);
          element.isDeleting = false;
        } else {
          this.hoveredElements.add(element);
          element.isDeleting = true;
        }

        this.dataService.updateElement(element, false);
      }
    }
  }
  private isPointInElement(
    element: WhiteboardElement,
    lastPosition: Point,
    position: Point,
    threshold: number
  ): boolean {
    return getElementUtil(element.type).hitTest(element, lastPosition, position, threshold);
  }
}
