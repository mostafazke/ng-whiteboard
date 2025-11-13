import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BasicComponent } from './basic.component';
import { NgWhiteboardService } from 'ng-whiteboard';

describe('BasicComponent', () => {
  let component: BasicComponent;
  let fixture: ComponentFixture<BasicComponent>;
  let mockWhiteboardService: jest.Mocked<NgWhiteboardService>;

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
    } as unknown as jest.Mocked<NgWhiteboardService>;

    await TestBed.configureTestingModule({
      imports: [BasicComponent],
      providers: [{ provide: NgWhiteboardService, useValue: mockWhiteboardService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.boardId).toBe('basic-board');
    expect(component.selectedTool()).toBe(component.toolType.Pen);
    expect(component.config.strokeColor).toBe('#2563eb');
    expect(component.config.backgroundColor).toBe('#ffffff');
    expect(component.config.strokeWidth).toBe(5);
  });

  it('should set active board on construction', () => {
    expect(mockWhiteboardService.setActiveBoard).toHaveBeenCalledWith('basic-board');
  });

  describe('Tool Selection', () => {
    it('should select tool', () => {
      component.selectTool(component.toolType.Rectangle);
      expect(component.selectedTool()).toBe(component.toolType.Rectangle);
      expect(mockWhiteboardService.setActiveTool).toHaveBeenCalledWith(component.toolType.Rectangle);
    });
  });

  describe('Drawing Controls', () => {
    it('should set stroke width', () => {
      component.setStrokeWidth(10);
      expect(component.config.strokeWidth).toBe(10);
      expect(component.isStrokeMenuOpen()).toBe(false);
    });

    it('should set stroke color', () => {
      const event = { target: { value: '#ff0000' } } as unknown as Event;
      component.setStrokeColor(event);
      expect(component.config.strokeColor).toBe('#ff0000');
    });

    it('should set background color', () => {
      const event = { target: { value: '#00ff00' } } as unknown as Event;
      component.setBackgroundColor(event);
      expect(component.config.backgroundColor).toBe('#00ff00');
    });
  });

  describe('Canvas Controls', () => {
    it('should toggle grid', () => {
      const initialGrid = component.config.enableGrid ?? false;
      component.toggleGrid();
      expect(component.config.enableGrid).toBe(!initialGrid);
    });

    it('should toggle snap to grid', () => {
      const initialSnap = component.config.snapToGrid ?? false;
      component.toggleSnapToGrid();
      expect(component.config.snapToGrid).toBe(!initialSnap);
    });

    it('should clear whiteboard with confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(true);
      component.clear();
      expect(mockWhiteboardService.clear).toHaveBeenCalled();
    });

    it('should not clear whiteboard without confirmation', () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      component.clear();
      expect(mockWhiteboardService.clear).not.toHaveBeenCalled();
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
      component.zoomReset();
      expect(mockWhiteboardService.resetZoom).toHaveBeenCalled();
    });
  });

  describe('Image Handling', () => {
    it('should handle image selection', (done) => {
      const mockFile = new File([''], 'test.png', { type: 'image/png' });
      const mockFileList = {
        0: mockFile,
        length: 1,
        item: () => mockFile,
      } as FileList;

      const event = {
        target: {
          files: mockFileList,
          value: '',
        },
      } as unknown as Event;

      // Mock FileReader
      interface MockFileReader {
        readAsDataURL: jest.Mock;
        result: string;
        onload?: (e: ProgressEvent) => void;
      }

      const mockFileReader: MockFileReader = {
        readAsDataURL: jest.fn(),
        result: 'data:image/png;base64,test',
      };

      jest
        .spyOn(window as unknown as { FileReader: new () => FileReader }, 'FileReader')
        .mockImplementation(() => mockFileReader as unknown as FileReader);

      component.onImageSelect(event);

      // Simulate FileReader.onload
      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as unknown as ProgressEvent);
        }
        expect(mockWhiteboardService.addImage).toHaveBeenCalledWith({ image: 'data:image/png;base64,test' });
        done();
      }, 0);
    });
  });

  describe('Save/Export', () => {
    it('should save as PNG', async () => {
      jest.spyOn(window, 'alert').mockImplementation();
      await component.save(component.formatType.Png);
      expect(mockWhiteboardService.save).toHaveBeenCalledWith(component.formatType.Png, 'whiteboard');
      expect(component.isSaveMenuOpen()).toBe(false);
    });

    it('should export data as JSON', () => {
      const createElementSpy = jest.spyOn(document, 'createElement');
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
      } as unknown as HTMLAnchorElement;
      createElementSpy.mockReturnValue(mockLink);

      component.exportData();

      expect(mockWhiteboardService.exportData).toHaveBeenCalled();
      expect(mockLink.download).toBe('whiteboard-data.json');
      expect(mockLink.click).toHaveBeenCalled();
    });

    it('should handle save error', async () => {
      mockWhiteboardService.save.mockRejectedValue(new Error('Save failed'));
      jest.spyOn(window, 'alert').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();

      await component.save(component.formatType.Png);

      expect(window.alert).toHaveBeenCalledWith('Failed to save whiteboard');
    });
  });

  describe('Data Import', () => {
    it('should import data from JSON file', (done) => {
      const mockFile = new File(['{"test": "data"}'], 'data.json', { type: 'application/json' });
      const mockFileList = {
        0: mockFile,
        length: 1,
        item: () => mockFile,
      } as FileList;

      const event = {
        target: {
          files: mockFileList,
          value: '',
        },
      } as unknown as Event;

      interface MockFileReader {
        readAsText: jest.Mock;
        result: string;
        onload?: (e: ProgressEvent) => void;
      }

      const mockFileReader: MockFileReader = {
        readAsText: jest.fn(),
        result: '{"test": "data"}',
      };

      jest
        .spyOn(window as unknown as { FileReader: new () => FileReader }, 'FileReader')
        .mockImplementation(() => mockFileReader as unknown as FileReader);
      jest.spyOn(window, 'alert').mockImplementation();

      component.importData(event);

      setTimeout(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as unknown as ProgressEvent);
        }
        expect(mockWhiteboardService.importData).toHaveBeenCalledWith('{"test": "data"}');
        done();
      }, 0);
    });
  });

  describe('Event Handlers', () => {
    it('should handle onSave event', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      component.onSave('data:image/png;base64,test');
      expect(spy).toHaveBeenCalled();
    });

    it('should handle onReady event', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      component.onReady();
      expect(spy).toHaveBeenCalledWith('Whiteboard ready!');
    });
  });
});
