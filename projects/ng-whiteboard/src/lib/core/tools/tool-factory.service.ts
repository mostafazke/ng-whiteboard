import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api';
import { ArrowBindingService, ConnectionPointsService, ConnectionUIService } from '../elements';
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
  private connectionPointsService = inject(ConnectionPointsService);
  private arrowBindingService = inject(ArrowBindingService);
  private connectionUIService = inject(ConnectionUIService);

  createTool(toolType: ToolType, apiService: ApiService): Tool {
    switch (toolType) {
      case ToolType.Arrow: {
        const tool = new ArrowTool(apiService);
        tool.setConnectionServices(this.connectionPointsService, this.arrowBindingService, this.connectionUIService);
        return tool;
      }
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
      case ToolType.Select: {
        const tool = new SelectTool(apiService);
        tool.setConnectionServices(this.connectionPointsService, this.arrowBindingService, this.connectionUIService);
        return tool;
      }
      case ToolType.Text:
        return new TextTool(apiService);
      default:
        throw new Error(`Unknown tool type: ${toolType}`);
    }
  }
}
