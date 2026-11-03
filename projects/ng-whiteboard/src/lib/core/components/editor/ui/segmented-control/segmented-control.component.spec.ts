import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MIXED } from '../../utils/selected-properties';
import { SegmentedControlComponent } from './segmented-control.component';

describe('SegmentedControlComponent', () => {
  let fixture: ComponentFixture<SegmentedControlComponent>;
  let emitted: string[];

  const radios = (): HTMLButtonElement[] => Array.from(fixture.nativeElement.querySelectorAll('[role="radio"]'));

  const setup = (value: string | typeof MIXED | undefined) => {
    fixture = TestBed.createComponent(SegmentedControlComponent);
    fixture.componentRef.setInput('label', 'Line ends');
    fixture.componentRef.setInput('options', [
      { value: 'round', label: 'Round' },
      { value: 'square', label: 'Square' },
      { value: 'butt', label: 'Flat' },
    ]);
    fixture.componentRef.setInput('value', value);
    emitted = [];
    fixture.componentInstance.valueChange.subscribe((v) => emitted.push(v));
    fixture.detectChanges();
  };

  beforeEach(() => TestBed.configureTestingModule({ imports: [SegmentedControlComponent] }));

  it('renders a labelled radiogroup with the checked option', () => {
    setup('square');
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]');
    expect(group.getAttribute('aria-label')).toBe('Line ends');
    expect(radios().map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false']);
    expect(radios().map((r) => r.tabIndex)).toEqual([-1, 0, -1]);
  });

  it('clicking an option emits its value', () => {
    setup('round');
    radios()[1].click();
    expect(emitted).toEqual(['square']);
  });

  it('ArrowRight emits the next value, focuses it and does not propagate', () => {
    setup('round');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true });
    const stop = jest.spyOn(event, 'stopPropagation');
    radios()[0].dispatchEvent(event);
    expect(emitted).toEqual(['square']);
    expect(document.activeElement).toBe(radios()[1]);
    expect(stop).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });

  it('keydown does not reach ancestors', () => {
    setup('round');
    const onParent = jest.fn();
    fixture.nativeElement.addEventListener('keydown', onParent);
    radios()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(onParent).not.toHaveBeenCalled();
  });

  it('wraps with ArrowLeft and jumps with Home and End', () => {
    setup('round');
    radios()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    radios()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    radios()[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    expect(emitted).toEqual(['butt', 'butt', 'round']);
  });

  it('ignores unrelated keys', () => {
    setup('round');
    const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
    const stop = jest.spyOn(event, 'stopPropagation');
    radios()[0].dispatchEvent(event);
    expect(emitted).toEqual([]);
    expect(stop).not.toHaveBeenCalled();
  });

  it('mixed value checks nothing and makes the first option tabbable', () => {
    setup(MIXED);
    expect(radios().some((r) => r.getAttribute('aria-checked') === 'true')).toBe(false);
    expect(radios().map((r) => r.tabIndex)).toEqual([0, -1, -1]);
  });
});
