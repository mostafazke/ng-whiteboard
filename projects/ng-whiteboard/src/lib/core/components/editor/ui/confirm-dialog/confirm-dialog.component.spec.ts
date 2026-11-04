import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  const buttons = () =>
    Array.from(
      fixture.nativeElement.querySelectorAll('.dlg button.confirm-btn, .dlg button.cancel-btn')
    ) as HTMLButtonElement[];

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmDialogComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.componentRef.setInput('message', 'Reset the canvas? This clears the board.');
    fixture.componentRef.setInput('confirmLabel', 'Reset');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });
  afterEach(() => fixture.nativeElement.remove());

  it('shows the message and Cancel then confirm buttons, focusing Cancel', () => {
    expect(fixture.nativeElement.textContent).toContain('Reset the canvas? This clears the board.');
    expect(buttons().map((b) => b.textContent?.trim())).toEqual(['Cancel', 'Reset']);
    expect(document.activeElement).toBe(buttons()[0]);
  });

  it('is narrow, has a short accessible name and describes itself with the message', () => {
    const dialog = fixture.nativeElement.querySelector('.dlg') as HTMLElement;
    expect(dialog.classList).toContain('dlg-sm');
    expect(dialog.getAttribute('aria-label')).toBe('Confirm');
    const message = fixture.nativeElement.querySelector('.confirm-message') as HTMLElement;
    expect(message.id).toBeTruthy();
    expect(dialog.getAttribute('aria-describedby')).toBe(message.id);
  });

  it('confirm and cancel emit', () => {
    const confirmed = jest.fn();
    const cancelled = jest.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.componentInstance.cancelled.subscribe(cancelled);
    buttons()[1].click();
    expect(confirmed).toHaveBeenCalledTimes(1);
    buttons()[0].click();
    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it('Escape cancels', () => {
    const cancelled = jest.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);
    buttons()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(cancelled).toHaveBeenCalledTimes(1);
  });
});
