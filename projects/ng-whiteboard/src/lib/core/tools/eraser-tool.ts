import { ToolType, WhiteboardElement } from '../types';
import { getTargetElement } from '../utils';
import { BaseTool } from './base-tool';

export class EraserTool extends BaseTool {
  type = ToolType.Eraser;
  private hoveredElements: Set<WhiteboardElement> = new Set();

  override handlePointerDown(event: PointerEvent): void {
    if (!this.active) return;

    this.hoveredElements.clear();
    this.processElement(event);
  }

  override handlePointerUp(): void {
    if (!this.active) return;

    this.hoveredElements.forEach(({ id }) => {
      this.dataService.removeElement(id);
    });
    this.hoveredElements.clear();
  }

  private processElement(event: PointerEvent): void {
    const element = getTargetElement(event, this.dataService.getData());
    if (element && !this.hoveredElements.has(element)) {
      element.opacity = 50;
      this.hoveredElements.add(element);
      this.dataService.updateElement(element, false);
    }
  }
}
