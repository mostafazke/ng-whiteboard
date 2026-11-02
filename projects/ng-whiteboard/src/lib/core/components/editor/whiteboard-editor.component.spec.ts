import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { IOService } from '../../input/io.service';
import { LayerManagementService } from '../../elements/layer-management.service';
import { SvgService } from '../../svg/svg.service';
import { FormatType } from '../../types';
import { WhiteboardEditorComponent } from './whiteboard-editor.component';

describe('WhiteboardEditorComponent', () => {
  let component: WhiteboardEditorComponent;
  let fixture: ComponentFixture<WhiteboardEditorComponent>;
  let keyDown$: Subject<KeyboardEvent>;
  const ioServiceMock = { save: jest.fn().mockResolvedValue('') };

  const altP = (): KeyboardEvent =>
    new KeyboardEvent('keydown', { key: 'p', code: 'KeyP', altKey: true, cancelable: true });

  beforeEach(async () => {
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
});
