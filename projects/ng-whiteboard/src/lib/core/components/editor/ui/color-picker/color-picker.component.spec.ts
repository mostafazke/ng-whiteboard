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
});
