import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { BasicComponent } from './basic.component';
import { NgWhiteboardService, ToolType, FormatType } from 'ng-whiteboard';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('BasicComponent', () => {
  let component: BasicComponent;
  let fixture: ComponentFixture<BasicComponent>;
  let mockWhiteboardService: any;

  beforeEach(async () => {
    mockWhiteboardService = {
      setActiveBoard: jest.fn(),
      setActiveTool: jest.fn(),
      undo: jest.fn(),
      redo: jest.fn(),
      clear: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      resetZoom: jest.fn(),
      addImage: jest.fn(),
      save: jest.fn().mockResolvedValue('mock-result'),
      exportData: jest.fn().mockReturnValue('{}'),
      importData: jest.fn(),
      updateSelectedElements: jest.fn(),
      setActiveLayer: jest.fn(),
      addLayer: jest.fn(),
      removeLayer: jest.fn().mockReturnValue(true),
      duplicateLayer: jest.fn(),
      renameLayer: jest.fn(),
      toggleLayerVisibility: jest.fn(),
      toggleLayerLock: jest.fn(),
      setLayerOpacity: jest.fn(),
      setLayerBlendMode: jest.fn(),
      reorderLayersByIndex: jest.fn(),
      signals: jest.fn().mockReturnValue({
        layers: signal([]),
        activeLayerId: signal('layer-1'),
        activeLayer: signal({ id: 'layer-1', name: 'Layer 1', visible: true, locked: false }),
        selectedTool: signal(ToolType.Pen),
        canUndo: signal(false),
        canRedo: signal(false),
        availableTools: signal([{ type: ToolType.Pen, enabled: true, name: 'Pen', icon: '' }]),
        selectedElements: signal([]),
        config: signal({ zoom: 1 }),
      }),
    };

    await TestBed.configureTestingModule({
      imports: [BasicComponent, NoopAnimationsModule],
    })
      .overrideComponent(BasicComponent, {
        set: {
          providers: [{ provide: NgWhiteboardService, useValue: mockWhiteboardService }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.boardId).toBe('whiteboard-app');
    expect(component.selectedTool()).toBe(ToolType.Pen);
    expect(component.config().strokeColor).toBe('#000000');
    expect(component.config().backgroundColor).toBe('#ffffff');
    expect(component.config().strokeWidth).toBe(3);
  });

  it('should set active board on construction', () => {
    expect(mockWhiteboardService.setActiveBoard).toHaveBeenCalledWith('whiteboard-app');
  });

  describe('Tool Selection', () => {
    it('should select tool', () => {
      component.selectTool(ToolType.Rectangle);
      expect(mockWhiteboardService.setActiveTool).toHaveBeenCalledWith(ToolType.Rectangle);
    });
  });

  describe('Drawing Controls', () => {
    it('should set stroke width', () => {
      component.selectWidth(10);
      expect(component.config().strokeWidth).toBe(10);
      expect(component.showWidthMenu()).toBe(false);
    });

    it('should set stroke color', () => {
      component.selectColor('#ff0000');
      expect(component.config().strokeColor).toBe('#ff0000');
    });

    it('should set background color', () => {
      component.selectBackgroundColor('#00ff00');
      expect(component.config().backgroundColor).toBe('#00ff00');
    });
  });

  describe('Canvas Controls', () => {
    it('should toggle grid', () => {
      const initialGrid = component.config().enableGrid ?? false;
      component.toggleGrid();
      expect(component.config().enableGrid).toBe(!initialGrid);
    });

    it('should clear whiteboard', () => {
      component.clear();
      expect(mockWhiteboardService.clear).toHaveBeenCalled();
    });
  });

  describe('History Controls', () => {
    it('should call undo', () => {
      component.undo();
      expect(mockWhiteboardService.undo).toHaveBeenCalled();
    });

    it('should call redo', () => {
      component.redo();
      expect(mockWhiteboardService.redo).toHaveBeenCalled();
    });
  });

  describe('Zoom Controls', () => {
    it('should zoom in', () => {
      component.zoomIn();
      expect(mockWhiteboardService.zoomIn).toHaveBeenCalled();
    });

    it('should zoom out', () => {
      component.zoomOut();
      expect(mockWhiteboardService.zoomOut).toHaveBeenCalled();
    });

    it('should reset zoom', () => {
      component.resetZoom();
      expect(mockWhiteboardService.resetZoom).toHaveBeenCalled();
    });
  });

  describe('Image Handling', () => {
    it('should handle image upload', fakeAsync(() => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const event = {
        target: {
          files: [mockFile],
        },
      } as unknown as Event;

      const mockReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/png;base64,test',
        onload: null as any,
        onerror: null as any,
      };

      jest.spyOn(window, 'FileReader').mockImplementation(() => mockReader as any);

      component.uploadImage(event);

      if (mockReader.onload) {
        mockReader.onload({ target: mockReader } as any);
      }

      tick();

      expect(mockWhiteboardService.addImage).toHaveBeenCalledWith({ image: 'data:image/png;base64,test' });
    }));
  });

  describe('Save/Export', () => {
    it('should save as PNG', async () => {
      await component.saveAsImage();
      expect(mockWhiteboardService.save).toHaveBeenCalledWith(FormatType.Png, 'Untitled Board');
    });

    it('should export data as JSON', () => {
      // Mock URL.createObjectURL and URL.revokeObjectURL
      global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');
      global.URL.revokeObjectURL = jest.fn();

      const clickSpy = jest.fn();
      const mockLink = {
        click: clickSpy,
        setAttribute: jest.fn(),
        style: {},
      };

      const originalCreateElement = document.createElement;
      jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          return mockLink as any;
        }
        return originalCreateElement.call(document, tagName);
      });

      component.exportBoard();

      expect(mockWhiteboardService.exportData).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Layer Operations', () => {
    it('should add a layer', () => {
      component.addLayer();
      expect(mockWhiteboardService.addLayer).toHaveBeenCalled();
    });

    it('should switch layer', () => {
      component.switchToLayer('layer-2');
      expect(mockWhiteboardService.setActiveLayer).toHaveBeenCalledWith('layer-2');
    });

    it('should delete layer with confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      component.deleteLayer('layer-1');
      expect(mockWhiteboardService.removeLayer).toHaveBeenCalledWith('layer-1');
    });
  });
});
