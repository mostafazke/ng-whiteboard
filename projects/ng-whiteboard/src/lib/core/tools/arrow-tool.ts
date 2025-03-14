import { ArrowElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ElementType, ToolType, WhiteboardElementStyle } from '../types';
import { snapToAngle, snapToGrid } from '../utils/utils';
import { BaseTool } from './base-tool';

export class ArrowTool extends BaseTool {
  type = ToolType.Arrow;
  element: ArrowElement | null = null;
  startPoint: [number, number] | null = null;
  private lastX = 0;
  private lastY = 0;
  private readonly MIN_LENGTH = 2;

  override handlePointerDown(event: PointerEvent): void {
    if (!this.active) return;

    let [x, y] = this.dataService.getCanvasCoordinates([event.offsetX, event.offsetY]);

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }

    this.startPoint = [x, y];
    this.lastX = x;
    this.lastY = y;

    this.element = createElement(ElementType.Arrow, {
      x1: x,
      y1: y,
      x2: x,
      y2: y,
      style: this.getElementStyle(),
    });

    this.dataService.addToDraft(this.element);
  }

  override handlePointerMove(event: PointerEvent): void {
    if (!this.active || !this.element) return;

    let [x2, y2] = this.dataService.getCanvasCoordinates([event.offsetX, event.offsetY]);

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      x2 = snapToGrid(x2, gridSize);
      y2 = snapToGrid(y2, gridSize);
    }

    if (event.shiftKey) {
      const x1 = this.element.x1;
      const y1 = this.element.y1;
      const { x, y } = snapToAngle(x1, y1, x2, y2);
      [x2, y2] = [x, y];
    }

    // Only update if the movement is significant
    if (Math.abs(x2 - this.lastX) > this.MIN_LENGTH || Math.abs(y2 - this.lastY) > this.MIN_LENGTH) {
      this.element.x2 = x2;
      this.element.y2 = y2;
      this.lastX = x2;
      this.lastY = y2;
    }
  }

  override handlePointerUp(): void {
    if (!this.active) return;

    if (this.element && this.startPoint) {
      this.dataService.commitDraftToData();
      this.startPoint = null;
      this.element = null;
    }

    this.lastX = 0;
    this.lastY = 0;
  }

  private getElementStyle(): WhiteboardElementStyle {
    return {
      strokeColor: this.whiteboardConfig.strokeColor,
      strokeWidth: this.whiteboardConfig.strokeWidth,
      lineCap: this.whiteboardConfig.lineCap,
      dasharray: this.whiteboardConfig.dasharray,
      dashoffset: this.whiteboardConfig.dashoffset,
    };
  }
}
