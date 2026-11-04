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
import { LineCap } from '../../../../types';
import { handleRadioKeydown, tabbableRadioIndex } from '../radio-group-keys';
import { MIXED } from '../../utils/selected-properties';
import { buildDasharray, LineStyle } from '../../utils/dasharray';
import { isLightColor } from '../../utils/color';

interface LineStyleOption {
  value: LineStyle;
  label: string;
}

const OPTIONS: readonly LineStyleOption[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'dashdot', label: 'Dash-dot' },
];

/** Preview thickness follows the stroke width but stays legible in a 40px tile. */
const MIN_PREVIEW_WIDTH = 1.5;
const MAX_PREVIEW_WIDTH = 4;

@Component({
  selector: 'wb-line-style-picker',
  standalone: true,
  template: `
    <div class="wb-line-style-picker" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options; track option.value; let i = $index) {
        <button
          type="button"
          class="wb-line-style-option"
          role="radio"
          [attr.aria-label]="option.label"
          [attr.title]="option.label"
          [attr.aria-checked]="option.value === value()"
          [tabIndex]="i === tabbableIndex() ? 0 : -1"
          (click)="select(option.value)"
          (keydown)="onKeydown($event, i)"
        >
          <svg
            viewBox="0 0 40 12"
            aria-hidden="true"
            focusable="false"
            [class.light-ink]="lightInk()"
            [style.color]="ink()"
          >
            <path
              d="M 4 6 L 36 6"
              fill="none"
              stroke="currentColor"
              [attr.stroke-width]="previewWidth()"
              [attr.stroke-linecap]="previewCap()"
              [attr.stroke-dasharray]="dashes()[i] || null"
            />
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './line-style-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class LineStylePickerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly options = OPTIONS;

  label = input.required<string>();
  value = input<LineStyle | typeof MIXED | undefined>(undefined);
  /** Previews are drawn in this color; falls back to the text color when absent or mixed. */
  color = input<string | typeof MIXED | undefined>(undefined);
  width = input<number>(2);
  lineCap = input<LineCap | typeof MIXED | undefined>(undefined);
  valueChange = output<LineStyle>();

  protected ink = computed(() => {
    const color = this.color();
    return typeof color === 'string' && color ? color : 'currentColor';
  });

  protected lightInk = computed(() => isLightColor(this.color()));

  protected previewWidth = computed(() =>
    Math.min(MAX_PREVIEW_WIDTH, Math.max(MIN_PREVIEW_WIDTH, this.width() || MIN_PREVIEW_WIDTH))
  );

  protected previewCap = computed(() => {
    const cap = this.lineCap();
    return cap === LineCap.Round || cap === LineCap.Square ? cap : LineCap.Butt;
  });

  /** Built at the preview width, so dash proportions and cap overlap match the canvas. */
  protected dashes = computed(() => OPTIONS.map((option) => buildDasharray(option.value, this.previewWidth())));

  protected tabbableIndex = computed(() => tabbableRadioIndex(OPTIONS, this.value()));

  protected select(value: LineStyle): void {
    this.valueChange.emit(value);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    handleRadioKeydown(event, index, OPTIONS.length, this.host.nativeElement, (next) =>
      this.select(OPTIONS[next].value)
    );
  }
}
