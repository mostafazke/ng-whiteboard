import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementType, WhiteboardElement } from '../../../../types';
import { MIXED, SelectedProperties } from '../../utils/selected-properties';
import { PropertiesPanelComponent } from './properties-panel.component';

const rect = (id: string, style = {}): WhiteboardElement =>
  ({ id, type: ElementType.Rectangle, x: 0, y: 0, rotation: 0, opacity: 100, zIndex: 1, style }) as WhiteboardElement;

describe('PropertiesPanelComponent', () => {
  let fixture: ComponentFixture<PropertiesPanelComponent>;

  const props = (overrides: Partial<SelectedProperties> = {}): SelectedProperties => ({
    strokeColor: '#000000',
    fillColor: '#000000',
    strokeWidth: 2,
    dasharray: '',
    opacity: 100,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PropertiesPanelComponent] });
    fixture = TestBed.createComponent(PropertiesPanelComponent);
  });

  it('shows mixed swatch when stroke is MIXED', () => {
    fixture.componentRef.setInput('selectedElements', [rect('a'), rect('b')]);
    fixture.componentRef.setInput('selectedProperties', props({ strokeColor: MIXED, strokeWidth: MIXED }));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const pickers = Array.from(el.querySelectorAll('ng-color-picker'));
    const mixedPickers = pickers.filter((p) => p.classList.contains('mixed'));
    expect(mixedPickers.length).toBe(1);
    expect(mixedPickers[0].querySelector('[aria-label="Mixed"]')).not.toBeNull();

    const displays = Array.from(el.querySelectorAll('.value-display')).map((d) => d.textContent?.trim());
    expect(displays).toContain('—');
    expect(displays).not.toContain('MIXED');
  });

  it('shows concrete values when not mixed', () => {
    fixture.componentRef.setInput('selectedElements', [rect('a'), rect('b')]);
    fixture.componentRef.setInput('selectedProperties', props({ strokeWidth: 4 }));
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('ng-color-picker.mixed')).toBeNull();
    const displays = Array.from(el.querySelectorAll('.value-display')).map((d) => d.textContent?.trim());
    expect(displays).toContain('4px');
  });

  it('does not emit changes on render when mixed', () => {
    const spy = jest.fn();
    fixture.componentInstance.propertyChange.subscribe(spy);
    fixture.componentInstance.colorChange.subscribe(spy);
    fixture.componentRef.setInput('selectedElements', [rect('a'), rect('b')]);
    fixture.componentRef.setInput('selectedProperties', props({ strokeColor: MIXED, opacity: MIXED }));
    fixture.detectChanges();
    expect(spy).not.toHaveBeenCalled();
  });
});
