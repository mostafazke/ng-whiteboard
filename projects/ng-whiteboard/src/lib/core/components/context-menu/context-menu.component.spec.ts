import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContextMenuComponent } from './context-menu.component';
import { ContextMenuService } from './context-menu.service';
import { ApiService } from '../../api/api.service';
import { SelectionService } from '../../elements/selection.service';
import { ClipboardService } from '../../input/clipboard.service';

describe('ContextMenuComponent', () => {
  let component: ContextMenuComponent;
  let fixture: ComponentFixture<ContextMenuComponent>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let contextMenuService: any;

  const mockApiService = {
    cutElements: jest.fn(),
    copyElements: jest.fn(),
    pasteElements: jest.fn(),
    duplicateElements: jest.fn(),
    deleteSelectedElements: jest.fn(),
    selectAll: jest.fn(),
    clearSelection: jest.fn(),
    undo: jest.fn(),
    redo: jest.fn(),
    bringToFront: jest.fn(),
    bringForward: jest.fn(),
    sendBackward: jest.fn(),
    sendToBack: jest.fn(),
    alignElements: jest.fn(),
    groupElements: jest.fn(),
    ungroupElements: jest.fn(),
    lockElements: jest.fn(),
    unlockElements: jest.fn(),
    clearAll: jest.fn(),
    export: jest.fn(),
  };

  const mockSelectionService = {
    getSelectedElements: jest.fn(),
  };

  const mockClipboardService = {
    getClipboardInfo: jest.fn(),
  };

  beforeEach(async () => {
    const contextMenuServiceSpy = {
      getContextMenuVisible: jest.fn(() => () => false),
      getContextMenuPosition: jest.fn(() => () => ({ x: 0, y: 0 })),
      getContextMenuSections: jest.fn(() => () => []),
      hideContextMenu: jest.fn(),
      executeAction: jest.fn(),
      getContainerBounds: jest.fn(() => () => null),
    };

    await TestBed.configureTestingModule({
      imports: [ContextMenuComponent],
      providers: [
        { provide: ContextMenuService, useValue: contextMenuServiceSpy },
        { provide: ApiService, useValue: mockApiService },
        { provide: SelectionService, useValue: mockSelectionService },
        { provide: ClipboardService, useValue: mockClipboardService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    contextMenuService = TestBed.inject(ContextMenuService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide context menu on escape key', () => {
    // Create a signal that returns true for visibility
    const visibilitySignal = () => true;
    contextMenuService.getContextMenuVisible.mockReturnValue(visibilitySignal);

    // Recreate component with new mock
    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Simulate escape key press
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(contextMenuService.hideContextMenu).toHaveBeenCalled();
  });

  it('should hide context menu when clicking outside', () => {
    // Create a signal that returns true for visibility
    const visibilitySignal = () => true;
    contextMenuService.getContextMenuVisible.mockReturnValue(visibilitySignal);

    // Recreate component with new mock
    fixture = TestBed.createComponent(ContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Create a mock element outside the context menu
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    // Simulate click outside by directly calling the method
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: outsideElement, configurable: true });
    component.onDocumentClick(event);

    expect(contextMenuService.hideContextMenu).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(outsideElement);
  });

  it('should not hide context menu when clicking inside', () => {
    contextMenuService.getContextMenuVisible.mockReturnValue(() => true);
    fixture.detectChanges();

    jest.spyOn(component, 'onDocumentClick');

    // Simulate click inside the context menu
    const contextMenuElement = component.contextMenu.nativeElement;
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: contextMenuElement });
    document.dispatchEvent(event);

    expect(contextMenuService.hideContextMenu).not.toHaveBeenCalled();
  });

  it('should execute action when item is clicked', () => {
    const mockAction = jest.fn();
    const mockItem = {
      id: 'test',
      label: 'Test',
      enabled: true,
      visible: true,
      action: mockAction,
    };

    const mockEvent = new MouseEvent('click');
    component.onItemClick(mockItem, mockEvent);

    expect(contextMenuService.executeAction).toHaveBeenCalledWith(mockAction);
  });

  it('should not execute action when item is disabled', () => {
    const mockAction = jest.fn();
    const mockItem = {
      id: 'test',
      label: 'Test',
      enabled: false,
      visible: true,
      action: mockAction,
    };

    const mockEvent = new MouseEvent('click');
    component.onItemClick(mockItem, mockEvent);

    expect(contextMenuService.executeAction).not.toHaveBeenCalled();
  });

  it('should not execute action when item has submenu', () => {
    const mockAction = jest.fn();
    const mockItem = {
      id: 'test',
      label: 'Test',
      enabled: true,
      visible: true,
      action: mockAction,
      submenu: [
        {
          id: 'sub1',
          label: 'Submenu 1',
          enabled: true,
          visible: true,
          action: jest.fn(),
        },
      ],
    };

    const mockEvent = new MouseEvent('click');
    jest.spyOn(mockEvent, 'stopPropagation');
    component.onItemClick(mockItem, mockEvent);

    expect(contextMenuService.executeAction).not.toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
  });

  describe('ngOnDestroy', () => {
    it('should hide context menu on destroy', () => {
      component.ngOnDestroy();
      expect(contextMenuService.hideContextMenu).toHaveBeenCalled();
    });

    it('should clear submenu timeout on destroy', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      // Create a real timeout
      component['submenuTimeout'] = setTimeout(() => {
        // Timeout callback
      }, 1000);

      component.ngOnDestroy();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeout(component['submenuTimeout'] as ReturnType<typeof setTimeout>);
    });
  });

  describe('submenu handling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      // Clear any pending timers before switching back to real timers
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('should show submenu when hovering item with submenu', () => {
      const mockItem = {
        id: 'test',
        label: 'Test',
        enabled: true,
        visible: true,
        submenu: [
          {
            id: 'sub1',
            label: 'Submenu 1',
            enabled: true,
            visible: true,
            action: jest.fn(),
          },
        ],
      };

      const mockElement = document.createElement('div');
      jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue({
        left: 100,
        right: 200,
        top: 50,
        bottom: 80,
        width: 100,
        height: 30,
        x: 100,
        y: 50,
        toJSON: jest.fn(),
      });

      const mockEvent = { currentTarget: mockElement } as unknown as MouseEvent;
      component.onItemHover(mockItem, mockEvent);

      expect(component.hoveredItem).toBe(mockItem);
    });

    it('should not show submenu when hovering disabled item', () => {
      const mockItem = {
        id: 'test',
        label: 'Test',
        enabled: false,
        visible: true,
        submenu: [
          {
            id: 'sub1',
            label: 'Submenu 1',
            enabled: true,
            visible: true,
            action: jest.fn(),
          },
        ],
      };

      const mockElement = document.createElement('div');
      const mockEvent = { currentTarget: mockElement } as unknown as MouseEvent;
      component.onItemHover(mockItem, mockEvent);

      expect(component.hoveredItem).toBeNull();
    });

    it('should hide submenu on item leave with delay', () => {
      component.hoveredItem = {
        id: 'test',
        label: 'Test',
        enabled: true,
        visible: true,
        submenu: [],
      };

      component.onItemLeave();

      // Should not be null immediately
      expect(component.hoveredItem).not.toBeNull();

      // Fast-forward time
      jest.advanceTimersByTime(100);

      expect(component.hoveredItem).toBeNull();

      // Clear any remaining timers
      jest.clearAllTimers();
    });

    it('should cancel hide timeout when entering submenu', () => {
      component.hoveredItem = {
        id: 'test',
        label: 'Test',
        enabled: true,
        visible: true,
        submenu: [],
      };
      component.onItemLeave();

      // Enter submenu before timeout
      component.onSubmenuEnter();
      jest.advanceTimersByTime(100);

      // Should still have hovered item
      expect(component.hoveredItem).not.toBeNull();
    });

    it('should hide submenu when leaving submenu with delay', () => {
      component.hoveredItem = {
        id: 'test',
        label: 'Test',
        enabled: true,
        visible: true,
        submenu: [],
      };

      component.onSubmenuLeave();

      // Should not be null immediately
      expect(component.hoveredItem).not.toBeNull();

      // Fast-forward time
      jest.advanceTimersByTime(100);

      expect(component.hoveredItem).toBeNull();

      // Clear any remaining timers
      jest.clearAllTimers();
    });

    it('should clear existing timeout when hovering new item', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      component['submenuTimeout'] = setTimeout(() => {
        // Timeout callback
      }, 1000);

      const mockItem = {
        id: 'test',
        label: 'Test',
        enabled: true,
        visible: true,
      };

      const mockElement = document.createElement('div');
      const mockEvent = { currentTarget: mockElement } as unknown as MouseEvent;
      component.onItemHover(mockItem, mockEvent);

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('position adjustment', () => {
    it('should adjust position when menu overflows right edge', () => {
      const containerBounds = {
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      contextMenuService.getContainerBounds.mockReturnValue(() => containerBounds);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      // Mock the context menu element with dimensions
      const mockMenuRect = {
        width: 200,
        height: 300,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      jest.spyOn(component.contextMenu.nativeElement, 'getBoundingClientRect').mockReturnValue(mockMenuRect);

      // Position that would overflow (800 - 10 = 790, but menu is 200 wide)
      const adjusted = component['adjustPosition'](700, 100);

      // Should be adjusted to fit within bounds
      expect(adjusted.x).toBeLessThanOrEqual(800 - 200 - 10);
    });

    it('should adjust position when menu overflows bottom edge', () => {
      const containerBounds = {
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      contextMenuService.getContainerBounds.mockReturnValue(() => containerBounds);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockMenuRect = {
        width: 200,
        height: 300,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      jest.spyOn(component.contextMenu.nativeElement, 'getBoundingClientRect').mockReturnValue(mockMenuRect);

      // Position that would overflow bottom
      const adjusted = component['adjustPosition'](100, 500);

      // Should be adjusted to fit within bounds
      expect(adjusted.y).toBeLessThanOrEqual(600 - 300 - 10);
    });

    it('should return original position when no container bounds', () => {
      contextMenuService.getContainerBounds.mockReturnValue(() => null);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const adjusted = component['adjustPosition'](100, 200);

      expect(adjusted).toEqual({ x: 100, y: 200 });
    });

    it('should ensure menu stays within minimum padding', () => {
      const containerBounds = {
        left: 0,
        top: 0,
        width: 800,
        height: 600,
        right: 800,
        bottom: 600,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      contextMenuService.getContainerBounds.mockReturnValue(() => containerBounds);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockMenuRect = {
        width: 200,
        height: 300,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      jest.spyOn(component.contextMenu.nativeElement, 'getBoundingClientRect').mockReturnValue(mockMenuRect);

      // Position too close to left edge
      const adjusted = component['adjustPosition'](5, 5);

      // Should be adjusted to minimum padding (10px)
      expect(adjusted.x).toBeGreaterThanOrEqual(10);
      expect(adjusted.y).toBeGreaterThanOrEqual(10);
    });
  });

  describe('submenu positioning', () => {
    it('should position submenu to the right by default', () => {
      const containerBounds = {
        left: 0,
        top: 0,
        width: 1000,
        height: 800,
        right: 1000,
        bottom: 800,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      contextMenuService.getContainerBounds.mockReturnValue(() => containerBounds);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockItemRect = {
        left: 100,
        right: 300,
        top: 150,
        bottom: 180,
        width: 200,
        height: 30,
        x: 100,
        y: 150,
        toJSON: jest.fn(),
      };

      const mockElement = document.createElement('div');
      jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue(mockItemRect);

      component['calculateSubmenuPosition'](mockElement);

      // Should position to the right of the item
      expect(component.submenuPosition.left).toBeGreaterThan(300);
    });

    it('should position submenu to the left when overflowing right', () => {
      const containerBounds = {
        left: 0,
        top: 0,
        width: 500,
        height: 800,
        right: 500,
        bottom: 800,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      contextMenuService.getContainerBounds.mockReturnValue(() => containerBounds);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockItemRect = {
        left: 300,
        right: 480,
        top: 150,
        bottom: 180,
        width: 180,
        height: 30,
        x: 300,
        y: 150,
        toJSON: jest.fn(),
      };

      const mockElement = document.createElement('div');
      jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue(mockItemRect);

      component['calculateSubmenuPosition'](mockElement);

      // Should position to the left of the item (less than item's left edge)
      expect(component.submenuPosition.left).toBeLessThan(300);
    });

    it('should adjust vertical position when overflowing bottom', () => {
      const containerBounds = {
        left: 0,
        top: 0,
        width: 1000,
        height: 400,
        right: 1000,
        bottom: 400,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      contextMenuService.getContainerBounds.mockReturnValue(() => containerBounds);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockItemRect = {
        left: 100,
        right: 300,
        top: 350,
        bottom: 380,
        width: 200,
        height: 30,
        x: 100,
        y: 350,
        toJSON: jest.fn(),
      };

      const mockElement = document.createElement('div');
      jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue(mockItemRect);

      component['calculateSubmenuPosition'](mockElement);

      // Should adjust top position to prevent overflow
      expect(component.submenuPosition.top).toBeLessThan(350);
    });

    it('should handle missing container bounds gracefully', () => {
      contextMenuService.getContainerBounds.mockReturnValue(() => null);

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockItemRect = {
        left: 100,
        right: 300,
        top: 150,
        bottom: 180,
        width: 200,
        height: 30,
        x: 100,
        y: 150,
        toJSON: jest.fn(),
      };

      const mockElement = document.createElement('div');
      jest.spyOn(mockElement, 'getBoundingClientRect').mockReturnValue(mockItemRect);

      component['calculateSubmenuPosition'](mockElement);

      // Should use fallback positioning
      expect(component.submenuPosition.left).toBeDefined();
      expect(component.submenuPosition.top).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should create computed position signal with container bounds', () => {
      const containerBounds = {
        left: 50,
        top: 30,
        width: 800,
        height: 600,
        right: 850,
        bottom: 630,
        x: 50,
        y: 30,
        toJSON: jest.fn(),
      };

      contextMenuService.getContainerBounds.mockReturnValue(() => containerBounds);
      contextMenuService.getContextMenuPosition.mockReturnValue(() => ({ x: 200, y: 150 }));

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockMenuRect = {
        width: 200,
        height: 300,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      jest.spyOn(component.contextMenu.nativeElement, 'getBoundingClientRect').mockReturnValue(mockMenuRect);

      component.ngOnInit();

      // Position should be converted from viewport to container-relative
      const position = component.position();
      expect(position.x).toBe(150); // 200 - 50
      expect(position.y).toBe(120); // 150 - 30
    });

    it('should handle position without container bounds', () => {
      contextMenuService.getContainerBounds.mockReturnValue(() => null);
      contextMenuService.getContextMenuPosition.mockReturnValue(() => ({ x: 200, y: 150 }));

      fixture = TestBed.createComponent(ContextMenuComponent);
      component = fixture.componentInstance;

      const mockMenuRect = {
        width: 200,
        height: 300,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: jest.fn(),
      };

      jest.spyOn(component.contextMenu.nativeElement, 'getBoundingClientRect').mockReturnValue(mockMenuRect);

      component.ngOnInit();

      // Position should remain unchanged
      const position = component.position();
      expect(position.x).toBeDefined();
      expect(position.y).toBeDefined();
    });
  });
});
