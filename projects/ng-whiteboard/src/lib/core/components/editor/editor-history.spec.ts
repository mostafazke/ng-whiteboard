import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgWhiteboardComponent } from '../../../ng-whiteboard.component';
import { ApiService } from '../../api/api.service';
import { createElement } from '../../elements/element.utils';
import { ElementType, ToolType, WhiteboardElement } from '../../types';
import { WhiteboardEditorComponent } from './whiteboard-editor.component';
import { wideEditorResizeObserver } from './testing/wide-editor-resize-observer';

const rect = (id: string): WhiteboardElement =>
  ({
    id,
    type: ElementType.Rectangle,
    x: 0,
    y: 0,
    width: 20,
    height: 20,
    rx: 0,
    rotation: 0,
    opacity: 100,
    zIndex: 1,
    selectAfterDraw: false,
    style: { strokeColor: '#000000', strokeWidth: 2 },
  }) as WhiteboardElement;

describe('Editor edit batch vs canvas history (integration)', () => {
  let fixture: ComponentFixture<NgWhiteboardComponent>;
  let api: ApiService;
  const host = (): HTMLElement => fixture.nativeElement;
  const svg = (): SVGSVGElement => host().querySelector('svg[svg]') as SVGSVGElement;
  const ids = () => api.getElements().map((e) => e.id);
  const r1 = () => api.getElements().find((e) => e.id === 'r1') as WhiteboardElement;

  const pointer = (target: EventTarget, type: string, x: number, y: number) =>
    target.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons: 1, clientX: x, clientY: y })
    );
  const gesture = (from: [number, number], to: [number, number], start: EventTarget = svg()) => {
    pointer(start, 'pointerdown', ...from);
    for (const point of [[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2], to]) {
      pointer(svg(), 'pointermove', point[0], point[1]);
      jest.advanceTimersByTime(20);
    }
    pointer(svg(), 'pointerup', ...to);
    fixture.detectChanges();
  };
  const pickStrokeColor = (values: string[]) => {
    const colors = host().querySelectorAll('ng-properties-panel input[type="color"]');
    const input = colors[colors.length - 1] as HTMLInputElement;
    for (const value of values) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }
  };
  const selectR1 = () => {
    api.addElements([rect('r1')]);
    api.selectElements(['r1']);
    api.clearHistory();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    global.ResizeObserver = wideEditorResizeObserver();
    await TestBed.configureTestingModule({ imports: [NgWhiteboardComponent] }).compileComponents();
    fixture = TestBed.createComponent(NgWhiteboardComponent);
    fixture.componentRef.setInput('showEditor', true);
    document.body.appendChild(host());
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    api = fixture.debugElement.query(By.directive(WhiteboardEditorComponent)).injector.get(ApiService);
    Object.assign(svg(), {
      setPointerCapture: jest.fn(),
      releasePointerCapture: jest.fn(),
      hasPointerCapture: () => false,
    });
    (host().querySelector('[globalKeyboard]') as HTMLElement).dispatchEvent(new MouseEvent('mouseenter'));
  });

  afterEach(() => {
    jest.useRealTimers();
    host().remove();
  });

  it('a pen stroke drawn while a color edit is open is its own undo step', () => {
    jest.useFakeTimers();
    api.setActiveTool(ToolType.Pen);
    selectR1();
    pickStrokeColor(['#111111', '#123456']);
    gesture([50, 50], [90, 90]);
    expect(ids().length).toBe(2);

    api.undo();
    expect(ids()).toEqual(['r1']);
    expect(r1().style.strokeColor).toBe('#123456');
    api.undo();
    expect(r1().style.strokeColor).toBe('#000000');
  });

  it('a select-tool move made while a color edit is open is its own undo step', () => {
    api.setActiveTool(ToolType.Select);
    selectR1();
    pickStrokeColor(['#123456']);
    jest.useFakeTimers();
    gesture([5, 5], [35, 45], svg().querySelector('[data-wb-id="r1"]') as Element);
    expect(r1().x).not.toBe(0);

    api.undo();
    expect(r1().x).toBe(0);
    expect(r1().style.strokeColor).toBe('#123456');
    api.undo();
    expect(r1().style.strokeColor).toBe('#000000');
  });

  it('Ctrl+Z during an open color edit undoes the edit as one step and loses nothing', () => {
    api.addElements([rect('r1')]);
    api.selectElements(['r1']);
    fixture.detectChanges();
    pickStrokeColor(['#111111', '#123456']);

    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));

    expect(ids()).toEqual(['r1']);
    expect(r1().style.strokeColor).toBe('#000000');
    api.redo();
    expect(r1().style.strokeColor).toBe('#123456');
  });

  it('a stale color settle timer does not close a slider drag started within 400ms', () => {
    jest.useFakeTimers();
    selectR1();
    pickStrokeColor(['#123456']);
    const slider = host().querySelector('ng-properties-panel input[aria-label="Opacity"]') as HTMLInputElement;
    slider.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0 }));
    const drag = (value: string) => {
      slider.value = value;
      slider.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    drag('80');
    jest.advanceTimersByTime(400);
    drag('60');
    drag('40');
    slider.dispatchEvent(new Event('change'));

    expect(r1().opacity).toBe(40);
    api.undo();
    expect(r1().opacity).toBe(100);
    expect(r1().style.strokeColor).toBe('#123456');
  });

  describe('contextual sections', () => {
    const canUndo = () => api.getCanUndoSignal()();
    const panel = () => host().querySelector('ng-properties-panel') as HTMLElement;
    const checked = (group: string) =>
      panel().querySelector(`[aria-label="${group}"] [aria-checked="true"]`) as HTMLElement;
    const selectArrowAndRect = () => {
      api.addElements([createElement(ElementType.Arrow, { id: 'a1', x2: 100, y2: 0 }), rect('r1')]);
      api.selectElements(['a1', 'r1']);
      api.clearHistory();
      fixture.detectChanges();
    };

    it('a width change on an arrow plus a rectangle updates both in one undo step', () => {
      selectArrowAndRect();
      const slider = panel().querySelector('input[aria-label="Stroke width"]') as HTMLInputElement;
      for (const value of ['6', '8']) {
        slider.value = value;
        slider.dispatchEvent(new Event('input'));
        fixture.detectChanges();
      }
      slider.dispatchEvent(new Event('change'));

      expect(api.getElements().map((e) => e.style.strokeWidth)).toEqual([8, 8]);
      api.undo();
      expect(api.getElements().map((e) => e.style.strokeWidth)).toEqual([2, 2]);
      expect(canUndo()).toBe(false);
    });

    it('re-choosing the current arrow head, path or line end adds no history step', () => {
      api.addElements([createElement(ElementType.Arrow, { id: 'a1', x2: 100, y2: 0 })]);
      api.selectElements(['a1']);
      api.clearHistory();
      fixture.detectChanges();

      for (const group of ['Start', 'End', 'Arrow path', 'Line ends']) {
        checked(group).click();
        fixture.detectChanges();
      }

      expect(canUndo()).toBe(false);
    });

    it('choosing a brush with nothing selected changes the default without a history step', () => {
      api.setActiveTool(ToolType.Pen);
      api.clearHistory();
      fixture.detectChanges();

      checked('Brush').click();
      fixture.detectChanges();
      (panel().querySelector('[aria-label="Brush"] [role="radio"][aria-label="Marker"]') as HTMLElement).click();
      fixture.detectChanges();

      expect(api.getConfig().penType).toBe('marker');
      expect(canUndo()).toBe(false);
    });
  });
});
