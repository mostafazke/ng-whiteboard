import { DataService } from '../data/data.service';
import { Tool, ToolType, WhiteboardConfig } from '../types';

export abstract class BaseTool implements Tool {
  abstract type: ToolType;
  protected active = false;

  constructor(protected dataService: DataService) {}

  get whiteboardConfig(): WhiteboardConfig {
    return this.dataService?.getConfig();
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
