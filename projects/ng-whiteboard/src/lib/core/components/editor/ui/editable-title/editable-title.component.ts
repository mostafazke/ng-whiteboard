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
  viewChild,
} from '@angular/core';
import { IconComponent } from '../../icon/icon.component';
import { DEFAULT_BOARD_TITLE } from '../../utils/board-title';

@Component({
  selector: 'ng-editable-title',
  standalone: true,
  imports: [IconComponent],
  template: `
    @if (editing()) {
      <input
        #field
        class="title-input"
        type="text"
        aria-label="Board title"
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
        (keydown)="onKeydown($event)"
        (blur)="commit(false)"
      />
    } @else {
      <button #trigger type="button" class="title-button" aria-label="Rename board" [title]="value()" (click)="start()">
        <span class="title-text">{{ value() }}</span>
        <ng-icon class="title-pencil" name="pencil"></ng-icon>
      </button>
    }
  `,
  styleUrl: './editable-title.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditableTitleComponent {
  value = input(DEFAULT_BOARD_TITLE);
  valueChange = output<string>();

  protected editing = signal(false);
  protected draft = signal('');
  private field = viewChild<ElementRef<HTMLInputElement>>('field');
  private trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private injector = inject(Injector);

  protected start() {
    this.draft.set(this.value());
    this.editing.set(true);
    afterNextRender(
      () => {
        const input = this.field()?.nativeElement;
        input?.focus();
        input?.select();
      },
      { injector: this.injector }
    );
  }

  protected onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.commit(true);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.finish(true);
    }
  }

  protected commit(refocus: boolean) {
    if (!this.editing()) return;
    this.valueChange.emit(this.draft().trim() || DEFAULT_BOARD_TITLE);
    this.finish(refocus);
  }

  private finish(refocus: boolean) {
    this.editing.set(false);
    if (!refocus) return;
    afterNextRender(() => this.trigger()?.nativeElement.focus(), { injector: this.injector });
  }
}
