import { TestBed } from '@angular/core/testing';
import { ToolManagerService } from '../tool-manager.service';
import { DataService } from '../../data/data.service';
import { Tool, ToolType } from '../../types';
import { HandTool } from '../hand-tool';
import { PenTool } from '../pen-tool';
import { BehaviorSubject } from 'rxjs';

describe('ToolManagerService', () => {
  let service: ToolManagerService;
  let mockDataService: jest.Mocked<DataService>;

  beforeEach(() => {
    mockDataService = {
      selectedTool$: new BehaviorSubject<ToolType>(ToolType.Hand),
    } as unknown as jest.Mocked<DataService>;

    TestBed.configureTestingModule({
      providers: [ToolManagerService, { provide: DataService, useValue: mockDataService }],
    });
    service = TestBed.inject(ToolManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize default tools', () => {
    expect(() => service.getTool(ToolType.Hand)).not.toThrow();
    expect(() => service.getTool(ToolType.Pen)).not.toThrow();
  });

  it('should register a new tool', () => {
    const mockTool: Tool = { type: ToolType.Hand, activate: jest.fn(), deactivate: jest.fn() };
    service.clearRegistry();
    service.registerTool(ToolType.Hand, mockTool);
    expect(service.getTool(ToolType.Hand)).toBe(mockTool);
  });

  it('should throw an error when registering a tool with an existing type', () => {
    const mockTool: Tool = { type: ToolType.Hand, activate: jest.fn(), deactivate: jest.fn() };
    service.clearRegistry();
    service.registerTool(ToolType.Hand, mockTool);
    expect(() => service.registerTool(ToolType.Hand, mockTool)).toThrowError(
      `Tool of type '${ToolType.Hand}' is already registered.`
    );
  });

  it('should set the current tool', () => {
    const mockTool: Tool = { type: ToolType.Pen, activate: jest.fn(), deactivate: jest.fn() };
    service.clearRegistry();
    service.registerTool(ToolType.Pen, mockTool);
    service.setCurrentTool(ToolType.Pen);
    expect(service.getCurrentTool()).toBe(mockTool);
    expect(mockTool.activate).toHaveBeenCalled();
  });

  it('should deactivate the previous tool when setting a new tool', () => {
    const mockTool1: Tool = { type: ToolType.Hand, activate: jest.fn(), deactivate: jest.fn() };
    const mockTool2: Tool = { type: ToolType.Pen, activate: jest.fn(), deactivate: jest.fn() };
    service.clearRegistry();
    service.registerTool(ToolType.Hand, mockTool1);
    service.registerTool(ToolType.Pen, mockTool2);

    service.setCurrentTool(ToolType.Hand);
    service.setCurrentTool(ToolType.Pen);

    expect(mockTool1.deactivate).toHaveBeenCalled();
    expect(mockTool2.activate).toHaveBeenCalled();
  });

  it('should throw an error when setting a tool that is not registered', () => {
    service.clearRegistry();
    expect(() => service.setCurrentTool(ToolType.Arrow)).toThrow(`Tool of type '${ToolType.Arrow}' not found.`);
  });

  it('should get the current tool type', () => {
    const mockTool: Tool = { type: ToolType.Pen, activate: jest.fn(), deactivate: jest.fn() };
    service.clearRegistry();
    service.registerTool(ToolType.Pen, mockTool);
    service.setCurrentTool(ToolType.Pen);
    expect(service.getCurrentToolType()).toBe(ToolType.Pen);
  });

  it('should clear the tool registry', () => {
    const mockTool: Tool = { type: ToolType.Hand, activate: jest.fn(), deactivate: jest.fn() };
    service.clearRegistry();
    service.registerTool(ToolType.Hand, mockTool);
    service.clearRegistry();
    expect(() => service.getTool(ToolType.Hand)).toThrowError(`Tool of type '${ToolType.Hand}' not found.`);
  });
});
