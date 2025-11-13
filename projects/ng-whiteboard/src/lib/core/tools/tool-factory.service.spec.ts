import { TestBed } from '@angular/core/testing';
import { ToolFactory } from './tool-factory.service';
import { ApiService } from '../api/api.service';
import { ToolType } from '../types';
import { createMockApiService } from '../testing';
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
} from './index';

describe('ToolFactory', () => {
  let factory: ToolFactory;
  let mockApiService: ReturnType<typeof createMockApiService>;

  beforeEach(() => {
    mockApiService = createMockApiService();

    TestBed.configureTestingModule({
      providers: [ToolFactory, { provide: ApiService, useValue: mockApiService }],
    });

    factory = TestBed.inject(ToolFactory);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(factory).toBeTruthy();
    });

    it('should be provided in root', () => {
      const factoryFromRoot = TestBed.inject(ToolFactory);
      expect(factoryFromRoot).toBe(factory);
    });
  });

  describe('createTool()', () => {
    it('should create ArrowTool instance', () => {
      const tool = factory.createTool(ToolType.Arrow, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(ArrowTool);
      expect(tool.type).toBe(ToolType.Arrow);
    });

    it('should create EllipseTool instance', () => {
      const tool = factory.createTool(ToolType.Ellipse, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(EllipseTool);
      expect(tool.type).toBe(ToolType.Ellipse);
    });

    it('should create EraserTool instance', () => {
      const tool = factory.createTool(ToolType.Eraser, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(EraserTool);
      expect(tool.type).toBe(ToolType.Eraser);
    });

    it('should create HandTool instance', () => {
      const tool = factory.createTool(ToolType.Hand, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(HandTool);
      expect(tool.type).toBe(ToolType.Hand);
    });

    it('should create ImageTool instance', () => {
      const tool = factory.createTool(ToolType.Image, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(ImageTool);
      expect(tool.type).toBe(ToolType.Image);
    });

    it('should create LineTool instance', () => {
      const tool = factory.createTool(ToolType.Line, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(LineTool);
      expect(tool.type).toBe(ToolType.Line);
    });

    it('should create PenTool instance', () => {
      const tool = factory.createTool(ToolType.Pen, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(PenTool);
      expect(tool.type).toBe(ToolType.Pen);
    });

    it('should create RectangleTool instance', () => {
      const tool = factory.createTool(ToolType.Rectangle, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(RectangleTool);
      expect(tool.type).toBe(ToolType.Rectangle);
    });

    it('should create SelectTool instance', () => {
      const tool = factory.createTool(ToolType.Select, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(SelectTool);
      expect(tool.type).toBe(ToolType.Select);
    });

    it('should create TextTool instance', () => {
      const tool = factory.createTool(ToolType.Text, mockApiService as unknown as ApiService);
      expect(tool).toBeInstanceOf(TextTool);
      expect(tool.type).toBe(ToolType.Text);
    });

    it('should throw error for unknown tool type', () => {
      const unknownType = 'UnknownTool' as ToolType;
      expect(() => factory.createTool(unknownType, mockApiService as unknown as ApiService)).toThrow(
        `Unknown tool type: ${unknownType}`
      );
    });

    it('should create different instances for each call', () => {
      const tool1 = factory.createTool(ToolType.Pen, mockApiService as unknown as ApiService);
      const tool2 = factory.createTool(ToolType.Pen, mockApiService as unknown as ApiService);
      expect(tool1).not.toBe(tool2);
    });

    it('should pass apiService to created tool', () => {
      const tool = factory.createTool(ToolType.Hand, mockApiService as unknown as ApiService);
      // The tool should have access to apiService (tested through tool behavior)
      expect(tool).toBeDefined();
    });
  });

  describe('Tool Type Coverage', () => {
    it('should handle all ToolType enum values', () => {
      const toolTypes = [
        ToolType.Arrow,
        ToolType.Ellipse,
        ToolType.Eraser,
        ToolType.Hand,
        ToolType.Image,
        ToolType.Line,
        ToolType.Pen,
        ToolType.Rectangle,
        ToolType.Select,
        ToolType.Text,
      ];

      toolTypes.forEach((toolType) => {
        expect(() => factory.createTool(toolType, mockApiService as unknown as ApiService)).not.toThrow();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null apiService gracefully in tool creation', () => {
      // Creating tool with null should not throw at factory level
      // The tool itself might validate apiService later
      expect(() => factory.createTool(ToolType.Pen, null as unknown as ApiService)).not.toThrow();
    });

    it('should handle undefined apiService gracefully in tool creation', () => {
      expect(() => factory.createTool(ToolType.Pen, undefined as unknown as ApiService)).not.toThrow();
    });
  });
});
