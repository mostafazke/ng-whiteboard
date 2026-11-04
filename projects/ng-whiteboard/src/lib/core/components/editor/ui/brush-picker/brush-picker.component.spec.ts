import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PenType } from '../../../../types';
import { MIXED } from '../../utils/selected-properties';
import { BrushPickerComponent, penTypeLabel } from './brush-picker.component';

describe('BrushPickerComponent', () => {
  let fixture: ComponentFixture<BrushPickerComponent>;
  let emitted: PenType[];

  const radios = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[role="radio"]'));

  const setup = (value: PenType | typeof MIXED | undefined, color?: string | typeof MIXED) => {
    fixture = TestBed.createComponent(BrushPickerComponent);
    fixture.componentRef.setInput('label', 'Brush');
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('color', color);
    emitted = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [BrushPickerComponent] }));

  it('renders the five pen types with labels and a stroke preview each', () => {
    setup(undefined);
    expect(radios().map((r) => r.getAttribute('aria-label'))).toEqual([
      'Pen',
      'Marker',
      'Highlighter',
      'Brush',
      'Pencil',
    ]);
    radios().forEach((r) => expect(r.querySelector('path')?.getAttribute('d')).toBeTruthy());
  });

  it('previews filled outlines for pen and brush and strokes for the rest', () => {
    setup(undefined);
    const filled = radios().map((r) => r.querySelector('path')?.getAttribute('fill') === 'currentColor');
    expect(filled).toEqual([true, false, false, true, false]);
  });

  it('draws previews in the given stroke color', () => {
    setup(PenType.Pen, '#dc2626');
    expect(radios()[0].querySelector('svg')?.style.color).toBe('rgb(220, 38, 38)');
  });

  it('falls back to the text color for a mixed stroke color', () => {
    setup(PenType.Pen, MIXED);
    expect(radios()[0].querySelector('svg')?.style.color).toBe('currentcolor');
  });

  it('marks the current value checked and emits on click', () => {
    setup(PenType.Brush);
    expect(
      radios()
        .filter((r) => r.getAttribute('aria-checked') === 'true')
        .map((r) => r.title)
    ).toEqual(['Brush']);
    radios()[2].click();
    expect(emitted).toEqual([PenType.Highlighter]);
  });

  it('ArrowRight selects and focuses the next type without propagating', () => {
    setup(PenType.Pen);
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    const stop = jest.spyOn(event, 'stopPropagation');
    radios()[0].dispatchEvent(event);
    expect(emitted).toEqual([PenType.Marker]);
    expect(stop).toHaveBeenCalled();
    expect(document.activeElement === radios()[1] || !fixture.nativeElement.isConnected).toBe(true);
  });

  it('names pen types for display', () => {
    expect(penTypeLabel(PenType.Highlighter)).toBe('Highlighter');
    expect(penTypeLabel(undefined)).toBe('');
  });
});
