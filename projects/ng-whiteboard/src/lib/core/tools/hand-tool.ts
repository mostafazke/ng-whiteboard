import { ToolType } from '../types';
import { BaseTool } from './base-tool';

export class HandTool extends BaseTool {
  type = ToolType.Hand;
  private isDragging = false;
  private startX = 0;
  private startY = 0;

  override handlePointerDown(event: PointerEvent): void {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  override handlePointerMove(event: PointerEvent): void {
    if (!this.isDragging) return;

    const mouseDX = event.clientX - this.startX;
    const mouseDY = event.clientY - this.startY;
    const { gridTranslation, elementsTranslation } = this.dataService.getConfig();

    const newGridTranslation = {
      x: gridTranslation.x + mouseDX,
      y: gridTranslation.y + mouseDY,
    };

    const newElementsTranslation = {
      x: elementsTranslation.x + mouseDX,
      y: elementsTranslation.y + mouseDY,
    };

    this.updateGridPosition(newGridTranslation.x % 100, newGridTranslation.y % 100);
    this.updateElementsPosition(newElementsTranslation.x, newElementsTranslation.y);

    this.startX = event.clientX;
    this.startY = event.clientY;
  }

  override handlePointerUp(): void {
    this.isDragging = false;
  }

  private updateGridPosition(dx: number, dy: number): void {
    this.dataService.updateGridTranslation(dx, dy);
  }

  private updateElementsPosition(dx: number, dy: number): void {
    this.dataService.updateElementsTranslation(dx, dy);
  }
}
