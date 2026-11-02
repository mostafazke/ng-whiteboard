import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgWhiteboardComponent } from '../../../ng-whiteboard.component';
import { ApiService } from '../../api/api.service';
import { ElementType, ToolType, WhiteboardElement } from '../../types';
import { WhiteboardEditorComponent } from './whiteboard-editor.component';

const rect = (id: string): WhiteboardElement =>
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
    global.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
    await TestBed.configureTestingModule({ imports: [NgWhiteboardComponent] }).compileComponents();
    fixture = TestBed.createComponent(NgWhiteboardComponent);
    fixture.componentRef.setInput('showEditor', true);
    document.body.appendChild(host());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    editor = fixture.debugElement.query(By.directive(WhiteboardEditorComponent)).componentInstance;
    api = fixture.debugElement.query(By.directive(WhiteboardEditorComponent)).injector.get(ApiService);
    api.setActiveTool(ToolType.Pen);
    (host().querySelector('[globalKeyboard]') as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
  });

  afterEach(() => host().remove());

  it('Space typed in the header title input inserts a space and keeps the tool', () => {
    (host().querySelector('ng-header-panel h1') as HTMLElement).click();
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
});
