import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArrowheadType } from '../../../../elements';
import { MIXED } from '../../utils/selected-properties';
import { ArrowheadPickerComponent } from './arrowhead-picker.component';

describe('ArrowheadPickerComponent', () => {
  let fixture: ComponentFixture<ArrowheadPickerComponent>;
  let emitted: ArrowheadType[];

  const radios = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[role="radio"]'));

  const setup = (value: ArrowheadType | typeof MIXED | undefined, end: 'start' | 'end' = 'end') => {
    fixture = TestBed.createComponent(ArrowheadPickerComponent);
    fixture.componentRef.setInput('label', 'End');
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('end', end);
    emitted = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [ArrowheadPickerComponent] }));

  it('renders the eight heads with their labels', () => {
    setup(undefined);
    expect(radios().map((r) => r.getAttribute('aria-label'))).toEqual([
      'None',
      'Arrow',
      'Open arrow',
      'Diamond',
      'Open diamond',
      'Circle',
      'Open circle',
      'Bar',
    ]);
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]').getAttribute('aria-label')).toBe('End');
  });

  it('clicking Diamond emits diamond', () => {
    setup(ArrowheadType.Arrow);
    radios()[3].click();
    expect(emitted).toEqual([ArrowheadType.Diamond]);
  });

  it('marks the current value checked', () => {
    setup(ArrowheadType.Bar);
    const checked = radios().filter((r) => r.getAttribute('aria-checked') === 'true');
    expect(checked.map((r) => r.getAttribute('aria-label'))).toEqual(['Bar']);
  });

  it('mixed checks nothing', () => {
    setup(MIXED);
    expect(radios().some((r) => r.getAttribute('aria-checked') === 'true')).toBe(false);
    expect(radios()[0].tabIndex).toBe(0);
  });

  it('ArrowRight selects the next head without propagating', () => {
    setup(ArrowheadType.None);
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
    const stop = jest.spyOn(event, 'stopPropagation');
    radios()[0].dispatchEvent(event);
    expect(emitted).toEqual([ArrowheadType.Arrow]);
    expect(stop).toHaveBeenCalled();
  });

  it('mirrors icons for the start end', () => {
    setup(ArrowheadType.Arrow, 'start');
    expect(fixture.nativeElement.querySelector('svg').classList.contains('mirrored')).toBe(true);
    setup(ArrowheadType.Arrow, 'end');
    expect(fixture.nativeElement.querySelector('svg').classList.contains('mirrored')).toBe(false);
  });
});
