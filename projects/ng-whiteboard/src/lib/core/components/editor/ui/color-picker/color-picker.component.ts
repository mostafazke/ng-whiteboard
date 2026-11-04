import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { MIXED, Mixed } from '../../utils/selected-properties';

/**
 * Seeds for the native picker when the value is mixed or not a hex color. A native color input only
 * reports a pick that differs from its current value, so the seeds are unlikely picks and alternate
 * after each completed edit, so a seed the user picked once is not the seed next time.
 */
const NATIVE_SEEDS = ['#7f7f80', '#808081'];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** A cancelled native picker may fire neither `change` nor `blur`, so an edit also ends this long after its last `input`. */
const COLOR_EDIT_SETTLE_MS = 400;

@Component({
  selector: 'ng-color-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="color-picker-container">
      <div class="color-swatches">
        <button
          class="custom-color-swatch"
          (click)="openCustomPicker()"
          [attr.title]="isMixed ? 'Mixed' : 'Custom color: ' + currentColor"
          [attr.aria-label]="isMixed ? 'Mixed' : 'Custom color'"
        >
          <div class="color-preview" [style.backgroundColor]="isMixed ? null : currentColor"></div>
          <input
            #colorInput
            type="color"
            tabindex="-1"
            aria-hidden="true"
            [value]="nativeColor"
            (input)="onColorChange($event)"
            (change)="finishEdit()"
            (blur)="finishEdit()"
            style="opacity: 0; position: absolute; width: 1px; height: 1px; cursor: pointer;"
          />
        </button>
        <div class="color-separator"></div>
        <button
          *ngFor="let color of presetColors; trackBy: trackByColor"
          class="color-swatch"
          [style.backgroundColor]="color"
          [class.active]="!isMixed && color === value"
          (click)="selectPresetColor(color)"
          [attr.title]="color"
          [attr.aria-label]="'Color ' + color"
          [attr.aria-pressed]="!isMixed && color === value"
        ></button>
      </div>
    </div>
  `,
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.mixed]': 'isMixed' },
})
export class ColorPickerComponent implements OnDestroy {
  @Input() value: Mixed<string> = '#000000';
  @Output() colorChange = new EventEmitter<string>();
  /** The native picker started a continuous edit; `editEnd` fires on commit, blur or once input settles. */
  @Output() editStart = new EventEmitter<EventTarget>();
  @Output() editEnd = new EventEmitter<EventTarget | null>();
  @ViewChild('colorInput') colorInput!: ElementRef<HTMLInputElement>;
  private cdr = inject(ChangeDetectorRef);
  private seedIndex = 0;
  private editTarget: EventTarget | null = null;
  private settleTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy() {
    if (this.settleTimer !== null) this.finishEdit();
  }

  get isMixed(): boolean {
    return this.value === MIXED;
  }

  get currentColor(): string {
    return this.value === MIXED ? NATIVE_SEEDS[this.seedIndex] : this.value;
  }

  get nativeColor(): string {
    return this.value !== MIXED && HEX_COLOR.test(this.value) ? this.value : NATIVE_SEEDS[this.seedIndex];
  }

  presetColors = [
    '#000000', // Black
    '#ef4444', // Red
    '#eab308', // Yellow
    '#3b82f6', // Blue
    '#22c55e', // Green
    '#ffffff', // White
  ];

  onColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.editTarget = target;
    this.editStart.emit(target);
    this.colorChange.emit(target.value);
    this.clearSettleTimer();
    this.settleTimer = setTimeout(() => this.finishEdit(), COLOR_EDIT_SETTLE_MS);
  }

  finishEdit() {
    this.clearSettleTimer();
    if (this.editTarget === null) return;
    const target = this.editTarget;
    this.editTarget = null;
    this.seedIndex = 1 - this.seedIndex;
    this.cdr.markForCheck();
    this.editEnd.emit(target);
  }

  private clearSettleTimer() {
    if (this.settleTimer === null) return;
    clearTimeout(this.settleTimer);
    this.settleTimer = null;
  }

  selectPresetColor(color: string) {
    this.colorChange.emit(color);
  }

  openCustomPicker() {
    if (this.colorInput) {
      this.colorInput.nativeElement.click();
    }
  }

  trackByColor(index: number, color: string): string {
    return color;
  }
}
