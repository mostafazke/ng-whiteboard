import { Injectable, signal, computed, inject, effect } from '@angular/core';
import { EventBusService } from '../event-bus/event-bus.service';
import { Tool, ToolType, ToolConfig, TOOL_ICONS } from '../types';
import { CursorType } from '../types/cursors';
import { WhiteboardEvent } from '../types/events';
import { ToolFactory } from '../tools/tool-factory.service';
import { ApiService } from '../api';
import { BaseTool } from '../tools';

interface TemporaryToolOverride {
  tool: ToolType;
  reason: string;
  timestamp: number;
}

const DEFAULT_TOOLS: ReadonlyArray<ToolConfig> = [
  {
    id: 'hand',
    type: ToolType.Hand,
    name: 'Hand',
    description: 'Pan and navigate the canvas',
    icon: TOOL_ICONS[ToolType.Hand],
    enabled: true,
    order: 0,
  },
  {
    id: 'select',
    type: ToolType.Select,
    name: 'Select',
    description: 'Select and manipulate elements',
    icon: TOOL_ICONS[ToolType.Select],
    enabled: true,
    order: 1,
  },
  {
    id: 'pen',
    type: ToolType.Pen,
    name: 'Pen',
    description: 'Draw freehand lines',
    icon: TOOL_ICONS[ToolType.Pen],
    enabled: true,
    order: 2,
  },
  {
    id: 'line',
    type: ToolType.Line,
    name: 'Line',
    description: 'Draw straight lines',
    icon: TOOL_ICONS[ToolType.Line],
    enabled: true,
    order: 3,
  },
  {
    id: 'arrow',
    type: ToolType.Arrow,
    name: 'Arrow',
    description: 'Draw arrow lines',
    icon: TOOL_ICONS[ToolType.Arrow],
    enabled: true,
    order: 4,
  },
  {
    id: 'rectangle',
    type: ToolType.Rectangle,
    name: 'Rectangle',
    description: 'Draw rectangles',
    icon: TOOL_ICONS[ToolType.Rectangle],
    enabled: true,
    order: 5,
  },
  {
    id: 'ellipse',
    type: ToolType.Ellipse,
    name: 'Ellipse',
    description: 'Draw ellipses and circles',
    icon: TOOL_ICONS[ToolType.Ellipse],
    enabled: true,
    order: 6,
  },
  {
    id: 'text',
    type: ToolType.Text,
    name: 'Text',
    description: 'Add text annotations',
    icon: TOOL_ICONS[ToolType.Text],
    enabled: true,
    order: 7,
  },
  {
    id: 'image',
    type: ToolType.Image,
    name: 'Image',
    description: 'Add images',
    icon: TOOL_ICONS[ToolType.Image],
    enabled: true,
    order: 8,
  },
  {
    id: 'eraser',
    type: ToolType.Eraser,
    name: 'Eraser',
    description: 'Remove elements',
    icon: TOOL_ICONS[ToolType.Eraser],
    enabled: true,
    order: 9,
  },
] as const;

@Injectable({ providedIn: 'root' })
export class ToolsService {
  private readonly eventBusService = inject(EventBusService);
  private readonly toolFactory = inject(ToolFactory);
  private readonly _apiServiceCache = signal<ApiService | undefined>(undefined);

  private readonly _selectedTool = signal<ToolType>(ToolType.Pen);
  private readonly _toolConfigs = signal<ReadonlyMap<string, ToolConfig>>(new Map());
  private readonly _currentToolInstance = signal<Tool | null>(null);
  private readonly _cursor = signal<CursorType>(CursorType.Default);
  private readonly _temporaryOverrides = signal<readonly TemporaryToolOverride[]>([]);

  private readonly toolInstanceCache = new Map<ToolType, Tool>();

