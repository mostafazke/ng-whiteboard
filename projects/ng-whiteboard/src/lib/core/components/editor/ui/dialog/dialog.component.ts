import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  untracked,
  viewChild,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { getFocusableElements, wrapTabFocus } from '../../utils/focus-trap';
import { BottomSheetComponent } from '../bottom-sheet/bottom-sheet.component';

@Component({
  selector: 'ng-dialog',
  standalone: true,
  imports: [NgTemplateOutlet, IconComponent, BottomSheetComponent],
  template: `
    <ng-template #body>
      @if (heading()) {
        <div class="dlg-header">
          <h2 class="dlg-title">{{ heading() }}</h2>
          <button type="button" class="dlg-close" aria-label="Close" title="Close" (click)="close()">
            <ng-icon name="close"></ng-icon>
          </button>
        </div>
      }
      <div class="dlg-body"><ng-content /></div>
    </ng-template>

    @if (compact()) {
      <ng-bottom-sheet
        [label]="label()"
        [open]="open()"
        [opener]="opener()"
        [focusFallback]="focusFallback()"
        (closed)="close()"
      >
        <ng-container *ngTemplateOutlet="body" />
      </ng-bottom-sheet>
    } @else if (open()) {
      <div class="dlg-backdrop" (click)="close()"></div>
      <div
        #panel
        class="dlg"
        [class.dlg-sm]="size() === 'sm'"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
        [attr.aria-label]="label()"
        [attr.aria-describedby]="describedBy()"
        (keydown)="onKeydown($event)"
      >
        <ng-container *ngTemplateOutlet="body" />
      </div>
    }
  `,
  styleUrl: './dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogComponent {
  open = input(false);
  label = input('');
  /** Visible title; the dialog has no header when omitted. */
  heading = input('');
  compact = input(false);
  /** `sm` for short prompts such as confirmations. */
  size = input<'md' | 'sm'>('md');
  describedBy = input<string | null>(null);
  opener = input<HTMLElement | null>(null);
  focusFallback = input<HTMLElement | null>(null);
  closed = output<void>();

  private panel = viewChild<ElementRef<HTMLElement>>('panel');
  private restoreTarget: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const el = this.panel()?.nativeElement;
      untracked(() => (el ? this.focusInto(el) : this.restoreFocus()));
    });
    inject(DestroyRef).onDestroy(() => this.restoreFocus());
  }

  close() {
    this.closed.emit();
  }

  protected onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    const el = this.panel()?.nativeElement;
    if (el) wrapTabFocus(event, el);
  }

  private focusInto(panel: HTMLElement) {
    const active = panel.ownerDocument.activeElement;
    this.restoreTarget =
      this.opener() ?? (active instanceof HTMLElement && active !== panel.ownerDocument.body ? active : null);
    (getFocusableElements(panel)[0] ?? panel).focus();
  }

  private restoreFocus() {
    const target = this.restoreTarget;
    this.restoreTarget = null;
    if (target?.isConnected) target.focus();
    else if (target) this.focusFallback()?.focus({ preventScroll: true });
  }
}
