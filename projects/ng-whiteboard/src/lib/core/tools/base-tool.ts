import { DataService } from '../data/data.service';
import { Point, Tool, ToolType, WhiteboardConfig } from '../types';
import { getCanvasCoordinates } from '../utils';

export abstract class BaseTool implements Tool {
  abstract type: ToolType;
  protected active = false;

  constructor(protected dataService: DataService) {}

  get whiteboardConfig(): WhiteboardConfig {
    return this.dataService?.getConfig();
  }

  getPointerPosition(event: PointerEvent): Point {
    return getCanvasCoordinates(this.dataService.getConfig(), { x: event.offsetX, y: event.offsetY });
  }
  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  get isActive() {
    return this.active;
  }

  handlePointerDown?(event: PointerEvent): void;
  handlePointerMove?(event: PointerEvent): void;
  handlePointerUp?(event: PointerEvent): void;
}
