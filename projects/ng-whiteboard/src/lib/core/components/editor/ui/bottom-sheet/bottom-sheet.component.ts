import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { getFocusableElements, wrapTabFocus } from '../../utils/focus-trap';

const SWIPE_CLOSE_DISTANCE = 80;

@Component({
  selector: 'ng-bottom-sheet',
  standalone: true,
  template: `
    @if (open()) {
      <div class="bs-backdrop" (click)="close()"></div>
      <div
        #sheet
        class="bs-sheet"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-label]="label()"
        [class.dragging]="dragStartY !== null"
        [style.transform]="dragOffset() > 0 ? 'translateY(' + dragOffset() + 'px)' : null"
        (keydown)="onKeydown($event)"
      >
        <div
          class="bs-handle"
          (pointerdown)="onHandleDown($event)"
          (pointermove)="onHandleMove($event)"
          (pointerup)="onHandleUp()"
          (pointercancel)="resetDrag()"
        >
          <span class="bs-handle-bar"></span>
        </div>
        <div class="bs-content">
          <ng-content />
        </div>
      </div>
    }
  `,
  styleUrl: './bottom-sheet.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomSheetComponent {
  open = input(false);
  label = input('');
  closed = output<void>();

  protected dragOffset = signal(0);
  protected dragStartY: number | null = null;

  private sheet = viewChild<ElementRef<HTMLElement>>('sheet');
  private opener: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const el = this.sheet()?.nativeElement;
      untracked(() => (el ? this.focusInto(el) : this.restoreFocus()));
    });
  }

  close() {
    this.resetDrag();
    this.closed.emit();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    const el = this.sheet()?.nativeElement;
    if (el) wrapTabFocus(event, el);
  }

  onHandleDown(event: PointerEvent) {
    this.dragStartY = event.clientY;
    const handle = event.currentTarget as HTMLElement | null;
    try {
      handle?.setPointerCapture?.(event.pointerId);
    } catch {
      // pointer may already be released
    }
  }

  onHandleMove(event: PointerEvent) {
    if (this.dragStartY === null) return;
    this.dragOffset.set(Math.max(0, event.clientY - this.dragStartY));
  }

  onHandleUp() {
    if (this.dragStartY === null) return;
    if (this.dragOffset() > SWIPE_CLOSE_DISTANCE) this.close();
    else this.resetDrag();
  }

  resetDrag() {
    this.dragStartY = null;
    this.dragOffset.set(0);
  }

  private focusInto(sheet: HTMLElement) {
    const active = sheet.ownerDocument.activeElement;
    this.opener = active instanceof HTMLElement && active !== sheet.ownerDocument.body ? active : null;
    (getFocusableElements(sheet)[0] ?? sheet).focus();
  }

  private restoreFocus() {
    const opener = this.opener;
    this.opener = null;
    if (opener?.isConnected) opener.focus();
  }
}
