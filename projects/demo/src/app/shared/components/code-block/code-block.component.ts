import { Component, Input, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { copyToClipboard } from '../../utils/helpers';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="code-block" [ngClass]="{ 'with-header': title }">
      @if (title) {
      <div class="code-header">
        <span class="code-title">{{ title }}</span>
        <button class="copy-btn" (click)="copy()" [attr.aria-label]="copied() ? 'Copied!' : 'Copy code'">
          {{ copied() ? '✓ Copied' : '📋 Copy' }}
        </button>
      </div>
      }
      <pre><code [attr.class]="language">{{ code }}</code></pre>
      @if (!title) {
      <button class="copy-btn-floating" (click)="copy()" [attr.aria-label]="copied() ? 'Copied!' : 'Copy code'">
        {{ copied() ? '✓' : '📋' }}
      </button>
      }
    </div>
  `,
  styles: [
    `
      .code-block {
        position: relative;
        background: var(--color-bg-tertiary);
        border: 1px solid var(--color-border-primary);
        border-radius: var(--radius-lg);
        overflow: hidden;
        margin: var(--spacing-lg) 0;
        box-shadow: var(--shadow-sm);
        transition: var(--transition-base);

        &:hover {
          box-shadow: var(--shadow-md);
          border-color: var(--color-border-secondary);
        }

        &.with-header {
          border-radius: var(--radius-lg);
        }

        .code-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-md) var(--spacing-lg);
          background: linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%);
          border-bottom: 1px solid var(--color-border-primary);
          position: relative;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--color-accent), transparent);
            opacity: 0.3;
          }

          .code-title {
            font-family: var(--font-family-mono);
            font-size: var(--font-size-sm);
            color: var(--color-text-primary);
            font-weight: var(--font-weight-semibold);
            display: flex;
            align-items: center;
            gap: var(--spacing-sm);

            &::before {
              content: '📄';
              font-size: 1rem;
            }
          }

          .copy-btn {
            padding: var(--spacing-sm) var(--spacing-md);
            font-size: var(--font-size-xs);
            font-weight: var(--font-weight-medium);
            height: auto;
            min-height: 0;
            background: var(--color-bg-primary);
            color: var(--color-text-secondary);
            border: 1px solid var(--color-border-secondary);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all var(--transition-base);
            display: flex;
            align-items: center;
            gap: var(--spacing-xs);
            box-shadow: var(--shadow-sm);

            &:hover {
              background: var(--color-accent);
              color: white;
              border-color: var(--color-accent);
              transform: translateY(-1px);
              box-shadow: var(--shadow-md);
            }

            &:active {
              transform: translateY(0);
              box-shadow: var(--shadow-sm);
            }

            &:focus-visible {
              outline: 2px solid var(--color-accent);
              outline-offset: 2px;
            }
          }
        }

        pre {
          margin: 0;
          padding: var(--spacing-lg);
          overflow-x: auto;
          background: var(--color-bg-primary);

          &::-webkit-scrollbar {
            height: 8px;
          }

          &::-webkit-scrollbar-track {
            background: var(--color-bg-secondary);
            border-radius: var(--radius-full);
          }

          &::-webkit-scrollbar-thumb {
            background: var(--color-border-secondary);
            border-radius: var(--radius-full);

            &:hover {
              background: var(--color-accent);
            }
          }

          code {
            font-family: var(--font-family-mono);
            font-size: var(--font-size-sm);
            line-height: var(--line-height-relaxed);
            background: none;
            padding: 0;
            color: var(--color-text-primary);
          }
        }

        .copy-btn-floating {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          width: 36px;
          height: 36px;
          padding: 0;
          font-size: var(--font-size-base);
          border-radius: var(--radius-md);
          background: var(--color-bg-secondary);
          color: var(--color-text-secondary);
          border: 1px solid var(--color-border-secondary);
          cursor: pointer;
          opacity: 0.8;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-sm);
          display: flex;
          align-items: center;
          justify-content: center;

          &:hover {
            opacity: 1;
            background: var(--color-accent);
            color: white;
            border-color: var(--color-accent);
            transform: translateY(-2px);
            box-shadow: var(--shadow-md);
          }

          &:active {
            transform: translateY(0);
            box-shadow: var(--shadow-sm);
          }

          &:focus-visible {
            outline: 2px solid var(--color-accent);
            outline-offset: 2px;
          }
        }
      }
    `,
  ],
})
export class CodeBlockComponent {
  @Input() code = '';
  @Input() language = '';
  @Input() title = '';

  copied = signal(false);

  async copy(): Promise<void> {
    const success = await copyToClipboard(this.code);
    if (success) {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
