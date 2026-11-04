import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { handleRadioKeydown, tabbableRadioIndex } from '../radio-group-keys';
import { MIXED } from '../../utils/selected-properties';

export interface SegmentedOption {
  value: string;
  label: string;
}

@Component({
  selector: 'wb-segmented-control',
  standalone: true,
  template: `
    <div class="wb-segmented" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options(); track option.value; let i = $index) {
        <button
          type="button"
          class="wb-segmented-option"
          role="radio"
          [attr.aria-checked]="option.value === value()"
          [tabIndex]="i === tabbableIndex() ? 0 : -1"
          (click)="select(option.value)"
          (keydown)="onKeydown($event, i)"
        >
          {{ option.label }}
        </button>
      }
    </div>
  `,
  styleUrl: './segmented-control.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class SegmentedControlComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  label = input.required<string>();
  options = input.required<readonly SegmentedOption[]>();
  value = input<string | typeof MIXED | undefined>(undefined);
  valueChange = output<string>();

  protected tabbableIndex = computed(() => tabbableRadioIndex(this.options(), this.value()));

  protected select(value: string): void {
    this.valueChange.emit(value);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    handleRadioKeydown(event, index, this.options().length, this.host.nativeElement, (next) =>
      this.select(this.options()[next].value)
    );
  }
}
