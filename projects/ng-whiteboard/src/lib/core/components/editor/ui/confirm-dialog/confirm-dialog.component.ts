import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';

let nextConfirmId = 0;

@Component({
  selector: 'ng-confirm-dialog',
  standalone: true,
  imports: [DialogComponent],
  template: `
    <ng-dialog
      label="Confirm"
      size="sm"
      [describedBy]="messageId"
      [open]="open()"
      [compact]="compact()"
      [opener]="opener()"
      [focusFallback]="focusFallback()"
      (closed)="cancelled.emit()"
    >
      <p class="confirm-message" [id]="messageId">{{ message() }}</p>
      <div class="confirm-actions">
        <button type="button" class="cancel-btn" (click)="cancelled.emit()">Cancel</button>
        <button type="button" class="confirm-btn" (click)="confirmed.emit()">{{ confirmLabel() }}</button>
      </div>
    </ng-dialog>
  `,
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  protected readonly messageId = `wb-confirm-message-${nextConfirmId++}`;
  open = input(false);
  message = input('');
  confirmLabel = input('Confirm');
  compact = input(false);
  opener = input<HTMLElement | null>(null);
  focusFallback = input<HTMLElement | null>(null);
  confirmed = output<void>();
  cancelled = output<void>();
}
