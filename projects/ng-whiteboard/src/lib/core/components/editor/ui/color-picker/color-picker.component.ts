import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'ng-color-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="color-picker-container">
      <div class="color-swatches">
        <button class="custom-color-swatch" (click)="openCustomPicker()" [attr.title]="'Custom color: ' + value">
          <div class="color-preview" [style.backgroundColor]="value"></div>
          <input
            #colorInput
            type="color"
            [value]="value"
            (input)="onColorChange($event)"
            style="opacity: 0; position: absolute; width: 1px; height: 1px; cursor: pointer;"
          />
        </button>
        <div class="color-separator"></div>
        <button
          *ngFor="let color of presetColors; trackBy: trackByColor"
          class="color-swatch"
          [style.backgroundColor]="color"
          [class.active]="color === value"
          (click)="selectPresetColor(color)"
          [attr.title]="color"
        ></button>
      </div>
    </div>
  `,
  styleUrl: './color-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPickerComponent {
  @Input() value = '#000000';
  @Output() colorChange = new EventEmitter<string>();
  @ViewChild('colorInput') colorInput!: ElementRef<HTMLInputElement>;

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
    console.log('🚀 ~ ColorPickerComponent ~ onColorChange ~ event:', event);
    const target = event.target as HTMLInputElement;
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
