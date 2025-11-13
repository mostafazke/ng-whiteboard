import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CanvasService } from '../canvas/canvas.service';
import { ConfigService } from '../config/config.service';
import { ElementsService } from '../elements/elements.service';
import { LayerManagementService } from '../elements/layer-management.service';
import { SelectionService } from '../elements/selection.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { HistoryService } from '../history/history.service';
import { IOService } from '../input';
import { ClipboardService } from '../input/clipboard.service';
import { KeyboardShortcutService } from '../input/keyboard-shortcut.service';
import { ToolsService } from '../tools/tools.service';
import { AlignmentType, ElementType, FormatType, ToolType, WhiteboardElement } from '../types';
import { CursorType } from '../types/cursors';
import { WhiteboardEvent } from '../types/events';
import { PanService } from '../viewport/pan.service';
import { ZoomService } from '../viewport/zoom.service';
import { ApiService } from './api.service';

// Mock services with minimal signal implementations
const createMockService = (serviceClass: { prototype: object }) => ({
  // Add common properties that might be accessed
  elements: signal([]),
  draftElements: signal([]),
  allElements: signal([]),
  selectedElements: signal([]),
  canUndo: signal(false),
  canRedo: signal(false),
  zoom: signal(1),
  tool: signal('select'),
  config: signal({}),
  layers: signal([]),
  activeLayer: signal(null),
  activeLayerId: signal('layer-1'),
  elementsCount: signal(0),
  hasElements: signal(false),
  selectedTool: signal(ToolType.Select),
  // Add minimal method stubs to prevent errors
  ...Object.getOwnPropertyNames(serviceClass.prototype)
    .filter((name) => name !== 'constructor')
    .reduce((acc, methodName) => {
      acc[methodName] = jest.fn();
      return acc;
    }, {} as Record<string, jest.Mock>),
});

