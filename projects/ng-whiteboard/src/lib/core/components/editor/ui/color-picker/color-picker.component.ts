import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MIXED, Mixed } from '../../utils/selected-properties';

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
            [value]="currentColor"
            (input)="onColorChange($event)"
            (change)="editEnd.emit()"
            (blur)="editEnd.emit()"
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
export class ColorPickerComponent {
  @Input() value: Mixed<string> = '#000000';
  @Output() colorChange = new EventEmitter<string>();
  /** The native picker started a continuous edit; `editEnd` fires when it commits or loses focus. */
  @Output() editStart = new EventEmitter<void>();
  @Output() editEnd = new EventEmitter<void>();
  @ViewChild('colorInput') colorInput!: ElementRef<HTMLInputElement>;

  get isMixed(): boolean {
    return this.value === MIXED;
  }

  get currentColor(): string {
    return this.value === MIXED ? '#000000' : this.value;
  }

  // Curated preset colors - most commonly used
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
    this.editStart.emit();
    this.colorChange.emit(target.value);
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
