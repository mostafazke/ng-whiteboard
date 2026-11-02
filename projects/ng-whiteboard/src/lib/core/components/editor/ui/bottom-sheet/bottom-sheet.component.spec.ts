import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BottomSheetComponent } from './bottom-sheet.component';

@Component({
  standalone: true,
  imports: [BottomSheetComponent],
  template: `
    <button class="opener" (click)="open.set(true)">Open</button>
    <ng-bottom-sheet [open]="open()" label="Test sheet" (closed)="onClosed()">
      <button class="first">First</button>
      <button class="last">Last</button>
    </ng-bottom-sheet>
  `,
})
class HostComponent {
  open = signal(false);
  closedCount = 0;
  onClosed() {
    this.closedCount++;
    this.open.set(false);
  }
}

@Component({
  standalone: true,
  imports: [BottomSheetComponent],
  template: `
    <div class="fallback" tabindex="-1" #fallback>
      <button class="opener" #opener (click)="open.set(true)">Open</button>
    </div>
    <button class="other">Other</button>
    @if (show()) {
      <ng-bottom-sheet
        [open]="open()"
        [opener]="explicit() ? opener : null"
        [focusFallback]="fallback"
        label="Dyn"
        (closed)="open.set(false)"
      >
        <button class="first">First</button>
      </ng-bottom-sheet>
    }
  `,
})
class DynamicHostComponent {
  open = signal(true);
  show = signal(true);
  explicit = signal(false);
}

describe('BottomSheetComponent focus restoration', () => {
  let fixture: ComponentFixture<DynamicHostComponent>;
  const q = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement;

  const setup = async (explicit: boolean, focusOpenerFirst: boolean) => {
    fixture = TestBed.createComponent(DynamicHostComponent);
    fixture.componentInstance.open.set(false);
    fixture.componentInstance.explicit.set(explicit);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    if (focusOpenerFirst) q('.opener').focus();
    else (document.activeElement as HTMLElement | null)?.blur();
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
  };

  afterEach(() => fixture.nativeElement.remove());

  it('restores focus to an explicit opener when nothing was focused (iOS tap)', async () => {
    await setup(true, false);
    expect(document.activeElement).toBe(q('.first'));
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(q('.opener'));
  });

  it('restores focus when the sheet is destroyed while open', async () => {
    await setup(false, true);
    expect(document.activeElement).toBe(q('.first'));
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(q('.opener'));
  });

  it('focuses the fallback when the opener is gone by the time the sheet is destroyed', async () => {
    await setup(true, true);
    expect(document.activeElement).toBe(q('.first'));
    q('.opener').remove();
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(q('.fallback'));
  });

  it('focuses the fallback when the opener is gone by the time the sheet closes', async () => {
    await setup(true, true);
    q('.opener').remove();
    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(q('.fallback'));
  });

  it('does not steal focus on destroy when focus already moved outside the sheet', async () => {
    await setup(false, true);
    q('.other').focus();
    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(q('.other'));
  });
});

describe('BottomSheetComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const find = (sel: string) => fixture.nativeElement.querySelector(sel) as HTMLElement | null;
  const q = (sel: string): HTMLElement => {
    const el = find(sel);
    if (!el) throw new Error(`missing ${sel}`);
    return el;
  };

  const openSheet = async () => {
    const opener = q('.opener');
    opener.focus();
    opener.click();
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => fixture.nativeElement.remove());

  it('renders nothing while closed', () => {
    expect(find('.bs-sheet')).toBeNull();
  });

  it('renders a labelled dialog when open', async () => {
    await openSheet();
    const sheet = q('.bs-sheet');
    expect(sheet.getAttribute('role')).toBe('dialog');
    expect(sheet.getAttribute('aria-label')).toBe('Test sheet');
  });

  it('closes on Escape', async () => {
    await openSheet();
    q('.bs-sheet').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(host.closedCount).toBe(1);
  });

  it('closes on backdrop click', async () => {
    await openSheet();
    q('.bs-backdrop').click();
    expect(host.closedCount).toBe(1);
  });

  it('focuses first focusable on open', async () => {
    await openSheet();
    expect(document.activeElement).toBe(q('.first'));
  });

  it('returns focus to the opener on close', async () => {
    await openSheet();
    host.open.set(false);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(q('.opener'));
  });

  it('Tab from last focusable wraps to first', async () => {
    await openSheet();
    q('.last').focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    q('.last').dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(q('.first'));
  });

  it('Shift+Tab from first focusable wraps to last', async () => {
    await openSheet();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    q('.first').dispatchEvent(tab);
    expect(document.activeElement).toBe(q('.last'));
  });

  it('closes when the handle is swiped down more than 80px', async () => {
    await openSheet();
    const handle = q('.bs-handle');
    handle.dispatchEvent(pointer('pointerdown', 100));
    handle.dispatchEvent(pointer('pointermove', 190));
    handle.dispatchEvent(pointer('pointerup', 190));
    expect(host.closedCount).toBe(1);
  });

  it('stays open on a short swipe', async () => {
    await openSheet();
    const handle = q('.bs-handle');
    handle.dispatchEvent(pointer('pointerdown', 100));
    handle.dispatchEvent(pointer('pointermove', 150));
    handle.dispatchEvent(pointer('pointerup', 150));
    expect(host.closedCount).toBe(0);
  });
});

function pointer(type: string, clientY: number): Event {
  const event = new MouseEvent(type, { clientY, bubbles: true });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  return event;
}