describe('ApiService', () => {
  let service: ApiService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockElementsService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCanvasService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSelectionService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockToolsService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockIOService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockHistoryService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockZoomService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPanService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockLayerService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockConfigService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockClipboardService: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEventBusService: any;

  const mockElement: WhiteboardElement = {
    id: 'test-1',
    type: 'rectangle' as ElementType.Rectangle,
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rx: 5,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    style: {
      strokeColor: '#000000',
      fillColor: '#ffffff',
      strokeWidth: 2,
      fillStyle: 'solid',
      strokeStyle: 'solid',
    },
  } as WhiteboardElement;

  beforeEach(() => {
    mockElementsService = createMockService(ElementsService);
    mockCanvasService = createMockService(CanvasService);
    mockToolsService = createMockService(ToolsService);
    mockIOService = createMockService(IOService);
    mockHistoryService = {
      ...createMockService(HistoryService),
      getCanUndoSignal: jest.fn().mockReturnValue(signal(false)),
      getCanRedoSignal: jest.fn().mockReturnValue(signal(false)),
    };
    mockZoomService = createMockService(ZoomService);
    mockPanService = createMockService(PanService);
    mockLayerService = createMockService(LayerManagementService);
    mockConfigService = {
      ...createMockService(ConfigService),
      getConfig: jest.fn().mockReturnValue({}),
    };
    mockClipboardService = {
      ...createMockService(ClipboardService),
      getClipboardInfo: jest.fn().mockReturnValue({ count: 0 }),
    };
    mockEventBusService = createMockService(EventBusService);
    mockSelectionService = {
      ...createMockService(SelectionService),
      getSelectedElementsSignal: jest.fn().mockReturnValue(signal([])),
      getSelectionBoxSignal: jest.fn().mockReturnValue(signal(null)),
      getBoundingBoxSignal: jest.fn().mockReturnValue(signal(null)),
    };

    TestBed.configureTestingModule({
      providers: [
        ApiService,
        { provide: ElementsService, useValue: mockElementsService },
        { provide: CanvasService, useValue: mockCanvasService },
        { provide: SelectionService, useValue: mockSelectionService },
        { provide: ToolsService, useValue: mockToolsService },
        { provide: IOService, useValue: mockIOService },
        { provide: HistoryService, useValue: mockHistoryService },
        { provide: ZoomService, useValue: mockZoomService },
        { provide: PanService, useValue: mockPanService },
        { provide: LayerManagementService, useValue: mockLayerService },
        { provide: KeyboardShortcutService, useValue: createMockService(KeyboardShortcutService) },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: ClipboardService, useValue: mockClipboardService },
        { provide: EventBusService, useValue: mockEventBusService },
      ],
    });
    service = TestBed.inject(ApiService);
  });

  describe('Service Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should expose reactive signals', () => {
      expect(service.elements).toBeTruthy();
      expect(service.draftElements).toBeTruthy();
      expect(service.allElements).toBeTruthy();
      expect(service.selectedElements).toBeTruthy();
      expect(service.config).toBeTruthy();
      expect(service.elementsCount).toBeTruthy();
      expect(service.hasElements).toBeTruthy();
      expect(service.selectedTool).toBeTruthy();
      expect(service.layers).toBeTruthy();
      expect(service.activeLayerId).toBeTruthy();
      expect(service.activeLayer).toBeTruthy();
    });

    it('should instantiate the service correctly', () => {
      expect(service).toBeInstanceOf(ApiService);
      expect(typeof service).toBe('object');
    });
  });

  describe('Element Management', () => {
    it('should set elements', () => {
      const elements = [mockElement];
      service.setElements(elements);
      expect(mockElementsService.setElements).toHaveBeenCalledWith(elements);
    });

    it('should get elements', () => {
      mockElementsService.getElements.mockReturnValue([mockElement]);
      const result = service.getElements();
      expect(mockElementsService.getElements).toHaveBeenCalled();
      expect(result).toEqual([mockElement]);
    });

    it('should add elements', () => {
      const elements = [mockElement];
      service.addElements(elements);
      expect(mockElementsService.addElements).toHaveBeenCalledWith(elements);
    });

    it('should update elements', () => {
      const updates = [{ id: 'test-1', x: 50 }];
      service.updateElements(updates);
      expect(mockElementsService.updateElements).toHaveBeenCalledWith(updates);
    });

    it('should remove elements', () => {
      const elements = [mockElement];
      service.removeElements(elements);
      expect(mockElementsService.removeElements).toHaveBeenCalledWith(elements);
    });

    it('should clear all elements', () => {
      service.clear();
      expect(mockElementsService.clear).toHaveBeenCalled();
    });

    it('should clear all elements and selection', () => {
      service.clearAll();
      expect(mockElementsService.clear).toHaveBeenCalled();
      expect(mockSelectionService.clearSelection).toHaveBeenCalled();
    });

    it('should add a single element', () => {
      service.addElement(mockElement);
      expect(mockElementsService.addElements).toHaveBeenCalledWith([mockElement]);
    });

    it('should update a single element', () => {
      service.updateElement(mockElement);
      expect(mockElementsService.updateElements).toHaveBeenCalledWith([mockElement]);
    });

    it('should remove elements by IDs', () => {
      const ids = ['test-1', 'test-2'];
      service.removeElementsByIds(ids);
      expect(mockElementsService.removeElementsByIds).toHaveBeenCalledWith(ids);
    });

    it('should get element by ID', () => {
      mockElementsService.getElementById.mockReturnValue(mockElement);
      const result = service.getElementById('test-1');
      expect(mockElementsService.getElementById).toHaveBeenCalledWith('test-1');
      expect(result).toEqual(mockElement);
    });

    it('should get elements by IDs', () => {
      const ids = ['test-1', 'test-2'];
      mockElementsService.getElementsByIds.mockReturnValue([mockElement]);
      const result = service.getElementsByIds(ids);
      expect(mockElementsService.getElementsByIds).toHaveBeenCalledWith(ids);
      expect(result).toEqual([mockElement]);
    });

    it('should get next Z-index', () => {
      mockElementsService.getNextZIndex.mockReturnValue(5);
      const result = service.getNextZIndex();
      expect(mockElementsService.getNextZIndex).toHaveBeenCalled();
      expect(result).toBe(5);
    });

    it('should get all elements', () => {
      mockElementsService.getElements.mockReturnValue([mockElement]);
      const result = service.getAllElements();
      expect(mockElementsService.getElements).toHaveBeenCalled();
      expect(result).toEqual([mockElement]);
    });

    it('should check if element exists', () => {
      mockElementsService.elementExists.mockReturnValue(true);
      const result = service.elementExists('test-1');
      expect(mockElementsService.elementExists).toHaveBeenCalledWith('test-1');
      expect(result).toBe(true);
    });
  });

  describe('Draft Elements Management', () => {
    it('should get draft elements', () => {
      mockElementsService.getDraftElements.mockReturnValue([mockElement]);
      const result = service.getDraftElements();
      expect(mockElementsService.getDraftElements).toHaveBeenCalled();
      expect(result).toEqual([mockElement]);
    });

    it('should add draft elements', () => {
      const elements = [mockElement];
      service.addDraftElements(elements);
      expect(mockElementsService.addDraftElements).toHaveBeenCalledWith(elements);
    });

    it('should update draft elements', () => {
      const updates = [{ id: 'test-1', x: 50 }];
      service.updateDraftElements(updates);
      expect(mockElementsService.updateDraftElements).toHaveBeenCalledWith(updates);
    });

    it('should remove draft elements', () => {
      const ids = ['test-1'];
      service.removeDraftElements(ids);
      expect(mockElementsService.removeDraftElements).toHaveBeenCalledWith(ids);
    });

    it('should commit draft elements', () => {
      service.commitDraftElements();
      expect(mockElementsService.commitDraftElements).toHaveBeenCalled();
    });
  });

  describe('Selection Management', () => {
    it('should select elements with element', () => {
      service.selectElements(mockElement);
      expect(mockSelectionService.selectElements).toHaveBeenCalledWith(mockElement, false);
    });

    it('should select elements with append flag', () => {
      service.selectElements([mockElement], true);
      expect(mockSelectionService.selectElements).toHaveBeenCalledWith([mockElement], true);
    });

    it('should deselect element', () => {
      service.deselectElement('test-1');
      expect(mockSelectionService.deselectElement).toHaveBeenCalledWith('test-1');
    });

    it('should toggle selection', () => {
      service.toggleSelection(mockElement);
      expect(mockSelectionService.toggleSelection).toHaveBeenCalledWith(mockElement);
    });

    it('should clear selection', () => {
      service.clearSelection();
      expect(mockSelectionService.clearSelection).toHaveBeenCalled();
    });

    it('should select all elements', () => {
      service.selectAll();
      expect(mockSelectionService.selectAll).toHaveBeenCalled();
    });

    it('should get selected elements', () => {
      mockSelectionService.getSelectedElements.mockReturnValue([mockElement]);
      const result = service.getSelectedElements();
      expect(mockSelectionService.getSelectedElements).toHaveBeenCalled();
      expect(result).toEqual([mockElement]);
    });

    it('should update selected elements', () => {
      const partial = { x: 50 };
      service.updateSelectedElements(partial);
      expect(mockSelectionService.updateSelectedElements).toHaveBeenCalledWith(partial);
    });

    it('should remove selected elements', () => {
      service.removeSelectedElements();
      expect(mockSelectionService.removeSelectedElements).toHaveBeenCalled();
    });

    it('should check if element is selected', () => {
      mockSelectionService.isSelected.mockReturnValue(true);
      const result = service.isSelected('test-1');
      expect(mockSelectionService.isSelected).toHaveBeenCalledWith('test-1');
      expect(result).toBe(true);
    });

    it('should clear selection box', () => {
      service.clearSelectionBox();
      expect(mockSelectionService.clearSelectionBox).toHaveBeenCalled();
    });

    it('should transform selected elements', () => {
      const transformFn = (els: WhiteboardElement[]) => els;
      service.transformSelectedElements(transformFn);
      expect(mockSelectionService.transformSelectedElements).toHaveBeenCalledWith(transformFn);
    });

    it('should set selection box', () => {
      const box = { x: 0, y: 0, width: 100, height: 100, visible: true };
      service.setSelectionBox(box);
      expect(mockSelectionService.setSelectionBox).toHaveBeenCalledWith(box);
    });

    it('should update bounding box', () => {
      service.updateBoundingBox();
      expect(mockSelectionService.updateBoundingBox).toHaveBeenCalled();
    });

    it('should get selection box signal', () => {
      const result = service.getSelectionBoxSignal();
      expect(mockSelectionService.getSelectionBoxSignal).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should get bounding box signal', () => {
      const result = service.getBoundingBoxSignal();
      expect(mockSelectionService.getBoundingBoxSignal).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });
  });

  describe('Clipboard Operations', () => {
    it('should get clipboard info', () => {
      const result = service.getClipboardInfo();
      expect(mockClipboardService.getClipboardInfo).toHaveBeenCalled();
      expect(result).toEqual({ count: 0 });
    });

    it('should copy elements', () => {
      service.copyElements();
      expect(mockSelectionService.copyElements).toHaveBeenCalled();
    });

    it('should cut elements', () => {
      service.cutElements();
      expect(mockSelectionService.cutElements).toHaveBeenCalled();
    });

    it('should paste elements', () => {
      service.pasteElements();
      expect(mockSelectionService.pasteElements).toHaveBeenCalled();
    });

    it('should duplicate elements', () => {
      service.duplicateElements();
      expect(mockSelectionService.duplicateElements).toHaveBeenCalled();
    });

    it('should delete selected elements', () => {
      service.deleteSelectedElements();
      expect(mockSelectionService.deleteSelectedElements).toHaveBeenCalled();
    });
  });

  describe('Element Ordering', () => {
    it('should bring to front', () => {
      service.bringToFront();
      expect(mockSelectionService.bringToFront).toHaveBeenCalled();
    });

    it('should bring forward', () => {
      service.bringForward();
      expect(mockSelectionService.bringForward).toHaveBeenCalled();
    });

    it('should send backward', () => {
      service.sendBackward();
      expect(mockSelectionService.sendBackward).toHaveBeenCalled();
    });

    it('should send to back', () => {
      service.sendToBack();
      expect(mockSelectionService.sendToBack).toHaveBeenCalled();
    });
  });

  describe('Grouping and Locking', () => {
    it('should group selected elements', () => {
      service.groupSelectedElements();
      expect(mockSelectionService.groupSelectedElements).toHaveBeenCalled();
    });

    it('should ungroup selected elements', () => {
      service.ungroupSelectedElements();
      expect(mockSelectionService.ungroupSelectedElements).toHaveBeenCalled();
    });

    it('should lock elements', () => {
      service.lockElements();
      expect(mockSelectionService.lockElements).toHaveBeenCalled();
    });

    it('should unlock elements', () => {
      service.unlockElements();
      expect(mockSelectionService.unlockElements).toHaveBeenCalled();
    });
  });

  describe('Alignment', () => {
    it('should align elements', () => {
      service.alignElements(AlignmentType.Left);
      expect(mockSelectionService.alignElements).toHaveBeenCalledWith(AlignmentType.Left);
    });
  });

  describe('Canvas Management', () => {
    it('should initialize whiteboard', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      service.initializeWhiteboard(svg);
      expect(mockCanvasService.initializeCanvas).toHaveBeenCalledWith(svg);
      expect(mockToolsService.setApiService).toHaveBeenCalledWith(service);
    });

    it('should get canvas', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      mockCanvasService.getCanvas.mockReturnValue(svg);
      const result = service.getCanvas();
      expect(mockCanvasService.getCanvas).toHaveBeenCalled();
      expect(result).toBe(svg);
    });

    it('should set canvas dimensions', () => {
      service.setCanvasDimensions(800, 600);
      expect(mockCanvasService.setCanvasDimensions).toHaveBeenCalledWith(800, 600);
    });

    it('should center canvas', () => {
      service.centerCanvas();
      expect(mockCanvasService.centerCanvas).toHaveBeenCalled();
    });

    it('should toggle fullscreen', () => {
      service.fullScreen();
      expect(mockCanvasService.fullScreen).toHaveBeenCalled();
    });

    it('should exit fullscreen', () => {
      service.exitFullScreen(1024, 768);
      expect(mockCanvasService.exitFullScreen).toHaveBeenCalledWith(1024, 768);
    });

    it('should reset canvas', () => {
      service.resetCanvas();
      expect(mockCanvasService.resetCanvas).toHaveBeenCalled();
    });
  });

  describe('Zoom and Pan', () => {
    it('should set zoom', () => {
      service.setZoom(1.5);
      expect(mockZoomService.zoom).toHaveBeenCalledWith(1.5);
    });

    it('should zoom in', () => {
      service.zoomIn();
      expect(mockZoomService.zoomIn).toHaveBeenCalled();
    });

    it('should zoom out', () => {
      service.zoomOut();
      expect(mockZoomService.zoomOut).toHaveBeenCalled();
    });

    it('should reset zoom', () => {
      service.resetZoom();
      expect(mockZoomService.resetZoom).toHaveBeenCalled();
    });

    it('should zoom to fit', () => {
      service.zoomToFit();
      expect(mockZoomService.zoomToFit).toHaveBeenCalled();
    });

    it('should zoom to selection', () => {
      service.zoomToSelection();
      expect(mockZoomService.zoomToSelection).toHaveBeenCalled();
    });

    it('should pan canvas', () => {
      service.pan(10, 20);
      expect(mockPanService.pan).toHaveBeenCalledWith(10, 20);
    });

    it('should pan to position', () => {
      service.panTo(100, 200);
      expect(mockPanService.panTo).toHaveBeenCalledWith(100, 200);
    });

    it('should reset pan', () => {
      service.resetPan();
      expect(mockPanService.resetPan).toHaveBeenCalled();
    });
  });

  describe('I/O Operations', () => {
    it('should save with default format', async () => {
      mockIOService.save.mockResolvedValue('saved-data');
      const result = await service.save();
      expect(mockIOService.save).toHaveBeenCalledWith(FormatType.Base64, 'whiteboard');
      expect(result).toBe('saved-data');
    });

    it('should save with custom format and name', async () => {
      mockIOService.save.mockResolvedValue('saved-data');
      const result = await service.save(FormatType.Png, 'my-board');
      expect(mockIOService.save).toHaveBeenCalledWith(FormatType.Png, 'my-board');
      expect(result).toBe('saved-data');
    });

    it('should add image', () => {
      const imageInfo = { image: 'data:image/png;base64,test', x: 0, y: 0 };
      service.addImage(imageInfo);
      expect(mockIOService.addImage).toHaveBeenCalledWith(imageInfo);
    });

    it('should import image file', async () => {
      const file = new File([''], 'test.png', { type: 'image/png' });
      mockIOService.importImageFile.mockResolvedValue(undefined);
      await service.importImageFile(file, 10, 20);
      expect(mockIOService.importImageFile).toHaveBeenCalledWith(file, 10, 20);
    });

    it('should export data', () => {
      mockIOService.exportData.mockReturnValue('{"elements":[]}');
      const result = service.exportData();
      expect(mockIOService.exportData).toHaveBeenCalled();
      expect(result).toBe('{"elements":[]}');
    });

    it('should import data', () => {
      const jsonData = '{"elements":[]}';
      service.importData(jsonData);
      expect(mockIOService.importData).toHaveBeenCalledWith(jsonData);
    });
  });

  describe('Undo/Redo Operations', () => {
    it('should undo when history available', () => {
      mockHistoryService.undo.mockReturnValue([mockElement]);
      const result = service.undo();
      expect(mockHistoryService.undo).toHaveBeenCalled();
      expect(mockElementsService.setElements).toHaveBeenCalledWith([mockElement]);
      expect(mockSelectionService.clearSelection).toHaveBeenCalled();
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Undo, undefined);
      expect(result).toBe(true);
    });

    it('should return false when undo not available', () => {
      mockHistoryService.undo.mockReturnValue(null);
      const result = service.undo();
      expect(mockHistoryService.undo).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should redo when history available', () => {
      mockHistoryService.redo.mockReturnValue([mockElement]);
      const result = service.redo();
      expect(mockHistoryService.redo).toHaveBeenCalled();
      expect(mockElementsService.setElements).toHaveBeenCalledWith([mockElement]);
      expect(mockSelectionService.clearSelection).toHaveBeenCalled();
      expect(mockEventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Redo, undefined);
      expect(result).toBe(true);
    });

    it('should return false when redo not available', () => {
      mockHistoryService.redo.mockReturnValue(null);
      const result = service.redo();
      expect(mockHistoryService.redo).toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should get can undo signal', () => {
      const result = service.getCanUndoSignal();
      expect(mockHistoryService.getCanUndoSignal).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should get can redo signal', () => {
      const result = service.getCanRedoSignal();
      expect(mockHistoryService.getCanRedoSignal).toHaveBeenCalled();
      expect(result).toBeTruthy();
    });

    it('should clear history', () => {
      service.clearHistory();
      expect(mockHistoryService.clearHistory).toHaveBeenCalled();
    });
  });

  describe('History Recording', () => {
    it('should record element creation', () => {
      const before = [mockElement];
      const after = [mockElement, { ...mockElement, id: 'test-2' }];
      service.recordElementCreation(before, after);
      expect(mockHistoryService.recordElementCreation).toHaveBeenCalledWith(before, after);
    });

    it('should record element update', () => {
      const before = [mockElement];
      const after = [{ ...mockElement, x: 50 }];
      service.recordElementUpdate(before, after);
      expect(mockHistoryService.recordElementUpdate).toHaveBeenCalledWith(before, after);
    });

    it('should record element deletion', () => {
      const before = [mockElement];
      const after: WhiteboardElement[] = [];
      service.recordElementDeletion(before, after);
      expect(mockHistoryService.recordElementDeletion).toHaveBeenCalledWith(before, after);
    });

    it('should record clear', () => {
      const before = [mockElement];
      const after: WhiteboardElement[] = [];
      service.recordClear(before, after);
      expect(mockHistoryService.recordClear).toHaveBeenCalledWith(before, after);
    });

    it('should record custom change', () => {
      const before = [mockElement];
      const after = [{ ...mockElement, x: 50 }];
      const description = 'Custom change';
      service.recordChange(before, after, description);
      expect(mockHistoryService.recordChange).toHaveBeenCalledWith(before, after, description);
    });
  });

  describe('Configuration', () => {
    it('should get config', () => {
      const config = { canvasWidth: 800, canvasHeight: 600 };
      mockConfigService.getConfig.mockReturnValue(config);
      const result = service.getConfig();
      expect(mockConfigService.getConfig).toHaveBeenCalled();
      expect(result).toEqual(config);
    });

    it('should update config', () => {
      const config = { canvasWidth: 1024, canvasHeight: 768 };
      service.updateConfig(config);
      expect(mockConfigService.updateConfig).toHaveBeenCalledWith(config);
    });

    it('should update config value', () => {
      service.updateConfigValue('canvasWidth', 1024);
      expect(mockConfigService.updateConfigValue).toHaveBeenCalledWith('canvasWidth', 1024);
    });
  });

  describe('Layer Management', () => {
    it('should add layer', () => {
      mockLayerService.addLayer.mockReturnValue('layer-2');
      const result = service.addLayer('New Layer');
      expect(mockLayerService.addLayer).toHaveBeenCalledWith('New Layer');
      expect(result).toBe('layer-2');
    });

    it('should remove layer', () => {
      mockLayerService.removeLayer.mockReturnValue(true);
      const result = service.removeLayer('layer-1');
      expect(mockLayerService.removeLayer).toHaveBeenCalledWith('layer-1');
      expect(result).toBe(true);
    });

    it('should set active layer', () => {
      mockLayerService.setActiveLayer.mockReturnValue(true);
      const result = service.setActiveLayer('layer-2');
      expect(mockLayerService.setActiveLayer).toHaveBeenCalledWith('layer-2');
      expect(result).toBe(true);
    });

    it('should get active layer ID', () => {
      mockLayerService.getActiveLayerId.mockReturnValue('layer-1');
      const result = service.getActiveLayerId();
      expect(mockLayerService.getActiveLayerId).toHaveBeenCalled();
      expect(result).toBe('layer-1');
    });

    it('should toggle layer visibility', () => {
      mockLayerService.toggleLayerVisibility.mockReturnValue(true);
      const result = service.toggleLayerVisibility('layer-1');
      expect(mockLayerService.toggleLayerVisibility).toHaveBeenCalledWith('layer-1');
      expect(result).toBe(true);
    });

    it('should toggle layer lock', () => {
      mockLayerService.toggleLayerLock.mockReturnValue(true);
      const result = service.toggleLayerLock('layer-1');
      expect(mockLayerService.toggleLayerLock).toHaveBeenCalledWith('layer-1');
      expect(result).toBe(true);
    });

    it('should rename layer', () => {
      mockLayerService.renameLayer.mockReturnValue(true);
      const result = service.renameLayer('layer-1', 'Renamed Layer');
      expect(mockLayerService.renameLayer).toHaveBeenCalledWith('layer-1', 'Renamed Layer');
      expect(result).toBe(true);
    });

    it('should set layer opacity', () => {
      mockLayerService.setLayerOpacity.mockReturnValue(true);
      const result = service.setLayerOpacity('layer-1', 0.5);
      expect(mockLayerService.setLayerOpacity).toHaveBeenCalledWith('layer-1', 0.5);
      expect(result).toBe(true);
    });

    it('should set layer blend mode', () => {
      mockLayerService.setLayerBlendMode.mockReturnValue(true);
      const result = service.setLayerBlendMode('layer-1', 'multiply');
      expect(mockLayerService.setLayerBlendMode).toHaveBeenCalledWith('layer-1', 'multiply');
      expect(result).toBe(true);
    });

    it('should move layer up', () => {
      mockLayerService.moveLayerUp.mockReturnValue(true);
      const result = service.moveLayerUp('layer-1');
      expect(mockLayerService.moveLayerUp).toHaveBeenCalledWith('layer-1');
      expect(result).toBe(true);
    });

    it('should move layer down', () => {
      mockLayerService.moveLayerDown.mockReturnValue(true);
      const result = service.moveLayerDown('layer-1');
      expect(mockLayerService.moveLayerDown).toHaveBeenCalledWith('layer-1');
      expect(result).toBe(true);
    });
  });

  describe('Grid Operations', () => {
    it('should toggle grid', () => {
      service.toggleGrid();
      expect(mockCanvasService.toggleGrid).toHaveBeenCalled();
    });

    it('should toggle snap to grid', () => {
      service.toggleSnapToGrid();
      expect(mockCanvasService.toggleSnapToGrid).toHaveBeenCalled();
    });

    it('should set grid size', () => {
      service.setGridSize(20);
      expect(mockCanvasService.setGridSize).toHaveBeenCalledWith(20);
    });
  });

  describe('Tool Management', () => {
    it('should set active tool', () => {
      service.setActiveTool(ToolType.Rectangle);
      expect(mockToolsService.setActiveTool).toHaveBeenCalledWith(ToolType.Rectangle);
    });

    it('should get active tool', () => {
      mockToolsService.getActiveToolType.mockReturnValue(ToolType.Select);
      const result = service.getActiveTool();
      expect(mockToolsService.getActiveToolType).toHaveBeenCalled();
      expect(result).toBe(ToolType.Select);
    });
  });

  describe('Cursor Management', () => {
    it('should set cursor', () => {
      service.setCursor(CursorType.Pointer);
      expect(mockToolsService.setCursor).toHaveBeenCalledWith(CursorType.Pointer);
    });

    it('should reset cursor', () => {
      service.resetCursor();
      expect(mockToolsService.resetCursor).toHaveBeenCalled();
    });
  });

  describe('Coordinate Conversion', () => {
    it('should convert screen to canvas coordinates', () => {
      mockCanvasService.screenToCanvas.mockReturnValue({ x: 50, y: 100 });
      const result = service.screenToCanvas(100, 200);
      expect(mockCanvasService.screenToCanvas).toHaveBeenCalledWith(100, 200);
      expect(result).toEqual({ x: 50, y: 100 });
    });

    it('should convert canvas to screen coordinates', () => {
      mockCanvasService.canvasToScreen.mockReturnValue({ x: 100, y: 200 });
      const result = service.canvasToScreen(50, 100);
      expect(mockCanvasService.canvasToScreen).toHaveBeenCalledWith(50, 100);
      expect(result).toEqual({ x: 100, y: 200 });
    });
  });
});
