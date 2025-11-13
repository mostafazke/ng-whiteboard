import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ToolsService } from './tools.service';
import { ToolFactory } from './tool-factory.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { ApiService } from '../api/api.service';
import { ToolType, Tool, ToolConfig } from '../types';
import { CursorType } from '../types/cursors';
import { WhiteboardEvent } from '../types/events';
import { createMockApiService } from '../testing';

describe('ToolsService', () => {
  let service: ToolsService;
  let mockApiService: ReturnType<typeof createMockApiService>;
  let mockEventBus: jest.Mocked<EventBusService>;
  let mockToolFactory: jest.Mocked<ToolFactory>;

  const createMockTool = (type: ToolType): Tool => ({
    type,
    activate: jest.fn(),
    deactivate: jest.fn(),
    handlePointerDown: jest.fn(),
    handlePointerMove: jest.fn(),
    handlePointerUp: jest.fn(),
    onActivate: jest.fn(),
    onDeactivate: jest.fn(),
  });

  beforeEach(() => {
    mockApiService = createMockApiService();

    mockEventBus = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    } as unknown as jest.Mocked<EventBusService>;

    mockToolFactory = {
      createTool: jest.fn((type: ToolType) => createMockTool(type)),
    } as unknown as jest.Mocked<ToolFactory>;

    TestBed.configureTestingModule({
      providers: [
        ToolsService,
        { provide: ApiService, useValue: mockApiService },
        { provide: EventBusService, useValue: mockEventBus },
        { provide: ToolFactory, useValue: mockToolFactory },
      ],
    });

    service = TestBed.inject(ToolsService);
    service.setApiService(mockApiService as unknown as ApiService);

    // Clear mock calls from initialization
    mockEventBus.emit.mockClear();
    mockToolFactory.createTool.mockClear();
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default tools', () => {
      const configs = service.getToolConfigs();
      expect(configs.length).toBeGreaterThan(0);
      expect(configs.some((c) => c.type === ToolType.Pen)).toBe(true);
      expect(configs.some((c) => c.type === ToolType.Hand)).toBe(true);
    });

    it('should initialize with Pen as selected tool', () => {
      expect(service.selectedTool()).toBe(ToolType.Pen);
    });

    it('should have correct number of default tools', () => {
      const configs = service.getToolConfigs();
      expect(configs.length).toBe(10); // Hand, Select, Pen, Line, Arrow, Rectangle, Ellipse, Text, Image, Eraser
    });
  });

  describe('Tool Instance Management', () => {
    it('should get tool instance', () => {
      const tool = service.getToolInstance(ToolType.Hand);
      expect(tool).toBeDefined();
      expect(tool.type).toBe(ToolType.Hand);
    });

    it('should cache tool instances', () => {
      // Clear the mock calls from initialization
      mockToolFactory.createTool.mockClear();

      const tool1 = service.getToolInstance(ToolType.Hand);
      const tool2 = service.getToolInstance(ToolType.Hand);
      expect(tool1).toBe(tool2);
      expect(mockToolFactory.createTool).toHaveBeenCalledTimes(1);
    });

    it('should create different instances for different tool types', () => {
      const handTool = service.getToolInstance(ToolType.Hand);
      const penTool = service.getToolInstance(ToolType.Pen);
      expect(handTool).not.toBe(penTool);
      expect(handTool.type).toBe(ToolType.Hand);
      expect(penTool.type).toBe(ToolType.Pen);
    });

    it('should throw error when getting unregistered tool', () => {
      const configs = service.getToolConfigs();
      configs.forEach((config) => {
        if (config.type === ToolType.Arrow) {
          service.unregisterTool(config.id);
        }
      });

      expect(() => service.getToolInstance(ToolType.Arrow)).toThrow(`Tool type '${ToolType.Arrow}' is not registered.`);
    });

    it('should throw error when ApiService not set', () => {
      // Create a new service instance via TestBed but don't set ApiService
      const newService = TestBed.inject(ToolsService);
      // Clear the apiServiceCache to simulate not being set
      (newService as any).apiServiceCache = undefined;

      expect(() => newService.getToolInstance(ToolType.Hand)).toThrow(
        'ApiService not set. Call setApiService() first.'
      );
    });

    it('should get active tool instance', () => {
      service.setActiveTool(ToolType.Hand);
      // Wait for effects to run
      TestBed.flushEffects();
      const tool = service.getActiveToolInstance();
      expect(tool.type).toBe(ToolType.Hand);
    });

    it('should throw error when no active tool instance', () => {
      // Create a service and manually clear the current tool instance
      const testService = TestBed.inject(ToolsService);
      (testService as any)._currentToolInstance.set(null);

      expect(() => testService.getActiveToolInstance()).toThrow('No active tool instance found.');
    });
  });

  describe('Active Tool Management', () => {
    it('should set active tool', () => {
      service.setActiveTool(ToolType.Hand);
      expect(service.getActiveToolType()).toBe(ToolType.Hand);
    });

    it('should check if tool is active', () => {
      service.setActiveTool(ToolType.Hand);
      expect(service.isToolActive(ToolType.Hand)).toBe(true);
      expect(service.isToolActive(ToolType.Pen)).toBe(false);
    });

    it('should switch between tools', () => {
      service.setActiveTool(ToolType.Hand);
      expect(service.getActiveToolType()).toBe(ToolType.Hand);

      service.setActiveTool(ToolType.Pen);
      expect(service.getActiveToolType()).toBe(ToolType.Pen);
    });

    it('should not set tool if already active', () => {
      service.setActiveTool(ToolType.Hand);
      const emitCount = mockEventBus.emit.mock.calls.length;
      service.setActiveTool(ToolType.Hand);
      expect(mockEventBus.emit).toHaveBeenCalledTimes(emitCount); // No additional emit
    });

    it('should emit ToolChange event when switching tools', () => {
      // Service starts with Pen active, so switch to different tool
      mockEventBus.emit.mockClear(); // Clear previous calls
      service.setActiveTool(ToolType.Hand);
      TestBed.flushEffects(); // Let effects run
      expect(mockEventBus.emit).toHaveBeenCalledWith(WhiteboardEvent.ToolChange, ToolType.Hand);
    });

    it('should deactivate old tool when switching', () => {
      service.setActiveTool(ToolType.Hand);
      TestBed.flushEffects(); // Let the effect run
      const handTool = service.currentTool();

      service.setActiveTool(ToolType.Pen);
      TestBed.flushEffects(); // Let the effect run
      expect(handTool?.deactivate).toHaveBeenCalled();
    });

    it('should activate new tool when switching', () => {
      service.setActiveTool(ToolType.Hand);
      const handTool = service.currentTool();
      expect(handTool?.activate).toHaveBeenCalled();
    });

    it('should reset to default tool', () => {
      service.setActiveTool(ToolType.Hand);
      service.resetToDefaultTool();
      expect(service.getActiveToolType()).toBe(ToolType.Pen);
    });

    it('should get active tool type', () => {
      service.setActiveTool(ToolType.Ellipse);
      expect(service.getActiveToolType()).toBe(ToolType.Ellipse);
    });
  });

  describe('Tool Registration', () => {
    it('should register new tool', () => {
      const customConfig: ToolConfig = {
        id: 'custom-tool',
        type: ToolType.Pen,
        name: 'Custom Tool',
        description: 'A custom tool',
        enabled: true,
        order: 100,
      };

      service.registerTool(customConfig);
      const config = service.getToolConfig('custom-tool');
      expect(config).toEqual(customConfig);
    });

    it('should register multiple tools', () => {
      const configs: ToolConfig[] = [
        {
          id: 'custom-1',
          type: ToolType.Pen,
          name: 'Custom 1',
          enabled: true,
        },
        {
          id: 'custom-2',
          type: ToolType.Line,
          name: 'Custom 2',
          enabled: true,
        },
      ];

      service.registerTools(configs);
      expect(service.getToolConfig('custom-1')).toBeDefined();
      expect(service.getToolConfig('custom-2')).toBeDefined();
    });

    it('should check if tool is registered', () => {
      expect(service.isToolRegistered(ToolType.Hand)).toBe(true);
      expect(service.isToolRegistered(ToolType.Pen)).toBe(true);
    });

    it('should get registered tool types', () => {
      const toolTypes = service.getRegisteredToolTypes();
      expect(toolTypes).toContain(ToolType.Hand);
      expect(toolTypes).toContain(ToolType.Pen);
      expect(toolTypes.length).toBeGreaterThan(0);
    });

    it('should return unique tool types', () => {
      // Register duplicate tool type
      service.registerTool({
        id: 'duplicate-pen',
        type: ToolType.Pen,
        name: 'Duplicate Pen',
        enabled: true,
      });

      const toolTypes = service.getRegisteredToolTypes();
      const penCount = toolTypes.filter((t) => t === ToolType.Pen).length;
      expect(penCount).toBe(1);
    });

    it('should unregister tool', () => {
      const customConfig: ToolConfig = {
        id: 'temp-tool',
        type: ToolType.Hand,
        name: 'Temp Tool',
        enabled: true,
      };

      service.registerTool(customConfig);
      expect(service.getToolConfig('temp-tool')).toBeDefined();

      const result = service.unregisterTool('temp-tool');
      expect(result).toBe(true);
      expect(service.getToolConfig('temp-tool')).toBeUndefined();
    });

    it('should return false when unregistering non-existent tool', () => {
      const result = service.unregisterTool('non-existent');
      expect(result).toBe(false);
    });

    it('should switch to default when unregistering active tool', () => {
      const customConfig: ToolConfig = {
        id: 'active-tool',
        type: ToolType.Hand,
        name: 'Active Tool',
        enabled: true,
      };

      service.registerTool(customConfig);
      service.setActiveTool(ToolType.Hand);
      expect(service.getActiveToolType()).toBe(ToolType.Hand);

      service.unregisterTool('active-tool');
      expect(service.getActiveToolType()).toBe(ToolType.Pen);
    });
  });

  describe('Tool Configuration', () => {
    it('should get tool config', () => {
      const configs = service.getToolConfigs();
      const handConfig = configs.find((c) => c.type === ToolType.Hand);
      expect(handConfig).toBeDefined();
      expect(handConfig?.name).toBe('Hand');
    });

    it('should get all tool configs', () => {
      const configs = service.getToolConfigs();
      expect(Array.isArray(configs)).toBe(true);
      expect(configs.length).toBeGreaterThan(0);
    });

    it('should enable/disable tool', () => {
      const configs = service.getToolConfigs();
      const handConfig = configs.find((c) => c.type === ToolType.Hand);
      expect(handConfig).toBeDefined();

      const result = service.setToolEnabled(handConfig!.id, false);
      expect(result).toBe(true);

      const updatedConfig = service.getToolConfig(handConfig!.id);
      expect(updatedConfig?.enabled).toBe(false);
    });

    it('should return false when enabling/disabling non-existent tool', () => {
      const result = service.setToolEnabled('non-existent', false);
      expect(result).toBe(false);
    });

    it('should switch to default when disabling active tool', () => {
      const configs = service.getToolConfigs();
      const handConfig = configs.find((c) => c.type === ToolType.Hand);

      service.setActiveTool(ToolType.Hand);
      service.setToolEnabled(handConfig!.id, false);

      expect(service.getActiveToolType()).toBe(ToolType.Pen);
    });

    it('should return available tools', () => {
      const available = service.availableTools();
      expect(available.length).toBeGreaterThan(0);
      expect(available.every((t) => t.enabled)).toBe(true);
    });

    it('should sort available tools by order', () => {
      const available = service.availableTools();
      for (let i = 0; i < available.length - 1; i++) {
        const order1 = available[i].order ?? 999;
        const order2 = available[i + 1].order ?? 999;
        expect(order1).toBeLessThanOrEqual(order2);
      }
    });

    it('should filter out disabled tools from available tools', () => {
      const configs = service.getToolConfigs();
      const handConfig = configs.find((c) => c.type === ToolType.Hand);

      service.setToolEnabled(handConfig!.id, false);
      const available = service.availableTools();

      expect(available.some((t) => t.id === handConfig!.id)).toBe(false);
    });
  });

  describe('Temporary Tool Override', () => {
    it('should push temporary tool', () => {
      service.setActiveTool(ToolType.Pen);
      service.pushTemporaryTool(ToolType.Hand, 'space-key');

      expect(service.effectiveTool()).toBe(ToolType.Hand);
      expect(service.selectedTool()).toBe(ToolType.Pen);
    });

    it('should not emit ToolChange event for temporary override', () => {
      const initialEmitCount = mockEventBus.emit.mock.calls.length;
      service.pushTemporaryTool(ToolType.Hand, 'space-key');

      expect(mockEventBus.emit).toHaveBeenCalledTimes(initialEmitCount);
    });

    it('should avoid duplicate temporary tools with same reason', () => {
      service.pushTemporaryTool(ToolType.Hand, 'space-key');
      service.pushTemporaryTool(ToolType.Hand, 'space-key');

      expect(service.temporaryOverrides().length).toBe(1);
    });

    it('should allow multiple temporary tools with different reasons', () => {
      service.pushTemporaryTool(ToolType.Hand, 'reason-1');
      service.pushTemporaryTool(ToolType.Select, 'reason-2');

      expect(service.temporaryOverrides().length).toBe(2);
    });

    it('should use last temporary tool as effective tool', () => {
      service.pushTemporaryTool(ToolType.Hand, 'reason-1');
      service.pushTemporaryTool(ToolType.Select, 'reason-2');

      expect(service.effectiveTool()).toBe(ToolType.Select);
    });

    it('should pop temporary tool', () => {
      service.setActiveTool(ToolType.Pen);
      service.pushTemporaryTool(ToolType.Hand, 'space-key');
      expect(service.effectiveTool()).toBe(ToolType.Hand);

      service.popTemporaryTool();
      expect(service.effectiveTool()).toBe(ToolType.Pen);
    });

    it('should pop temporary tool by reason', () => {
      service.pushTemporaryTool(ToolType.Hand, 'reason-1');
      service.pushTemporaryTool(ToolType.Select, 'reason-2');

      service.popTemporaryTool('reason-1');
      expect(service.temporaryOverrides().length).toBe(1);
      expect(service.effectiveTool()).toBe(ToolType.Select);
    });

    it('should pop last temporary tool when no reason provided', () => {
      service.pushTemporaryTool(ToolType.Hand, 'reason-1');
      service.pushTemporaryTool(ToolType.Select, 'reason-2');

      service.popTemporaryTool();
      expect(service.effectiveTool()).toBe(ToolType.Hand);
    });

    it('should handle pop when no temporary tools exist', () => {
      expect(() => service.popTemporaryTool()).not.toThrow();
      expect(service.temporaryOverrides().length).toBe(0);
    });

    it('should clear all temporary tools', () => {
      service.pushTemporaryTool(ToolType.Hand, 'reason-1');
      service.pushTemporaryTool(ToolType.Select, 'reason-2');

      service.clearTemporaryTools();
      expect(service.temporaryOverrides().length).toBe(0);
    });

    it('should check if has temporary override', () => {
      expect(service.hasTemporaryOverride()).toBe(false);

      service.pushTemporaryTool(ToolType.Hand, 'space-key');
      expect(service.hasTemporaryOverride()).toBe(true);

      service.popTemporaryTool();
      expect(service.hasTemporaryOverride()).toBe(false);
    });

    it('should generate default reason with timestamp', () => {
      const beforeTime = Date.now();
      service.pushTemporaryTool(ToolType.Hand);
      const afterTime = Date.now();

      const overrides = service.temporaryOverrides();
      expect(overrides.length).toBe(1);
      expect(overrides[0].reason).toMatch(/^temp-\d+$/);

      const timestamp = parseInt(overrides[0].reason.replace('temp-', ''));
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('Cursor Management', () => {
    it('should set cursor', () => {
      service.setCursor(CursorType.Crosshair);
      expect(service.cursor()).toBe(CursorType.Crosshair);
    });

    it('should reset cursor to tool cursor', () => {
      service.setCursor(CursorType.Crosshair);
      service.resetCursor();
      // Cursor should be reset based on active tool
      expect(service.cursor()).toBeDefined();
    });

    it('should update cursor when tool changes', () => {
      service.setActiveTool(ToolType.Hand);
      const handCursor = service.cursor();

      service.setActiveTool(ToolType.Pen);
      const penCursor = service.cursor();

      // Cursors may be different based on tool
      expect(handCursor).toBeDefined();
      expect(penCursor).toBeDefined();
    });
  });

  describe('Computed Signals', () => {
    it('should compute effectiveTool from selected tool', () => {
      service.setActiveTool(ToolType.Hand);
      expect(service.effectiveTool()).toBe(ToolType.Hand);
    });

    it('should compute effectiveTool from temporary override', () => {
      service.setActiveTool(ToolType.Pen);
      service.pushTemporaryTool(ToolType.Hand, 'space-key');

      expect(service.effectiveTool()).toBe(ToolType.Hand);
      expect(service.selectedTool()).toBe(ToolType.Pen);
    });

    it('should update currentTool signal when effectiveTool changes', () => {
      service.setActiveTool(ToolType.Hand);
      TestBed.flushEffects();
      const handTool = service.currentTool();
      expect(handTool?.type).toBe(ToolType.Hand);

      service.setActiveTool(ToolType.Pen);
      TestBed.flushEffects();
      const penTool = service.currentTool();
      expect(penTool?.type).toBe(ToolType.Pen);
    });
  });

  describe('Cleanup', () => {
    it('should destroy service', () => {
      service.setActiveTool(ToolType.Hand);
      const handTool = service.currentTool();

      service.destroy();

      expect(handTool?.deactivate).toHaveBeenCalled();
      expect(service.temporaryOverrides().length).toBe(0);
    });

    it('should clear tool cache on destroy', () => {
      service.getToolInstance(ToolType.Hand);
      service.getToolInstance(ToolType.Pen);

      service.destroy();

      // After destroy, getting tool should create new instance
      mockToolFactory.createTool.mockClear();
      service.getToolInstance(ToolType.Hand);
      expect(mockToolFactory.createTool).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapidly switching tools', () => {
      service.setActiveTool(ToolType.Hand);
      service.setActiveTool(ToolType.Pen);
      service.setActiveTool(ToolType.Line);
      service.setActiveTool(ToolType.Arrow);

      expect(service.getActiveToolType()).toBe(ToolType.Arrow);
    });

    it('should handle multiple temporary overrides', () => {
      service.setActiveTool(ToolType.Pen);
      service.pushTemporaryTool(ToolType.Hand, 'reason-1');
      service.pushTemporaryTool(ToolType.Select, 'reason-2');
      service.pushTemporaryTool(ToolType.Eraser, 'reason-3');

      expect(service.effectiveTool()).toBe(ToolType.Eraser);

      service.popTemporaryTool('reason-2');
      expect(service.effectiveTool()).toBe(ToolType.Eraser);

      service.popTemporaryTool();
      expect(service.effectiveTool()).toBe(ToolType.Hand);

      service.popTemporaryTool();
      expect(service.effectiveTool()).toBe(ToolType.Pen);
    });

    it('should handle registering tool with custom data', () => {
      const customConfig: ToolConfig = {
        id: 'custom-tool',
        type: ToolType.Pen,
        name: 'Custom Tool',
        enabled: true,
        customData: { foo: 'bar', nested: { value: 42 } },
      };

      service.registerTool(customConfig);
      const config = service.getToolConfig('custom-tool');
      expect(config?.customData).toEqual({ foo: 'bar', nested: { value: 42 } });
    });

    it('should handle registering tool with permissions', () => {
      const customConfig: ToolConfig = {
        id: 'restricted-tool',
        type: ToolType.Pen,
        name: 'Restricted Tool',
        enabled: true,
        permissions: ['admin', 'editor'],
      };

      service.registerTool(customConfig);
      const config = service.getToolConfig('restricted-tool');
      expect(config?.permissions).toEqual(['admin', 'editor']);
    });
  });

  describe('Default Tool Configurations', () => {
    it('should have Hand tool configured', () => {
      const configs = service.getToolConfigs();
      const handConfig = configs.find((c) => c.type === ToolType.Hand);
      expect(handConfig).toBeDefined();
      expect(handConfig?.name).toBe('Hand');
      expect(handConfig?.enabled).toBe(true);
    });

    it('should have Select tool configured', () => {
      const configs = service.getToolConfigs();
      const selectConfig = configs.find((c) => c.type === ToolType.Select);
      expect(selectConfig).toBeDefined();
      expect(selectConfig?.name).toBe('Select');
    });

    it('should have Pen tool configured', () => {
      const configs = service.getToolConfigs();
      const penConfig = configs.find((c) => c.type === ToolType.Pen);
      expect(penConfig).toBeDefined();
      expect(penConfig?.name).toBe('Pen');
    });

    it('should have all drawing tools configured', () => {
      const configs = service.getToolConfigs();
      const toolTypes = configs.map((c) => c.type);

      expect(toolTypes).toContain(ToolType.Line);
      expect(toolTypes).toContain(ToolType.Arrow);
      expect(toolTypes).toContain(ToolType.Rectangle);
      expect(toolTypes).toContain(ToolType.Ellipse);
    });

    it('should have utility tools configured', () => {
      const configs = service.getToolConfigs();
      const toolTypes = configs.map((c) => c.type);

      expect(toolTypes).toContain(ToolType.Text);
      expect(toolTypes).toContain(ToolType.Image);
      expect(toolTypes).toContain(ToolType.Eraser);
    });
  });
});
