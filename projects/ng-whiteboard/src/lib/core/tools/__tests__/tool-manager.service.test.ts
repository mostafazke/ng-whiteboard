import { TestBed } from '@angular/core/testing';
import { ToolsService } from '../tools.service';
import { ApiService } from '../../api/api.service';
import { ToolType } from '../../types';
import { createMockApiService } from '../../testing';

describe('ToolsService', () => {
  let service: ToolsService;
  let mockApiService: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    mockApiService = createMockApiService();

    TestBed.configureTestingModule({
      providers: [ToolsService, { provide: ApiService, useValue: mockApiService }],
    });
    service = TestBed.inject(ToolsService);
    service.setApiService(mockApiService as unknown as ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize default tools', () => {
    expect(() => service.getToolInstance(ToolType.Hand)).not.toThrow();
    expect(() => service.getToolInstance(ToolType.Pen)).not.toThrow();
  });

  it('should get a tool instance', () => {
    const handTool = service.getToolInstance(ToolType.Hand);
    expect(handTool).toBeDefined();
    expect(handTool.type).toBe(ToolType.Hand);
  });

  it('should cache tool instances', () => {
    const handTool1 = service.getToolInstance(ToolType.Hand);
    const handTool2 = service.getToolInstance(ToolType.Hand);
    expect(handTool1).toBe(handTool2);
  });

  it('should set the active tool', () => {
    service.setActiveTool(ToolType.Pen);
    expect(service.getActiveToolType()).toBe(ToolType.Pen);
  });

  it('should check if a tool is active', () => {
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

  it('should throw an error when getting a tool instance for unregistered type', () => {
    // First unregister all tools with the specific type
    const configs = service.getToolConfigs();
    configs.forEach((config) => {
      if (config.type === ToolType.Arrow) {
        service.unregisterTool(config.id);
      }
    });

    expect(() => service.getToolInstance(ToolType.Arrow)).toThrow();
  });

  it('should get the active tool type', () => {
    service.setActiveTool(ToolType.Pen);
    expect(service.getActiveToolType()).toBe(ToolType.Pen);
  });

  it('should check if a tool is registered', () => {
    expect(service.isToolRegistered(ToolType.Hand)).toBe(true);
    expect(service.isToolRegistered(ToolType.Pen)).toBe(true);
  });

  it('should get registered tool types', () => {
    const toolTypes = service.getRegisteredToolTypes();
    expect(toolTypes).toContain(ToolType.Hand);
    expect(toolTypes).toContain(ToolType.Pen);
  });
});
