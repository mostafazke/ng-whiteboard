import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayerPanelComponent, WhiteboardLayer } from './layer-panel.component';

describe('LayerPanelComponent', () => {
  let fixture: ComponentFixture<LayerPanelComponent>;
  let component: LayerPanelComponent;

  const layer = (opacity: number): WhiteboardLayer => ({
    id: 'l1',
    name: 'Layer 1',
    visible: true,
    locked: false,
    opacity,
    zIndex: 0,
    type: 'drawing',
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LayerPanelComponent] }).compileComponents();
    fixture = TestBed.createComponent(LayerPanelComponent);
    component = fixture.componentInstance;
  });

  it('layer opacity shows 100% for opacity 1', () => {
    component.layers = [layer(1)];
    fixture.detectChanges();
    const text = fixture.nativeElement.querySelector('.opacity-value').textContent.trim();
    expect(text).toBe('100%');
  });

  it('emits opacity as 0-1 when the slider moves', () => {
    component.layers = [layer(1)];
    fixture.detectChanges();
    const emitted: { layerId: string; opacity: number }[] = [];
    component.layerOpacityChanged.subscribe((e) => emitted.push(e));
    const slider: HTMLInputElement = fixture.nativeElement.querySelector('.opacity-slider');
    slider.value = '50';
    slider.dispatchEvent(new Event('input'));
    expect(emitted).toEqual([{ layerId: 'l1', opacity: 0.5 }]);
  });
});
