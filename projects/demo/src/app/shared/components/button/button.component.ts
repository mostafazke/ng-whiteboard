import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button [type]="type" [disabled]="disabled || loading" [ngClass]="classes" (click)="handleClick($event)">
      @if (loading) {
      <span class="spinner"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      @import '../../../styles/mixins';

      button {
        @include button-base;

        &.btn-primary {
          @include button-primary;
        }

        &.btn-secondary {
          @include button-secondary;
        }

        &.btn-ghost {
          @include button-ghost;
        }

        &.btn-danger {
          background: var(--color-error);
          color: white;

          &:hover:not(:disabled) {
            background: #dc2626;
          }
        }

        &.btn-sm {
          padding: var(--spacing-xs) var(--spacing-md);
          font-size: var(--font-size-sm);
        }

        &.btn-md {
          padding: var(--spacing-sm) var(--spacing-lg);
          font-size: var(--font-size-base);
        }

        &.btn-lg {
          padding: var(--spacing-md) var(--spacing-xl);
          font-size: var(--font-size-lg);
        }

        &.full-width {
          width: 100%;
        }

        .spinner {
          display: inline-block;
          width: 1em;
          height: 1em;
          border: 2px solid currentColor;
          border-right-color: transparent;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  get classes(): string[] {
    return [`btn-${this.variant}`, `btn-${this.size}`, this.fullWidth ? 'full-width' : ''].filter(Boolean);
  }

  handleClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}
