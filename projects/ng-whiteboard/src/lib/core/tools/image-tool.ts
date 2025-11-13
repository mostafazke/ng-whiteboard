import { PointerInfo, ToolType } from '../types';
import { CursorType } from '../types/cursors';
import { BaseTool } from './base-tool';

export class ImageTool extends BaseTool {
  type = ToolType.Image;
  override baseCursor = CursorType.Image;

  override handlePointerDown(event: PointerInfo): void {
    const { x, y } = this.getPointerPosition(event);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent) => {
          const image = (e.target as FileReader).result as string;
          this.apiService.addImage({ image, x, y });
        };
        reader.readAsDataURL(files[0]);
      }
    };
    input.click();
  }
}
