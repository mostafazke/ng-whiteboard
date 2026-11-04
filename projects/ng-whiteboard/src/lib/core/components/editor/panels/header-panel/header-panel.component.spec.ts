import { ComponentFixture, TestBed } from '@angular/core/testing';
import { buildMainMenu } from '../../utils/editor-actions';
import { HeaderPanelComponent } from './header-panel.component';

describe('HeaderPanelComponent', () => {
  let fixture: ComponentFixture<HeaderPanelComponent>;
  const el = (): HTMLElement => fixture.nativeElement;
  const q = <T extends HTMLElement>(selector: string) => el().querySelector(selector) as T;

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderPanelComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.componentRef.setInput('editorConfig', { title: 'My board' });
    fixture.componentRef.setInput('menuItems', buildMainMenu({ theme: 'light', canCopyImage: true, mac: false }));
    fixture.detectChanges();
  });
  afterEach(() => fixture.nativeElement.remove());

  it('renders the layer panel from the editor layers and forwards its actions in one output', () => {
    fixture.componentRef.setInput('layers', [
      { id: 'l1', name: 'L', visible: true, locked: false, zIndex: 0, elements: ['a', 'b'], opacity: 1 },
    ]);
    fixture.componentRef.setInput('activeLayerId', 'l1');
    fixture.componentRef.setInput('showLayers', true);
    fixture.detectChanges();
    const forwarded = jest.fn();
    fixture.componentInstance.layerAction.subscribe(forwarded);

    expect(q('.lp-count').textContent?.trim()).toBe('2 elements');
    q('.lp-eye').click();

    expect(forwarded).toHaveBeenCalledWith({ type: 'toggle-visible', id: 'l1' });
  });

  it('Escape in compact leaves the layers sheet to handle it', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.componentRef.setInput('showLayers', true);
    fixture.detectChanges();
    const toggled = jest.fn();
    fixture.componentInstance.layersToggle.subscribe(toggled);
    const reachedParent = jest.fn();
    fixture.nativeElement.addEventListener('keydown', reachedParent);

    q('.layers-button').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(toggled).not.toHaveBeenCalled();
    expect(reachedParent).toHaveBeenCalled();
  });

  it('renders exactly a menu button, the title button and a layers button', () => {
    const buttons = Array.from(el().querySelectorAll('button'));
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual(['Menu', 'Rename board', 'Layers']);
    expect(el().textContent).not.toMatch(/\b(New|Save|Export)\b/);
    expect(q('.theme-btn')).toBeNull();
  });

  it('keeps the properties button in compact', () => {
    fixture.componentRef.setInput('compact', true);
    fixture.detectChanges();
    expect(Array.from(el().querySelectorAll('button')).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Menu',
      'Rename board',
      'Layers',
      'Properties',
    ]);
  });

  it('commits a renamed title', () => {
    const renamed = jest.fn();
    fixture.componentInstance.titleChange.subscribe(renamed);
    q('.title-button').click();
    fixture.detectChanges();
    const input = q<HTMLInputElement>('.title-input');
    input.value = 'Renamed';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(renamed).toHaveBeenCalledWith('Renamed');
  });

  describe('menu popover', () => {
    const open = () => {
      q('.menu-btn').click();
      fixture.detectChanges();
    };
    const items = () => Array.from(el().querySelectorAll('[role="menuitem"]')) as HTMLButtonElement[];

    it('opens a role=menu listing the six items', () => {
      open();
      expect(q('.menu-btn').getAttribute('aria-expanded')).toBe('true');
      expect(items().length).toBe(6);
      expect(items()[0].textContent).toContain('Open…');
    });

    it('ArrowDown moves focus between items', () => {
      open();
      items()[0].focus();
      items()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
      expect(document.activeElement).toBe(items()[1]);
    });

    it('choosing an item emits its id and closes the menu', () => {
      const action = jest.fn();
      fixture.componentInstance.menuAction.subscribe(action);
      open();
      items()[1].click();
      fixture.detectChanges();
      expect(action).toHaveBeenCalledWith({ id: 'save', opener: q('.menu-btn') });
      expect(q('[role="menu"]')).toBeNull();
    });

    it('Escape closes the menu and focuses its trigger', () => {
      open();
      items()[2].focus();
      items()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(q('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(q('.menu-btn'));
    });

    it('a pointerdown outside closes it', () => {
      open();
      document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      fixture.detectChanges();
      expect(q('[role="menu"]')).toBeNull();
    });

    it('in compact the button asks the parent for the sheet instead', () => {
      fixture.componentRef.setInput('compact', true);
      fixture.detectChanges();
      const toggled = jest.fn();
      fixture.componentInstance.menuToggle.subscribe(toggled);
      open();
      expect(toggled).toHaveBeenCalledTimes(1);
      expect(q('[role="menu"]')).toBeNull();
    });
  });
});
