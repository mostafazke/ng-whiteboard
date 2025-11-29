import { TestBed } from '@angular/core/testing';
import {
  Tool,
  ToolType,
  WhiteboardConfig,
  WhiteboardEvent,
  PointerInfo,
  WhiteboardElement,
  ElementType,
} from '../types';
import { SvgService } from './svg.service';
import { ToolsService } from '../tools/tools.service';
import { EventBusService } from '../event-bus/event-bus.service';
import { ConfigService } from '../config/config.service';
import { ApiService } from '../api/api.service';
import { KeyboardShortcutService } from '../input/keyboard-shortcut.service';
import { ContextMenuService } from '../components/context-menu/context-menu.service';
import { DragDropService } from '../input/drag-drop.service';
import { WheelHandlerService } from '../viewport/wheel-handler.service';
global.DOMRect = class DOMRect {
  constructor(public x = 0, public y = 0, public width = 0, public height = 0) {
    this.left = x;
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
  }
  left = 0;
  top = 0;
  right = 0;
  bottom = 0;
  toJSON() {
    return JSON.stringify(this);
  }
} as typeof DOMRect;

// Mock DragEvent for testing since it's not available in jsdom
class MockDragEvent extends Event {
  dataTransfer: DataTransfer | null = null;
  constructor(type: string) {
    super(type);
  }
}

if (typeof DragEvent === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).DragEvent = MockDragEvent;
}

// Mock the target utility
jest.mock('../utils/dom/target', () => ({
  getTargetElement: jest.fn(),
}));

import { getTargetElement } from '../utils/dom/target';

