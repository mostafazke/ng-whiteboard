import { PointerInfo, ToolType } from '../types';
import { CursorType } from '../types/cursors';
import { BaseTool } from './base-tool';

export class ImageTool extends BaseTool {
  type = ToolType.Image;
  override baseCursor = CursorType.Image;

  override handlePointerDown(event: PointerInfo): void {
    this.apiService.pickImage(this.getPointerPosition(event));
  }
}
