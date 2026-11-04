import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuComponent, MenuItem } from './menu.component';

const ITEMS: MenuItem[] = [
  { id: 'open', label: 'Open…', icon: 'folder-open', shortcut: 'Ctrl+O' },
  { id: 'save', label: 'Save to file', icon: 'file-json' },
  { id: 'reset', label: 'Reset canvas…', icon: 'reset', separatorBefore: true },
];

describe('MenuComponent', () => {
  let fixture: ComponentFixture<MenuComponent>;
  const items = () => Array.from(fixture.nativeElement.querySelectorAll('[role="menuitem"]')) as HTMLButtonElement[];
  const press = (target: HTMLElement, key: string) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.componentRef.setInput('items', ITEMS);
    fixture.detectChanges();
  });
  afterEach(() => fixture.nativeElement.remove());

  it('renders a menu with menuitems and shortcut hints', () => {
    expect(fixture.nativeElement.querySelector('[role="menu"]')).not.toBeNull();
    expect(items().map((b) => b.textContent)).toEqual([
      expect.stringContaining('Open…'),
      expect.stringContaining('Save to file'),
      expect.stringContaining('Reset canvas…'),
    ]);
    expect(items()[0].textContent).toContain('Ctrl+O');
  });

  it('ArrowDown/ArrowUp/Home/End move focus, wrapping', () => {
    items()[0].focus();
    press(items()[0], 'ArrowDown');
    expect(document.activeElement).toBe(items()[1]);
    press(items()[1], 'End');
    expect(document.activeElement).toBe(items()[2]);
    press(items()[2], 'ArrowDown');
    expect(document.activeElement).toBe(items()[0]);
    press(items()[0], 'ArrowUp');
    expect(document.activeElement).toBe(items()[2]);
    press(items()[2], 'Home');
    expect(document.activeElement).toBe(items()[0]);
  });

  it('renders a separator before items that ask for one and keeps it out of arrow navigation', () => {
    const children = Array.from(fixture.nativeElement.querySelector('[role="menu"]').children) as HTMLElement[];
    expect(children.map((c) => c.getAttribute('role'))).toEqual(['menuitem', 'menuitem', 'separator', 'menuitem']);
    items()[1].focus();
    press(items()[1], 'ArrowDown');
    expect(document.activeElement).toBe(items()[2]);
  });

  it('emits the id of the chosen item', () => {
    const selected = jest.fn();
    fixture.componentInstance.itemSelected.subscribe(selected);
    items()[1].click();
    expect(selected).toHaveBeenCalledWith('save');
  });

  it('Escape asks to close and is contained', () => {
    const closeRequested = jest.fn();
    fixture.componentInstance.closeRequested.subscribe(closeRequested);
    const reached = jest.fn();
    fixture.nativeElement.addEventListener('keydown', reached);
    items()[0].focus();
    press(items()[0], 'Escape');
    expect(closeRequested).toHaveBeenCalled();
    expect(reached).not.toHaveBeenCalled();
  });

  it('embedded menus leave Escape to their sheet', () => {
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    const closeRequested = jest.fn();
    fixture.componentInstance.closeRequested.subscribe(closeRequested);
    press(items()[0], 'Escape');
    expect(closeRequested).not.toHaveBeenCalled();
  });
});
