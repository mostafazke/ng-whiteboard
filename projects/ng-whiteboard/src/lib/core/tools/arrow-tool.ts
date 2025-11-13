import { ArrowElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { ElementType, Point, PointerInfo, ToolType, WhiteboardElementStyle } from '../types';
import { snapToAngle, snapToGrid } from '../utils/geometry';
import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';

export class ArrowTool extends BaseTool {
  type = ToolType.Arrow;
  override baseCursor = CursorType.Crosshair;
  element: ArrowElement | null = null;
  startPoint: Point | null = null;
  private lastX = 0;
  private lastY = 0;
  private readonly MIN_LENGTH = 2;

  override handlePointerDown(event: PointerInfo): void {
    if (!this.active) return;

    const coordinates = this.getPointerPosition(event);
    let { x, y } = coordinates;

    const { snapToGrid: allowedSnap } = this.whiteboardConfig;
    if (allowedSnap) {
      const { gridSize } = this.whiteboardConfig;
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }

    this.startPoint = { x, y };
    this.lastX = x;
    this.lastY = y;

    this.element = createElement(
      ElementType.Arrow,
      {
        x1: x,
        y1: y,
        x2: x,
        y2: y,
        style: this.getElementStyle(),
        zIndex: this.apiService.getNextZIndex(),
      },
      this.apiService.getActiveLayerId()
    );

    this.apiService.addDraftElements([this.element]);
  }
  override handlePointerMove(event: PointerInfo): void {
    if (!this.active || !this.element) return;

    const coordinates = this.getPointerPosition(event);
    let x2 = coordinates.x;
    let y2 = coordinates.y;

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
      x2 = x;
      y2 = y;
    }

    if (Math.abs(x2 - this.lastX) > this.MIN_LENGTH || Math.abs(y2 - this.lastY) > this.MIN_LENGTH) {
      this.apiService.updateDraftElements([{ id: this.element.id, x2, y2 }]);
      this.lastX = x2;
      this.lastY = y2;
    }
  }
  override handlePointerUp(): void {
    if (!this.active) return;

    if (this.element && this.startPoint) {
      const element = this.element;
      this.apiService.commitDraftElements();

      if (element.selectAfterDraw) {
        this.apiService.selectElements([element.id]);
      }

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
