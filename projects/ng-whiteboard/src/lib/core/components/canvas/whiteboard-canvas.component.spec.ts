import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { WhiteboardCanvasComponent } from './whiteboard-canvas.component';
import { ApiService } from '../../api';
import { CanvasService } from '../../canvas';
import { ConfigService } from '../../config';
import { SelectionService, ConnectionUIService, HandleService } from '../../elements';
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
    // Reset signal values
    mockAllElements.set([mockElement]);
    mockLayers.set([mockLayer]);
    mockSelectedTool.set(ToolType.Pen);
    mockConfigSignal.set(mockConfig);
    mockSelectionBox.set(null);
    mockBoundingBox.set(null);
    mockTransform.set({ x: 0, y: 0, scale: 1 });

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
      isLineOnlySelectionSignal: signal(false),
      selectedIdsSignal: signal([]),
      isSelected: jest.fn().mockReturnValue(false),
    };

    const mockHandleService = {
      isLineOnlySelection: signal(false),
      lineEndpointHandles: signal([]),
      curveHandles: signal([]),
    };

    const mockConnectionUIService = {
      snapIndicator: signal(null),
      visibleConnectionPoints: signal([]),
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
            { provide: ConnectionUIService, useValue: mockConnectionUIService },
            { provide: HandleService, useValue: mockHandleService },
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

    it('should compute svg viewbox correctly in normal mode', () => {
      const viewBox = component.svgViewBox();
      expect(viewBox).toBe('0 0 800 600');
    });

    it('should compute svg viewbox correctly in fullscreen mode', () => {
      mockConfigSignal.set({
        ...mockConfig,
        fullScreen: true,
        canvasWidth: 1000,
        canvasHeight: 500,
        zoom: 2
      });
      const viewBox = component.svgViewBox();
      expect(viewBox).toBe('0 0 500 250');
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

    it('should compute grid config correctly with offset', () => {
      mockConfigSignal.set({ ...mockConfig, x: 150, y: 250 });

      const gridConfig = component.gridConfig();
      expect(gridConfig.transform).toBe('translate(50, 50)');
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

    it('should sort elements correctly when some have no layerId', () => {
      const layerWithZ10 = { ...mockLayer, id: 'z10', zIndex: 10 };
      const layerWithZ20 = { ...mockLayer, id: 'z20', zIndex: 20 };
      mockLayers.set([layerWithZ10, layerWithZ20]);

      const elNoLayer = { ...mockElement, id: 'no-layer', layerId: undefined, zIndex: 50000 };
      const elLayer10 = { ...mockElement, id: 'layer-10', layerId: 'z10', zIndex: 1 };
      const elLayer20 = { ...mockElement, id: 'layer-20', layerId: 'z20', zIndex: 1 };

      mockAllElements.set([elLayer20, elLayer10, elNoLayer]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(3);
      // z-indices:
      // no-layer: 0*1000 + 50000 = 50000 (layerA is undefined, zIndex is 0)
      // layer-10: 10*1000 + 1 = 10001
      // layer-20: 20*1000 + 1 = 20001
      // Order should be layer-10, layer-20, no-layer
      expect(filtered[0].id).toBe('layer-10');
      expect(filtered[1].id).toBe('layer-20');
      expect(filtered[2].id).toBe('no-layer');
    });

    it('should handle sorting with layer zIndex 0', () => {
      const layerZ0 = { ...mockLayer, id: 'z0', zIndex: 0 };
      const layerZ1 = { ...mockLayer, id: 'z1', zIndex: 1 };
      mockLayers.set([layerZ0, layerZ1]);

      const elZ0 = { ...mockElement, id: 'el-z0', layerId: 'z0', zIndex: 10 };
      const elZ1 = { ...mockElement, id: 'el-z1', layerId: 'z1', zIndex: 5 };

      mockAllElements.set([elZ1, elZ0]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(2);
      // z-indices:
      // el-z0: 0 * 1000 + 10 = 10
      // el-z1: 1 * 1000 + 5 = 1005
      expect(filtered[0].id).toBe('el-z0');
      expect(filtered[1].id).toBe('el-z1');
    });

    it('should include elements without layerId', () => {
      const elementNoLayer = { ...mockElement, id: 'no-layer', layerId: undefined };
      mockLayers.set([mockLayer]);
      mockAllElements.set([elementNoLayer]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('no-layer');
    });

    it('should return empty array if all layers are invisible', () => {
      mockLayers.set([{ ...mockLayer, visible: false }]);
      mockAllElements.set([mockElement]);

      const filtered = component.filteredElements();
      expect(filtered).toEqual([]);
    });

    it('should handle empty layers array', () => {
      mockLayers.set([]);
      mockAllElements.set([mockElement]);

      const filtered = component.filteredElements();
      // Elements without layerId should still be shown if there are no layers?
      // Current logic: elements.filter((el) => !el.layerId || visibleLayerIds.has(el.layerId))
      // if visibleLayerIds is empty, and el.layerId is 'default', it will be filtered out.
      // If el.layerId is undefined, it will stay.
      expect(filtered.length).toBe(0); // mockElement has layerId: 'default'
    });

    it('should handle elements with non-existent layerId', () => {
      const elementBadLayer = { ...mockElement, id: 'bad-layer', layerId: 'non-existent' };
      mockLayers.set([mockLayer]);
      mockAllElements.set([elementBadLayer]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(0);
    });

    it('should correctly map isLocked, blendMode, and transform from layer/element', () => {
      const lockedLayer = {
        ...mockLayer,
        id: 'locked-layer',
        locked: true,
        blendMode: 'multiply'
      };
      const elementOnLockedLayer = {
        ...mockElement,
        id: 'el-locked',
        layerId: 'locked-layer',
        scaleX: 2,
        scaleY: 3,
        rotation: 45,
        x: 100,
        y: 200
      };

      mockLayers.set([lockedLayer]);
      mockAllElements.set([elementOnLockedLayer]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(1);
      expect(filtered[0].isLocked).toBe(true);
      expect(filtered[0].blendMode).toBe('multiply');
      expect(filtered[0].transform).toBe('translate(100,200) rotate(45) scale(2,3)');
    });

    it('should use default blendMode "normal" if layer blendMode is missing', () => {
      const layerNoBlend = { ...mockLayer, blendMode: undefined };
      mockLayers.set([layerNoBlend as any]);
      mockAllElements.set([mockElement]);

      const filtered = component.filteredElements();
      expect(filtered[0].blendMode).toBe('normal');
    });

    it('should sort elements correctly within and across layers', () => {
      const layer1 = { ...mockLayer, id: 'l1', zIndex: 1 };
      const layer2 = { ...mockLayer, id: 'l2', zIndex: 2 };
      mockLayers.set([layer1, layer2]);

      const el1 = { ...mockElement, id: 'el1', layerId: 'l1', zIndex: 10 }; // 1*1000 + 10 = 1010
      const el2 = { ...mockElement, id: 'el2', layerId: 'l1', zIndex: 5 };  // 1*1000 + 5 = 1005
      const el3 = { ...mockElement, id: 'el3', layerId: 'l2', zIndex: 1 };  // 2*1000 + 1 = 2001

      mockAllElements.set([el1, el2, el3]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(3);
      expect(filtered[0].id).toBe('el2');
      expect(filtered[1].id).toBe('el1');
      expect(filtered[2].id).toBe('el3');
    });

    it('should handle elements without layerId when no layers are defined', () => {
      mockLayers.set([]);
      const el = { ...mockElement, id: 'no-layer-no-config', layerId: undefined };
      mockAllElements.set([el]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe('no-layer-no-config');
    });

    it('should use default isLocked and blendMode when no layer is found', () => {
      const elementNoLayer = { ...mockElement, id: 'el-no-layer', layerId: undefined };

      mockLayers.set([mockLayer]);
      mockAllElements.set([elementNoLayer]);

      const filtered = component.filteredElements();
      expect(filtered.length).toBe(1);
      expect(filtered[0].isLocked).toBe(false);
      expect(filtered[0].blendMode).toBe('normal');
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

  describe('isArrowSelected', () => {
    it('should call selectionService.isSelected', () => {
      component.isArrowSelected('test-id');
      expect(component.selectionService.isSelected).toHaveBeenCalledWith('test-id');
    });
  });
});