describe('SvgService', () => {
  let service: SvgService;
  let eventBusService: jest.Mocked<EventBusService>;
  let configService: jest.Mocked<ConfigService>;
  let apiService: jest.Mocked<ApiService>;
  let contextMenuService: jest.Mocked<ContextMenuService>;

  const currentTool: Tool = {
    type: ToolType.Pen,
    activate: jest.fn(),
    deactivate: jest.fn(),
    handlePointerDown: jest.fn(),
    handlePointerMove: jest.fn(),
    handlePointerUp: jest.fn(),
  };

  beforeEach(() => {
    const toolsServiceMock = {
      getActiveToolType: jest.fn().mockReturnValue(ToolType.Pen),
      getActiveToolInstance: jest.fn().mockReturnValue(currentTool),
      getToolInstance: jest.fn().mockReturnValue(currentTool),
      hasTemporaryOverride: jest.fn().mockReturnValue(false),
      pushTemporaryTool: jest.fn(),
      popTemporaryTool: jest.fn(),
    };

    const eventBusMock = {
      emit: jest.fn(),
    };

    const configMock = {
      getConfig: jest.fn().mockReturnValue({
        drawingEnabled: true,
        keyboardShortcutsEnabled: true,
      } as WhiteboardConfig),
    };

    const apiServiceMock = {
      getElements: jest.fn().mockReturnValue([]),
      selectedElements: jest.fn().mockReturnValue([]),
      selectElements: jest.fn(),
      clearSelection: jest.fn(),
    };

    const contextMenuServiceMock = {
      showContextMenu: jest.fn(),
    };

    const keyboardShortcutServiceMock = {
      handleKeyDown: jest.fn(),
      handleKeyUp: jest.fn(),
    };

    const dragDropServiceMock = {
      handleFiles: jest.fn(),
      handleText: jest.fn(),
      handleElements: jest.fn(),
    };

    const wheelHandlerServiceMock = {
      handleWheel: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SvgService,
        { provide: ToolsService, useValue: toolsServiceMock },
        { provide: EventBusService, useValue: eventBusMock },
        { provide: ConfigService, useValue: configMock },
        { provide: ApiService, useValue: apiServiceMock },
        { provide: ContextMenuService, useValue: contextMenuServiceMock },
        { provide: KeyboardShortcutService, useValue: keyboardShortcutServiceMock },
        { provide: DragDropService, useValue: dragDropServiceMock },
        { provide: WheelHandlerService, useValue: wheelHandlerServiceMock },
      ],
    });

    service = TestBed.inject(SvgService);
    eventBusService = TestBed.inject(EventBusService) as jest.Mocked<EventBusService>;
    configService = TestBed.inject(ConfigService) as jest.Mocked<ConfigService>;
    apiService = TestBed.inject(ApiService) as jest.Mocked<ApiService>;
    contextMenuService = TestBed.inject(ContextMenuService) as jest.Mocked<ContextMenuService>;
  });

  const createMockPointerInfo = (overrides: Partial<PointerInfo> = {}): PointerInfo => ({
    x: 100,
    y: 100,
    clientX: 100,
    clientY: 100,
    pageX: 100,
    pageY: 100,
    movementX: 0,
    movementY: 0,
    pressure: 0.5,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    width: 1,
    height: 1,
    pointerType: 'mouse',
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    eventType: 'pointerdown',
    timeStamp: Date.now(),
    target: null,
    ...overrides,
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit DrawStart event and handle pointer down', () => {
    const pointerInfo = createMockPointerInfo({ eventType: 'pointerdown', button: 0 });

    service.onPointerDown(pointerInfo);

    expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.DrawStart, pointerInfo);
    expect(currentTool.handlePointerDown).toHaveBeenCalledWith(pointerInfo);
  });

  it('should emit Drawing event and handle pointer move', () => {
    const pointerInfo = createMockPointerInfo({ eventType: 'pointermove' });

    service.onPointerMove(pointerInfo);

    expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.Drawing, pointerInfo);
    expect(currentTool.handlePointerMove).toHaveBeenCalledWith(pointerInfo);
  });

  it('should emit DrawEnd event and handle pointer up', () => {
    const pointerInfo = createMockPointerInfo({ eventType: 'pointerup' });

    service.onPointerUp(pointerInfo);

    expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.DrawEnd);
    expect(currentTool.handlePointerUp).toHaveBeenCalledWith(pointerInfo);
  });

  it('should not emit events if drawing is disabled', () => {
    configService.getConfig.mockReturnValue({
      drawingEnabled: false,
      keyboardShortcutsEnabled: true,
    } as WhiteboardConfig);
    const pointerInfo = createMockPointerInfo();

    service.onPointerDown(pointerInfo);
    service.onPointerMove(pointerInfo);
    service.onPointerUp(pointerInfo);

    expect(eventBusService.emit).not.toHaveBeenCalled();
  });

  describe('Context Menu', () => {
    it('should show context menu without selection when no element is clicked', () => {
      (getTargetElement as jest.Mock).mockReturnValue(null);
      const pointerInfo = createMockPointerInfo({
        eventType: 'contextmenu',
        clientX: 150,
        clientY: 200,
      });
      const containerBounds = new DOMRect(0, 0, 800, 600);

      service.onContextMenu(pointerInfo, containerBounds);

      expect(contextMenuService.showContextMenu).toHaveBeenCalledWith(150, 200, containerBounds);
      expect(apiService.selectElements).not.toHaveBeenCalled();
    });

    it('should select element and show context menu when element is right-clicked', () => {
      const mockElement: WhiteboardElement = {
        id: 'element-1',
        type: ElementType.Rectangle,
        x: 50,
        y: 50,
      } as WhiteboardElement;

      (getTargetElement as jest.Mock).mockReturnValue(mockElement);
      apiService.selectedElements.mockReturnValue([]); // No elements currently selected

      const pointerInfo = createMockPointerInfo({
        eventType: 'contextmenu',
        clientX: 150,
        clientY: 200,
      });
      const containerBounds = new DOMRect(0, 0, 800, 600);

      service.onContextMenu(pointerInfo, containerBounds);

      expect(apiService.selectElements).toHaveBeenCalledWith(mockElement);
      expect(contextMenuService.showContextMenu).toHaveBeenCalledWith(150, 200, containerBounds);
    });

    it('should not change selection when right-clicking on already selected element in multi-selection', () => {
      const mockElement1: WhiteboardElement = {
        id: 'element-1',
        type: ElementType.Rectangle,
      } as WhiteboardElement;

      const mockElement2: WhiteboardElement = {
        id: 'element-2',
        type: ElementType.Ellipse,
      } as WhiteboardElement;

      (getTargetElement as jest.Mock).mockReturnValue(mockElement1);
      apiService.selectedElements.mockReturnValue([mockElement1, mockElement2]); // Multiple elements selected

      const pointerInfo = createMockPointerInfo({
        eventType: 'contextmenu',
        clientX: 150,
        clientY: 200,
      });

      service.onContextMenu(pointerInfo);

      expect(apiService.selectElements).not.toHaveBeenCalled();
      expect(contextMenuService.showContextMenu).toHaveBeenCalledWith(150, 200, undefined);
    });

    it('should select element when right-clicking on unselected element', () => {
      const selectedElement: WhiteboardElement = {
        id: 'element-1',
        type: ElementType.Rectangle,
      } as WhiteboardElement;

      const clickedElement: WhiteboardElement = {
        id: 'element-2',
        type: ElementType.Ellipse,
      } as WhiteboardElement;

      (getTargetElement as jest.Mock).mockReturnValue(clickedElement);
      apiService.selectedElements.mockReturnValue([selectedElement]); // Different element selected

      const pointerInfo = createMockPointerInfo({
        eventType: 'contextmenu',
        clientX: 150,
        clientY: 200,
      });

      service.onContextMenu(pointerInfo);

      expect(apiService.selectElements).toHaveBeenCalledWith(clickedElement);
      expect(contextMenuService.showContextMenu).toHaveBeenCalledWith(150, 200, undefined);
    });

    it('should not show context menu if drawing is disabled', () => {
      configService.getConfig.mockReturnValue({
        drawingEnabled: false,
        keyboardShortcutsEnabled: true,
      } as WhiteboardConfig);

      const pointerInfo = createMockPointerInfo({
        eventType: 'contextmenu',
        clientX: 150,
        clientY: 200,
      });

      service.onContextMenu(pointerInfo);

      expect(contextMenuService.showContextMenu).not.toHaveBeenCalled();
    });
  });

  describe('Middle Button (Pan)', () => {
    let toolsService: jest.Mocked<ToolsService>;
    let handTool: jest.Mocked<Tool>;

    beforeEach(() => {
      // Clear previous mock calls
      (currentTool.handlePointerDown as jest.Mock).mockClear();
      (currentTool.handlePointerMove as jest.Mock).mockClear();
      (currentTool.handlePointerUp as jest.Mock).mockClear();

      toolsService = TestBed.inject(ToolsService) as jest.Mocked<ToolsService>;
      handTool = {
        type: ToolType.Hand,
        activate: jest.fn(),
        deactivate: jest.fn(),
        handlePointerDown: jest.fn(),
        handlePointerMove: jest.fn(),
        handlePointerUp: jest.fn(),
      };
      toolsService.getToolInstance.mockReturnValue(handTool);
    });

    it('should activate hand tool on middle button down', () => {
      const pointerInfo = createMockPointerInfo({ button: 1 });

      service.onPointerDown(pointerInfo);

      expect(toolsService.pushTemporaryTool).toHaveBeenCalledWith(ToolType.Hand, 'pan-middle');
      expect(handTool.handlePointerDown).toHaveBeenCalledWith(pointerInfo);
      expect(currentTool.handlePointerDown).not.toHaveBeenCalled();
    });

    it('should handle pointer move with hand tool when middle button is active', () => {
      toolsService.hasTemporaryOverride.mockReturnValue(true);
      const pointerInfo = createMockPointerInfo({ eventType: 'pointermove' });

      service.onPointerMove(pointerInfo);

      expect(handTool.handlePointerMove).toHaveBeenCalledWith(pointerInfo);
      expect(currentTool.handlePointerMove).not.toHaveBeenCalled();
    });

    it('should deactivate hand tool on middle button up', () => {
      toolsService.hasTemporaryOverride.mockReturnValue(true);
      const pointerInfo = createMockPointerInfo({ button: 1, eventType: 'pointerup' });

      service.onPointerUp(pointerInfo);

      expect(handTool.handlePointerUp).toHaveBeenCalledWith(pointerInfo);
      expect(toolsService.popTemporaryTool).toHaveBeenCalledWith('pan-middle');
    });

    it('should not handle anything on right button down (button 2)', () => {
      const pointerInfo = createMockPointerInfo({ button: 2 });

      service.onPointerDown(pointerInfo);

      expect(toolsService.pushTemporaryTool).not.toHaveBeenCalled();
      expect(currentTool.handlePointerDown).not.toHaveBeenCalled();
      expect(eventBusService.emit).not.toHaveBeenCalled();
    });

    it('should not handle pointer down when temporary override is active', () => {
      toolsService.hasTemporaryOverride.mockReturnValue(true);
      const pointerInfo = createMockPointerInfo({ button: 0 });

      service.onPointerDown(pointerInfo);

      expect(currentTool.handlePointerDown).not.toHaveBeenCalled();
    });

    it('should handle null hand tool gracefully on middle button', () => {
      toolsService.getToolInstance.mockReturnValue(null as unknown as Tool);
      const pointerInfo = createMockPointerInfo({ button: 1 });

      expect(() => service.onPointerDown(pointerInfo)).not.toThrow();
    });

    it('should handle hand tool that throws error gracefully', () => {
      toolsService.getToolInstance.mockImplementation(() => {
        throw new Error('Tool not found');
      });
      const pointerInfo = createMockPointerInfo({ button: 1 });

      expect(() => service.onPointerDown(pointerInfo)).not.toThrow();
    });
  });

  describe('Keyboard Events', () => {
    let keyboardShortcutService: jest.Mocked<KeyboardShortcutService>;
    let toolsService: jest.Mocked<ToolsService>;

    beforeEach(() => {
      keyboardShortcutService = TestBed.inject(KeyboardShortcutService) as jest.Mocked<KeyboardShortcutService>;
      toolsService = TestBed.inject(ToolsService) as jest.Mocked<ToolsService>;
    });

    it('should activate hand tool on spacebar down', () => {
      const event = new KeyboardEvent('keydown', { code: 'Space' });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      service.onKeyDown(event);

      expect(toolsService.pushTemporaryTool).toHaveBeenCalledWith(ToolType.Hand, 'pan-space');
      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(keyboardShortcutService.handleKeyDown).not.toHaveBeenCalled();
    });

    it('should not activate hand tool multiple times when space is held', () => {
      const event1 = new KeyboardEvent('keydown', { code: 'Space' });
      const event2 = new KeyboardEvent('keydown', { code: 'Space' });

      service.onKeyDown(event1);
      toolsService.pushTemporaryTool.mockClear();

      service.onKeyDown(event2);

      expect(toolsService.pushTemporaryTool).not.toHaveBeenCalled();
    });

    it('should deactivate hand tool on spacebar up', () => {
      const downEvent = new KeyboardEvent('keydown', { code: 'Space' });
      const upEvent = new KeyboardEvent('keyup', { code: 'Space' });
      const preventDefaultSpy = jest.spyOn(upEvent, 'preventDefault');

      service.onKeyDown(downEvent);
      service.onKeyUp(upEvent);

      expect(toolsService.popTemporaryTool).toHaveBeenCalledWith('pan-space');
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should handle keyboard shortcuts when enabled', () => {
      const event = new KeyboardEvent('keydown', { code: 'KeyZ', ctrlKey: true });

      service.onKeyDown(event);

      expect(keyboardShortcutService.handleKeyDown).toHaveBeenCalledWith(event);
    });

    it('should not handle keyboard shortcuts when disabled', () => {
      configService.getConfig.mockReturnValue({
        drawingEnabled: true,
        keyboardShortcutsEnabled: false,
      } as WhiteboardConfig);

      const event = new KeyboardEvent('keydown', { code: 'KeyZ', ctrlKey: true });

      service.onKeyDown(event);

      expect(keyboardShortcutService.handleKeyDown).not.toHaveBeenCalled();
    });

    it('should handle key up for shortcuts when enabled', () => {
      const event = new KeyboardEvent('keyup', { code: 'KeyZ' });

      service.onKeyUp(event);

      expect(keyboardShortcutService.handleKeyUp).toHaveBeenCalled();
    });

    it('should not handle key up for shortcuts when disabled', () => {
      configService.getConfig.mockReturnValue({
        drawingEnabled: true,
        keyboardShortcutsEnabled: false,
      } as WhiteboardConfig);

      const event = new KeyboardEvent('keyup', { code: 'KeyZ' });

      service.onKeyUp(event);

      expect(keyboardShortcutService.handleKeyUp).not.toHaveBeenCalled();
    });

    it('should handle key up event', () => {
      const event = new KeyboardEvent('keyup', { code: 'KeyZ' });
      service.onKeyUp(event);
      expect(keyboardShortcutService.handleKeyUp).toHaveBeenCalledWith(event);
    });

    it('should not deactivate hand tool on key up when space was not held', () => {
      const upEvent = new KeyboardEvent('keyup', { code: 'Space' });

      service.onKeyUp(upEvent);

      expect(toolsService.popTemporaryTool).not.toHaveBeenCalled();
    });
  });

  describe('Double Click', () => {
    it('should emit ElementDoubleClicked event on double click', () => {
      const mockElement = document.createElement('div');
      const pointerInfo = createMockPointerInfo({
        eventType: 'pointerdown',
        isDoubleClick: true,
        target: mockElement,
        clientX: 150,
        clientY: 200,
      });

      service.onPointerDown(pointerInfo);

      expect(eventBusService.emit).toHaveBeenCalledWith(WhiteboardEvent.ElementDoubleClicked, {
        target: mockElement,
        clientX: 150,
        clientY: 200,
      });
    });
  });

  describe('Wheel Events', () => {
    let wheelHandlerService: jest.Mocked<WheelHandlerService>;

    beforeEach(() => {
      wheelHandlerService = TestBed.inject(WheelHandlerService) as jest.Mocked<WheelHandlerService>;
    });

    it('should handle wheel events when drawing is enabled', () => {
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });

      service.onWheel(wheelEvent);

      expect(wheelHandlerService.handleWheel).toHaveBeenCalledWith(wheelEvent);
    });

    it('should not handle wheel events when drawing is disabled', () => {
      configService.getConfig.mockReturnValue({
        drawingEnabled: false,
        keyboardShortcutsEnabled: true,
      } as WhiteboardConfig);

      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });

      service.onWheel(wheelEvent);

      expect(wheelHandlerService.handleWheel).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    let dragDropService: jest.Mocked<DragDropService>;

    beforeEach(() => {
      dragDropService = TestBed.inject(DragDropService) as jest.Mocked<DragDropService>;
    });

    describe('onDragOver', () => {
      it('should set drop effect to copy when drawing is enabled', () => {
        const dragEvent = new DragEvent('dragover');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: { dropEffect: '' },
          writable: true,
        });

        service.onDragOver(dragEvent);

        expect(dragEvent.dataTransfer?.dropEffect).toBe('copy');
      });

      it('should not set drop effect when drawing is disabled', () => {
        configService.getConfig.mockReturnValue({
          drawingEnabled: false,
          keyboardShortcutsEnabled: true,
        } as WhiteboardConfig);

        const dragEvent = new DragEvent('dragover');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: { dropEffect: '' },
          writable: true,
        });

        service.onDragOver(dragEvent);

        expect(dragEvent.dataTransfer?.dropEffect).toBe('');
      });

      it('should handle drag over without dataTransfer', () => {
        const dragEvent = new DragEvent('dragover');

        expect(() => service.onDragOver(dragEvent)).not.toThrow();
      });
    });

    describe('onDrop', () => {
      it('should handle dropped files', () => {
        const file = new File(['content'], 'test.png', { type: 'image/png' });
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [file],
            getData: jest.fn(),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleFiles).toHaveBeenCalledWith([file]);
      });

      it('should handle dropped HTML text', () => {
        const htmlContent = '<p>Hello <strong>World</strong></p>';
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [],
            getData: jest.fn((type: string) => {
              if (type === 'text/html') return htmlContent;
              return '';
            }),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleText).toHaveBeenCalledWith(htmlContent, dragEvent, true);
      });

      it('should handle dropped plain text', () => {
        const textContent = 'Plain text content';
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [],
            getData: jest.fn((type: string) => {
              if (type === 'text/plain') return textContent;
              return '';
            }),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleText).toHaveBeenCalledWith(textContent, dragEvent, false);
      });

      it('should handle dropped JSON elements', () => {
        const elements = [
          { id: '1', type: 'rectangle' },
          { id: '2', type: 'ellipse' },
        ];
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [],
            getData: jest.fn((type: string) => {
              if (type === 'application/json') return JSON.stringify(elements);
              return '';
            }),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleElements).toHaveBeenCalledWith(elements, dragEvent);
      });

      it('should handle invalid JSON gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [],
            getData: jest.fn((type: string) => {
              if (type === 'application/json') return 'invalid json {';
              return '';
            }),
          },
        });

        service.onDrop(dragEvent);

        expect(consoleSpy).toHaveBeenCalledWith('Failed to parse dropped JSON:', expect.any(Error));
        consoleSpy.mockRestore();
      });

      it('should handle JSON that is not an array', () => {
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [],
            getData: jest.fn((type: string) => {
              if (type === 'application/json') return JSON.stringify({ not: 'array' });
              return '';
            }),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleElements).not.toHaveBeenCalled();
      });

      it('should not handle drop when drawing is disabled', () => {
        configService.getConfig.mockReturnValue({
          drawingEnabled: false,
          keyboardShortcutsEnabled: true,
        } as WhiteboardConfig);

        const file = new File(['content'], 'test.png', { type: 'image/png' });
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [file],
            getData: jest.fn(),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleFiles).not.toHaveBeenCalled();
      });

      it('should prioritize files over text', () => {
        const file = new File(['content'], 'test.png', { type: 'image/png' });
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [file],
            getData: jest.fn(() => 'some text'),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleFiles).toHaveBeenCalled();
        expect(dragDropService.handleText).not.toHaveBeenCalled();
      });

      it('should prioritize HTML over plain text', () => {
        const htmlContent = '<p>HTML</p>';
        const dragEvent = new DragEvent('drop');
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: {
            files: [],
            getData: jest.fn((type: string) => {
              if (type === 'text/html') return htmlContent;
              if (type === 'text/plain') return 'plain text';
              return '';
            }),
          },
        });

        service.onDrop(dragEvent);

        expect(dragDropService.handleText).toHaveBeenCalledWith(htmlContent, dragEvent, true);
        expect(dragDropService.handleText).not.toHaveBeenCalledWith('plain text', dragEvent, false);
      });
    });
  });
});
