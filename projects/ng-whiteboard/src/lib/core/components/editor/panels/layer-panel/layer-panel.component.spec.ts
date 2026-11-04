import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayerPanelAction, LayerPanelComponent, WhiteboardLayer } from './layer-panel.component';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `e${i}`);

const layer = (id: string, zIndex: number, extra: Partial<WhiteboardLayer> = {}): WhiteboardLayer => ({
  id,
  name: `Layer ${id}`,
  visible: true,
  locked: false,
  opacity: 1,
  zIndex,
  elements: [],
  blendMode: 'normal',
  ...extra,
});

describe('LayerPanelComponent', () => {
  let fixture: ComponentFixture<LayerPanelComponent>;
  let actions: LayerPanelAction[];

  const el = (): HTMLElement => fixture.nativeElement;
  const q = <T extends HTMLElement>(selector: string) => el().querySelector(selector) as T;
  const qa = <T extends HTMLElement>(selector: string) => Array.from(el().querySelectorAll(selector)) as T[];
  const rows = () => qa('.lp-row');
  const setLayers = (layers: WhiteboardLayer[], active = layers[layers.length - 1]?.id ?? '') => {
    fixture.componentRef.setInput('layers', layers);
    fixture.componentRef.setInput('activeLayerId', active);
    fixture.detectChanges();
  };
  const key = (target: HTMLElement, init: KeyboardEventInit) => {
    const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };
  const openMenu = (index: number) => {
    qa('.lp-more')[index].click();
    fixture.detectChanges();
  };
  const slider0 = () => q<HTMLInputElement>('.lp-slider');
  const twoLayers = () => setLayers([layer('a', 0, { elements: ids(2) }), layer('b', 1)], 'b');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LayerPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(LayerPanelComponent);
    document.body.appendChild(fixture.nativeElement);
    actions = [];
    fixture.componentInstance.action.subscribe((a) => actions.push(a));
  });
  afterEach(() => fixture.nativeElement.remove());

  describe('rows', () => {
    it('lists layers top-first with name and element count', () => {
      setLayers([layer('a', 0, { elements: ids(6) }), layer('b', 1, { elements: ids(1) }), layer('c', 2)]);
      expect(qa('.lp-name').map((n) => n.textContent?.trim())).toEqual(['Layer c', 'Layer b', 'Layer a']);
      expect(qa('.lp-count').map((n) => n.textContent?.trim())).toEqual(['Empty', '1 element', '6 elements']);
    });

    it('has no opacity slider or type label in a row', () => {
      setLayers([layer('a', 0)]);
      expect(q('.lp-row input[type="range"]')).toBeNull();
      expect(q('.layer-type')).toBeNull();
    });

    it('highlights the active row', () => {
      twoLayers();
      expect(rows().map((r) => r.classList.contains('active'))).toEqual([true, false]);
    });

    it('selecting a row emits select', () => {
      twoLayers();
      rows()[1].click();
      expect(actions).toEqual([{ type: 'select', id: 'a' }]);
    });

    it('add emits add', () => {
      twoLayers();
      q('.lp-add').click();
      expect(actions).toEqual([{ type: 'add' }]);
    });

    it('eye and lock emit toggles without selecting the row', () => {
      twoLayers();
      qa('.lp-eye')[0].click();
      qa('.lp-lock')[0].click();
      expect(actions).toEqual([
        { type: 'toggle-visible', id: 'b' },
        { type: 'toggle-lock', id: 'b' },
      ]);
    });

    it('keeps the eye and lock buttons shown for hidden and locked layers', () => {
      setLayers([layer('a', 0, { visible: false, locked: true }), layer('b', 1)]);
      expect(qa('.lp-eye').map((b) => b.classList.contains('is-on'))).toEqual([false, true]);
      expect(qa('.lp-lock').map((b) => b.classList.contains('is-on'))).toEqual([false, true]);
      expect(qa('.lp-eye')[1].getAttribute('aria-pressed')).toBe('true');
    });
  });

  describe('rename', () => {
    const startRename = () => {
      q('.lp-name').dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      fixture.detectChanges();
      return q<HTMLInputElement>('.lp-name-input');
    };

    it('double-click turns the name into a focused input', () => {
      twoLayers();
      const input = startRename();
      expect(input.value).toBe('Layer b');
      expect(document.activeElement).toBe(input);
    });

    it('F2 on a focused row starts renaming', () => {
      twoLayers();
      key(rows()[0], { key: 'F2' });
      expect(q('.lp-name-input')).not.toBeNull();
    });

    it('Enter emits rename with the trimmed name', () => {
      twoLayers();
      const input = startRename();
      input.value = '  Sketch  ';
      key(input, { key: 'Enter' });
      expect(actions).toEqual([{ type: 'rename', id: 'b', name: 'Sketch' }]);
      expect(q('.lp-name-input')).toBeNull();
    });

    it('blur commits, and an Enter followed by blur commits once', () => {
      twoLayers();
      const input = startRename();
      input.value = 'Sketch';
      key(input, { key: 'Enter' });
      input.dispatchEvent(new Event('blur'));
      expect(actions.filter((a) => a.type === 'rename').length).toBe(1);
    });

    it('an empty name emits nothing', () => {
      twoLayers();
      const input = startRename();
      input.value = '   ';
      key(input, { key: 'Enter' });
      expect(actions).toEqual([]);
      expect(q('.lp-name').textContent?.trim()).toBe('Layer b');
    });

    it('Escape restores the name, emits nothing and does not bubble', () => {
      twoLayers();
      const bubbled = jest.fn();
      el().addEventListener('keydown', bubbled);
      const input = startRename();
      input.value = 'Changed';
      key(input, { key: 'Escape' });
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(actions).toEqual([]);
      expect(bubbled).not.toHaveBeenCalled();
      expect(q('.lp-name').textContent?.trim()).toBe('Layer b');
    });
  });

  describe('keyboard and structure', () => {
    it('Enter on a focused row starts rename and Space selects', () => {
      twoLayers();
      key(rows()[1], { key: 'Enter' });
      expect(q('.lp-name-input')).not.toBeNull();
      expect(actions).toEqual([]);
      q<HTMLInputElement>('.lp-name-input').dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
      );
      fixture.detectChanges();
      key(rows()[1], { key: ' ' });
      expect(actions).toEqual([{ type: 'select', id: 'a' }]);
    });

    it('hides the grip when there is a single layer', () => {
      setLayers([layer('a', 0)]);
      expect(q('.lp-grip')).toBeNull();
      twoLayers();
      expect(qa('.lp-grip').length).toBe(2);
    });

    it('the more button is a disclosure, not a menu popup', () => {
      twoLayers();
      expect(q('.lp-more').hasAttribute('aria-haspopup')).toBe(false);
      expect(q('.lp-more').hasAttribute('aria-controls')).toBe(false);
      openMenu(0);
      expect(q('.lp-more').getAttribute('aria-controls')).toBe(q('.lp-options').id);
    });

    it('ends an open opacity edit when destroyed mid-drag', () => {
      twoLayers();
      openMenu(0);
      slider0().value = '30';
      slider0().dispatchEvent(new Event('input'));
      fixture.destroy();
      expect(actions.map((a) => (a.type === 'opacity' ? a.phase : a.type))).toEqual(['start', 'change', 'end']);
    });

    it('after deleting, focus moves to the neighbouring row', () => {
      twoLayers();
      qa('.lp-more')[0].click();
      fixture.detectChanges();
      qa<HTMLButtonElement>('.lp-action')
        .find((b) => b.textContent?.includes('Delete'))!
        .click();
      fixture.detectChanges();
      expect(document.activeElement).toBe(rows()[1]);
    });
  });

  describe('reorder', () => {
    it('Alt+ArrowDown on the top row emits reorder 0 to 1', () => {
      twoLayers();
      key(rows()[0], { key: 'ArrowDown', altKey: true });
      expect(actions).toEqual([{ type: 'reorder', from: 0, to: 1 }]);
    });

    it('Alt+ArrowUp on the top row emits nothing', () => {
      twoLayers();
      key(rows()[0], { key: 'ArrowUp', altKey: true });
      expect(actions).toEqual([]);
    });

    it('dragging the handle of row 0 below row 1 emits the same reorder', () => {
      twoLayers();
      qa('.lp-item').forEach((item, i) => {
        item.getBoundingClientRect = () => ({ top: i * 32, bottom: i * 32 + 32, height: 32 }) as DOMRect;
      });
      const handle = qa('.lp-grip')[0];
      const fire = (type: string, y: number) => {
        handle.dispatchEvent(new MouseEvent(type, { bubbles: true, clientY: y }));
        fixture.detectChanges();
      };
      fire('pointerdown', 16);
      fire('pointermove', 50);
      expect(rows()[0].classList.contains('dragging')).toBe(true);
      fire('pointerup', 50);
      expect(actions).toEqual([{ type: 'reorder', from: 0, to: 1 }]);
    });

    it('a drag that ends on its own row or is cancelled emits nothing', () => {
      twoLayers();
      qa('.lp-item').forEach((item, i) => {
        item.getBoundingClientRect = () => ({ top: i * 32, bottom: i * 32 + 32, height: 32 }) as DOMRect;
      });
      const handle = qa('.lp-grip')[0];
      handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientY: 16 }));
      handle.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 20 }));
      handle.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientY: 16 }));
      handle.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientY: 60 }));
      handle.dispatchEvent(new MouseEvent('pointercancel', { bubbles: true, clientY: 60 }));
      handle.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 60 }));
      expect(actions).toEqual([]);
    });
  });

  describe('layer menu', () => {
    const slider = () => q<HTMLInputElement>('.lp-slider');
    const input = (value: string) => {
      slider().value = value;
      slider().dispatchEvent(new Event('input'));
    };
    const action = (label: string) => qa<HTMLButtonElement>('.lp-action').find((b) => b.textContent?.includes(label))!;

    it('the more button opens options with opacity, blend mode and actions', () => {
      twoLayers();
      openMenu(0);
      expect(q('.lp-more').getAttribute('aria-expanded')).toBe('true');
      expect(slider()).not.toBeNull();
      expect(qa('.lp-blend option').map((o) => o.getAttribute('value'))).toEqual([
        'normal',
        'multiply',
        'screen',
        'overlay',
        'darken',
        'lighten',
      ]);
      expect(qa('.lp-action').map((b) => b.textContent?.trim())).toEqual(['Duplicate', 'Merge down', 'Delete']);
    });

    it('an opacity drag emits start, change and end', () => {
      twoLayers();
      openMenu(0);
      slider().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
      input('70');
      input('40');
      slider().dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
      expect(actions).toEqual([
        { type: 'opacity', id: 'b', opacity: 0.7, phase: 'start' },
        { type: 'opacity', id: 'b', opacity: 0.7, phase: 'change' },
        { type: 'opacity', id: 'b', opacity: 0.4, phase: 'change' },
        { type: 'opacity', id: 'b', opacity: 0.4, phase: 'end' },
      ]);
    });

    it('a keyboard step ends the edit on the change event', () => {
      twoLayers();
      openMenu(0);
      input('55');
      slider().dispatchEvent(new Event('change'));
      const phases = actions.filter((a) => a.type === 'opacity').map((a) => (a as { phase: string }).phase);
      expect(phases).toEqual(['start', 'change', 'end']);
    });

    it('a lost pointerup still ends the edit on pointercancel, blur and close', () => {
      twoLayers();
      openMenu(0);
      input('60');
      slider().dispatchEvent(new MouseEvent('pointercancel', { bubbles: true }));
      input('50');
      slider().dispatchEvent(new Event('blur'));
      input('30');
      key(slider(), { key: 'Escape' });
      const phases = actions.filter((a) => a.type === 'opacity').map((a) => (a as { phase: string }).phase);
      expect(phases.filter((p) => p === 'start').length).toBe(3);
      expect(phases.filter((p) => p === 'end').length).toBe(3);
      expect(phases[phases.length - 1]).toBe('end');
    });

    it('blend mode emits blend', () => {
      twoLayers();
      openMenu(0);
      const select = q<HTMLSelectElement>('.lp-blend');
      select.value = 'multiply';
      select.dispatchEvent(new Event('change'));
      expect(actions).toEqual([{ type: 'blend', id: 'b', blendMode: 'multiply' }]);
    });

    it('duplicate and merge down emit and close the menu', () => {
      twoLayers();
      openMenu(0);
      action('Duplicate').click();
      fixture.detectChanges();
      expect(actions).toEqual([{ type: 'duplicate', id: 'b' }]);
      expect(q('.lp-options')).toBeNull();
      openMenu(0);
      action('Merge down').click();
      expect(actions[1]).toEqual({ type: 'merge-down', id: 'b' });
    });

    it('Merge down is disabled on the bottom row and Delete when only one layer exists', () => {
      twoLayers();
      openMenu(1);
      expect(action('Merge down').disabled).toBe(true);
      setLayers([layer('a', 0)]);
      expect(action('Delete').disabled).toBe(true);
    });

    it('Escape closes the menu and returns focus to the more button', () => {
      twoLayers();
      openMenu(0);
      key(slider(), { key: 'Escape' });
      expect(q('.lp-options')).toBeNull();
      expect(document.activeElement).toBe(qa('.lp-more')[0]);
    });

    it('arrow keys move between the actions', () => {
      twoLayers();
      openMenu(0);
      action('Duplicate').focus();
      key(action('Duplicate'), { key: 'ArrowDown' });
      expect(document.activeElement).toBe(action('Merge down'));
    });
  });

  describe('delete', () => {
    const del = () => {
      qa('.lp-more')[1].click();
      fixture.detectChanges();
      qa<HTMLButtonElement>('.lp-action')
        .find((b) => b.textContent?.includes('Delete'))!
        .click();
      fixture.detectChanges();
    };

    it('an empty layer is deleted at once with delete-elements', () => {
      twoLayers();
      qa('.lp-more')[0].click();
      fixture.detectChanges();
      qa<HTMLButtonElement>('.lp-action')
        .find((b) => b.textContent?.includes('Delete'))!
        .click();
      expect(actions).toEqual([{ type: 'delete', id: 'b', mode: 'delete-elements' }]);
    });

    it('a layer with elements asks first', () => {
      twoLayers();
      del();
      expect(q('.lp-confirm p').textContent?.trim()).toBe('Delete layer and its 2 elements?');
      expect(actions).toEqual([]);
      const labels = qa('.lp-confirm button').map((b) => b.textContent?.trim());
      expect(labels).toEqual(['Cancel', 'Delete', 'Move elements to Layer b and delete']);
    });

    it('uses the singular for one element', () => {
      setLayers([layer('a', 0, { elements: ['x'] }), layer('b', 1)], 'b');
      qa('.lp-more')[1].click();
      fixture.detectChanges();
      qa<HTMLButtonElement>('.lp-action')
        .find((b) => b.textContent?.includes('Delete'))!
        .click();
      fixture.detectChanges();
      expect(q('.lp-confirm p').textContent?.trim()).toBe('Delete layer and its 1 element?');
    });

    it('Delete confirms with delete-elements', () => {
      twoLayers();
      del();
      qa('.lp-confirm button')[1].click();
      expect(actions).toEqual([{ type: 'delete', id: 'a', mode: 'delete-elements' }]);
    });

    it('Move elements confirms with move-elements', () => {
      twoLayers();
      del();
      qa('.lp-confirm button')[2].click();
      expect(actions).toEqual([{ type: 'delete', id: 'a', mode: 'move-elements' }]);
    });

    it('Cancel and Escape close the confirm without emitting', () => {
      twoLayers();
      del();
      qa('.lp-confirm button')[0].click();
      fixture.detectChanges();
      expect(q('.lp-confirm')).toBeNull();
      del();
      key(q('.lp-confirm'), { key: 'Escape' });
      expect(q('.lp-confirm')).toBeNull();
      expect(actions).toEqual([]);
    });
  });

  it('shows a close button only when asked and emits closed', () => {
    twoLayers();
    expect(q('.close-btn')).toBeNull();
    fixture.componentRef.setInput('showClose', true);
    fixture.detectChanges();
    const closed = jest.fn();
    fixture.componentInstance.closed.subscribe(closed);
    q('.close-btn').click();
    expect(closed).toHaveBeenCalled();
  });
});
