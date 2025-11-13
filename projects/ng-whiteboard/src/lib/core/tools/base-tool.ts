import { ApiService } from '../api/api.service';
import { Point, PointerInfo, Tool, ToolType, WhiteboardConfig } from '../types';
import { CursorType } from '../types/cursors';
import { getCanvasCoordinates } from '../utils/geometry';

export abstract class BaseTool implements Tool {
  abstract type: ToolType;
  protected active = false;
  // Base cursor for this tool (used when tool becomes active)
  baseCursor: CursorType = CursorType.Default;

  constructor(protected apiService: ApiService) {}

  get whiteboardConfig(): WhiteboardConfig {
    return this.apiService?.getConfig();
  }

  getPointerPosition({ x, y }: PointerInfo): Point {
    return getCanvasCoordinates(this.apiService.getConfig(), { x, y });
  }

  activate(): void {
    this.active = true;
    this.onActivate?.();
  }

  deactivate(): void {
    this.active = false;
    this.onDeactivate?.();
  }

  protected setCursor(cursor: CursorType) {
    this.apiService.setCursor(cursor);
  }

  protected resetCursor() {
    this.apiService.resetCursor();
  }

  get isActive() {
    return this.active;
  }

  handlePointerDown?(event: PointerInfo): void;
  handlePointerMove?(event: PointerInfo): void;
  handlePointerUp?(event: PointerInfo): void;
  handleKeyDown?(event: KeyboardEvent): void;
  handleKeyUp?(event: KeyboardEvent): void;
  onActivate?(): void;
  onDeactivate?(): void;
}
