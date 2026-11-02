import { TestBed } from '@angular/core/testing';
import { WhiteboardConfig } from '../../../../types';
import { ControlsPanelComponent } from './controls-panel.component';

describe('ControlsPanelComponent', () => {
  it('Escape in compact leaves the zoom sheet to handle it', () => {
    const fixture = TestBed.createComponent(ControlsPanelComponent);
    fixture.componentRef.setInput('config', { zoom: 1 } as WhiteboardConfig);
    fixture.componentRef.setInput('compact', true);
    fixture.componentRef.setInput('showZoomMenu', true);
    fixture.detectChanges();
    const toggled = jest.fn();
    fixture.componentInstance.zoomMenuToggle.subscribe(toggled);
    const reachedParent = jest.fn();
    fixture.nativeElement.addEventListener('keydown', reachedParent);

    const trigger = fixture.nativeElement.querySelector('.zoom-value') as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(fixture.nativeElement.querySelector('.zoom-dropdown')).toBeNull();
    expect(toggled).not.toHaveBeenCalled();
    expect(reachedParent).toHaveBeenCalled();
  });

  it('each zoom action emits its own output', () => {
    const fixture = TestBed.createComponent(ControlsPanelComponent);
    fixture.componentRef.setInput('config', { zoom: 1 } as WhiteboardConfig);
    const panel = fixture.componentInstance;
    const emitted: string[] = [];
    panel.zoomToFit.subscribe(() => emitted.push('fit'));
    panel.zoomToSelection.subscribe(() => emitted.push('selection'));
    panel.resetZoom.subscribe(() => emitted.push('reset'));

    panel.runZoomAction('fit');
    panel.runZoomAction('selection');
    panel.runZoomAction('reset');

    expect(emitted).toEqual(['fit', 'selection', 'reset']);
  });
});
