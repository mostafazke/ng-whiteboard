import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MIXED } from '../../utils/selected-properties';
import { ColorPickerComponent } from './color-picker.component';

describe('ColorPickerComponent', () => {
  let fixture: ComponentFixture<ColorPickerComponent>;
  let emitted: string[];

  const nativeInput = (): HTMLInputElement => fixture.nativeElement.querySelector('input[type="color"]');

  // A native color input only fires input/change when the picked value differs from its current one.
  const pickInBrowser = (color: string) => {
    const input = nativeInput();
    if (input.value === color) return;
    input.value = color;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ColorPickerComponent] });
    fixture = TestBed.createComponent(ColorPickerComponent);
    emitted = [];
    fixture.componentInstance.colorChange.subscribe((c) => emitted.push(c));
  });

  it('choosing black in the custom picker on a mixed selection applies black', () => {
    fixture.componentInstance.value = MIXED;
    fixture.detectChanges();

    pickInBrowser('#000000');

    expect(emitted).toEqual(['#000000']);
  });

  it('seeds the custom picker with the current color when not mixed', () => {
    fixture.componentInstance.value = '#ef4444';
    fixture.detectChanges();

    expect(nativeInput().value).toBe('#ef4444');
    pickInBrowser('#000000');
    expect(emitted).toEqual(['#000000']);
  });

  it('wraps a native picker drag in editStart/editEnd', () => {
    const events: string[] = [];
    fixture.componentInstance.editStart.subscribe(() => events.push('start'));
    fixture.componentInstance.editEnd.subscribe(() => events.push('end'));
    fixture.componentInstance.value = '#ffffff';
    fixture.detectChanges();

    pickInBrowser('#123456');

    expect(events).toEqual(['start', 'end']);
  });

  it('picking the first seed gray on a mixed selection applies it', () => {
    fixture.componentInstance.value = MIXED;
    fixture.detectChanges();

    pickInBrowser('#808080');

    expect(emitted).toEqual(['#808080']);
  });

  it('a seed the user picked is not the seed on the next pick', () => {
    fixture.componentInstance.value = MIXED;
    fixture.detectChanges();
    const first = nativeInput().value;
    pickInBrowser(first === '#7f7f80' ? '#808081' : '#7f7f80');
    fixture.componentInstance.finishEdit();
    fixture.componentInstance.value = MIXED;
    fixture.detectChanges();

    expect(nativeInput().value).not.toBe(first);
  });

  it('a transparent value seeds the picker so black can be picked', () => {
    fixture.componentInstance.value = 'transparent';
    fixture.detectChanges();

    pickInBrowser('#000000');

    expect(emitted).toEqual(['#000000']);
  });

  describe('preview', () => {
    const preview = (): HTMLElement => fixture.nativeElement.querySelector('.color-preview');
    const button = (): HTMLElement => fixture.nativeElement.querySelector('.custom-color-swatch');

    it('shows the real transparent value, not the native seed', () => {
      fixture.componentInstance.value = 'transparent';
      fixture.detectChanges();

      expect(preview().style.backgroundColor).toBe('transparent');
      expect(button().getAttribute('title')).toBe('Custom color: transparent');
      expect(nativeInput().value).toMatch(/^#(7f7f80|808081)$/);
    });

    it('previews 3-digit hex and named colors as given', () => {
      fixture.componentInstance.value = '#f00';
      fixture.detectChanges();
      expect(preview().style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(button().getAttribute('title')).toBe('Custom color: #f00');

      fixture.componentInstance.value = 'red';
      fixture.componentInstance.finishEdit();
      fixture.detectChanges();
      expect(preview().style.backgroundColor).toBe('rgb(255, 0, 0)');
    });
  });

  it('re-renders the native seed after an edit ends while still mixed', () => {
    fixture.componentInstance.value = MIXED;
    fixture.detectChanges();
    const first = nativeInput().value;
    pickInBrowser('#123456');

    fixture.componentInstance.finishEdit();
    fixture.detectChanges();

    expect(nativeInput().value).not.toBe(first);
  });
});
