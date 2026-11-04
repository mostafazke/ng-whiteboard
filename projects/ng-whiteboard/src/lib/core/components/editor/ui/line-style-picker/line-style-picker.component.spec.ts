import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineCap } from '../../../../types';
import { MIXED } from '../../utils/selected-properties';
import { LineStyle } from '../../utils/dasharray';
import { LineStylePickerComponent } from './line-style-picker.component';

describe('LineStylePickerComponent', () => {
  let fixture: ComponentFixture<LineStylePickerComponent>;
  let emitted: LineStyle[];

  const radios = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[role="radio"]'));
  const line = (i: number) => radios()[i].querySelector('path') as SVGPathElement;

  const setup = (
    inputs: { value?: LineStyle | typeof MIXED; color?: string | typeof MIXED; width?: number; lineCap?: LineCap } = {}
  ) => {
    fixture = TestBed.createComponent(LineStylePickerComponent);
    fixture.componentRef.setInput('label', 'Line style');
    Object.entries(inputs).forEach(([key, value]) => fixture.componentRef.setInput(key, value));
    emitted = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [LineStylePickerComponent] }));

  it('renders the four styles as a labelled radio group', () => {
    setup();
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]').getAttribute('aria-label')).toBe('Line style');
    expect(radios().map((r) => r.getAttribute('aria-label'))).toEqual(['Solid', 'Dashed', 'Dotted', 'Dash-dot']);
  });

  it('previews each pattern at the stroke width with the real proportions', () => {
    setup({ width: 3 });
    expect(line(0).getAttribute('stroke-dasharray')).toBeNull();
    expect(line(1).getAttribute('stroke-dasharray')).toBe('9,9');
    expect(line(2).getAttribute('stroke-dasharray')).toBe('3,6');
    expect(line(3).getAttribute('stroke-dasharray')).toBe('15,6,3,6');
    expect(line(1).getAttribute('stroke-width')).toBe('3');
  });

  it('keeps the preview width legible for very thin and very thick strokes', () => {
    setup({ width: 0.5 });
    expect(line(1).getAttribute('stroke-width')).toBe('1.5');
    setup({ width: 20 });
    expect(line(1).getAttribute('stroke-width')).toBe('4');
  });

  it('draws in the stroke color with the stroke line cap', () => {
    setup({ color: '#2563eb', lineCap: LineCap.Round });
    expect(radios()[0].querySelector('svg')?.style.color).toBe('rgb(37, 99, 235)');
    expect(line(2).getAttribute('stroke-linecap')).toBe('round');
  });

  it('falls back to the text color and flat ends when mixed', () => {
    setup({ color: MIXED });
    expect(radios()[0].querySelector('svg')?.style.color).toBe('currentcolor');
    expect(line(0).getAttribute('stroke-linecap')).toBe('butt');
  });

  it('outlines near-white previews so they stay visible', () => {
    setup({ color: '#ffffff' });
    expect(radios()[0].querySelector('svg')?.classList).toContain('light-ink');
    setup({ color: '#111827' });
    expect(radios()[0].querySelector('svg')?.classList).not.toContain('light-ink');
  });

  it('checks the current value, keeps mixed unchecked, and emits on click', () => {
    setup({ value: 'dotted' });
    expect(
      radios()
        .filter((r) => r.getAttribute('aria-checked') === 'true')
        .map((r) => r.title)
    ).toEqual(['Dotted']);
    radios()[3].click();
    expect(emitted).toEqual(['dashdot']);

    setup({ value: MIXED });
    expect(radios().some((r) => r.getAttribute('aria-checked') === 'true')).toBe(false);
    expect(radios()[0].tabIndex).toBe(0);
  });

  it('ArrowLeft wraps to the last style without propagating', () => {
    setup({ value: 'solid' });
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true });
    const stop = jest.spyOn(event, 'stopPropagation');
    radios()[0].dispatchEvent(event);
    expect(emitted).toEqual(['dashdot']);
    expect(stop).toHaveBeenCalled();
  });
});
