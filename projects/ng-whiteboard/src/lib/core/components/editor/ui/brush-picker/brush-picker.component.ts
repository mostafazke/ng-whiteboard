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
import { PenType } from '../../../../types';
import { PenRenderPipe } from '../../../../pipes/pen-render.pipe';
import { handleRadioKeydown, tabbableRadioIndex } from '../radio-group-keys';
import { MIXED } from '../../utils/selected-properties';
import { isLightColor } from '../../utils/color';

interface BrushOption {
  value: PenType;
  label: string;
}

const OPTIONS: readonly BrushOption[] = [
  { value: PenType.Pen, label: 'Pen' },
  { value: PenType.Marker, label: 'Marker' },
  { value: PenType.Highlighter, label: 'Highlighter' },
  { value: PenType.Brush, label: 'Brush' },
  { value: PenType.Pencil, label: 'Pencil' },
];

/** A gentle S-curve across the 40×28 preview box, slow at the start so pressure-based types show their swell. */
const PREVIEW_POINTS: number[][] = Array.from({ length: 24 }, (_, i) => {
  const t = i / 23;
  return [6 + t * 28, 14 - Math.sin(t * Math.PI * 1.6) * 6];
});

const PREVIEW_WIDTH = 1.6;

export function penTypeLabel(value: PenType | typeof MIXED | undefined): string {
  return OPTIONS.find((option) => option.value === value)?.label ?? '';
}

@Component({
  selector: 'wb-brush-picker',
  standalone: true,
  imports: [PenRenderPipe],
  template: `
    <div class="wb-brush-picker" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options; track option.value; let i = $index) {
        @let pen = previewPoints | penRender: option.value : previewWidth;
        <button
          type="button"
          class="wb-brush-option"
          role="radio"
          [attr.aria-label]="option.label"
          [attr.title]="option.label"
          [attr.aria-checked]="option.value === value()"
          [tabIndex]="i === tabbableIndex() ? 0 : -1"
          (click)="select(option.value)"
          (keydown)="onKeydown($event, i)"
        >
          <svg
            viewBox="0 0 40 28"
            aria-hidden="true"
            focusable="false"
            [class.light-ink]="lightInk()"
            [style.color]="previewColor()"
          >
            <g [attr.filter]="pen.filter" [style.mix-blend-mode]="pen.blendMode" [attr.opacity]="pen.opacity">
              @if (pen.filled) {
                <path [attr.d]="pen.d" fill="currentColor" />
              } @else {
                <path
                  [attr.d]="pen.d"
                  fill="none"
                  stroke="currentColor"
                  [attr.stroke-width]="pen.strokeWidth"
                  [attr.stroke-linecap]="pen.lineCap"
                  [attr.stroke-linejoin]="pen.lineJoin"
                />
              }
            </g>
          </svg>
        </button>
      }
    </div>
  `,
  styleUrl: './brush-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class BrushPickerComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly options = OPTIONS;
  protected readonly previewPoints = PREVIEW_POINTS;
  protected readonly previewWidth = PREVIEW_WIDTH;

  label = input.required<string>();
  value = input<PenType | typeof MIXED | undefined>(undefined);
  /** Previews are drawn in this color; falls back to the text color when absent or mixed. */
  color = input<string | typeof MIXED | undefined>(undefined);
  valueChange = output<PenType>();

  protected previewColor = computed(() => {
    const color = this.color();
    return typeof color === 'string' && color ? color : 'currentColor';
  });

  protected lightInk = computed(() => isLightColor(this.color()));

  protected tabbableIndex = computed(() => tabbableRadioIndex(OPTIONS, this.value()));

  protected select(value: PenType): void {
    this.valueChange.emit(value);
  }

  protected onKeydown(event: KeyboardEvent, index: number): void {
    handleRadioKeydown(event, index, OPTIONS.length, this.host.nativeElement, (next) =>
      this.select(OPTIONS[next].value)
    );
  }
}
