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
    fixture.componentRef.setInput('selectedTool', ToolType.ZoomArea);
    fixture.detectChanges();

    expect(buttons().filter((b) => b.tabIndex === 0)).toEqual([buttons()[0]]);
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

  it('numbers tools 1-9 then 0 in display order', () => {
    expect(buttons().map((b) => b.querySelector('.tool-digit')?.textContent?.trim())).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '0',
    ]);
  });
});
