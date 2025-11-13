import { TestBed } from '@angular/core/testing';
import { KeyboardShortcutService } from './keyboard-shortcut.service';
import { ApiService } from '../api';
import { ConfigService } from '../config/config.service';
import { WhiteboardConfig } from '../types';

describe('KeyboardShortcutService', () => {
  let service: KeyboardShortcutService;
  let mockApiService: jest.Mocked<ApiService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const mockConfig: WhiteboardConfig = {
    keyboardShortcutsEnabled: true,
  } as WhiteboardConfig;

  const createKeyEvent = (options: {
    key: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
  }): KeyboardEvent => {
    return new KeyboardEvent('keydown', {
      key: options.key,
      ctrlKey: options.ctrlKey || false,
      metaKey: options.metaKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      bubbles: true,
      cancelable: true,
    });
  };

  const addSpies = (event: KeyboardEvent) => {
    jest.spyOn(event, 'preventDefault');
    jest.spyOn(event, 'stopPropagation');
    return event;
  };

  beforeEach(() => {
    mockApiService = {
      undo: jest.fn().mockReturnValue(true),
      redo: jest.fn().mockReturnValue(true),
      selectAll: jest.fn(),
      clearSelection: jest.fn(),
      copyElements: jest.fn(),
      cutElements: jest.fn(),
      pasteElements: jest.fn(),
      duplicateElements: jest.fn(),
      deleteSelectedElements: jest.fn(),
      groupSelectedElements: jest.fn(),
      ungroupSelectedElements: jest.fn(),
      zoomIn: jest.fn(),
      zoomOut: jest.fn(),
      zoomToFit: jest.fn(),
      resetZoom: jest.fn(),
      zoomToSelection: jest.fn(),
      toggleGrid: jest.fn(),
      toggleSnapToGrid: jest.fn(),
      setActiveTool: jest.fn(),
      bringToFront: jest.fn(),
      bringForward: jest.fn(),
      sendBackward: jest.fn(),
      sendToBack: jest.fn(),
      alignElements: jest.fn(),
      flipHorizontal: jest.fn(),
      flipVertical: jest.fn(),
      moveSelectedElements: jest.fn(),
    } as unknown as jest.Mocked<ApiService>;

    mockConfigService = {
      getConfig: jest.fn().mockReturnValue(mockConfig),
      updateConfigValue: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutService,
        { provide: ApiService, useValue: mockApiService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    });

    service = TestBed.inject(KeyboardShortcutService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('toggleKeyboardShortcuts', () => {
    it('should toggle keyboard shortcuts from enabled to disabled', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...mockConfig,
        keyboardShortcutsEnabled: true,
      } as WhiteboardConfig);

      service.toggleKeyboardShortcuts();

      expect(mockConfigService.updateConfigValue).toHaveBeenCalledWith('keyboardShortcutsEnabled', false);
    });

    it('should toggle keyboard shortcuts from disabled to enabled', () => {
      mockConfigService.getConfig.mockReturnValue({
        ...mockConfig,
        keyboardShortcutsEnabled: false,
      } as WhiteboardConfig);

      service.toggleKeyboardShortcuts();

      expect(mockConfigService.updateConfigValue).toHaveBeenCalledWith('keyboardShortcutsEnabled', true);
    });
  });

  describe('handleKeyUp', () => {
    it('should exist and be callable with keyboard event', () => {
      const event = new KeyboardEvent('keyup', { key: 'a' });
      expect(() => service.handleKeyUp(event)).not.toThrow();
    });
  });

  describe('handleKeyDown', () => {
    describe('input focus detection', () => {
      it('should not handle shortcuts when HTMLInputElement is focused', () => {
        const input = document.createElement('input');
        document.body.appendChild(input);
        input.focus();

        const event = addSpies(createKeyEvent({ key: 'a', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.selectAll).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();

        document.body.removeChild(input);
      });

      it('should not handle shortcuts when HTMLTextAreaElement is focused', () => {
        const textarea = document.createElement('textarea');
        document.body.appendChild(textarea);
        textarea.focus();

        const event = addSpies(createKeyEvent({ key: 'a', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.selectAll).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();

        document.body.removeChild(textarea);
      });

      it('should not handle shortcuts when contenteditable element is focused', () => {
        const div = document.createElement('div');
        div.setAttribute('contenteditable', 'true');
        document.body.appendChild(div);
        div.focus();

        const event = addSpies(createKeyEvent({ key: 'a', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.selectAll).not.toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();

        document.body.removeChild(div);
      });

      it('should handle shortcuts when no input element is focused', () => {
        const div = document.createElement('div');
        div.tabIndex = 0;
        document.body.appendChild(div);
        div.focus();

        const event = addSpies(createKeyEvent({ key: 'escape' }));
        service.handleKeyDown(event);

        expect(mockApiService.clearSelection).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();

        document.body.removeChild(div);
      });
    });

    describe('undo/redo shortcuts', () => {
      it('should handle Ctrl+Z for undo', () => {
        const event = addSpies(createKeyEvent({ key: 'z', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.undo).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Cmd+Z for undo on Mac', () => {
        const event = addSpies(createKeyEvent({ key: 'z', metaKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.undo).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should handle Ctrl+Y for redo', () => {
        const event = addSpies(createKeyEvent({ key: 'y', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.redo).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl+Shift+Z for redo', () => {
        const event = addSpies(createKeyEvent({ key: 'z', ctrlKey: true, shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.redo).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should handle uppercase Z for undo', () => {
        const event = addSpies(createKeyEvent({ key: 'Z', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.undo).toHaveBeenCalled();
      });
    });

    describe('selection shortcuts', () => {
      it('should handle Ctrl+A for select all', () => {
        const event = addSpies(createKeyEvent({ key: 'a', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.selectAll).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Escape for clear selection', () => {
        const event = addSpies(createKeyEvent({ key: 'escape' }));
        service.handleKeyDown(event);

        expect(mockApiService.clearSelection).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Escape with uppercase', () => {
        const event = addSpies(createKeyEvent({ key: 'Escape' }));
        service.handleKeyDown(event);

        expect(mockApiService.clearSelection).toHaveBeenCalled();
      });
    });

    describe('clipboard shortcuts', () => {
      it('should handle Ctrl+C for copy', () => {
        const event = addSpies(createKeyEvent({ key: 'c', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.copyElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl+X for cut', () => {
        const event = addSpies(createKeyEvent({ key: 'x', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.cutElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl+V for paste', () => {
        const event = addSpies(createKeyEvent({ key: 'v', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.pasteElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl+D for duplicate', () => {
        const event = addSpies(createKeyEvent({ key: 'd', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.duplicateElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('delete shortcuts', () => {
      it('should handle Delete key', () => {
        const event = addSpies(createKeyEvent({ key: 'delete' }));
        service.handleKeyDown(event);

        expect(mockApiService.deleteSelectedElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Backspace key', () => {
        const event = addSpies(createKeyEvent({ key: 'backspace' }));
        service.handleKeyDown(event);

        expect(mockApiService.deleteSelectedElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Delete with uppercase', () => {
        const event = addSpies(createKeyEvent({ key: 'Delete' }));
        service.handleKeyDown(event);

        expect(mockApiService.deleteSelectedElements).toHaveBeenCalled();
      });

      it('should handle Backspace with uppercase', () => {
        const event = addSpies(createKeyEvent({ key: 'Backspace' }));
        service.handleKeyDown(event);

        expect(mockApiService.deleteSelectedElements).toHaveBeenCalled();
      });
    });

    describe('grouping shortcuts', () => {
      it('should handle Ctrl+G for group', () => {
        const event = addSpies(createKeyEvent({ key: 'g', ctrlKey: true, shiftKey: false }));
        service.handleKeyDown(event);

        expect(mockApiService.groupSelectedElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl+Shift+G for ungroup', () => {
        const event = addSpies(createKeyEvent({ key: 'g', ctrlKey: true, shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.ungroupSelectedElements).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('zoom shortcuts', () => {
      it('should handle Ctrl+= for zoom in', () => {
        const event = addSpies(createKeyEvent({ key: '=', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.zoomIn).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl++ for zoom in', () => {
        const event = addSpies(createKeyEvent({ key: '+', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.zoomIn).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl+- for zoom out', () => {
        const event = addSpies(createKeyEvent({ key: '-', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.zoomOut).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('grid and snap shortcuts', () => {
      it("should handle Ctrl+' for toggle grid", () => {
        const event = addSpies(createKeyEvent({ key: "'", ctrlKey: true, shiftKey: false }));
        service.handleKeyDown(event);

        expect(mockApiService.toggleGrid).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Ctrl+Shift+; for toggle snap to grid', () => {
        const event = addSpies(createKeyEvent({ key: ';', ctrlKey: true, shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.toggleSnapToGrid).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('tool shortcuts', () => {
      it('should handle V for Select tool', () => {
        const event = addSpies(createKeyEvent({ key: 'v' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('select');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle D for Pen (Draw) tool', () => {
        const event = addSpies(createKeyEvent({ key: 'd' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('pen');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle E for Eraser tool', () => {
        const event = addSpies(createKeyEvent({ key: 'e' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('eraser');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle H for Hand tool', () => {
        const event = addSpies(createKeyEvent({ key: 'h' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('hand');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle R for Rectangle tool', () => {
        const event = addSpies(createKeyEvent({ key: 'r' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('rectangle');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle O for Ellipse tool', () => {
        const event = addSpies(createKeyEvent({ key: 'o' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('ellipse');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle A for Arrow tool', () => {
        const event = addSpies(createKeyEvent({ key: 'a' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('arrow');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle L for Line tool', () => {
        const event = addSpies(createKeyEvent({ key: 'l' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('line');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle T for Text tool', () => {
        const event = addSpies(createKeyEvent({ key: 't' }));
        service.handleKeyDown(event);

        expect(mockApiService.setActiveTool).toHaveBeenCalledWith('text');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('layer order shortcuts', () => {
      it('should handle ] for bring to front', () => {
        const event = addSpies(createKeyEvent({ key: ']' }));
        service.handleKeyDown(event);

        expect(mockApiService.bringToFront).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Alt+] for bring forward', () => {
        const event = addSpies(createKeyEvent({ key: ']', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.bringForward).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Alt+[ for send backward', () => {
        const event = addSpies(createKeyEvent({ key: '[', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.sendBackward).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle [ for send to back', () => {
        const event = addSpies(createKeyEvent({ key: '[' }));
        service.handleKeyDown(event);

        expect(mockApiService.sendToBack).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('alignment shortcuts', () => {
      it('should handle Alt+W for align top', () => {
        const event = addSpies(createKeyEvent({ key: 'w', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.alignElements).toHaveBeenCalledWith('top');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Alt+V for align middle', () => {
        const event = addSpies(createKeyEvent({ key: 'v', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.alignElements).toHaveBeenCalledWith('middle');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Alt+S for align bottom', () => {
        const event = addSpies(createKeyEvent({ key: 's', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.alignElements).toHaveBeenCalledWith('bottom');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Alt+A for align left', () => {
        const event = addSpies(createKeyEvent({ key: 'a', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.alignElements).toHaveBeenCalledWith('left');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Alt+H for align center (horizontally)', () => {
        const event = addSpies(createKeyEvent({ key: 'h', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.alignElements).toHaveBeenCalledWith('center');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Alt+D for align right', () => {
        const event = addSpies(createKeyEvent({ key: 'd', altKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.alignElements).toHaveBeenCalledWith('right');
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('additional zoom shortcuts', () => {
      it('should handle Shift+0 for reset zoom (100%)', () => {
        const event = addSpies(createKeyEvent({ key: '0', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.resetZoom).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Shift+1 for zoom to fit', () => {
        const event = addSpies(createKeyEvent({ key: '1', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.zoomToFit).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Shift+2 for zoom to selection', () => {
        const event = addSpies(createKeyEvent({ key: '2', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.zoomToSelection).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('flip shortcuts', () => {
      it('should handle Shift+H for flip horizontal', () => {
        const event = addSpies(createKeyEvent({ key: 'h', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.flipHorizontal).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Shift+V for flip vertical', () => {
        const event = addSpies(createKeyEvent({ key: 'v', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.flipVertical).toHaveBeenCalled();
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('move shortcuts', () => {
      it('should handle ArrowRight for moving right by 1px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowright' }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(1, 0);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle ArrowLeft for moving left by 1px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowleft' }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(-1, 0);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle ArrowUp for moving up by 1px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowup' }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(0, -1);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle ArrowDown for moving down by 1px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowdown' }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(0, 1);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Shift+ArrowRight for moving right by 10px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowright', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(10, 0);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Shift+ArrowLeft for moving left by 10px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowleft', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(-10, 0);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Shift+ArrowUp for moving up by 10px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowup', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(0, -10);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });

      it('should handle Shift+ArrowDown for moving down by 10px', () => {
        const event = addSpies(createKeyEvent({ key: 'arrowdown', shiftKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.moveSelectedElements).toHaveBeenCalledWith(0, 10);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.stopPropagation).toHaveBeenCalled();
      });
    });

    describe('unhandled keys', () => {
      it('should not prevent default for unhandled keys', () => {
        const event = addSpies(createKeyEvent({ key: 'q', ctrlKey: false }));
        service.handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
      });

      it('should not prevent default for Ctrl+Q (unhandled)', () => {
        const event = addSpies(createKeyEvent({ key: 'q', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
      });

      it('should not prevent default when ApiService returns false for undo', () => {
        mockApiService.undo.mockReturnValue(false);

        const event = addSpies(createKeyEvent({ key: 'z', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.undo).toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
      });

      it('should not prevent default when ApiService returns false for redo', () => {
        mockApiService.redo.mockReturnValue(false);

        const event = addSpies(createKeyEvent({ key: 'y', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.redo).toHaveBeenCalled();
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.stopPropagation).not.toHaveBeenCalled();
      });
    });

    describe('case insensitivity', () => {
      it('should handle uppercase keys', () => {
        const event = addSpies(createKeyEvent({ key: 'C', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.copyElements).toHaveBeenCalled();
      });

      it('should handle mixed case keys', () => {
        const event = addSpies(createKeyEvent({ key: 'V', ctrlKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.pasteElements).toHaveBeenCalled();
      });
    });

    describe('metaKey (Mac Command key) support', () => {
      it('should handle Cmd+C for copy on Mac', () => {
        const event = addSpies(createKeyEvent({ key: 'c', metaKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.copyElements).toHaveBeenCalled();
      });

      it('should handle Cmd+V for paste on Mac', () => {
        const event = addSpies(createKeyEvent({ key: 'v', metaKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.pasteElements).toHaveBeenCalled();
      });

      it('should handle Cmd+A for select all on Mac', () => {
        const event = addSpies(createKeyEvent({ key: 'a', metaKey: true }));
        service.handleKeyDown(event);

        expect(mockApiService.selectAll).toHaveBeenCalled();
      });
    });
  });
});