  readonly selectedTool = this._selectedTool.asReadonly();
  readonly currentTool = this._currentToolInstance.asReadonly();
  readonly cursor = this._cursor.asReadonly();
  readonly temporaryOverrides = this._temporaryOverrides.asReadonly();

  readonly effectiveTool = computed((): ToolType => {
    const overrides = this._temporaryOverrides();
    return overrides.length > 0 ? overrides[overrides.length - 1].tool : this._selectedTool();
  });

  readonly availableTools = computed((): readonly ToolConfig[] => {
    const configs = this._toolConfigs();
    return Array.from(configs.values())
      .filter((tool) => tool.enabled)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  });

  constructor() {
    this.initializeDefaultTools();

    effect(
      () => {
        const toolType = this.effectiveTool();
        const apiService = this._apiServiceCache();
        // Only update tool instance after ApiService is initialized
        if (apiService) {
          this.updateCurrentToolInstance(toolType);
        }
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        // Only update cursor after tool instance is available
        if (this._currentToolInstance()) {
          this.updateCursorForActiveTool();
        }
      },
      { allowSignalWrites: true }
    );
  }

  private initializeDefaultTools(): void {
    const configMap = new Map<string, ToolConfig>();
    DEFAULT_TOOLS.forEach((config) => {
      configMap.set(config.id, { ...config });
    });
    this._toolConfigs.set(configMap);
  }

  private updateCurrentToolInstance(toolType: ToolType): void {
    const currentTool = this._currentToolInstance();

    if (currentTool && currentTool.type !== toolType) {
      currentTool.deactivate();
    }

    const newTool = this.getToolInstance(toolType);
    newTool.activate();
    this._currentToolInstance.set(newTool);

    if (!this.hasTemporaryOverride()) {
      this.eventBusService.emit(WhiteboardEvent.ToolChange, toolType);
    }
  }

  private updateCursorForActiveTool(): void {
    const tool = this._currentToolInstance();
    if (tool && 'baseCursor' in tool) {
      this._cursor.set((tool as BaseTool).baseCursor);
    } else {
      this._cursor.set(CursorType.Default);
    }
  }

  getActiveToolType(): ToolType {
    return this.effectiveTool();
  }

  getActiveToolInstance(): Tool {
    const tool = this._currentToolInstance();
    if (!tool) {
      throw new Error('No active tool instance found.');
    }
    return tool;
  }

  setActiveTool(tool: ToolType): void {
    if (this._selectedTool() !== tool) {
      this._selectedTool.set(tool);
    }
  }

  isToolActive(tool: ToolType): boolean {
    return this.effectiveTool() === tool;
  }

  getToolInstance(toolType: ToolType): Tool {
    const isRegistered = Array.from(this._toolConfigs().values()).some((config) => config.type === toolType);

    if (!isRegistered) {
      throw new Error(`Tool type '${toolType}' is not registered.`);
    }

    if (!this.toolInstanceCache.has(toolType)) {
      const apiService = this._apiServiceCache();
      if (!apiService) {
        throw new Error('ApiService not set. Call setApiService() first.');
      }
      const tool = this.toolFactory.createTool(toolType, apiService);
      this.toolInstanceCache.set(toolType, tool);
    }

    const tool = this.toolInstanceCache.get(toolType);
    if (!tool) {
      throw new Error(`Failed to create or retrieve tool instance for type: ${toolType}`);
    }
    return tool;
  }

  getRegisteredToolTypes(): ToolType[] {
    return Array.from(this._toolConfigs().values())
      .map((config) => config.type)
      .filter((type, index, array) => array.indexOf(type) === index);
  }

  isToolRegistered(toolType: ToolType): boolean {
    return Array.from(this._toolConfigs().values()).some((config) => config.type === toolType);
  }

  resetToDefaultTool(): void {
    this.setActiveTool(ToolType.Pen);
  }

  registerTool(config: ToolConfig): void {
    const currentConfigs = this._toolConfigs();
    const updatedConfigs = new Map(currentConfigs);
    updatedConfigs.set(config.id, { ...config });
    this._toolConfigs.set(updatedConfigs);
  }

