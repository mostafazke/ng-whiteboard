import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { ApiService } from '../../api/api.service';
import { ElementsService } from '../../elements/elements.service';
import { HistoryService } from '../../history/history.service';
import { SelectionService } from '../../elements/selection.service';
import { IOService } from '../../input/io.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { SvgService } from '../../svg/svg.service';
import { ElementType, WhiteboardElement } from '../../types';
import { BottomSheetComponent } from './ui/bottom-sheet/bottom-sheet.component';
import { ZOOM_ACTIONS } from './utils/editor-actions';
import { WhiteboardEditorComponent } from './whiteboard-editor.component';

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  disconnected = false;
  constructor(private callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }
  observe() {
    /* noop */
  }
  disconnect() {
    this.disconnected = true;
  }
  resize(width: number, height: number) {
    this.callback([{ contentRect: { width, height } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
}

describe('WhiteboardEditorComponent', () => {
  let component: WhiteboardEditorComponent;
  let fixture: ComponentFixture<WhiteboardEditorComponent>;
  let keyDown$: Subject<KeyboardEvent>;
  const ioServiceMock = {
    save: jest.fn().mockResolvedValue(''),
    exportDataAsFile: jest.fn(),
    importDataFromFile: jest.fn().mockResolvedValue(undefined),
    copyToClipboard: jest.fn().mockResolvedValue(undefined),
    renderExport: jest.fn().mockResolvedValue({ dataUrl: 'data:image/png;base64,AAA', width: 1, height: 1 }),
  };

  const altP = (): KeyboardEvent =>
    new KeyboardEvent('keydown', { key: 'p', code: 'KeyP', altKey: true, cancelable: true });

  beforeEach(async () => {
    FakeResizeObserver.instances = [];
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
    Object.values(ioServiceMock).forEach((fn) => fn.mockClear());
    keyDown$ = new Subject<KeyboardEvent>();
    await TestBed.configureTestingModule({
      imports: [WhiteboardEditorComponent],
      providers: [
        { provide: SvgService, useValue: { keyDown$: keyDown$.asObservable() } },
        { provide: IOService, useValue: ioServiceMock },
        ApiService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WhiteboardEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('toggles panel on Alt+P from board keydown', () => {
    const before = component.isPanelOpenSignal();
    keyDown$.next(altP());
    expect(component.isPanelOpenSignal()).toBe(!before);
  });

  it('ignores shortcut from editable target', () => {
    const input = document.createElement('input');
    const event = altP();
    Object.defineProperty(event, 'target', { value: input });
    const before = component.isPanelOpenSignal();
    keyDown$.next(event);
    expect(component.isPanelOpenSignal()).toBe(before);
  });

  it('toggles on Alt+P when the layout yields a different key (macOS)', () => {
    const before = component.isPanelOpenSignal();
    keyDown$.next(new KeyboardEvent('keydown', { key: 'π', code: 'KeyP', altKey: true }));
    expect(component.isPanelOpenSignal()).toBe(!before);
  });

  it('does not toggle on plain P', () => {
    const before = component.isPanelOpenSignal();
    keyDown$.next(new KeyboardEvent('keydown', { key: 'p' }));
    expect(component.isPanelOpenSignal()).toBe(before);
  });

  describe('layer actions', () => {
    const layers = () => TestBed.inject(LayerManagementService);
    const topFirst = () =>
      [...layers().layers()]
        .sort((a, b) => b.zIndex - a.zIndex)
        .map((l) => l.id);
    const opacityOf = (id: string) => layers().layers().find((l) => l.id === id)?.opacity;
    const undoSteps = () => {
      let n = 0;
      while (component.canUndoSignal()) {
        component.undo();
        n++;
      }
      return n;
    };

    beforeEach(() => {
      layers().addLayer('Top');
      TestBed.inject(HistoryService).clearHistory();
    });

    it('select, add, rename, visibility and lock reach the board', () => {
      const [top, bottom] = topFirst();
      component.onLayerAction({ type: 'select', id: bottom });
      expect(layers().activeLayerId()).toBe(bottom);

      component.onLayerAction({ type: 'rename', id: top, name: 'Sketch' });
      expect(layers().layers().find((l) => l.id === top)?.name).toBe('Sketch');

      component.onLayerAction({ type: 'toggle-visible', id: bottom });
      component.onLayerAction({ type: 'toggle-lock', id: bottom });
      const state = layers().layers().find((l) => l.id === bottom);
      expect([state?.visible, state?.locked]).toEqual([false, true]);

      component.onLayerAction({ type: 'add' });
      expect(layers().layers().length).toBe(3);
      expect(layers().layers().some((l) => l.name === 'Layer 3')).toBe(true);
    });

    it('an opacity drag is one undo step', () => {
      const [top] = topFirst();
      component.onLayerAction({ type: 'opacity', id: top, opacity: 0.8, phase: 'start' });
      component.onLayerAction({ type: 'opacity', id: top, opacity: 0.8, phase: 'change' });
      component.onLayerAction({ type: 'opacity', id: top, opacity: 0.5, phase: 'change' });
      component.onLayerAction({ type: 'opacity', id: top, opacity: 0.5, phase: 'end' });
      expect(opacityOf(top)).toBe(0.5);
      expect(undoSteps()).toBe(1);
      expect(opacityOf(top)).toBe(1);
    });

    it('closing the layers popover mid-edit ends the opacity batch', () => {
      const [top] = topFirst();
      component.showLayersDropdownSignal.set(true);
      fixture.detectChanges();
      component.onLayerAction({ type: 'opacity', id: top, opacity: 0.8, phase: 'start' });
      component.onLayerAction({ type: 'opacity', id: top, opacity: 0.8, phase: 'change' });
      component.showLayersDropdownSignal.set(false);
      fixture.detectChanges();
      component.onLayerAction({ type: 'opacity', id: top, opacity: 0.3, phase: 'change' });
      expect(undoSteps()).toBe(2);
    });

    it('blend, duplicate and merge-down reach the board', () => {
      const [top, bottom] = topFirst();
      component.onLayerAction({ type: 'blend', id: top, blendMode: 'multiply' });
      expect(layers().layers().find((l) => l.id === top)?.blendMode).toBe('multiply');
      component.onLayerAction({ type: 'duplicate', id: top });
      expect(layers().layers().length).toBe(3);
      component.onLayerAction({ type: 'merge-down', id: top });
      expect(layers().layers().some((l) => l.id === bottom)).toBe(true);
    });

    it('reorder uses top-first indices', () => {
      const [top, bottom] = topFirst();
      component.onLayerAction({ type: 'reorder', from: 0, to: 1 });
      expect(topFirst()).toEqual([bottom, top]);
    });

    it('delete passes its mode', () => {
      const removeLayer = jest.spyOn(component.editorStateService, 'removeLayer');
      const [top] = topFirst();
      component.onLayerAction({ type: 'delete', id: top, mode: 'move-elements' });
      expect(removeLayer).toHaveBeenCalledWith(top, 'move-elements');
    });

    it('the header panel forwards its panel actions through one layerAction output', () => {
      const [top] = topFirst();
      component.showLayersDropdownSignal.set(true);
      fixture.detectChanges();
      document.body.appendChild(fixture.nativeElement);
      (fixture.nativeElement.querySelector('.layers-dropdown .lp-eye') as HTMLButtonElement).click();
      fixture.detectChanges();
      fixture.nativeElement.remove();
      expect(layers().layers().find((l) => l.id === top)?.visible).toBe(false);
    });
  });

  it('toolbar has no more-tools button', () => {
    expect(fixture.nativeElement.querySelector('.more-tools')).toBeNull();
  });

  describe('accessibility', () => {
    const resize = (width: number, height: number) => {
      FakeResizeObserver.instances.forEach((o) => o.resize(width, height));
      fixture.detectChanges();
    };
    const unnamed = (): string[] =>
      Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .filter((b) => !(b.getAttribute('aria-label') ?? '').trim() && !(b.textContent ?? '').trim())
        .map((b) => b.className || b.outerHTML);
    const rect = (id: string, x: number, zIndex: number) =>
      ({
        id,
        type: ElementType.Rectangle,
        x,
        y: 0,
        width: 10,
        height: 10,
        rx: 0,
        rotation: 0,
        opacity: 100,
        zIndex,
        selectAfterDraw: false,
        style: {},
      }) as WhiteboardElement;
    const selectThree = () => {
      TestBed.inject(ElementsService).setElements([rect('r1', 0, 1), rect('r2', 20, 2), rect('r3', 40, 3)]);
      TestBed.inject(SelectionService).selectElements(['r1', 'r2', 'r3']);
      fixture.detectChanges();
    };
    const escape = (target: HTMLElement) =>
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

    beforeEach(() => document.body.appendChild(fixture.nativeElement));
    afterEach(() => fixture.nativeElement.remove());
    afterAll(() => {
      delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    });

    it('every editor button has an accessible name (wide, popovers open)', () => {
      resize(1440, 900);
      selectThree();
      component.showZoomPopupSignal.set(true);
      component.showLayersDropdownSignal.set(true);
      fixture.detectChanges();
      expect(unnamed()).toEqual([]);
    });

    it('every editor button has an accessible name (compact, sheets open)', () => {
      resize(390, 844);
      selectThree();
      component.propertiesSheetOpenSignal.set(true);
      component.menuSheetOpenSignal.set(true);
      component.showLayersDropdownSignal.set(true);
      component.showZoomPopupSignal.set(true);
      fixture.detectChanges();
      expect(unnamed()).toEqual([]);
    });

    it('Escape closes zoom menu and focuses its trigger', () => {
      resize(1440, 900);
      const trigger = fixture.nativeElement.querySelector('.zoom-value') as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      const action = fixture.nativeElement.querySelector('.zoom-action') as HTMLButtonElement;
      action.focus();
      escape(action);
      fixture.detectChanges();
      expect(component.showZoomPopupSignal()).toBe(false);
      expect(fixture.nativeElement.querySelector('.zoom-dropdown')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('Escape closes layers popover and focuses its trigger', () => {
      resize(1440, 900);
      const trigger = fixture.nativeElement.querySelector('.layers-button') as HTMLButtonElement;
      trigger.click();
      fixture.detectChanges();
      const close = fixture.nativeElement.querySelector('.layers-dropdown .close-btn') as HTMLButtonElement;
      close.focus();
      escape(close);
      fixture.detectChanges();
      expect(component.showLayersDropdownSignal()).toBe(false);
      expect(document.activeElement).toBe(trigger);
    });
  });

  describe('continuous property edits', () => {
    const rectEl = (id: string, extra: Partial<WhiteboardElement> = {}) =>
      ({
        id,
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        rx: 0,
        rotation: 0,
        opacity: 100,
        zIndex: 1,
        selectAfterDraw: false,
        style: { strokeWidth: 2, strokeColor: '#000000' },
        ...extra,
      }) as WhiteboardElement;
    const panel = (): HTMLElement => fixture.nativeElement.querySelector('ng-properties-panel');
    const select = () => {
      FakeResizeObserver.instances.forEach((o) => o.resize(1440, 900));
      TestBed.inject(ElementsService).setElements([rectEl('r1')]);
      TestBed.inject(SelectionService).selectElements(['r1']);
      TestBed.inject(HistoryService).clearHistory();
      fixture.detectChanges();
    };
    const drag = (input: HTMLInputElement, values: string[]) => {
      input.dispatchEvent(new Event('focus'));
      for (const value of values) {
        input.value = value;
        input.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      }
      input.dispatchEvent(new Event('change'));
    };
    const r1 = () => TestBed.inject(ElementsService).getElements()[0];

    it('an opacity slider drag is one undo step', () => {
      select();
      drag(panel().querySelector('input[aria-label="Opacity"]') as HTMLInputElement, ['90', '80', '70', '60', '50']);

      const history = TestBed.inject(HistoryService);
      expect(r1().opacity).toBe(50);
      const before = history.undo() as WhiteboardElement[];
      expect(before[0].opacity).toBe(100);
      expect(history.undo()).toBeNull();
    });

    it('a stroke width slider drag is one undo step', () => {
      select();
      drag(panel().querySelector('input[aria-label="Stroke width"]') as HTMLInputElement, ['3', '4', '5', '6', '7']);

      const history = TestBed.inject(HistoryService);
      expect(r1().style.strokeWidth).toBe(7);
      expect((history.undo() as WhiteboardElement[])[0].style.strokeWidth).toBe(2);
      expect(history.undo()).toBeNull();
    });

    it('dragging in the native color input is one undo step', () => {
      select();
      const color = panel().querySelectorAll('input[type="color"]');
      drag(color[color.length - 1] as HTMLInputElement, ['#111111', '#222222', '#333333', '#444444', '#555555']);

      const history = TestBed.inject(HistoryService);
      expect(r1().style.strokeColor).toBe('#555555');
      expect((history.undo() as WhiteboardElement[])[0].style.strokeColor).toBe('#000000');
      expect(history.undo()).toBeNull();
    });

    it('a later discrete edit is its own undo step', () => {
      select();
      drag(panel().querySelector('input[aria-label="Opacity"]') as HTMLInputElement, ['90', '80']);
      component.onPropertyChange({ property: 'strokeWidth', value: 9 });

      const history = TestBed.inject(HistoryService);
      expect((history.undo() as WhiteboardElement[])[0].style.strokeWidth).toBe(2);
      expect((history.undo() as WhiteboardElement[])[0].opacity).toBe(100);
    });

    describe('an edit that ends without change or blur', () => {
      const slide = (input: HTMLInputElement, values: string[]) => {
        for (const value of values) {
          input.value = value;
          input.dispatchEvent(new Event('input'));
          fixture.detectChanges();
        }
      };
      const opacity = () => panel().querySelector('input[aria-label="Opacity"]') as HTMLInputElement;
      const ids = () =>
        TestBed.inject(ElementsService)
          .getElements()
          .map((e) => e.id);
      const drawStroke = () => TestBed.inject(ElementsService).addElements([rectEl('stroke')]);

      afterEach(() => jest.useRealTimers());

      it('stroke drawn after slider input without change gets its own undo entry', () => {
        select();
        slide(opacity(), ['90', '80']);
        window.dispatchEvent(new Event('pointerup'));
        drawStroke();

        const api = TestBed.inject(ApiService);
        expect(api.undo()).toBe(true);
        expect(ids()).toEqual(['r1']);
        expect(r1().opacity).toBe(80);
        expect(api.undo()).toBe(true);
        expect(r1().opacity).toBe(100);
        expect(api.redo()).toBe(true);
        expect(api.redo()).toBe(true);
        expect(ids()).toEqual(['r1', 'stroke']);
      });

      it('pointercancel closes the batch too', () => {
        select();
        slide(opacity(), ['90']);
        window.dispatchEvent(new Event('pointercancel'));
        drawStroke();

        TestBed.inject(ApiService).undo();
        expect(ids()).toEqual(['r1']);
        expect(r1().opacity).toBe(90);
      });

      it('editor undo closes an open edit batch first', () => {
        select();
        slide(opacity(), ['90', '80']);
        component.undo();

        expect(r1().opacity).toBe(100);
        expect(TestBed.inject(HistoryService).undo()).toBeNull();
        component.redo();
        expect(r1().opacity).toBe(80);
      });

      it('delete closes an open edit batch first', () => {
        select();
        slide(opacity(), ['90']);
        component.deleteElement();

        const api = TestBed.inject(ApiService);
        api.undo();
        expect(ids()).toEqual(['r1']);
        expect(r1().opacity).toBe(90);
        api.undo();
        expect(r1().opacity).toBe(100);
      });

      it('color input batch closes after debounce', () => {
        jest.useFakeTimers();
        select();
        const colors = panel().querySelectorAll('input[type="color"]');
        slide(colors[colors.length - 1] as HTMLInputElement, ['#111111', '#222222']);
        jest.advanceTimersByTime(399);
        expect(TestBed.inject(HistoryService).getCanUndoSignal()()).toBe(false);
        jest.advanceTimersByTime(1);
        drawStroke();

        const api = TestBed.inject(ApiService);
        api.undo();
        expect(ids()).toEqual(['r1']);
        expect(r1().style.strokeColor).toBe('#222222');
      });

      it('endEdit is idempotent', () => {
        select();
        const state = component.editorStateService;
        state.beginEdit();
        state.updateOpacity(50);
        state.endEdit();
        state.endEdit();
        drawStroke();

        const history = TestBed.inject(HistoryService);
        expect((history.undo() as WhiteboardElement[]).map((e) => e.id)).toEqual(['r1']);
        expect((history.undo() as WhiteboardElement[])[0].opacity).toBe(100);
        expect(history.undo()).toBeNull();
      });

      it('endEdit never closes a batch it did not open', () => {
        select();
        const history = TestBed.inject(HistoryService);
        const state = component.editorStateService;
        const elements = TestBed.inject(ElementsService);
        state.beginEdit();
        history.startBatch('Cancelled elsewhere', elements.getElements()).clear();
        const move = history.startBatch('Move element', elements.getElements());
        state.endEdit();
        elements.updateElements([{ id: 'r1', x: 5 } as Partial<WhiteboardElement> & { id: string }]);
        expect(history.getCanUndoSignal()()).toBe(false);

        history.completeBatch(elements.getElements());
        move.execute();
        expect((history.undo() as WhiteboardElement[])[0].x).toBe(0);
      });

      it('a pending color edit closes when its picker is destroyed', () => {
        jest.useFakeTimers();
        select();
        const fill = panel().querySelectorAll('input[type="color"]')[0] as HTMLInputElement;
        slide(fill, ['#111111']);
        TestBed.inject(SelectionService).clearSelection();
        fixture.detectChanges();
        drawStroke();

        const api = TestBed.inject(ApiService);
        api.undo();
        expect(ids()).toEqual(['r1']);
        expect(r1().style.fill).toBe('#111111');
      });

      it('keys and pointerdown on the slider that owns the batch keep it open; elsewhere they close it', () => {
        select();
        const history = TestBed.inject(HistoryService);
        const key = (target: EventTarget, init: KeyboardEventInit) =>
          target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }));
        slide(opacity(), ['90']);
        key(opacity(), { key: 'ArrowLeft' });
        opacity().dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
        slide(opacity(), ['80']);
        expect(history.getCanUndoSignal()()).toBe(false);

        key(document.body, { key: 'r' });
        expect(history.getCanUndoSignal()()).toBe(true);
        expect((history.undo() as WhiteboardElement[])[0].opacity).toBe(100);
        expect(history.undo()).toBeNull();
      });

      it('a modified key on the owning slider still closes the batch', () => {
        select();
        slide(opacity(), ['90']);
        opacity().dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
        expect(TestBed.inject(HistoryService).getCanUndoSignal()()).toBe(true);
      });

      it('a pointerdown elsewhere closes the batch', () => {
        select();
        slide(opacity(), ['90']);
        document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
        expect(TestBed.inject(HistoryService).getCanUndoSignal()()).toBe(true);
      });

      describe('window listeners', () => {
        const types = ['pointerdown', 'pointerup', 'pointercancel', 'keydown'];
        const ours = (spy: jest.SpyInstance) => spy.mock.calls.filter(([type]) => types.includes(type as string));

        it('are all removed on endEdit and on destroy', () => {
          const add = jest.spyOn(window, 'addEventListener');
          const remove = jest.spyOn(window, 'removeEventListener');
          const state = component.editorStateService;

          state.beginEdit();
          state.beginEdit();
          expect(ours(add).length).toBe(types.length);
          state.endEdit();
          expect(ours(remove)).toEqual(ours(add));

          add.mockClear();
          remove.mockClear();
          state.beginEdit();
          fixture.destroy();
          expect(ours(remove)).toEqual(ours(add));
          expect(ours(add).length).toBe(types.length);
          add.mockRestore();
          remove.mockRestore();
        });
      });
    });
  });

  describe('main menu, dialogs and file shortcuts', () => {
    const q = <T extends HTMLElement>(selector: string) => fixture.nativeElement.querySelector(selector) as T;
    const all = (selector: string) => Array.from(fixture.nativeElement.querySelectorAll(selector)) as HTMLElement[];
    const items = () => all('ng-header-panel [role="menuitem"]') as HTMLButtonElement[];
    const hasContent = () => component.editorStateService.hasContent();
    const box = (): WhiteboardElement =>
      ({
        id: 'r1',
        type: ElementType.Rectangle,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        rx: 0,
        rotation: 0,
        opacity: 100,
        zIndex: 1,
        selectAfterDraw: false,
        style: {},
      }) as WhiteboardElement;
    const mount = (copySupported: boolean) => {
      fixture.destroy();
      if (copySupported) {
        Object.defineProperty(navigator, 'clipboard', { value: { write: jest.fn() }, configurable: true });
        (globalThis as unknown as { ClipboardItem: unknown }).ClipboardItem = class {};
      }
      fixture = TestBed.createComponent(WhiteboardEditorComponent);
      component = fixture.componentInstance;
      document.body.appendChild(fixture.nativeElement);
      fixture.detectChanges();
      FakeResizeObserver.instances[FakeResizeObserver.instances.length - 1]?.resize(1440, 900);
      fixture.detectChanges();
    };
    const choose = (label: string) => {
      q<HTMLButtonElement>('ng-header-panel .menu-btn').click();
      fixture.detectChanges();
      const item = items().find((b) => (b.textContent ?? '').includes(label));
      if (!item) throw new Error(`no menu item ${label}`);
      item.click();
      fixture.detectChanges();
    };
    const confirmDialog = () => q('ng-confirm-dialog .dlg');
    const press = (target: EventTarget, init: KeyboardEventInit) => {
      const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      return event;
    };

    afterEach(() => {
      fixture.nativeElement.remove();
      delete (navigator as unknown as { clipboard?: unknown }).clipboard;
      delete (globalThis as unknown as { ClipboardItem?: unknown }).ClipboardItem;
    });
    afterAll(() => {
      delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    });

    it('lists the six items in order when image copy is supported', () => {
      mount(true);
      q<HTMLButtonElement>('ng-header-panel .menu-btn').click();
      fixture.detectChanges();
      expect(items().map((b) => (b.textContent ?? '').trim())).toEqual([
        expect.stringContaining('Open…'),
        expect.stringContaining('Save to file'),
        expect.stringContaining('Export image…'),
        expect.stringContaining('Copy as PNG'),
        expect.stringContaining('Dark mode'),
        expect.stringContaining('Reset canvas…'),
      ]);
    });

    it('omits Copy as PNG when the browser cannot copy images', () => {
      mount(false);
      q<HTMLButtonElement>('ng-header-panel .menu-btn').click();
      fixture.detectChanges();
      expect(items().some((b) => (b.textContent ?? '').includes('Copy as PNG'))).toBe(false);
      expect(items().length).toBe(5);
    });

    it('Reset canvas confirms, then clears the board and restores the initial title', () => {
      mount(false);
      TestBed.inject(ElementsService).setElements([box()]);
      component.editorStateService.updateTitle('Changed');

      choose('Reset canvas…');
      expect(confirmDialog().textContent).toContain('Reset the canvas? This clears the board.');
      expect(hasContent()).toBe(true);

      q<HTMLButtonElement>('.confirm-btn').click();
      fixture.detectChanges();
      expect(hasContent()).toBe(false);
      expect(component.editorConfigSignal().title).toBe('Whiteboard');
      expect(confirmDialog()).toBeNull();
    });

    it('cancelling the reset confirm changes nothing', () => {
      mount(false);
      TestBed.inject(ElementsService).setElements([box()]);
      choose('Reset canvas…');
      q<HTMLButtonElement>('.cancel-btn').click();
      fixture.detectChanges();
      expect(hasContent()).toBe(true);
      expect(confirmDialog()).toBeNull();
    });

    it('Open on an empty board goes straight to the file picker', () => {
      mount(false);
      const click = jest.spyOn(q<HTMLInputElement>('input[type="file"]'), 'click').mockImplementation();
      choose('Open…');
      expect(confirmDialog()).toBeNull();
      expect(click).toHaveBeenCalledTimes(1);
    });

    it('Open on a non-empty board confirms the replacement before picking a file', () => {
      mount(false);
      TestBed.inject(ElementsService).setElements([box()]);
      const input = q<HTMLInputElement>('input[type="file"]');
      const click = jest.spyOn(input, 'click').mockImplementation();
      choose('Open…');
      expect(confirmDialog().textContent).toContain('Replace the current board?');
      expect(click).not.toHaveBeenCalled();

      q<HTMLButtonElement>('.confirm-btn').click();
      expect(click).toHaveBeenCalledTimes(1);

      const file = new File(['{}'], 'board.json', { type: 'application/json' });
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      input.dispatchEvent(new Event('change'));
      expect(ioServiceMock.importDataFromFile).toHaveBeenCalledWith(file);
    });

    it('the hidden file input accepts JSON', () => {
      mount(false);
      expect(q('input[type="file"]').getAttribute('accept')).toBe('.json,application/json');
    });

    it('Save to file downloads the board under its title', () => {
      mount(false);
      component.editorStateService.updateTitle('Sprint');
      choose('Save to file');
      expect(ioServiceMock.exportDataAsFile).toHaveBeenCalledWith('Sprint');
    });

    it('Export image opens the export dialog', () => {
      mount(false);
      choose('Export image…');
      expect(component.exportDialogOpen()).toBe(true);
      expect(q('ng-dialog [role="dialog"] h2').textContent).toContain('Export image');
    });

    it('the export dialog previews the render and downloads the board under its title', async () => {
      mount(false);
      component.editorStateService.updateTitle('Sprint');
      choose('Export image…');
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
      expect(q<HTMLImageElement>('wb-export-dialog img').src).toBe('data:image/png;base64,AAA');
      q<HTMLButtonElement>('.wb-export-download').click();
      expect(ioServiceMock.save).toHaveBeenCalledWith('png', 'Sprint', {
        scale: 2,
        background: true,
        padding: 16,
        onlySelected: false,
      });
    });

    it('Escape closes the export dialog and returns focus to the menu trigger', () => {
      mount(false);
      const trigger = q<HTMLButtonElement>('ng-header-panel .menu-btn');
      choose('Export image…');
      press(q('ng-dialog [role="dialog"]'), { key: 'Escape' });
      fixture.detectChanges();
      expect(component.exportDialogOpen()).toBe(false);
      expect(q('wb-export-dialog')).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });

    it('a scale chosen in the export dialog is remembered when it reopens', () => {
      mount(false);
      choose('Export image…');
      Array.from(document.querySelectorAll<HTMLElement>('[aria-label="Scale"] [role="radio"]'))
        .find((b) => b.textContent?.trim() === '3×')
        ?.click();
      component.exportDialogOpen.set(false);
      fixture.detectChanges();
      component.exportDialogOpen.set(true);
      fixture.detectChanges();
      expect(q('[aria-label="Scale"] [role="radio"][aria-checked="true"]').textContent?.trim()).toBe('3×');
    });

    it('Copy as PNG copies with the export settings', () => {
      mount(true);
      choose('Copy as PNG');
      expect(ioServiceMock.copyToClipboard).toHaveBeenCalledWith('png', {
        scale: 2,
        background: true,
        padding: 16,
        onlySelected: false,
      });
    });

    it('Dark mode toggles the theme and the label follows', () => {
      mount(false);
      choose('Dark mode');
      expect(component.themeSignal()).toBe('dark');
      q<HTMLButtonElement>('ng-header-panel .menu-btn').click();
      fixture.detectChanges();
      expect(items().some((b) => (b.textContent ?? '').includes('Light mode'))).toBe(true);
    });

    it('Escape closes the menu and focuses its trigger', () => {
      mount(false);
      const trigger = q<HTMLButtonElement>('ng-header-panel .menu-btn');
      trigger.click();
      fixture.detectChanges();
      press(items()[0], { key: 'Escape' });
      fixture.detectChanges();
      expect(items().length).toBe(0);
      expect(document.activeElement).toBe(trigger);
    });

    it('the reset confirm returns focus to the menu button on cancel', () => {
      mount(false);
      TestBed.inject(ElementsService).setElements([box()]);
      choose('Reset canvas…');
      press(q('.cancel-btn'), { key: 'Escape' });
      fixture.detectChanges();
      expect(document.activeElement).toBe(q('ng-header-panel .menu-btn'));
    });

    it('separates Copy as PNG, the theme toggle and Reset in the popover and in the compact sheet', () => {
      mount(true);
      const shape = (root: string) =>
        Array.from(fixture.nativeElement.querySelector(`${root} [role="menu"]`).children as HTMLCollection).map(
          (c) => c.getAttribute('role') + ':' + (c.textContent ?? '').trim().slice(0, 9)
        );
      const expected = [
        'menuitem:Open…',
        'menuitem:Save to f',
        'menuitem:Export im',
        'menuitem:Copy as P',
        'separator:',
        'menuitem:Dark mode',
        'separator:',
        'menuitem:Reset can',
      ];
      q<HTMLButtonElement>('ng-header-panel .menu-btn').click();
      fixture.detectChanges();
      expect(shape('ng-header-panel').map((e) => e.split(':')[0])).toEqual(expected.map((e) => e.split(':')[0]));

      FakeResizeObserver.instances[FakeResizeObserver.instances.length - 1].resize(390, 844);
      fixture.detectChanges();
      component.menuSheetOpenSignal.set(true);
      fixture.detectChanges();
      expect(shape('ng-bottom-sheet').map((e) => e.split(':')[0])).toEqual(expected.map((e) => e.split(':')[0]));
    });

    it('Dark mode closes the compact menu sheet as well', () => {
      mount(false);
      FakeResizeObserver.instances[FakeResizeObserver.instances.length - 1].resize(390, 844);
      fixture.detectChanges();
      component.menuSheetOpenSignal.set(true);
      fixture.detectChanges();
      component.runMenuAction('theme');
      expect(component.menuSheetOpenSignal()).toBe(false);
    });

    describe('shortcuts', () => {
      it('are ignored while the reset confirm is open', () => {
        mount(false);
        TestBed.inject(ElementsService).setElements([box()]);
        choose('Reset canvas…');
        press(q('.cancel-btn'), { key: 's', code: 'KeyS', ctrlKey: true });
        press(q('.cancel-btn'), { key: 'E', code: 'KeyE', ctrlKey: true, shiftKey: true });
        expect(ioServiceMock.exportDataAsFile).not.toHaveBeenCalled();
        expect(component.exportDialogOpen()).toBe(false);
      });

      it('are ignored while the export dialog is open', () => {
        mount(false);
        choose('Export image…');
        press(q('.dlg-close'), { key: 's', code: 'KeyS', ctrlKey: true });
        expect(ioServiceMock.exportDataAsFile).not.toHaveBeenCalled();
      });

      const toolbarButton = () => q<HTMLButtonElement>('ng-toolbar button');

      it('Ctrl+S saves once even when the board also reports the event, and prevents default', () => {
        mount(false);
        const event = press(toolbarButton(), { key: 's', code: 'KeyS', ctrlKey: true });
        keyDown$.next(event);
        expect(ioServiceMock.exportDataAsFile).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
      });

      it('Meta works in place of Ctrl', () => {
        mount(false);
        press(toolbarButton(), { key: 's', code: 'KeyS', metaKey: true });
        expect(ioServiceMock.exportDataAsFile).toHaveBeenCalledTimes(1);
      });

      it('Ctrl+S from the board is handled', () => {
        mount(false);
        keyDown$.next(new KeyboardEvent('keydown', { key: 's', code: 'KeyS', ctrlKey: true, cancelable: true }));
        expect(ioServiceMock.exportDataAsFile).toHaveBeenCalledTimes(1);
      });

      it('Ctrl+O opens the file picker', () => {
        mount(false);
        const click = jest.spyOn(q<HTMLInputElement>('input[type="file"]'), 'click').mockImplementation();
        const event = press(toolbarButton(), { key: 'o', code: 'KeyO', ctrlKey: true });
        expect(click).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
      });

      it('Ctrl+Shift+E opens the export dialog', () => {
        mount(false);
        const event = press(toolbarButton(), { key: 'E', code: 'KeyE', ctrlKey: true, shiftKey: true });
        expect(component.exportDialogOpen()).toBe(true);
        expect(event.defaultPrevented).toBe(true);
      });

      it('Ctrl+Shift+C copies as PNG', () => {
        mount(true);
        const event = press(toolbarButton(), { key: 'C', code: 'KeyC', ctrlKey: true, shiftKey: true });
        expect(ioServiceMock.copyToClipboard).toHaveBeenCalledTimes(1);
        expect(event.defaultPrevented).toBe(true);
      });

      it('does nothing while typing in an input', () => {
        mount(false);
        q<HTMLButtonElement>('ng-header-panel .title-button').click();
        fixture.detectChanges();
        const event = press(q('ng-header-panel .title-input'), { key: 's', code: 'KeyS', ctrlKey: true });
        expect(ioServiceMock.exportDataAsFile).not.toHaveBeenCalled();
        expect(event.defaultPrevented).toBe(false);
      });
    });
  });

  describe('layout', () => {
    const resize = (width: number, height: number) => {
      FakeResizeObserver.instances.forEach((o) => o.resize(width, height));
      fixture.detectChanges();
    };
    const propertiesSheet = (): BottomSheetComponent => {
      const sheet = fixture.debugElement
        .queryAll(By.directive(BottomSheetComponent))
        .map((d) => d.componentInstance as BottomSheetComponent)
        .find((s) => s.label() === 'Properties');
      if (!sheet) throw new Error('no properties sheet');
      return sheet;
    };
    const propertiesButton = (): HTMLButtonElement => {
      const button = fixture.nativeElement.querySelector('ng-header-panel .properties-btn') as HTMLButtonElement | null;
      if (!button) throw new Error('no properties button');
      return button;
    };

    afterAll(() => {
      delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    });

    it('renders neither the floating properties panel nor a sheet before the first measurement', () => {
      expect(fixture.nativeElement.querySelector('.editor').hasAttribute('data-layout')).toBe(false);
      expect(fixture.nativeElement.querySelector('ng-properties-panel')).toBeNull();
      expect(fixture.debugElement.queryAll(By.directive(BottomSheetComponent)).length).toBe(0);

      resize(390, 844);
      expect(fixture.nativeElement.querySelector('.editor').getAttribute('data-layout')).toBe('compact');
      expect(fixture.debugElement.queryAll(By.directive(BottomSheetComponent)).length).toBeGreaterThan(0);
    });

    it('derives layout from the editor size and reflects it on the root', () => {
      resize(820, 1180);
      expect(component.layout()).toBe('medium');
      expect(fixture.nativeElement.querySelector('.editor').getAttribute('data-layout')).toBe('medium');
    });

    it('disconnects the observer on destroy', () => {
      expect(FakeResizeObserver.instances.length).toBeGreaterThan(0);
      fixture.destroy();
      expect(FakeResizeObserver.instances.every((o) => o.disconnected)).toBe(true);
    });

    it('a layout change closes open sheets and popovers', () => {
      resize(390, 844);
      component.propertiesSheetOpenSignal.set(true);
      component.menuSheetOpenSignal.set(true);
      component.showLayersDropdownSignal.set(true);
      component.showZoomPopupSignal.set(true);
      fixture.detectChanges();

      resize(820, 1180);

      expect([
        component.propertiesSheetOpenSignal(),
        component.menuSheetOpenSignal(),
        component.showLayersDropdownSignal(),
        component.showZoomPopupSignal(),
      ]).toEqual([false, false, false, false]);
    });

    it('Alt+P in compact toggles the properties sheet, not the floating panel', () => {
      resize(390, 844);
      const panelOpen = component.isPanelOpenSignal();

      keyDown$.next(altP());
      fixture.detectChanges();
      expect(propertiesSheet().open()).toBe(true);

      keyDown$.next(altP());
      fixture.detectChanges();
      expect(propertiesSheet().open()).toBe(false);
      expect(component.isPanelOpenSignal()).toBe(panelOpen);
    });

    it('compact layout renders properties inside bottom sheet closed by default', () => {
      resize(390, 844);
      const sheet = propertiesSheet();
      expect(sheet.open()).toBe(false);
      expect(fixture.nativeElement.querySelector('.editor-container > ng-properties-panel')).toBeNull();

      propertiesButton().click();
      fixture.detectChanges();
      expect(sheet.open()).toBe(true);
      expect(fixture.nativeElement.querySelector('ng-bottom-sheet ng-properties-panel')).not.toBeNull();
    });

    it('selection does not open sheet', () => {
      resize(390, 844);
      TestBed.inject(ElementsService).setElements([
        {
          id: 'r1',
          type: ElementType.Rectangle,
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          rx: 0,
          rotation: 0,
          opacity: 100,
          zIndex: 1,
          selectAfterDraw: false,
          style: {},
        } as WhiteboardElement,
      ]);
      TestBed.inject(SelectionService).selectElements(['r1']);
      fixture.detectChanges();

      expect(propertiesSheet().open()).toBe(false);
      expect(propertiesButton().classList).toContain('has-selection');
    });

    describe('shared action descriptors', () => {
      const buttons = (selector: string): HTMLButtonElement[] =>
        Array.from(fixture.nativeElement.querySelectorAll(selector));
      const labels = (selector: string) => buttons(selector).map((b) => (b.textContent ?? '').trim());
      const zoomSpies = () => ({
        fit: jest.spyOn(component.editorStateService, 'zoomToFit').mockImplementation(),
        selection: jest.spyOn(component.editorStateService, 'zoomToSelection').mockImplementation(),
        reset: jest.spyOn(component.editorStateService, 'resetZoom').mockImplementation(),
      });

      it('header popover and menu sheet list the same menu items and run the same handler', () => {
        const run = jest.spyOn(component, 'runMenuAction').mockImplementation();
        resize(1440, 900);
        buttons('ng-header-panel .menu-btn')[0].click();
        fixture.detectChanges();
        const popover = labels('ng-header-panel [role="menuitem"]');
        expect(popover.length).toBe(5);
        buttons('ng-header-panel [role="menuitem"]')[1].click();
        expect(run).toHaveBeenLastCalledWith('save');

        resize(390, 844);
        component.menuSheetOpenSignal.set(true);
        fixture.detectChanges();
        expect(labels('ng-bottom-sheet [role="menuitem"]')).toEqual(popover);
        buttons('ng-bottom-sheet [role="menuitem"]')[1].click();
        expect(run).toHaveBeenLastCalledWith('save');
      });

      it('zoom popover and zoom sheet list ZOOM_ACTIONS and run the same handlers', () => {
        const spies = zoomSpies();
        resize(1440, 900);
        component.showZoomPopupSignal.set(true);
        fixture.detectChanges();
        expect(labels('.zoom-action')).toEqual(ZOOM_ACTIONS.map((a) => a.label));
        expect(buttons('.zoom-action').map((b) => b.disabled)).toEqual(ZOOM_ACTIONS.map((a) => !!a.requiresSelection));
        buttons('.zoom-action')[0].click();
        expect(spies.fit).toHaveBeenCalledTimes(1);

        resize(390, 844);
        component.showZoomPopupSignal.set(true);
        fixture.detectChanges();
        const items = buttons('ng-bottom-sheet .wb-sheet-item');
        expect(items.map((b) => (b.textContent ?? '').trim())).toEqual(ZOOM_ACTIONS.map((a) => a.label));
        items[2].click();
        expect(spies.reset).toHaveBeenCalledTimes(1);
        expect(spies.selection).not.toHaveBeenCalled();
      });
    });

    it('leaving compact with a sheet open moves focus to the editor root, not the body', async () => {
      document.body.appendChild(fixture.nativeElement);
      resize(390, 844);
      propertiesButton().click();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(propertiesSheet().open()).toBe(true);
      expect(fixture.nativeElement.querySelector('.bs-sheet').contains(document.activeElement)).toBe(true);
      const root = fixture.nativeElement.querySelector('.editor') as HTMLElement;
      const focus = jest.spyOn(root, 'focus');

      resize(1440, 900);
      await fixture.whenStable();

      expect(document.activeElement).toBe(root);
      expect(focus).toHaveBeenCalledWith({ preventScroll: true });
      fixture.nativeElement.remove();
    });

    it('leaving compact does not take back focus the host page moved elsewhere', async () => {
      const outside = document.createElement('input');
      document.body.append(fixture.nativeElement, outside);
      resize(390, 844);
      propertiesButton().click();
      fixture.detectChanges();
      await fixture.whenStable();

      FakeResizeObserver.instances.forEach((o) => o.resize(1440, 900));
      outside.focus();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.activeElement).toBe(outside);
      fixture.nativeElement.remove();
      outside.remove();
    });

    it('wide layout renders the floating properties panel and no sheets', () => {
      resize(1440, 900);
      expect(fixture.nativeElement.querySelector('.editor-container > ng-properties-panel')).not.toBeNull();
      expect(fixture.debugElement.queryAll(By.directive(BottomSheetComponent)).length).toBe(0);
    });
  });
});

describe('WhiteboardEditorComponent without ResizeObserver', () => {
  let saved: unknown;

  beforeEach(() => {
    saved = (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
    TestBed.configureTestingModule({
      imports: [WhiteboardEditorComponent],
      providers: [
        { provide: SvgService, useValue: { keyDown$: new Subject<KeyboardEvent>() } },
        { provide: IOService, useValue: { save: jest.fn() } },
        ApiService,
      ],
    });
  });

  afterEach(() => {
    if (saved) (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = saved;
  });

  it('falls back to the wide layout and renders the properties panel', () => {
    expect(typeof ResizeObserver).toBe('undefined');
    const fixture = TestBed.createComponent(WhiteboardEditorComponent);
    fixture.detectChanges();
    fixture.detectChanges();

    expect(fixture.componentInstance.layout()).toBe('wide');
    expect(fixture.nativeElement.querySelector('.editor-container > ng-properties-panel')).not.toBeNull();
  });
});
