import { ShapeElement } from '../elements';
import { createElement } from '../elements/element.utils';
import { drawingStyle } from '../config/drawing-style';
import { ElementType, Point, PointerInfo, ToolType } from '../types';
import { CursorType } from '../types/cursors';
import { snapToGrid } from '../utils/geometry';
import { BaseTool } from './base-tool';

export class ShapeTool extends BaseTool {
  type = ToolType.Shape;
  override baseCursor = CursorType.Crosshair;
  element: ShapeElement | null = null;
  startPoint: Point | null = null;
  private aspectRatio = 1;

  override cancel(): void {
    if (this.element) this.apiService.removeDraftElements([this.element.id]);
    this.element = null;
    this.startPoint = null;
  }

  override handlePointerDown(event: PointerInfo): void {
    if (!this.active) return;

    const shape = this.apiService.getActiveShape();
    if (!shape) return;

    let { x, y } = this.getPointerPosition(event);

    if (this.whiteboardConfig.snapToGrid) {
      const { gridSize } = this.whiteboardConfig;
      x = snapToGrid(x, gridSize);
      y = snapToGrid(y, gridSize);
    }
    this.startPoint = { x, y };
    this.aspectRatio = shape.aspectRatio;

    this.element = createElement(
      ElementType.Shape,
      {
        x,
        y,
        shapeId: shape.id,
        path: shape.path,
        style: drawingStyle(this.whiteboardConfig),
        zIndex: this.apiService.getNextZIndex(),
      },
      this.apiService.getActiveLayerId()
    ) as ShapeElement;

    this.apiService.addDraftElements([this.element]);
  }

  override handlePointerMove(event: PointerInfo): void {
    if (!this.active || !this.element || !this.startPoint) return;

    const { x, y } = this.getPointerPosition(event);
    const start_x = this.startPoint.x;
    const start_y = this.startPoint.y;
    let w = Math.abs(x - start_x);
    let h = Math.abs(y - start_y);
    let new_x = null;
    let new_y = null;

    if (event.shiftKey) {
      w = Math.max(w, h * this.aspectRatio);
      h = w / this.aspectRatio;
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

    if (this.whiteboardConfig.snapToGrid) {
      const { gridSize } = this.whiteboardConfig;
      w = snapToGrid(w, gridSize);
      h = event.shiftKey ? w / this.aspectRatio : snapToGrid(h, gridSize);
      new_x = snapToGrid(new_x, gridSize);
      new_y = snapToGrid(new_y, gridSize);
    }

    this.apiService.updateDraftElements([{ id: this.element.id, width: w, height: h, x: new_x, y: new_y }]);
  }

  override handlePointerUp(): void {
    if (!this.active) return;
    if (this.element && this.startPoint) {
      const element = this.element;
      this.apiService.commitDraftElements();

      this.apiService.finalizeDraw(element);

      this.startPoint = null;
      this.element = null;
    }
  }
}
