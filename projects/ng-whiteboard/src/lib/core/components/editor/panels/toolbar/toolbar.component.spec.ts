import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvailableShape } from '../../../../elements/shapes';
import { ToolType } from '../../../../types';
import { ToolbarComponent } from './toolbar.component';

describe('ToolbarComponent', () => {
  let fixture: ComponentFixture<ToolbarComponent>;
  let root: HTMLElement;

  const buttons = (): HTMLButtonElement[] => Array.from(root.querySelectorAll<HTMLButtonElement>('button.tool-btn'));
  const press = (target: HTMLElement, key: string): KeyboardEvent => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event;
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(ToolbarComponent);
    fixture.componentRef.setInput('selectedTool', ToolType.Pen);
    fixture.detectChanges();
    root = fixture.nativeElement;
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('is a labelled toolbar', () => {
    expect(root.querySelector('[role="toolbar"]')?.getAttribute('aria-label')).toBe('Tools');
  });

  it('active tool has aria-pressed=true and others false', () => {
    const pressed = buttons().filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed.map((b) => b.dataset['tool'])).toEqual([ToolType.Pen]);
    expect(buttons().every((b) => b.hasAttribute('aria-pressed'))).toBe(true);
  });

  it('uses roving tabindex with the active tool tabbable', () => {
    expect(
      buttons()
        .filter((b) => b.tabIndex === 0)
        .map((b) => b.dataset['tool'])
    ).toEqual([ToolType.Pen]);
    expect(buttons().filter((b) => b.tabIndex === -1).length).toBe(buttons().length - 1);
  });

  it('makes the first tool the tab stop when the selected tool is not in the toolbar', () => {
    fixture.componentRef.setInput('tools', [ToolType.Select, ToolType.Rectangle]);
    fixture.detectChanges();

    expect(
      buttons()
        .filter((b) => b.tabIndex === 0)
        .map((b) => b.dataset['tool'])
    ).toEqual([ToolType.Select]);
    expect(buttons().some((b) => b.getAttribute('aria-pressed') === 'true')).toBe(false);
  });

  it('ArrowRight moves focus to next tool and stops propagation', () => {
    const all = buttons();
    const pen = all.find((b) => b.dataset['tool'] === ToolType.Pen) as HTMLButtonElement;
    pen.focus();
    const onWindow = jest.fn();
    window.addEventListener('keydown', onWindow);
    const event = press(pen, 'ArrowRight');
    window.removeEventListener('keydown', onWindow);
    expect(document.activeElement).toBe(all[all.indexOf(pen) + 1]);
    expect(event.defaultPrevented).toBe(true);
    expect(onWindow).not.toHaveBeenCalled();
  });

  it('ArrowLeft wraps from first to last', () => {
    const all = buttons();
    all[0].focus();
    press(all[0], 'ArrowLeft');
    expect(document.activeElement).toBe(all[all.length - 1]);
  });

  it('Home focuses first and End focuses last tool', () => {
    const all = buttons();
    all[3].focus();
    press(all[3], 'End');
    expect(document.activeElement).toBe(all[all.length - 1]);
    press(all[all.length - 1], 'Home');
    expect(document.activeElement).toBe(all[0]);
  });

  it('does not stop propagation for unrelated keys', () => {
    const all = buttons();
    all[0].focus();
    const onWindow = jest.fn();
    window.addEventListener('keydown', onWindow);
    press(all[0], 'p');
    window.removeEventListener('keydown', onWindow);
    expect(onWindow).toHaveBeenCalled();
  });

  it('every tool button has an accessible name', () => {
    expect(buttons().every((b) => (b.getAttribute('aria-label') ?? '').length > 0)).toBe(true);
  });

  it('tooltip and aria-keyshortcuts match the keyboard shortcuts, without a native title', () => {
    const pen = buttons().find((b) => b.dataset['tool'] === ToolType.Pen) as HTMLButtonElement;
    expect(pen.dataset['tooltip']).toBe('Pen (P)');
    expect(pen.getAttribute('aria-keyshortcuts')).toBe('P D 3');
    expect(buttons().some((b) => b.hasAttribute('title'))).toBe(false);
  });

  it('numbers tools 1-9 then 0 in display order, skipping the lock and zoom-area buttons', () => {
    const digits = buttons()
      .filter((b) => b.querySelector('.tool-digit'))
      .map((b) => b.querySelector('.tool-digit')?.textContent?.trim());
    expect(digits).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']);
    expect(root.querySelector('[data-tool="zoomArea"] .tool-digit')).toBeNull();
  });

  it('shows the zoom-area tool with the Z shortcut', () => {
    const zoom = root.querySelector<HTMLButtonElement>('[data-tool="zoomArea"]');
    expect(zoom?.dataset['tooltip']).toBe('Zoom to area (Z)');
    expect(zoom?.getAttribute('aria-keyshortcuts')).toBe('Z');
  });

  it('hides tools not listed in tools and renumbers the rest', () => {
    fixture.componentRef.setInput('tools', [ToolType.Select, ToolType.Text]);
    fixture.detectChanges();

    expect(buttons().map((b) => b.dataset['tool'] ?? 'lock')).toEqual(['lock', ToolType.Select, ToolType.Text]);
    expect(root.querySelector('[data-tool="text"] .tool-digit')?.textContent?.trim()).toBe('2');
  });

  it('reflects the tool lock and emits lockToggle on click', () => {
    const lock = root.querySelector<HTMLButtonElement>('.lock-btn') as HTMLButtonElement;
    fixture.componentRef.setInput('locked', true);
    fixture.detectChanges();
    const emitted = jest.fn();
    fixture.componentInstance.lockToggle.subscribe(emitted);

    expect(lock.getAttribute('aria-pressed')).toBe('true');
    expect(lock.getAttribute('aria-keyshortcuts')).toBe('Q');
    lock.click();
    expect(emitted).toHaveBeenCalled();
  });

  it('lays out vertically on the left, but not in compact', () => {
    const bar = () => root.querySelector('[role="toolbar"]') as HTMLElement;
    fixture.componentRef.setInput('position', 'left');
    fixture.detectChanges();
    expect(bar().classList).toContain('vertical');
    expect(bar().getAttribute('aria-orientation')).toBe('vertical');

    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(bar().classList).not.toContain('vertical');
  });

  describe('compact shape flyout', () => {
    const trigger = () => root.querySelector<HTMLButtonElement>('.flyout-trigger') as HTMLButtonElement;
    const items = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.flyout-item'));

    beforeEach(() => {
      fixture.componentRef.setInput('compact', true);
      fixture.detectChanges();
    });

    it('collapses the shapes into one button showing the last used shape', () => {
      expect(root.querySelector('[data-tool="ellipse"]')).toBeNull();
      expect(trigger().dataset['tool']).toBe(ToolType.Rectangle);

      fixture.componentRef.setInput('selectedTool', ToolType.Arrow);
      fixture.detectChanges();
      fixture.componentRef.setInput('selectedTool', ToolType.Pen);
      fixture.detectChanges();

      expect(trigger().dataset['tool']).toBe(ToolType.Arrow);
      expect(trigger().classList).not.toContain('active');
    });

    it('opens the menu, picks a shape and closes', () => {
      const emitted = jest.fn();
      fixture.componentInstance.toolSelect.subscribe(emitted);

      trigger().click();
      fixture.detectChanges();
      expect(trigger().getAttribute('aria-expanded')).toBe('true');
      expect(items().map((b) => b.dataset['tool'])).toEqual([
        ToolType.Rectangle,
        ToolType.Ellipse,
        ToolType.Line,
        ToolType.Arrow,
      ]);
      expect(root.querySelector('.shape-grid')).toBeNull();

      items()[1].click();
      fixture.detectChanges();
      expect(emitted).toHaveBeenCalledWith(ToolType.Ellipse);
      expect(items()).toEqual([]);
    });

    it('closes on Escape and on an outside pointerdown', () => {
      trigger().click();
      fixture.detectChanges();
      const escape = press(items()[0], 'Escape');
      fixture.detectChanges();
      expect(escape.defaultPrevented).toBe(true);
      expect(items()).toEqual([]);
      expect(document.activeElement).toBe(trigger());

      trigger().click();
      fixture.detectChanges();
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(items()).toEqual([]);
    });

    it('closes when focus leaves the menu', () => {
      trigger().click();
      fixture.detectChanges();
      items()[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: items()[1] }));
      fixture.detectChanges();
      expect(items().length).toBe(4);

      items()[0].dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.body }));
      fixture.detectChanges();
      expect(items()).toEqual([]);
    });

    it('closes when the tool changes from elsewhere, e.g. a shortcut', () => {
      trigger().click();
      fixture.detectChanges();
      fixture.componentRef.setInput('selectedTool', ToolType.Text);
      fixture.detectChanges();
      expect(items()).toEqual([]);
    });
  });

  describe('shapes picker', () => {
    const SHAPES: AvailableShape[] = [
      { id: 'star', name: 'Star', path: 'M0 0 L1 0 Z', aspectRatio: 1 },
      { id: 'heart', name: 'Heart', path: 'M0 0 L1 1 Z', aspectRatio: 1 },
      { id: 'cloud', name: 'Cloud', path: 'M0 1 L1 1 Z', aspectRatio: 1 },
      { id: 'hexagon', name: 'Hexagon', path: 'M0 0 L0 1 Z', aspectRatio: 1 },
      { id: 'cross', name: 'Cross', path: 'M1 0 L0 1 Z', aspectRatio: 1 },
      { id: 'moon', name: 'Moon', path: 'M1 0 L1 1 Z', aspectRatio: 1 },
    ];
    const more = () => root.querySelector<HTMLButtonElement>('button[aria-label="More shapes"]') as HTMLButtonElement;
    const gridItems = () => Array.from(root.querySelectorAll<HTMLButtonElement>('.shape-grid button'));
    const iconPath = (button: HTMLElement) => button.querySelector('svg path')?.getAttribute('d');
    const groups = () => Array.from(root.querySelectorAll<HTMLElement>('[role="toolbar"] > .toolbar-group'));

    beforeEach(() => {
      fixture.componentRef.setInput('shapes', SHAPES);
      fixture.componentRef.setInput('activeShapeId', 'heart');
      fixture.detectChanges();
    });

    describe('wide', () => {
      it('puts the more-shapes button alone at the end of the toolbar', () => {
        const last = groups()[groups().length - 1];
        expect(last.querySelectorAll('button').length).toBe(1);
        expect(last.querySelector('button')).toBe(more());
        expect(more().dataset['tool']).toBe(ToolType.Shape);
        expect(more().getAttribute('aria-haspopup')).toBe('menu');
        expect(more().dataset['tooltip']).toBe('More shapes (S)');
        expect(iconPath(more())).not.toBe('M0 0 L1 1 Z');
        expect(
          Array.from(root.querySelectorAll<HTMLButtonElement>('button.tool-btn'))
            .map((b) => b.dataset['tool'])
            .filter((t) => t !== undefined)
            .slice(4, 8)
        ).toEqual([ToolType.Rectangle, ToolType.Ellipse, ToolType.Line, ToolType.Arrow]);
      });

      it('is active only while the Shape tool is selected', () => {
        expect(more().classList).not.toContain('active');
        expect(more().getAttribute('aria-pressed')).toBe('false');

        fixture.componentRef.setInput('selectedTool', ToolType.Shape);
        fixture.detectChanges();
        expect(more().classList).toContain('active');
        expect(more().getAttribute('aria-pressed')).toBe('true');
      });

      it('opens a grid of shapes and focuses the first item', () => {
        more().click();
        fixture.detectChanges();

        expect(more().getAttribute('aria-expanded')).toBe('true');
        expect(root.querySelector('.shape-grid')?.getAttribute('role')).toBe('menu');
        expect(gridItems().map((b) => b.getAttribute('role'))).toEqual(SHAPES.map(() => 'menuitemradio'));
        expect(gridItems().map((b) => b.getAttribute('aria-label'))).toEqual(SHAPES.map((s) => s.name));
        expect(gridItems().map((b) => b.title)).toEqual(SHAPES.map((s) => s.name));
        expect(gridItems().map((b) => b.getAttribute('aria-checked'))).toEqual([
          'false',
          'true',
          'false',
          'false',
          'false',
          'false',
        ]);
        expect(iconPath(gridItems()[2])).toBe('M0 1 L1 1 Z');
        expect(document.activeElement).toBe(gridItems()[0]);
      });

      it('moves focus with the arrow keys, Home and End, and closes on Escape', () => {
        more().click();
        fixture.detectChanges();

        press(gridItems()[0], 'ArrowRight');
        expect(document.activeElement).toBe(gridItems()[1]);
        const down = press(gridItems()[1], 'ArrowDown');
        expect(down.defaultPrevented).toBe(true);
        expect(document.activeElement).toBe(gridItems()[5]);
        press(gridItems()[5], 'ArrowUp');
        expect(document.activeElement).toBe(gridItems()[1]);
        press(gridItems()[1], 'ArrowLeft');
        expect(document.activeElement).toBe(gridItems()[0]);
        press(gridItems()[0], 'ArrowLeft');
        expect(document.activeElement).toBe(gridItems()[5]);
        press(gridItems()[5], 'Home');
        expect(document.activeElement).toBe(gridItems()[0]);
        press(gridItems()[0], 'End');
        expect(document.activeElement).toBe(gridItems()[5]);

        press(gridItems()[5], 'Escape');
        fixture.detectChanges();
        expect(gridItems()).toEqual([]);
        expect(document.activeElement).toBe(more());
      });

      it('highlights the active shape only while the Shape tool is selected', () => {
        const activeItems = () => Array.from(root.querySelectorAll('.shape-item.active'));
        more().click();
        fixture.detectChanges();
        expect(activeItems()).toEqual([]);

        fixture.componentRef.setInput('selectedTool', ToolType.Shape);
        fixture.detectChanges();
        more().click();
        fixture.detectChanges();
        expect(activeItems().map((b) => b.getAttribute('aria-label'))).toEqual(['Heart']);
      });

      it('emits the picked shape and closes', () => {
        const emitted = jest.fn();
        fixture.componentInstance.shapeSelect.subscribe(emitted);
        more().click();
        fixture.detectChanges();

        gridItems()
          .find((b) => b.getAttribute('aria-label') === 'Heart')
          ?.click();
        fixture.detectChanges();

        expect(emitted).toHaveBeenCalledWith('heart');
        expect(gridItems()).toEqual([]);
        expect(document.activeElement).toBe(more());
      });

      it('re-renders the grid when shapes change at runtime', () => {
        fixture.componentRef.setInput('shapes', [
          ...SHAPES,
          { id: 'logo', name: 'Logo', path: 'M0 0 L1 1 L0 1 Z', aspectRatio: 2 },
        ]);
        fixture.detectChanges();
        more().click();
        fixture.detectChanges();

        expect(gridItems().length).toBe(SHAPES.length + 1);
        expect(gridItems()[SHAPES.length].getAttribute('aria-label')).toBe('Logo');
        expect(iconPath(gridItems()[SHAPES.length])).toBe('M0 0 L1 0.5 L0 0.5 Z');
      });

      it('opens the grid beside a left-docked toolbar', () => {
        fixture.componentRef.setInput('position', 'left');
        fixture.detectChanges();
        more().click();
        fixture.detectChanges();
        expect(root.querySelector('.flyout-menu')?.classList).toContain('beside');
      });

      it('hides the more-shapes button when there are no shapes', () => {
        fixture.componentRef.setInput('shapes', []);
        fixture.detectChanges();
        expect(more()).toBeNull();
        expect(root.querySelector('[data-tool="shape"]')).toBeNull();
      });

      it('hides the more-shapes button when the shape tool is not in tools', () => {
        fixture.componentRef.setInput('tools', [ToolType.Pen, ToolType.Rectangle]);
        fixture.detectChanges();
        expect(more()).toBeNull();
      });
    });

    describe('compact', () => {
      const shapeTrigger = () =>
        root.querySelector<HTMLButtonElement>('.flyout-trigger:not([aria-label="More shapes"])') as HTMLButtonElement;
      const menus = () => Array.from(root.querySelectorAll('.flyout-menu'));

      beforeEach(() => {
        fixture.componentRef.setInput('compact', true);
        fixture.detectChanges();
      });

      it('keeps the shape flyout to the four basic tools, with no grid', () => {
        shapeTrigger().click();
        fixture.detectChanges();

        expect(menus().length).toBe(1);
        expect(
          Array.from(menus()[0].querySelectorAll<HTMLButtonElement>('.flyout-tool')).map((b) => b.dataset['tool'])
        ).toEqual([ToolType.Rectangle, ToolType.Ellipse, ToolType.Line, ToolType.Arrow]);
        expect(root.querySelector('.shape-grid')).toBeNull();
      });

      it('shows the more-shapes button at the end and opens the grid from it', () => {
        const last = groups()[groups().length - 1];
        expect(last.querySelector('button')).toBe(more());

        more().click();
        fixture.detectChanges();
        expect(gridItems().length).toBe(SHAPES.length);
        expect(root.querySelector('.flyout-tool')).toBeNull();
      });

      it('shows one menu at a time and returns focus to the button that opened it', () => {
        shapeTrigger().click();
        fixture.detectChanges();
        more().click();
        fixture.detectChanges();
        expect(menus().length).toBe(1);
        expect(root.querySelector('.flyout-tool')).toBeNull();
        expect(gridItems().length).toBe(SHAPES.length);
        expect(shapeTrigger().getAttribute('aria-expanded')).toBe('false');

        press(gridItems()[0], 'Escape');
        fixture.detectChanges();
        expect(document.activeElement).toBe(more());

        shapeTrigger().click();
        fixture.detectChanges();
        press(root.querySelector('.flyout-tool') as HTMLElement, 'Escape');
        fixture.detectChanges();
        expect(menus()).toEqual([]);
        expect(document.activeElement).toBe(shapeTrigger());
      });

      it('hides the more-shapes button when the shape tool is not in tools', () => {
        fixture.componentRef.setInput('tools', [ToolType.Pen, ToolType.Rectangle, ToolType.Ellipse]);
        fixture.detectChanges();
        expect(more()).toBeNull();
      });
    });
  });
});
