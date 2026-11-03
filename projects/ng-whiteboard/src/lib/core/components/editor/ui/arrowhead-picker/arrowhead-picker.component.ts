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
import { ArrowheadType } from '../../../../elements';
import { nextRadioIndex } from '../radio-group-keys';
import { MIXED } from '../../utils/selected-properties';

interface ArrowheadOption {
  value: ArrowheadType;
  label: string;
  shape: string;
  filled: boolean;
}

const DIAMOND = 'M 20 12 L 14 7 L 8 12 L 14 17 Z';
const CIRCLE = 'M 20 12 A 5 5 0 1 0 10 12 A 5 5 0 1 0 20 12 Z';

const OPTIONS: readonly ArrowheadOption[] = [
  { value: ArrowheadType.None, label: 'None', shape: '', filled: false },
  { value: ArrowheadType.Arrow, label: 'Arrow', shape: 'M 20 12 L 11 7 L 11 17 Z', filled: true },
  { value: ArrowheadType.OpenArrow, label: 'Open arrow', shape: 'M 12 7 L 20 12 L 12 17', filled: false },
  { value: ArrowheadType.Diamond, label: 'Diamond', shape: DIAMOND, filled: true },
  { value: ArrowheadType.OpenDiamond, label: 'Open diamond', shape: DIAMOND, filled: false },
  { value: ArrowheadType.Circle, label: 'Circle', shape: CIRCLE, filled: true },
  { value: ArrowheadType.OpenCircle, label: 'Open circle', shape: CIRCLE, filled: false },
  { value: ArrowheadType.Bar, label: 'Bar', shape: 'M 20 6 L 20 18', filled: false },
];

@Component({
  selector: 'wb-arrowhead-picker',
  standalone: true,
  template: `
    <div class="wb-arrowhead-picker" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options; track option.value; let i = $index) {
        <button
          type="button"
          class="wb-arrowhead-option"
          role="radio"
          [attr.aria-label]="option.label"
          [attr.title]="option.label"
          [attr.aria-checked]="option.value === value()"
          [tabIndex]="i === tabbableIndex() ? 0 : -1"
          (click)="select(option.value)"
          (keydown)="onKeydown($event, i)"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            aria-hidden="true"
            focusable="false"
            [class.mirrored]="end() === 'start'"
          >
            <path d="M 2 12 L 20 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            @if (option.shape) {
              <path
                [attr.d]="option.shape"
                [attr.fill]="option.filled ? 'currentColor' : 'none'"
                stroke="currentColor"
                stroke-width="2"
                stroke-linejoin="round"
                stroke-linecap="round"
              />
            }
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './arrowhead-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ArrowheadPickerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly options = OPTIONS;

  label = input.required<string>();
  value = input<ArrowheadType | typeof MIXED | undefined>(undefined);
  end = input<'start' | 'end'>('end');
  valueChange = output<ArrowheadType>();

  protected tabbableIndex = computed(() => {
    const index = OPTIONS.findIndex((option) => option.value === this.value());
    return index < 0 ? 0 : index;
  });

  protected select(value: ArrowheadType): void {
    this.valueChange.emit(value);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    const next = nextRadioIndex(event.key, index, OPTIONS.length);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    this.select(OPTIONS[next].value);
    this.host.nativeElement.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
  }
}
