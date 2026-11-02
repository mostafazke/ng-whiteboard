import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { ElementsService } from '../../elements/elements.service';
import { SelectionService } from '../../elements/selection.service';
import { IOService } from '../../input/io.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { SvgService } from '../../svg/svg.service';
import { ElementType, FormatType, WhiteboardElement } from '../../types';
import { BottomSheetComponent } from './ui/bottom-sheet/bottom-sheet.component';
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
  const ioServiceMock = { save: jest.fn().mockResolvedValue('') };

  const altP = (): KeyboardEvent =>
    new KeyboardEvent('keydown', { key: 'p', code: 'KeyP', altKey: true, cancelable: true });

  beforeEach(async () => {
    FakeResizeObserver.instances = [];
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
    ioServiceMock.save.mockClear();
    keyDown$ = new Subject<KeyboardEvent>();
    await TestBed.configureTestingModule({
      imports: [WhiteboardEditorComponent],
      providers: [
        { provide: SvgService, useValue: { keyDown$: keyDown$.asObservable() } },
        { provide: IOService, useValue: ioServiceMock },
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

  it('ignores Alt+P dispatched on window outside the board', () => {
    const before = component.isPanelOpenSignal();
    window.dispatchEvent(altP());
    expect(component.isPanelOpenSignal()).toBe(before);
  });

  it('toggles on Alt+P when the layout yields a different key (macOS)', () => {
    const before = component.isPanelOpenSignal();
    keyDown$.next(new KeyboardEvent('keydown', { key: 'π', code: 'KeyP', altKey: true }));
    expect(component.isPanelOpenSignal()).toBe(!before);
  });

  it('Save calls IOService.save with SVG and the title', async () => {
    await component.save();
    expect(ioServiceMock.save).toHaveBeenCalledWith(
      FormatType.Svg,
      component.editorConfigSignal().title || 'Whiteboard'
    );
  });

  it('Export calls IOService.save with PNG and the title', async () => {
    await component.export();
    expect(ioServiceMock.save).toHaveBeenCalledWith(
      FormatType.Png,
      component.editorConfigSignal().title || 'Whiteboard'
    );
  });

  it('does not reject when saving fails', async () => {
    ioServiceMock.save.mockRejectedValueOnce(new Error('x'));
    await expect(component.save()).resolves.toBeUndefined();
  });

  it('does not toggle on plain P', () => {
    const before = component.isPanelOpenSignal();
    keyDown$.next(new KeyboardEvent('keydown', { key: 'p' }));
    expect(component.isPanelOpenSignal()).toBe(before);
  });

  it('slider 50 sets layer opacity 0.5', () => {
    const spy = jest.spyOn(TestBed.inject(LayerManagementService), 'setLayerOpacity');
    component.onLayerPanelOpacityChanged({ layerId: 'l1', opacity: 0.5 });
    expect(spy).toHaveBeenCalledWith('l1', 0.5);
  });

  it('toolbar has no more-tools button', () => {
    expect(fixture.nativeElement.querySelector('.more-tools')).toBeNull();
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

    it('derives layout from the editor size and reflects it on the root', () => {
      resize(820, 1180);
      expect(component.layout()).toBe('medium');
      expect(fixture.nativeElement.querySelector('.editor').getAttribute('data-layout')).toBe('medium');
    });

    it('disconnects the observer on destroy', () => {
      fixture.destroy();
      expect(FakeResizeObserver.instances.every((o) => o.disconnected)).toBe(true);
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

    it('wide layout renders the floating properties panel and no sheets', () => {
      resize(1440, 900);
      expect(fixture.nativeElement.querySelector('.editor-container > ng-properties-panel')).not.toBeNull();
      expect(fixture.debugElement.queryAll(By.directive(BottomSheetComponent)).length).toBe(0);
    });
  });
});
