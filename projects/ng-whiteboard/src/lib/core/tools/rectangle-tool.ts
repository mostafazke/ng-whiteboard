import { RectangleElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ElementType, Point, ToolType, WhiteboardElementStyle } from '../types';
import { snapToGrid } from '../utils/utils';
import { BaseTool } from './base-tool';

export class RectangleTool extends BaseTool {
  type = ToolType.Rectangle;
  element: RectangleElement | null = null;
  startPoint: Point | null = null;

  override handlePointerDown(event: PointerEvent): void {
    if (!this.active) return;

    let { x, y } = this.getPointerPosition(event);

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }
    this.startPoint = { x, y };

    this.element = createElement(ElementType.Rectangle, {
      x,
      y,
      style: this.getElementStyle(),
    });

    this.dataService.addToDraft(this.element);
  }

  override handlePointerMove(event: PointerEvent): void {
    if (!this.active || !this.element || !this.startPoint) return;

    const { x, y } = this.getPointerPosition(event);
    const start_x = this.startPoint.x;
    const start_y = this.startPoint.y;
    let w = Math.abs(x - start_x);
    let h = Math.abs(y - start_y);
    let new_x = null;
    let new_y = null;

    if (event.shiftKey) {
      w = h = Math.max(w, h);
      new_x = start_x < x ? start_x : start_x - w;
      new_y = start_y < y ? start_y : start_y - h;
    } else {
      new_x = Math.min(start_x, x);
      new_y = Math.min(start_y, y);
    }
    if (event.altKey) {
      w *= 2;
      h *= 2;
      new_x = start_x - w / 2;
      new_y = start_y - h / 2;
    }

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      w = snapToGrid(w, gridSize);
      h = snapToGrid(h, gridSize);
      new_x = snapToGrid(new_x, gridSize);
      new_y = snapToGrid(new_y, gridSize);
    }

    this.element.width = w;
    this.element.height = h;
    this.element.x = new_x;
    this.element.y = new_y;
  }

  override handlePointerUp(): void {
    if (!this.active) return;
    if (this.element && this.startPoint) {
      this.dataService.commitDraftToData();
      this.startPoint = null;
      this.element = null;
    }
  }

  private getElementStyle(): WhiteboardElementStyle {
    return {
      strokeColor: this.whiteboardConfig.strokeColor,
      strokeWidth: this.whiteboardConfig.strokeWidth,
      lineJoin: this.whiteboardConfig.lineJoin,
      fill: this.whiteboardConfig.fill,
      dasharray: this.whiteboardConfig.dasharray,
      dashoffset: this.whiteboardConfig.dashoffset,
    };
  }
}
