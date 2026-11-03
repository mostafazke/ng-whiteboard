import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigService } from '../../../../config/config.service';
import { createElement } from '../../../../elements/element.utils';
import { ElementType, ToolType, WhiteboardElement } from '../../../../types';
import { MIXED, mergeSelectedProperties, SelectedProperties } from '../../utils/selected-properties';
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

  it('shows the fill picker as mixed when fill is MIXED', () => {
    fixture.componentRef.setInput('selectedElements', [rect('a'), rect('b')]);
    fixture.componentRef.setInput('selectedProperties', props({ fillColor: MIXED }));
    fixture.detectChanges();

    const pickers = Array.from(fixture.nativeElement.querySelectorAll('ng-color-picker')) as HTMLElement[];
    expect(pickers.map((p) => p.classList.contains('mixed'))).toEqual([true, false]);
  });

  it('marks no line style active when the dash pattern is MIXED', () => {
    fixture.componentRef.setInput('selectedElements', [rect('a'), rect('b')]);
    fixture.componentRef.setInput('selectedProperties', props({ dasharray: MIXED }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.line-style-btn').length).toBe(4);
    expect(fixture.nativeElement.querySelector('.line-style-btn.active')).toBeNull();
  });

  it('shows Mixed in the font family select when text fonts differ', () => {
    const text = (id: string, fontFamily: string) =>
      ({ ...rect(id, { fontFamily }), type: ElementType.Text }) as WhiteboardElement;
    fixture.componentRef.setInput('selectedElements', [text('a', 'Arial'), text('b', 'Georgia')]);
    fixture.componentRef.setInput('selectedProperties', props({ fontFamily: MIXED, fontSize: 16 }));
    fixture.detectChanges();

    const select = fixture.nativeElement.querySelector('select[aria-label="Font family"]') as HTMLSelectElement;
    expect(select.selectedOptions[0]?.textContent).toBe('Mixed');
    expect(select.value).toBe('');
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

  describe('contextual sections', () => {
    const el = (): HTMLElement => fixture.nativeElement;
    const query = (selector: string) => el().querySelector(selector);
    const labels = () => Array.from(el().querySelectorAll('label')).map((label) => label.textContent?.trim());
    const radio = (group: string, label: string) =>
      Array.from(el().querySelectorAll(`[aria-label="${group}"] [role="radio"]`)).find(
        (button) => button.textContent?.trim() === label
      ) as HTMLElement;

    const render = (elements: WhiteboardElement[], activeTool = ToolType.Select) => {
      fixture.componentRef.setInput('config', TestBed.inject(ConfigService).getConfig());
      fixture.componentRef.setInput('selectedElements', elements);
      fixture.componentRef.setInput('selectedProperties', mergeSelectedProperties(elements));
      fixture.componentRef.setInput('activeTool', activeTool);
      fixture.detectChanges();
    };

    const arrow = () => createElement(ElementType.Arrow, { id: 'arrow', x2: 100, y2: 0 });
    const image = () => createElement(ElementType.Image, { id: 'image', width: 10, height: 10 });
    const text = () => createElement(ElementType.Text, { id: 'text', text: 'Hi' });
    const rectangle = () => createElement(ElementType.Rectangle, { id: 'rect', width: 10, height: 10 });

    it('shows arrow heads, arrow path and line ends for an arrow, without fill or corner radius', () => {
      render([arrow()]);

      expect(query('wb-arrowhead-picker [aria-label="Start"]')).not.toBeNull();
      expect(query('wb-arrowhead-picker [aria-label="End"]')).not.toBeNull();
      expect(query('button[aria-label="Swap arrow heads"]')).not.toBeNull();
      expect(query('[role="radiogroup"][aria-label="Arrow path"]')).not.toBeNull();
      expect(query('[role="radiogroup"][aria-label="Line ends"]')).not.toBeNull();
      expect(labels()).not.toContain('Fill');
      expect(query('input[aria-label="Corner radius"]')).toBeNull();
    });

    it('shows only opacity among property sections for an image', () => {
      render([image()]);

      expect(el().querySelectorAll('ng-color-picker').length).toBe(0);
      expect(query('input[aria-label="Stroke width"]')).toBeNull();
      expect(el().querySelectorAll('.line-style-btn').length).toBe(0);
      expect(el().querySelectorAll('wb-segmented-control, wb-arrowhead-picker').length).toBe(0);
      expect(query('select[aria-label="Font family"]')).toBeNull();
      expect(query('input[aria-label="Opacity"]')).not.toBeNull();
    });

    it('labels the stroke as text color and shows font controls, no width or dash, for text', () => {
      render([text()]);

      expect(labels()).toContain('Text color');
      expect(labels()).not.toContain('Stroke');
      expect(query('select[aria-label="Font family"]')).not.toBeNull();
      expect(query('input[aria-label="Stroke width"]')).toBeNull();
      expect(el().querySelectorAll('.line-style-btn').length).toBe(0);
    });

    it('shows only stroke, width, dash and opacity for an arrow plus a rectangle', () => {
      render([arrow(), rectangle()]);

      expect(labels()).toContain('Stroke');
      expect(labels()).not.toContain('Fill');
      expect(query('input[aria-label="Stroke width"]')).not.toBeNull();
      expect(el().querySelectorAll('.line-style-btn').length).toBe(4);
      expect(query('input[aria-label="Opacity"]')).not.toBeNull();
      expect(query('input[aria-label="Corner radius"]')).toBeNull();
      expect(el().querySelectorAll('wb-segmented-control, wb-arrowhead-picker').length).toBe(0);
    });

    it('drops the arrow sections when the selection changes from an arrow to an image', () => {
      render([arrow()]);
      expect(query('wb-arrowhead-picker')).not.toBeNull();

      render([image()]);
      expect(query('wb-arrowhead-picker')).toBeNull();
      expect(query('wb-segmented-control')).toBeNull();
      expect(query('button[aria-label="Swap arrow heads"]')).toBeNull();
    });

    it('shows the brush and hides opacity for the pen tool with nothing selected', () => {
      render([], ToolType.Pen);

      const options = Array.from(el().querySelectorAll('[aria-label="Brush"] [role="radio"]'));
      expect(options.map((option) => option.textContent?.trim())).toEqual([
        'Pen',
        'Marker',
        'Highlighter',
        'Brush',
        'Pencil',
      ]);
      expect(radio('Brush', 'Pen').getAttribute('aria-checked')).toBe('true');
      expect(query('input[aria-label="Opacity"]')).toBeNull();
    });

    it('shows the default corner radius for the rectangle tool with nothing selected', () => {
      render([], ToolType.Rectangle);

      const slider = query('input[aria-label="Corner radius"]') as HTMLInputElement;
      expect([slider.min, slider.max, slider.value]).toEqual(['0', '50', '5']);
    });

    it('shows the config arrow defaults for the arrow tool with nothing selected', () => {
      render([], ToolType.Arrow);

      expect(radio('Arrow path', 'Curved').getAttribute('aria-checked')).toBe('true');
      expect(radio('Line ends', 'Round').getAttribute('aria-checked')).toBe('true');
      expect(query('[aria-label="End"] [aria-label="Open arrow"]')?.getAttribute('aria-checked')).toBe('true');
      expect(query('[aria-label="Start"] [aria-label="None"]')?.getAttribute('aria-checked')).toBe('true');
    });

    it('shows the general controls without fill for the select tool with nothing selected', () => {
      render([], ToolType.Select);

      expect(labels()).toEqual(expect.arrayContaining(['Background', 'Stroke', 'Width', 'Line Style']));
      expect(labels()).not.toContain('Fill');
      expect(el().querySelectorAll('.line-style-btn').length).toBe(4);
    });

    it('labels the stroke as text color for the text tool with nothing selected', () => {
      render([], ToolType.Text);

      expect(labels()).toContain('Text color');
      expect(query('select[aria-label="Font family"]')).not.toBeNull();
    });

    it('hides bold and italic for the text tool with nothing selected', () => {
      render([], ToolType.Text);

      expect(query('button[aria-label="Bold"]')).toBeNull();
      expect(query('button[aria-label="Italic"]')).toBeNull();
      expect(query('select[aria-label="Font family"]')).not.toBeNull();
      expect(query('input[aria-label="Font size"]')).not.toBeNull();
    });

    it('emits the arrow path and end head choices', () => {
      const spy = jest.fn();
      fixture.componentInstance.propertyChange.subscribe(spy);
      render([arrow()]);

      radio('Arrow path', 'Curved').click();
      (query('[aria-label="End"] [aria-label="Bar"]') as HTMLElement).click();

      expect(spy.mock.calls.map(([event]) => event)).toEqual([
        { property: 'arrowPath', value: 'curve' },
        { property: 'endHead', value: 'bar' },
      ]);
    });

    it('emits line ends, swap and brush changes', () => {
      const spy = jest.fn();
      fixture.componentInstance.propertyChange.subscribe(spy);
      render([arrow()]);

      radio('Line ends', 'Flat').click();
      (query('button[aria-label="Swap arrow heads"]') as HTMLElement).click();
      render([], ToolType.Pen);
      radio('Brush', 'Marker').click();

      expect(spy.mock.calls.map(([event]) => event)).toEqual([
        { property: 'lineCap', value: 'butt' },
        { property: 'swapArrowHeads', value: true },
        { property: 'penType', value: 'marker' },
      ]);
    });

    it('opens an edit batch while dragging the corner radius', () => {
      const changes = jest.fn();
      const starts = jest.fn();
      fixture.componentInstance.propertyChange.subscribe(changes);
      fixture.componentInstance.editStart.subscribe(starts);
      render([rectangle()]);

      const slider = query('input[aria-label="Corner radius"]') as HTMLInputElement;
      slider.value = '12';
      slider.dispatchEvent(new Event('input'));

      expect(starts).toHaveBeenCalledWith(slider);
      expect(changes).toHaveBeenCalledWith({ property: 'cornerRadius', value: 12 });
    });
  });
});
