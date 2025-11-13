import { PointerInfo, ToolType } from '../types';
import { BaseTool } from './base-tool';
import { CursorType } from '../types/cursors';

export class HandTool extends BaseTool {
  type = ToolType.Hand;
  override baseCursor = CursorType.Grab;
  private isDragging = false;
  private startX = 0;
  private startY = 0;

  override handlePointerDown(event: PointerInfo): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.setCursor(CursorType.Grabbing);
  }

  override handlePointerMove(event: PointerInfo): void {
    if (!this.isDragging) return;
    const { zoom } = this.whiteboardConfig;

    const mouseDX = (event.clientX - this.startX) / zoom;
    const mouseDY = (event.clientY - this.startY) / zoom;

    this.apiService.pan(mouseDX, mouseDY);

    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  override handlePointerUp(): void {
    this.isDragging = false;
    this.resetCursor();
  }
}
