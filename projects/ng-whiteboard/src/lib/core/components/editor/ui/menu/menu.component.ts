import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { IconName } from '../../icon/icons';
import { nextRadioIndex } from '../radio-group-keys';

export interface MenuItem {
  id: string;
  label: string;
  icon: IconName;
  shortcut?: string;
}

@Component({
  selector: 'ng-menu',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div
      class="wb-menu"
      role="menu"
      [class.embedded]="embedded()"
      [attr.aria-label]="label()"
      (keydown)="onKeydown($event)"
    >
      @for (item of items(); track item.id; let i = $index) {
        <button
          type="button"
          role="menuitem"
          class="wb-menu-item"
          [attr.tabindex]="i === active() ? 0 : -1"
          (focus)="active.set(i)"
          (click)="itemSelected.emit(item.id)"
        >
          <ng-icon [name]="item.icon"></ng-icon>
          <span class="wb-menu-label">{{ item.label }}</span>
          @if (item.shortcut) {
            <span class="wb-menu-shortcut" aria-hidden="true">{{ item.shortcut }}</span>
          }
        </button>
      }
    </div>
  `,
  styleUrl: './menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {
  items = input<readonly MenuItem[]>([]);
  label = input('Menu');
  /** Inside a bottom sheet: the sheet owns Escape and initial focus. */
  embedded = input(false);
  itemSelected = output<string>();
  closeRequested = output<void>();

  protected active = signal(0);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    afterNextRender(
      () => {
        if (!this.embedded()) this.focusItem(0);
      },
      { injector: inject(Injector) }
    );
  }

  protected onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (this.embedded()) return;
      event.preventDefault();
      event.stopPropagation();
      this.closeRequested.emit();
      return;
    }
    const count = this.items().length;
    if (count === 0) return;
    const nodes = this.nodes();
    const current = nodes.indexOf(this.host.nativeElement.ownerDocument.activeElement as HTMLElement);
    const next = nextRadioIndex(event.key, Math.max(current, 0), count);
    if (next === null || event.key === 'ArrowLeft' || event.key === 'ArrowRight') return;
    event.preventDefault();
    this.focusItem(next);
  }

  private nodes(): HTMLElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[role="menuitem"]'));
  }

  private focusItem(index: number) {
    this.active.set(index);
    this.nodes()[index]?.focus();
  }
}
