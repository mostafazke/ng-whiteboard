import { TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { ContextMenuDirective, ContextMenuEvent } from './context-menu.directive';

// Mock component for testing
@Component({
  template:
    '<div contextMenuCapture (contextMenuTriggered)="onContextMenu($event)" (contextMenuHidden)="onContextMenuHidden()"></div>',
  standalone: true,
  imports: [ContextMenuDirective],
})
class TestComponent {
  contextMenuEvent?: ContextMenuEvent;
  contextMenuHiddenCount = 0;

  onContextMenu(event: ContextMenuEvent) {
    this.contextMenuEvent = event;
  }

  onContextMenuHidden() {
    this.contextMenuHiddenCount++;
  }
}

describe('ContextMenuDirective', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TestComponent>>;
  let component: TestComponent;
  let directiveElement: HTMLElement;
  let directive: ContextMenuDirective;
  let debugElement: DebugElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent, ContextMenuDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement.children[0];
    directiveElement = debugElement.nativeElement;
    directive = debugElement.injector.get(ContextMenuDirective);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(directive).toBeTruthy();
  });

  describe('Context Menu Event', () => {
    it('should emit contextMenuTriggered event on right click', () => {
      const mouseEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200,
      });

      const preventDefaultSpy = jest.spyOn(mouseEvent, 'preventDefault');
      const stopPropagationSpy = jest.spyOn(mouseEvent, 'stopPropagation');

      directiveElement.dispatchEvent(mouseEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(stopPropagationSpy).toHaveBeenCalled();
      expect(component.contextMenuEvent).toBeDefined();
      expect(component.contextMenuEvent?.x).toBe(100);
      expect(component.contextMenuEvent?.y).toBe(200);
      expect(component.contextMenuEvent?.originalEvent).toBe(mouseEvent);
    });

    it('should emit contextMenuTriggered with correct coordinates', () => {
      const testCases = [
        { x: 0, y: 0 },
        { x: 150, y: 250 },
        { x: 500, y: 600 },
      ];

      testCases.forEach(({ x, y }) => {
        const mouseEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        });

        directiveElement.dispatchEvent(mouseEvent);

        expect(component.contextMenuEvent?.x).toBe(x);
        expect(component.contextMenuEvent?.y).toBe(y);
      });
    });

    it('should prevent default context menu behavior', () => {
      const mouseEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = jest.spyOn(mouseEvent, 'preventDefault');
      directiveElement.dispatchEvent(mouseEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should stop event propagation', () => {
      const mouseEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
      });

      const stopPropagationSpy = jest.spyOn(mouseEvent, 'stopPropagation');
      directiveElement.dispatchEvent(mouseEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Context Menu Hidden Event', () => {
    it('should emit contextMenuHidden on left click', () => {
      const leftClickEvent = new MouseEvent('click', {
        bubbles: true,
        button: 0, // Left click
      });

      directiveElement.dispatchEvent(leftClickEvent);

      expect(component.contextMenuHiddenCount).toBe(1);
    });

    it('should not emit contextMenuHidden on right click', () => {
      const rightClickEvent = new MouseEvent('click', {
        bubbles: true,
        button: 2, // Right click
      });

      directiveElement.dispatchEvent(rightClickEvent);

      expect(component.contextMenuHiddenCount).toBe(0);
    });

    it('should not emit contextMenuHidden on middle click', () => {
      const middleClickEvent = new MouseEvent('click', {
        bubbles: true,
        button: 1, // Middle click
      });

      directiveElement.dispatchEvent(middleClickEvent);

      expect(component.contextMenuHiddenCount).toBe(0);
    });

    it('should emit contextMenuHidden on Escape key press', () => {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      document.dispatchEvent(escapeEvent);

      expect(component.contextMenuHiddenCount).toBe(1);
    });

    it('should not emit contextMenuHidden on other key press', () => {
      const otherKeyEvents = [
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
        new KeyboardEvent('keydown', { key: 'Space', bubbles: true }),
        new KeyboardEvent('keydown', { key: 'a', bubbles: true }),
        new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
      ];

      otherKeyEvents.forEach((event) => {
        document.dispatchEvent(event);
      });

      expect(component.contextMenuHiddenCount).toBe(0);
    });

    it('should emit contextMenuHidden multiple times for multiple left clicks', () => {
      const leftClickEvent = new MouseEvent('click', {
        bubbles: true,
        button: 0,
      });

      directiveElement.dispatchEvent(leftClickEvent);
      directiveElement.dispatchEvent(leftClickEvent);
      directiveElement.dispatchEvent(leftClickEvent);

      expect(component.contextMenuHiddenCount).toBe(3);
    });

    it('should emit contextMenuHidden multiple times for multiple Escape presses', () => {
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      document.dispatchEvent(escapeEvent);
      document.dispatchEvent(escapeEvent);

      expect(component.contextMenuHiddenCount).toBe(2);
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should remove event listeners on destroy', () => {
      const removeEventListenerSpy = jest.spyOn(directiveElement, 'removeEventListener');
      const docRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener');

      directive.ngOnDestroy();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(docRemoveEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should not trigger events after directive is destroyed', () => {
      directive.ngOnDestroy();

      const mouseEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200,
      });

      component.contextMenuEvent = undefined;
      directiveElement.dispatchEvent(mouseEvent);

      expect(component.contextMenuEvent).toBeUndefined();
    });

    it('should not trigger click events after directive is destroyed', () => {
      directive.ngOnDestroy();

      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        button: 0,
      });

      component.contextMenuHiddenCount = 0;
      directiveElement.dispatchEvent(clickEvent);

      expect(component.contextMenuHiddenCount).toBe(0);
    });

    it('should not trigger keydown events after directive is destroyed', () => {
      directive.ngOnDestroy();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      component.contextMenuHiddenCount = 0;
      document.dispatchEvent(escapeEvent);

      expect(component.contextMenuHiddenCount).toBe(0);
    });
  });

  describe('Event Listener Setup', () => {
    it('should setup event listeners on init', () => {
      // Create a new instance to test ngOnInit
      const newFixture = TestBed.createComponent(TestComponent);
      const newDebugElement = newFixture.debugElement.children[0];
      const newDirectiveElement = newDebugElement.nativeElement;

      // Attach spies before init
      const contextMenuSpy = jest.spyOn(newDirectiveElement, 'addEventListener');
      const documentSpy = jest.spyOn(document, 'addEventListener');

      newFixture.detectChanges(); // This triggers ngOnInit

      expect(contextMenuSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
      expect(contextMenuSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(documentSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete context menu workflow', () => {
      // Step 1: Right click to open context menu
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 150,
        clientY: 250,
      });

      directiveElement.dispatchEvent(contextMenuEvent);

      expect(component.contextMenuEvent).toBeDefined();
      expect(component.contextMenuEvent?.x).toBe(150);
      expect(component.contextMenuEvent?.y).toBe(250);

      // Step 2: Press Escape to close context menu
      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      document.dispatchEvent(escapeEvent);

      expect(component.contextMenuHiddenCount).toBe(1);
    });

    it('should handle context menu open and close by left click', () => {
      // Step 1: Right click to open context menu
      const contextMenuEvent = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      });

      directiveElement.dispatchEvent(contextMenuEvent);

      expect(component.contextMenuEvent).toBeDefined();

      // Step 2: Left click to close context menu
      const leftClickEvent = new MouseEvent('click', {
        bubbles: true,
        button: 0,
      });

      directiveElement.dispatchEvent(leftClickEvent);

      expect(component.contextMenuHiddenCount).toBe(1);
    });

    it('should handle multiple context menu openings', () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ];

      positions.forEach(({ x, y }) => {
        const mouseEvent = new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: x,
          clientY: y,
        });

        directiveElement.dispatchEvent(mouseEvent);

        expect(component.contextMenuEvent?.x).toBe(x);
        expect(component.contextMenuEvent?.y).toBe(y);
      });
    });
  });
});
