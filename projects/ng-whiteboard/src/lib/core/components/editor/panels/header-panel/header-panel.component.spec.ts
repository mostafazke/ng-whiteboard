import { TestBed } from '@angular/core/testing';
import { EditorStateService } from '../../editor-state.service';
import { HeaderPanelComponent } from './header-panel.component';

describe('HeaderPanelComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: EditorStateService, useValue: {} }] });
  });

  it('passes layer opacity to the layer panel as 0-1', () => {
    const fixture = TestBed.createComponent(HeaderPanelComponent);
    fixture.componentRef.setInput('layers', [
      { id: 'l1', name: 'L', visible: true, locked: false, zIndex: 0, elements: [], opacity: 1 },
    ]);
    const [layer] = fixture.componentInstance.convertLayersToWhiteboardLayers();
    expect(layer.opacity).toBe(1);
  });

  it('Escape in compact leaves the layers sheet to handle it', () => {
    const fixture = TestBed.createComponent(HeaderPanelComponent);
    fixture.componentRef.setInput('compact', true);
    fixture.componentRef.setInput('showLayers', true);
    fixture.detectChanges();
    const toggled = jest.fn();
    fixture.componentInstance.layersToggle.subscribe(toggled);
    const reachedParent = jest.fn();
    fixture.nativeElement.addEventListener('keydown', reachedParent);

    const trigger = fixture.nativeElement.querySelector('.layers-button') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(toggled).not.toHaveBeenCalled();
    expect(reachedParent).toHaveBeenCalled();
  });
});