  registerTools(configs: ToolConfig[]): void {
    const currentConfigs = this._toolConfigs();
    const updatedConfigs = new Map(currentConfigs);

    configs.forEach((config) => {
      updatedConfigs.set(config.id, { ...config });
    });

    this._toolConfigs.set(updatedConfigs);
  }

  unregisterTool(toolId: string): boolean {
    const currentConfigs = this._toolConfigs();

    if (!currentConfigs.has(toolId)) {
      return false;
    }

    const toolConfig = currentConfigs.get(toolId);
    const updatedConfigs = new Map(currentConfigs);
    updatedConfigs.delete(toolId);
    this._toolConfigs.set(updatedConfigs);

    if (this._selectedTool() === toolConfig?.type) {
      this.resetToDefaultTool();
    }

    return true;
  }

  getToolConfig(toolId: string): ToolConfig | undefined {
    return this._toolConfigs().get(toolId);
  }

  getToolConfigs(): readonly ToolConfig[] {
    return Array.from(this._toolConfigs().values());
  }

  setToolEnabled(toolId: string, enabled: boolean): boolean {
    const config = this.getToolConfig(toolId);
    if (!config) return false;

    this.registerTool({ ...config, enabled });

    if (!enabled && this._selectedTool() === config.type) {
      this.resetToDefaultTool();
    }

    return true;
  }

  setToolEnabledByType(toolType: ToolType, enabled: boolean): boolean {
    const config = Array.from(this._toolConfigs().values()).find((c) => c.type === toolType);
    if (!config) return false;

    return this.setToolEnabled(config.id, enabled);
  }

  setEnabledTools(toolTypes: ToolType[]): void {
    const enabledSet = new Set(toolTypes);
    const currentConfigs = this._toolConfigs();
    const updatedConfigs = new Map<string, ToolConfig>();

    currentConfigs.forEach((config, id) => {
      updatedConfigs.set(id, {
        ...config,
        enabled: enabledSet.has(config.type),
      });
    });

    this._toolConfigs.set(updatedConfigs);

    if (!enabledSet.has(this._selectedTool())) {
      const firstEnabled = toolTypes[0] || ToolType.Pen;
      this.setActiveTool(firstEnabled);
    }
  }

  pushTemporaryTool(tool: ToolType, reason = `temp-${Date.now()}`): void {
    const overrides = this._temporaryOverrides();

    if (overrides.some((override) => override.reason === reason)) {
      return;
    }

    const newOverride: TemporaryToolOverride = {
      tool,
      reason,
      timestamp: Date.now(),
    };

    this._temporaryOverrides.update((overrides) => [...overrides, newOverride]);
  }

  popTemporaryTool(reason?: string): void {
    const overrides = this._temporaryOverrides();

    if (overrides.length === 0) return;

    let newOverrides: TemporaryToolOverride[];

    if (reason) {
      newOverrides = overrides.filter((override) => override.reason !== reason);
    } else {
      newOverrides = overrides.slice(0, -1);
    }

    if (newOverrides.length !== overrides.length) {
      this._temporaryOverrides.set(newOverrides);
    }
  }

  clearTemporaryTools(): void {
    this._temporaryOverrides.set([]);
  }

  hasTemporaryOverride(): boolean {
    return this._temporaryOverrides().length > 0;
  }

  setCursor(cursor: CursorType): void {
    this._cursor.set(cursor);
  }

  resetCursor(): void {
    this.updateCursorForActiveTool();
  }

  destroy(): void {
    const currentTool = this._currentToolInstance();
    if (currentTool) {
      currentTool.deactivate();
    }

    this.toolInstanceCache.clear();
    this.clearTemporaryTools();
  }

  setApiService(apiService: ApiService): void {
    this._apiServiceCache.set(apiService);
  }
}
