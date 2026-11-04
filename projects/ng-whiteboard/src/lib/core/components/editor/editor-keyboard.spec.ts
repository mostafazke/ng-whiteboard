import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgWhiteboardComponent } from '../../../ng-whiteboard.component';
import { ApiService } from '../../api/api.service';
import { IOService } from '../../input/io.service';
import { ElementType, ToolType, WhiteboardElement } from '../../types';
import { WhiteboardEditorComponent } from './whiteboard-editor.component';
import { wideEditorResizeObserver } from './testing/wide-editor-resize-observer';
import { renderDeferredEditor } from './testing/render-deferred-editor';

const rect = (id: string, x = 0, y = 0): WhiteboardElement =>
  ({
    id,
    type: ElementType.Rectangle,
    x,
    y,
    width: 10,
    height: 10,
    rx: 0,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: false,
    style: {},
  }) as WhiteboardElement;

describe('Editor keyboard containment (integration)', () => {
  let fixture: ComponentFixture<NgWhiteboardComponent>;
  let api: ApiService;
  let editor: WhiteboardEditorComponent;
  const host = (): HTMLElement => fixture.nativeElement;

  const key = (target: HTMLElement, type: 'keydown' | 'keyup', init: KeyboardEventInit): KeyboardEvent => {
    const event = new KeyboardEvent(type, { bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    return event;
  };

  beforeEach(async () => {
    global.ResizeObserver = wideEditorResizeObserver();
    await TestBed.configureTestingModule({ imports: [NgWhiteboardComponent] }).compileComponents();
    fixture = TestBed.createComponent(NgWhiteboardComponent);
    fixture.componentRef.setInput('showEditor', true);
    document.body.appendChild(host());
    await renderDeferredEditor(fixture);

    editor = fixture.debugElement.query(By.directive(WhiteboardEditorComponent)).componentInstance;
    api = fixture.debugElement.query(By.directive(WhiteboardEditorComponent)).injector.get(ApiService);
    api.setActiveTool(ToolType.Pen);
    (host().querySelector('[globalKeyboard]') as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
  });

  afterEach(() => host().remove());

  it('Space typed in the header title input inserts a space and keeps the tool', () => {
    (host().querySelector('ng-header-panel .title-button') as HTMLElement).click();
    fixture.detectChanges();
    const input = host().querySelector('ng-header-panel .title-input') as HTMLInputElement;
    input.focus();

    const down = key(input, 'keydown', { key: ' ', code: 'Space' });
    expect(down.defaultPrevented).toBe(false);
    expect(api.getActiveTool()).toBe(ToolType.Pen);
    key(input, 'keyup', { key: ' ', code: 'Space' });
    expect(api.getActiveTool()).toBe(ToolType.Pen);
  });

  it('Delete on a focused color swatch does not delete the selection', () => {
    api.addElements([rect('r1')]);
    api.selectElements(['r1']);
    fixture.detectChanges();
    const swatch = host().querySelector('ng-properties-panel .color-swatch') as HTMLButtonElement;
    swatch.focus();

    key(swatch, 'keydown', { key: 'Delete', code: 'Delete' });
    key(swatch, 'keydown', { key: 'Backspace', code: 'Backspace' });

    expect(api.getElements().map((e) => e.id)).toEqual(['r1']);
    expect(api.getSelectedElements().map((e) => e.id)).toEqual(['r1']);
  });

  it('Space and tool letters on a focused editor button do not reach the canvas', () => {
    const button = host().querySelector('ng-properties-panel .icon-btn') as HTMLButtonElement;
    button.focus();

    key(button, 'keydown', { key: ' ', code: 'Space' });
    key(button, 'keydown', { key: 'r', code: 'KeyR' });

    expect(api.getActiveTool()).toBe(ToolType.Pen);
    key(button, 'keyup', { key: ' ', code: 'Space' });
  });

  it('Alt+P from a focused editor button still toggles the properties panel', () => {
    const button = host().querySelector('ng-properties-panel .icon-btn') as HTMLButtonElement;
    button.focus();
    const before = editor.isPanelOpenSignal();

    key(button, 'keydown', { key: 'p', code: 'KeyP', altKey: true });

    expect(editor.isPanelOpenSignal()).toBe(!before);
  });

  it('canvas shortcuts still work when focus is outside the editor', () => {
    key(document.body, 'keydown', { key: 'r', code: 'KeyR' });
    expect(api.getActiveTool()).toBe(ToolType.Rectangle);
  });

  it('arrow keys on a focused editor button do not nudge the selection; on the canvas they do', () => {
    api.addElements([rect('r1', 30, 40)]);
    api.selectElements(['r1']);
    fixture.detectChanges();
    const position = () => [api.getElements()[0].x, api.getElements()[0].y];
    const button = host().querySelector('ng-properties-panel .icon-btn') as HTMLButtonElement;
    button.focus();

    key(button, 'keydown', { key: 'ArrowRight', code: 'ArrowRight' });
    key(button, 'keydown', { key: 'ArrowDown', code: 'ArrowDown', shiftKey: true });
    expect(position()).toEqual([30, 40]);

    const svg = host().querySelector('svg[svg]') as SVGSVGElement;
    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }));
    expect(position()[0]).toBeGreaterThan(30);
    expect(position()[1]).toBe(40);
  });

  it('arrow keys on a range slider are left to the slider: one value change, one undo step, no nudge', () => {
    api.addElements([rect('r1', 30, 40)]);
    api.selectElements(['r1']);
    api.clearHistory();
    fixture.detectChanges();
    const slider = host().querySelector('ng-properties-panel input[aria-label="Opacity"]') as HTMLInputElement;
    slider.focus();

    const down = key(slider, 'keydown', { key: 'ArrowLeft', code: 'ArrowLeft' });
    expect(down.defaultPrevented).toBe(false);
    // jsdom does not step a range input; replay what the browser does after an unprevented arrow key.
    slider.value = '99';
    slider.dispatchEvent(new Event('input'));
    slider.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const [r1] = api.getElements();
    expect([r1.opacity, r1.x, r1.y]).toEqual([99, 30, 40]);
    expect(api.undo()).toBe(true);
    expect(api.getElements()[0].opacity).toBe(100);
    expect(api.undo()).toBe(false);
  });

  it('keys pressed while the editor root itself holds focus still reach the canvas shortcuts', () => {
    const root = host().querySelector('ng-whiteboard-editor .editor') as HTMLElement;
    root.focus();
    expect(document.activeElement).toBe(root);

    key(root, 'keydown', { key: 'r', code: 'KeyR' });

    expect(api.getActiveTool()).toBe(ToolType.Rectangle);
  });

  it('arrow keys outside the editor still nudge the selection', () => {
    api.addElements([rect('r1')]);
    api.selectElements(['r1']);
    key(document.body, 'keydown', { key: 'ArrowRight', code: 'ArrowRight' });
    expect(api.getElements()[0].x).not.toBe(0);
  });

  it('the toolbar keeps roving focus with arrow keys', () => {
    const buttons = Array.from(host().querySelectorAll<HTMLButtonElement>('ng-toolbar button.tool-btn'));
    buttons[0].focus();
    key(buttons[0], 'keydown', { key: 'ArrowRight', code: 'ArrowRight' });
    expect(document.activeElement).toBe(buttons[1]);
  });

  it('zoom trigger uses the disclosure pattern', () => {
    const trigger = host().querySelector('ng-controls-panel .zoom-value') as HTMLButtonElement;
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);

    trigger.click();
    fixture.detectChanges();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    const id = trigger.getAttribute('aria-controls') as string;
    expect(host().querySelector(`#${id}`)?.classList).toContain('zoom-dropdown');
  });

  it('layers trigger points at its dropdown while open', () => {
    const trigger = host().querySelector('ng-header-panel .layers-button') as HTMLButtonElement;
    expect(trigger.hasAttribute('aria-haspopup')).toBe(false);
    expect(trigger.hasAttribute('aria-controls')).toBe(false);

    trigger.click();
    fixture.detectChanges();

    const id = trigger.getAttribute('aria-controls') as string;
    expect(host().querySelector(`#${id}`)?.classList).toContain('layers-dropdown');
  });

  it('Escape in the layer rename input restores the name and keeps the popover open', () => {
    (host().querySelector('ng-header-panel .layers-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    const input = host().querySelector('ng-header-panel .layer-name') as HTMLInputElement;
    const original = input.value;
    input.focus();
    input.value = 'Renamed';

    key(input, 'keydown', { key: 'Escape', code: 'Escape' });
    fixture.detectChanges();

    expect(input.value).toBe(original);
    expect(editor.showLayersDropdownSignal()).toBe(true);
    expect(host().querySelector('ng-header-panel .layers-dropdown')).not.toBeNull();
  });
});

describe('Alt+P with several boards (integration)', () => {
  let fixtures: ComponentFixture<NgWhiteboardComponent>[];
  let editors: WhiteboardEditorComponent[];

  const press = (target: HTMLElement) =>
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'p', code: 'KeyP', altKey: true, bubbles: true, cancelable: true }),
    );

  beforeEach(async () => {
    global.ResizeObserver = wideEditorResizeObserver();
    await TestBed.configureTestingModule({ imports: [NgWhiteboardComponent] }).compileComponents();
    fixtures = [0, 1].map(() => {
      const f = TestBed.createComponent(NgWhiteboardComponent);
      f.componentRef.setInput('showEditor', true);
      document.body.appendChild(f.nativeElement);
      return f;
    });
    for (const f of fixtures) await renderDeferredEditor(f);
    editors = fixtures.map((f) => f.debugElement.query(By.directive(WhiteboardEditorComponent)).componentInstance);
    (fixtures[1].nativeElement.querySelector('[globalKeyboard]') as HTMLElement).dispatchEvent(
      new MouseEvent('mouseenter'),
    );
  });

  afterEach(() => fixtures.forEach((f) => f.nativeElement.remove()));

  it('toggles the board the keyboard user is in, not the last hovered one', () => {
    const button = fixtures[0].nativeElement.querySelector('ng-properties-panel .icon-btn') as HTMLElement;
    button.focus();

    press(button);

    expect(editors[0].isPanelOpenSignal()).toBe(false);
    expect(editors[1].isPanelOpenSignal()).toBe(true);
  });

  it('a window-level Alt+P toggles the hovered board and not the other one', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', code: 'KeyP', altKey: true, cancelable: true }));

    expect(editors[0].isPanelOpenSignal()).toBe(true);
    expect(editors[1].isPanelOpenSignal()).toBe(false);
  });

  it('toggles once when the event also reaches the hovered board', () => {
    const button = fixtures[1].nativeElement.querySelector('ng-properties-panel .icon-btn') as HTMLElement;
    press(button);
    expect(editors[1].isPanelOpenSignal()).toBe(false);
    expect(editors[0].isPanelOpenSignal()).toBe(true);
  });
});

