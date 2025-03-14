import { HandTool } from './hand-tool';
import { Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DataService } from '../data/data.service';
import { ArrowTool } from './arrow-tool';
import { EllipseTool } from './ellipse-tool';
import { EraserTool } from './eraser-tool';
import { ImageTool } from './image-tool';
import { LineTool } from './line-tool';
import { PenTool } from './pen-tool';
import { RectangleTool } from './rectangle-tool';
import { SelectTool } from './select-tool';
import { TextTool } from './text-tool';
import { Tool, ToolType } from '../types';

@Injectable()
export class ToolManagerService {
  private currentTool!: Tool;
  private toolRegistry: Map<ToolType, Tool> = new Map();

  constructor(private dataService: DataService) {
    this.initializeDefaultTools(dataService);
    this.dataService.selectedTool$.pipe(takeUntilDestroyed()).subscribe((toolType) => {
      this.setCurrentTool(toolType);
    });
  }

  /**
   * Register a new tool dynamically
   * @param toolType - The type of the tool
   * @param tool - The tool instance
   */
  registerTool(toolType: ToolType, tool: Tool): void {
    if (this.toolRegistry.has(toolType)) {
      throw new Error(`Tool of type '${toolType}' is already registered.`);
    }
    this.toolRegistry.set(toolType, tool);
  }

  /**
   * Initialize the default tools
   */
  initializeDefaultTools(dataService: DataService): void {
    this.registerTool(ToolType.Hand, new HandTool(dataService));
    this.registerTool(ToolType.Pen, new PenTool(dataService));
    this.registerTool(ToolType.Line, new LineTool(dataService));
    this.registerTool(ToolType.Arrow, new ArrowTool(dataService));
    this.registerTool(ToolType.Rectangle, new RectangleTool(dataService));
    this.registerTool(ToolType.Ellipse, new EllipseTool(dataService));
    this.registerTool(ToolType.Text, new TextTool(dataService));
    this.registerTool(ToolType.Image, new ImageTool(dataService));
    this.registerTool(ToolType.Select, new SelectTool(dataService));
    this.registerTool(ToolType.Eraser, new EraserTool(dataService));
  }

  /**
   * Set the current active tool
   * @param toolType - The type of the tool to activate
   */
  setCurrentTool(toolType: ToolType): void {
    const currentTool = this.currentTool;
    const newTool = this.toolRegistry.get(toolType);

    if (currentTool) {
      currentTool.deactivate();
    }

    if (newTool) {
      newTool.activate();
      this.currentTool = newTool;
    } else {
      throw new Error(`Tool of type '${toolType}' not found.`);
    }
  }

  /**
   * Get the current active tool instance
   * @returns The active tool instance
   */
  getCurrentTool(): Tool {
    const tool = this.currentTool;
    if (!tool) {
      throw new Error(`No active tool found.`);
    }
    return tool;
  }

  /**
   * Get the current active tool type
   * @returns The active tool type
   */
  getCurrentToolType(): ToolType {
    return this.currentTool.type;
  }

  /**
   * Get a tool instance by type
   * @param type - The type of the tool
   * @returns The tool instance
   */
  getTool(type: ToolType): Tool {
    const tool = this.toolRegistry.get(type);
    if (!tool) {
      throw new Error(`Tool of type '${type}' not found.`);
    }
    return tool;
  }

  /**
   * Clear the registry
   */
  clearRegistry(): void {
    this.toolRegistry.clear();
  }
}
