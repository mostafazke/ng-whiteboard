import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LayerManagementService } from '../../elements/layer-management.service';
import { SvgService } from '../../svg/svg.service';
import { WhiteboardEditorComponent } from './whiteboard-editor.component';

describe('WhiteboardEditorComponent', () => {
  let component: WhiteboardEditorComponent;
  let fixture: ComponentFixture<WhiteboardEditorComponent>;
  let keyDown$: Subject<KeyboardEvent>;

  const altP = (): KeyboardEvent => new KeyboardEvent('keydown', { key: 'p', altKey: true, cancelable: true });

  beforeEach(async () => {
    keyDown$ = new Subject<KeyboardEvent>();
    await TestBed.configureTestingModule({
      imports: [WhiteboardEditorComponent],
      providers: [{ provide: SvgService, useValue: { keyDown$: keyDown$.asObservable() } }],
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
});