describe('File shortcuts with several boards (integration)', () => {
  let fixtures: ComponentFixture<NgWhiteboardComponent>[];
  let saves: jest.SpyInstance[];

  beforeEach(async () => {
    global.ResizeObserver = wideEditorResizeObserver();
    await TestBed.configureTestingModule({ imports: [NgWhiteboardComponent] }).compileComponents();
    fixtures = [0, 1].map(() => {
      const f = TestBed.createComponent(NgWhiteboardComponent);
      f.componentRef.setInput('showEditor', true);
      document.body.appendChild(f.nativeElement);
      return f;
    });
    for (const f of fixtures) await renderDeferredEditor(f);
    saves = fixtures.map((f) =>
      jest
        .spyOn(f.debugElement.query(By.directive(WhiteboardEditorComponent)).injector.get(IOService), 'exportDataAsFile')
        .mockImplementation(),
    );
    (fixtures[1].nativeElement.querySelector('[globalKeyboard]') as HTMLElement).dispatchEvent(
      new MouseEvent('mouseenter'),
    );
  });

  afterEach(() => fixtures.forEach((f) => f.nativeElement.remove()));

  it('Ctrl+S with board A focused saves only board A, even while board B is hovered', () => {
    const button = fixtures[0].nativeElement.querySelector('ng-toolbar button') as HTMLElement;
    button.focus();

    const event = new KeyboardEvent('keydown', { key: 's', code: 'KeyS', ctrlKey: true, bubbles: true, cancelable: true });
    button.dispatchEvent(event);

    expect(saves.map((s) => s.mock.calls.length)).toEqual([1, 0]);
    expect(event.defaultPrevented).toBe(true);
  });
});
