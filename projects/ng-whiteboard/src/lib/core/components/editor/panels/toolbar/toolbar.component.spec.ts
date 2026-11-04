import { ComponentFixture, TestBed } from '@angular/core/testing';
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
  });
});
