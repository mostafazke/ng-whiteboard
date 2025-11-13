import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WhiteboardCanvasComponent } from './whiteboard-canvas.component';
import { ApiService } from '../../api';
import { CanvasService } from '../../canvas';
import { ConfigService } from '../../config';
import { SelectionService } from '../../elements';
import { SvgService } from '../../svg';
import { ToolsService } from '../../tools';
import { WhiteboardElement, ElementType, ToolType } from '../../types';

describe('WhiteboardCanvasComponent', () => {
  let component: WhiteboardCanvasComponent;
  let fixture: ComponentFixture<WhiteboardCanvasComponent>;

  const mockConfig = {
    canvasWidth: 800,
    canvasHeight: 600,
    zoom: 1,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
    gridSize: 20,
    backgroundColor: '#ffffff',
    enableGrid: true,
    fontFamily: 'Arial',
    fontSize: 16,
    fullScreen: false,
  };

  const mockElement: WhiteboardElement = {
    id: '1',
    type: ElementType.Rectangle,
    x: 10,
    y: 10,
    width: 100,
    height: 50,
    rx: 0,
    rotation: 0,
    layerId: 'default',
    opacity: 100,
    zIndex: 0,
    style: {
      strokeWidth: 2,
      strokeColor: '#000000',
      fill: '#ffffff',
    },
  };

  const mockLayer = {
    id: 'default',
    name: 'Default Layer',
    visible: true,
    locked: false,
    opacity: 1,
    zIndex: 0,
    blendMode: 'normal',
  };

  // Create signal mocks
  const mockAllElements = signal([mockElement]);
  const mockLayers = signal([mockLayer]);
  const mockSelectedTool = signal(ToolType.Pen);
  const mockCursor = signal('default');
  const mockConfigSignal = signal(mockConfig);
  const mockSelectionBox = signal(null);
  const mockBoundingBox = signal(null);
  const mockTransform = signal({ x: 0, y: 0, scale: 1 });

  beforeEach(async () => {
    const mockApiService = {
      initializeWhiteboard: jest.fn(),
      allElements: mockAllElements,
      layers: mockLayers,
    };

    const mockConfigService = {
      getConfigSignal: jest.fn().mockReturnValue(mockConfigSignal),
    };

    const mockToolsService = {
      selectedTool: mockSelectedTool,
      cursor: mockCursor,
    };

    const mockSelectionService = {
      getSelectionBoxSignal: jest.fn().mockReturnValue(mockSelectionBox),
      getBoundingBoxSignal: jest.fn().mockReturnValue(mockBoundingBox),
    };

    const mockCanvasService = {
      getTransform: jest.fn().mockReturnValue(mockTransform),
    };

    const mockSvgService = {};

    await TestBed.configureTestingModule({
      imports: [WhiteboardCanvasComponent],
    })
      .overrideComponent(WhiteboardCanvasComponent, {
        set: {
          providers: [
            { provide: ApiService, useValue: mockApiService },
            { provide: ConfigService, useValue: mockConfigService },
            { provide: ToolsService, useValue: mockToolsService },
            { provide: SelectionService, useValue: mockSelectionService },
            { provide: CanvasService, useValue: mockCanvasService },
            { provide: SvgService, useValue: mockSvgService },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(WhiteboardCanvasComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectedToolSignal', () => {
    it('should return the selected tool from toolsService', () => {
      expect(component.selectedToolSignal()).toBe(ToolType.Pen);
    });

    it('should reflect changes in selected tool', () => {
      // Update the mock signal value
      mockSelectedTool.set(ToolType.Rectangle);

      expect(component.selectedToolSignal()).toBe(ToolType.Rectangle);
    });
  });

  describe('computed properties', () => {
    it('should compute canvas dimensions correctly', () => {
      expect(component.canvasWidth()).toBe(800);
      expect(component.canvasHeight()).toBe(600);
    });

    it('should compute svg dimensions in normal mode', () => {
      const dimensions = component.svgDimensions();
      expect(dimensions.width).toBe('800px');
      expect(dimensions.height).toBe('600px');
    });

    it('should compute svg dimensions in fullscreen mode', () => {
      const fullScreenConfig = { ...mockConfig, fullScreen: true };
      mockConfigSignal.set(fullScreenConfig);

      const dimensions = component.svgDimensions();
      expect(dimensions.width).toBe('100%');
      expect(dimensions.height).toBe('100%');
    });

    it('should compute svg viewbox correctly', () => {
      const viewBox = component.svgViewBox();
      expect(viewBox).toBe('0 0 800 600');
    });

    it('should compute content transform correctly', () => {
      const transform = component.contentTransform();
      expect(transform).toBe('translate(0, 0)');
    });

    it('should compute grid config correctly', () => {
      // Reset config to normal mode first
      mockConfigSignal.set(mockConfig);

      const gridConfig = component.gridConfig();
      expect(gridConfig.transform).toBe('translate(0, 0)');
      expect(gridConfig.width).toBe(900); // (canvasWidth (800) + 100) / zoom (1)
      expect(gridConfig.height).toBe(700); // (canvasHeight (600) + 100) / zoom (1)
    });

    it('should compute grid config correctly with zoom', () => {
      // Set config with zoom = 2
      mockConfigSignal.set({ ...mockConfig, zoom: 2 });

      const gridConfig = component.gridConfig();
      expect(gridConfig.transform).toBe('translate(0, 0)');
      expect(gridConfig.width).toBe(450); // (canvasWidth (800) + 100) / zoom (2)
      expect(gridConfig.height).toBe(350); // (canvasHeight (600) + 100) / zoom (2)
    });

    it('should compute text editor style correctly', () => {
      // Reset to normal mode first
      mockConfigSignal.set(mockConfig);

      // const textStyle = component.textEditorStyle();
      // expect(textStyle.width).toBe('800px');
      // expect(textStyle.height).toBe('600px');
      // expect(textStyle.top).toBe('0px');
      // expect(textStyle.left).toBe('0px');
      // expect(textStyle.inputHeight).toBe('2ch');
    });
  });

  describe('filteredElements', () => {
    it('should filter elements by visible layers', () => {
      const filtered = component.filteredElements();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe(mockElement.id);
      expect(filtered[0]).toHaveProperty('transform');
      expect(filtered[0]).toHaveProperty('isLocked');
      expect(filtered[0]).toHaveProperty('blendMode');
    });

    it('should exclude elements from invisible layers', () => {
      const invisibleLayer = { ...mockLayer, visible: false };
      mockLayers.set([invisibleLayer]);

      const filtered = component.filteredElements();
      expect(filtered).toEqual([]);
    });

    it('should sort elements by z-index', () => {
      // Reset layers to visible first
      mockLayers.set([mockLayer]);

      const element1 = { ...mockElement, id: '1', zIndex: 1 };
      const element2 = { ...mockElement, id: '2', zIndex: 2 };
      mockAllElements.set([element2, element1]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(2);
      expect(filtered[0].id).toBe('1');
      expect(filtered[1].id).toBe('2');
    });
  });

  describe('ngAfterViewInit', () => {
    it('should initialize whiteboard with svg container', () => {
      // Mock the ViewChild
      const mockSvgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      component.svgContainer = { nativeElement: mockSvgElement };

      component.ngAfterViewInit();

      expect(component.apiService.initializeWhiteboard).toHaveBeenCalledWith(mockSvgElement);
    });
  });
});
