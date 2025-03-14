import { EllipseElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ToolType, ElementType, WhiteboardElementStyle } from '../types';
import { snapToGrid } from '../utils/utils';
import { BaseTool } from './base-tool';

export class EllipseTool extends BaseTool {
  type = ToolType.Ellipse;
  element: EllipseElement | null = null;
  startPoint: [number, number] | null = null;

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

    this.element = createElement(ElementType.Ellipse, {
      cx: x,
      cy: y,
      style: this.getElementStyle(),
    });

    this.dataService.addToDraft(this.element);
  }

  override handlePointerMove(event: PointerEvent): void {
    if (!this.active || !this.element || !this.startPoint) return;

    const [x, y] = this.dataService.getCanvasCoordinates([event.offsetX, event.offsetY]);
    const start_x = this.startPoint[0] || 0;
    const start_y = this.startPoint[1] || 0;
    let cx = Math.abs(start_x + (x - start_x) / 2);
    let cy = Math.abs(start_y + (y - start_y) / 2);
    let rx = Math.abs(start_x - cx);
    let ry = Math.abs(start_y - cy);

    if (event.shiftKey) {
      ry = rx;
      cy = y > start_y ? start_y + rx : start_y - rx;
    }
    if (event.altKey) {
      cx = start_x;
      cy = start_y;
      rx = Math.abs(x - cx);
      ry = event.shiftKey ? rx : Math.abs(y - cy);
    }

    this.element.rx = rx;
    this.element.ry = ry;
    this.element.cx = cx;
    this.element.cy = cy;
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
      fill: this.whiteboardConfig.fill,
      dasharray: this.whiteboardConfig.dasharray,
      dashoffset: this.whiteboardConfig.dashoffset,
    };
  }
}
