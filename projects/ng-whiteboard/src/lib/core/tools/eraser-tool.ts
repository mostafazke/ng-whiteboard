import { getElementUtil } from '../elements/element.utils';
import { Point, PointerInfo, ToolType, WhiteboardElement } from '../types';
import { CursorType } from '../types/cursors';
import { isBoundsIntersect } from '../utils/geometry';
import { BaseTool } from './base-tool';

export class EraserTool extends BaseTool {
  type = ToolType.Eraser;
  override baseCursor = CursorType.Eraser;
  private isErasing = false;
  private readonly hoveredElementIds: Set<string> = new Set();
  private lastPosition: Point | null = null;

  override handlePointerDown(event: PointerInfo): void {
    if (!this.active) return;

    this.hoveredElementIds.clear();

    const position = this.getPointerPosition(event);
    this.isErasing = true;
    this.eraseElementsAt(position, position);
    this.lastPosition = position;
  }

  override handlePointerMove(event: PointerInfo): void {
    if (!this.active || !this.isErasing || !this.lastPosition) return;

    const position = this.getPointerPosition(event);
    this.eraseElementsAt(this.lastPosition, position, event.altKey);
    this.lastPosition = position;
  }

  override handlePointerUp(): void {
    if (!this.active) return;

    if (this.hoveredElementIds.size > 0) {
      const elementsToRemoveIds = Array.from(this.hoveredElementIds);
      const expandedIds = this.expandToIncludeGroups(elementsToRemoveIds);

      const elementsToRemove = this.apiService.getElements().filter((el) => expandedIds.includes(el.id));
      elementsToRemove.forEach((el) => {
        el.isDeleting = false;
      });

      this.apiService.updateElements(elementsToRemove);
      this.apiService.removeElements(elementsToRemove);
    }

    this.hoveredElementIds.clear();
    this.isErasing = false;
    this.lastPosition = null;
  }

  private eraseElementsAt(lastPosition: Point, position: Point, isAltPressed = false): void {
    const elements = this.apiService.getElements();
    const zoom = this.apiService.getConfig()?.zoom || 1;
    const distance = Math.hypot(position.x - lastPosition.x, position.y - lastPosition.y);

    const baseThreshold = 10 / zoom;
    const speedFactor = Math.log2(distance + 1) * 0.5;
    const dynamicThreshold = baseThreshold + distance * speedFactor;

    for (const element of elements) {
      const bounds = getElementUtil(element.type).getBounds(element);
      if (!isBoundsIntersect(bounds, lastPosition, position, dynamicThreshold)) continue;

      if (this.isPointInElement(element, lastPosition, position, dynamicThreshold)) {
        if (isAltPressed) {
          const groupedIds = this.expandToIncludeGroups([element.id]);
          groupedIds.forEach((id) => {
            this.hoveredElementIds.delete(id);
            const el = elements.find((e) => e.id === id);
            if (el) el.isDeleting = false;
          });
        }

        if (!isAltPressed && !this.hoveredElementIds.has(element.id)) {
          const groupedIds = this.expandToIncludeGroups([element.id]);
          groupedIds.forEach((id) => {
            this.hoveredElementIds.add(id);
            const el = elements.find((e) => e.id === id);
            if (el) el.isDeleting = true;
          });
        }

        const affectedIds = this.expandToIncludeGroups([element.id]);
        const affectedElements = elements.filter((el) => affectedIds.includes(el.id));
        this.apiService.updateElements(affectedElements);
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

  private expandToIncludeGroups(elementIds: string[]): string[] {
    const allElements = this.apiService.getElements();
    const elementsToExpand = allElements.filter((el) => elementIds.includes(el.id));

    const groupIds = new Set(
      elementsToExpand
        .map((el) => el.groupId)
        .filter((groupId): groupId is string => groupId !== undefined && groupId !== null)
    );

    if (groupIds.size === 0) {
      return elementIds;
    }

    const expandedElements = allElements.filter((el) => {
      return elementIds.includes(el.id) || (el.groupId && groupIds.has(el.groupId));
    });

    return expandedElements.map((el) => el.id);
  }
}
