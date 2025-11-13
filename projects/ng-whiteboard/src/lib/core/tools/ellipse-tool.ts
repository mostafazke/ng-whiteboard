import { EllipseElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ToolType, ElementType, WhiteboardElementStyle, Point, PointerInfo } from '../types';
import { snapToGrid } from '../utils/geometry';
import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';

export class EllipseTool extends BaseTool {
  type = ToolType.Ellipse;
  override baseCursor = CursorType.Crosshair;
  element: EllipseElement | null = null;
  startPoint: Point | null = null;

  override handlePointerDown(event: PointerInfo): void {
    if (!this.active) return;

    let { x, y } = this.getPointerPosition(event);

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }
    this.startPoint = { x, y };

    this.element = createElement(
      ElementType.Ellipse,
      {
        cx: x,
        cy: y,
        style: this.getElementStyle(),
        zIndex: this.apiService.getNextZIndex(),
      },
      this.apiService.getActiveLayerId()
    );

    this.apiService.addDraftElements([this.element]);
  }

  override handlePointerMove(event: PointerInfo): void {
    if (!this.active || !this.element || !this.startPoint) return;

    const { x, y } = this.getPointerPosition(event);
    const { x: startX, y: startY } = this.startPoint;

    let cx: number, cy: number, rx: number, ry: number;

    if (event.altKey) {
      // Draw from center
      cx = startX;
      cy = startY;
      rx = Math.abs(x - cx);
      ry = event.shiftKey ? rx : Math.abs(y - cy);
    } else {
      // Draw from corner
      cx = (startX + x) / 2;
      cy = (startY + y) / 2;
      rx = Math.abs(startX - x) / 2;
      ry = event.shiftKey ? rx : Math.abs(startY - y) / 2;

      if (event.shiftKey) {
        cy = y > startY ? startY + rx : startY - rx;
      }
    }

    this.apiService.updateDraftElements([{ id: this.element.id, rx, ry, cx, cy }]);
  }

  override handlePointerUp(): void {
    if (!this.active) return;
    if (this.element && this.startPoint) {
      const element = this.element;
      this.apiService.commitDraftElements();

      // Handle selection based on element's selectAfterDraw property
      if (element.selectAfterDraw) {
        this.apiService.selectElements([element.id]);
      }

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
