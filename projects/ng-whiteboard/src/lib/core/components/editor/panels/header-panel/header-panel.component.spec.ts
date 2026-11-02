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
});
