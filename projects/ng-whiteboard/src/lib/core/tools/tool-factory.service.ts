import { Injectable } from '@angular/core';
import { ApiService } from '../api';
import {
  ArrowTool,
  EllipseTool,
  EraserTool,
  HandTool,
  ImageTool,
  LineTool,
  PenTool,
  RectangleTool,
  SelectTool,
  TextTool,
} from '../tools';
import { Tool, ToolType } from '../types';

@Injectable({ providedIn: 'root' })
export class ToolFactory {
  createTool(toolType: ToolType, apiService: ApiService): Tool {
    switch (toolType) {
      case ToolType.Arrow:
        return new ArrowTool(apiService);
      case ToolType.Ellipse:
        return new EllipseTool(apiService);
      case ToolType.Eraser:
        return new EraserTool(apiService);
      case ToolType.Hand:
        return new HandTool(apiService);
      case ToolType.Image:
        return new ImageTool(apiService);
      case ToolType.Line:
        return new LineTool(apiService);
      case ToolType.Pen:
        return new PenTool(apiService);
      case ToolType.Rectangle:
        return new RectangleTool(apiService);
      case ToolType.Select:
        return new SelectTool(apiService);
      case ToolType.Text:
        return new TextTool(apiService);
      default:
        throw new Error(`Unknown tool type: ${toolType}`);
    }
  }
}
