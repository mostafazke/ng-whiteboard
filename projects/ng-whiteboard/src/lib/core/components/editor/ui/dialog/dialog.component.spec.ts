import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';

@Component({
  standalone: true,
  imports: [DialogComponent],
  template: `
    <button #opener id="opener">open</button>
    <ng-dialog
      label="Export image"
      heading="Export image"
      [compact]="compact()"
      [open]="open()"
      [opener]="opener"
      (closed)="open.set(false)"
    >
      <button id="first">First</button>
      <button id="last">Last</button>
    </ng-dialog>
  `,
})
class HostComponent {
  open = signal(false);
  compact = signal(false);
}

describe('DialogComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const q = <T extends HTMLElement>(sel: string) => fixture.nativeElement.querySelector(sel) as T;
  const press = (target: HTMLElement, init: KeyboardEventInit) =>
    target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
  const show = () => {
    q<HTMLButtonElement>('#opener').focus();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });
  afterEach(() => fixture.nativeElement.remove());

  it('renders nothing while closed', () => {
    expect(q('[role="dialog"]')).toBeNull();
  });

  it('opens a labelled modal with its heading and focuses inside', () => {
    show();
    const dialog = q('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Export image');
    expect(dialog.querySelector('h2')?.textContent).toContain('Export image');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('traps Tab and Shift+Tab inside', () => {
    show();
    q<HTMLButtonElement>('#last').focus();
    press(q('#last'), { key: 'Tab' });
    expect(document.activeElement).toBe(q('.dlg-close'));
    press(q('.dlg-close'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(q('#last'));
  });

  it('Escape closes and returns focus to the opener', () => {
    show();
    press(q('#first'), { key: 'Escape' });
    fixture.detectChanges();
    expect(fixture.componentInstance.open()).toBe(false);
    expect(q('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(q('#opener'));
  });

  it('is wide by default', () => {
    show();
    expect(q('.dlg').classList).not.toContain('dlg-sm');
  });

  it('the backdrop closes it', () => {
    show();
    q<HTMLElement>('.dlg-backdrop').click();
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('becomes a bottom sheet when compact', () => {
    fixture.componentInstance.compact.set(true);
    show();
    expect(q('ng-bottom-sheet .bs-sheet')).not.toBeNull();
    expect(q('.dlg')).toBeNull();
    expect(q('ng-bottom-sheet').textContent).toContain('First');
  });
});
