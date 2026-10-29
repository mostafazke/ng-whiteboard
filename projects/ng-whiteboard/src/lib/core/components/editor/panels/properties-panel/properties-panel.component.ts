import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ElementType, WhiteboardConfig, WhiteboardElement } from '../../../../types';
import { AlignmentType } from '../../ui/alignment-controls/alignment-controls.component';
import { IconComponent } from '../../icon/icon.component';
import { ColorPickerComponent } from '../../ui/color-picker/color-picker.component';
import { AlignmentControlsComponent } from '../../ui/alignment-controls/alignment-controls.component';

interface ColorPickerEvent {
  property: 'strokeColor' | 'fillColor' | 'backgroundColor';
  value: string;
}

interface PropertyChangeEvent {
  property: string;
  value: string | number | boolean;
}

@Component({
  selector: 'ng-properties-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ColorPickerComponent, AlignmentControlsComponent],
  template: `
    <!-- Properties Panel -->
    <div class="properties-panel">
      <div class="panel-content" [class.open]="isOpen()">
        <div class="panel-header">
          <h3 class="panel-title">Actions</h3>
          <div class="actions-bar">
            <button title="Toggle Grid" class="icon-btn" (click)="onGridToggle()" [class.active]="config().enableGrid">
              <ng-icon name="grid"></ng-icon>
            </button>
            <button title="Snap to Grid" class="icon-btn" (click)="onSnapToggle()" [class.active]="config().snapToGrid">
              <ng-icon name="snap"></ng-icon>
            </button>
            <button title="Delete" class="icon-btn danger" (click)="onDelete()" [disabled]="!hasSelection()">
              <ng-icon name="clear"></ng-icon>
            </button>
            <div class="flex-spacer"></div>
            <button title="Close Panel" class="icon-btn toggle-panel" (click)="togglePanel.emit()">
              <ng-icon name="panelRightClose"></ng-icon>
            </button>
          </div>
        </div>

        <div class="panel-sections">
          <!-- Canvas Properties -->
          <div class="section">
            <div class="controls">
              <div class="control-row" *ngIf="!hasSelection()">
                <label>Background</label>
                <ng-color-picker
                  [value]="config().backgroundColor"
                  (colorChange)="onColorChange('backgroundColor', $event)"
                >
                </ng-color-picker>
              </div>

              <!-- Fill Controls -->
              <div class="control-row" *ngIf="hasSelection()">
                <label>Fill</label>
                <ng-color-picker [value]="fillColorValue()" (colorChange)="onColorChange('fillColor', $event)">
                </ng-color-picker>
              </div>
            </div>
          </div>

          <!-- Shape Properties -->
          <div class="section">
            <div class="controls">
              <!-- Stroke Controls -->
              <div class="control-group">
                <div class="control-row">
                  <label>Stroke</label>
                  <ng-color-picker
                    [value]="strokeColorValue() || '#000000'"
                    (colorChange)="onColorChange('strokeColor', $event)"
                  >
                  </ng-color-picker>
                </div>

                <div class="control-slider">
                  <label class="slider-label">Width</label>
                  <div class="slider-container">
                    <input
                      type="range"
                      min="1"
                      max="20"
                      [value]="strokeWidthValue()"
                      (input)="onPropertyChange('strokeWidth', $event)"
                    />
                    <span class="value-display">{{ strokeWidthValue() }}px</span>
                  </div>
                </div>

                <div class="control-row" *ngIf="!hasTextSelection()">
                  <label>Line Style</label>
                  <div class="line-style-buttons">
                    <button
                      class="line-style-btn"
                      [class.active]="dashArrayValue() === ''"
                      (click)="onLineStyleChange('')"
                      title="Solid"
                    >
                      <svg width="32" height="4" viewBox="0 0 32 4">
                        <line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2" />
                      </svg>
                    </button>
                    <button
                      class="line-style-btn"
                      [class.active]="isDashedActive()"
                      (click)="onLineStyleChange('dashed')"
                      title="Dashed"
                    >
                      <svg width="32" height="4" viewBox="0 0 32 4">
                        <line
                          x1="0"
                          y1="2"
                          x2="32"
                          y2="2"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-dasharray="5,5"
                        />
                      </svg>
                    </button>
                    <button
                      class="line-style-btn"
                      [class.active]="isDottedActive()"
                      (click)="onLineStyleChange('dotted')"
                      title="Dotted"
                    >
                      <svg width="32" height="4" viewBox="0 0 32 4">
                        <line
                          x1="0"
                          y1="2"
                          x2="32"
                          y2="2"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-dasharray="2,2"
                        />
                      </svg>
                    </button>
                    <button
                      class="line-style-btn"
                      [class.active]="isDashDotActive()"
                      (click)="onLineStyleChange('dashdot')"
                      title="Dash-Dot"
                    >
                      <svg width="32" height="4" viewBox="0 0 32 4">
                        <line
                          x1="0"
                          y1="2"
                          x2="32"
                          y2="2"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-dasharray="10,5,2,5"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Opacity Control (only available when elements are selected) -->
              <div class="control-group" *ngIf="hasSelection()">
                <div class="control-slider">
                  <label class="slider-label">Opacity</label>
                  <div class="slider-container">
                    <input type="range" min="0" max="100" [value]="opacityValue()" (input)="onOpacityChange($event)" />
                    <span class="value-display">{{ opacityValue() }}%</span>
                  </div>
                </div>
              </div>

              <!-- Alignment Controls -->
              <div class="control-group" *ngIf="hasSelection() && selectedElements().length > 1">
                <label class="group-label">Alignment</label>
                <ng-alignment-controls
                  [selectedElements]="selectedElements()"
                  (alignmentChange)="onAlignmentChange($event)"
                >
                </ng-alignment-controls>
              </div>
            </div>
          </div>

          <!-- Text Properties (when text is selected) -->
          <div class="section" *ngIf="hasTextSelection()">
            <div class="controls">
              <div class="control-row">
                <label>Font Family</label>
                <select [value]="fontFamilyValue()" (change)="onPropertyChange('fontFamily', $event)">
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="monospace">Monospace</option>
                  <option value="Courier New">Courier New</option>
                </select>
              </div>

              <div class="control-slider">
                <label class="slider-label">Font Size</label>
                <div class="slider-container">
                  <input
                    type="range"
                    min="8"
                    max="72"
                    [value]="fontSizeValue()"
                    (input)="onPropertyChange('fontSize', $event)"
                  />
                  <span class="value-display">{{ fontSizeValue() }}px</span>
                </div>
              </div>

              <div class="control-group">
                <label class="group-label">Text Style</label>
                <div class="button-group">
                  <button class="style-btn" [class.active]="isBold()" (click)="toggleBold()" title="Bold">
                    <strong>B</strong>
                  </button>
                  <button class="style-btn" [class.active]="isItalic()" (click)="toggleItalic()" title="Italic">
                    <em>I</em>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Panel Toggle Button -->
      <button *ngIf="!isOpen()" class="panel-toggle-btn" title="Open Properties Panel" (click)="togglePanel.emit()">
        <ng-icon name="panelRightOpen"></ng-icon>
      </button>
    </div>
  `,
  styleUrl: './properties-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertiesPanelComponent {
  config = input<WhiteboardConfig>({} as WhiteboardConfig);
  selectedElements = input<WhiteboardElement[]>([]);
  selectedProperties = input<Record<string, unknown>>({});
  isOpen = input<boolean>(true);

  @Output() colorChange = new EventEmitter<ColorPickerEvent>();
  @Output() propertyChange = new EventEmitter<PropertyChangeEvent>();
  @Output() gridToggle = new EventEmitter<void>();
  @Output() snapToggle = new EventEmitter<void>();
  @Output() deleteSelected = new EventEmitter<void>();
  @Output() togglePanel = new EventEmitter<void>();
  @Output() alignmentChange = new EventEmitter<AlignmentType>();

  // Computed properties for better performance
  selectedElement = computed(() => this.selectedElements()[0] || null);
  hasSelection = computed(() => this.selectedElements().length > 0);
  hasTextSelection = computed(() => this.selectedElements().some((el) => el.type === ElementType.Text));

  strokeColorValue = computed(() => {
    const element = this.selectedElement();
    if (!element) return this.config().strokeColor;

    return element.style.strokeColor || this.config().strokeColor;
  });

  fillColorValue = computed(() => {
    const element = this.selectedElement();
    if (!element) return this.config().fill;
    return element.style.fill || this.config().fill;
  });

  strokeWidthValue = computed(() => {
    const element = this.selectedElement();
    if (!element) return this.config().strokeWidth;
    return element.style.strokeWidth || this.config().strokeWidth;
  });

  opacityValue = computed(() => {
    const element = this.selectedElement();
    // Opacity only applies to selected elements, default to 100
    if (!element) return 100;
    return element.opacity || 100;
  });

  fontSizeValue = computed(() => {
    const element = this.selectedElement();
    if (!element || element.type !== ElementType.Text) return this.config().fontSize;
    return element.style.fontSize || this.config().fontSize;
  });

  fontFamilyValue = computed(() => {
    const element = this.selectedElement();
    if (!element || element.type !== ElementType.Text) return this.config().fontFamily;
    return element.style.fontFamily || this.config().fontFamily;
  });

  dashArrayValue = computed(() => {
    const element = this.selectedElement();
    // Return config default or empty string when no selection
    if (!element) return this.config().dasharray || '';
    return element.style.dasharray || '';
  });

  isBold = computed(() => {
    const element = this.selectedElement();
    if (!element || element.type !== ElementType.Text) return false;
    return element.style.fontWeight === 'bold';
  });

  isItalic = computed(() => {
    const element = this.selectedElement();
    if (!element || element.type !== ElementType.Text) return false;
    return element.style.fontStyle === 'italic';
  });

  isDashedActive = computed(() => {
    const dasharray = this.dashArrayValue();
    const width = this.strokeWidthValue();
    // Dashed pattern: dash length ~3x width, gap ~3x width
    return dasharray === `${width * 3},${width * 3}`;
  });

  isDottedActive = computed(() => {
    const dasharray = this.dashArrayValue();
    const width = this.strokeWidthValue();
    // Dotted pattern: dash length ~1x width, gap ~2x width
    return dasharray === `${width},${width * 2}`;
  });

  isDashDotActive = computed(() => {
    const dasharray = this.dashArrayValue();
    const width = this.strokeWidthValue();
    // Dash-dot pattern: long dash ~5x, gap ~2x, short dash ~1x, gap ~2x
    return dasharray === `${width * 5},${width * 2},${width},${width * 2}`;
  });

  onColorChange(property: ColorPickerEvent['property'], value: string) {
    this.colorChange.emit({ property, value });
  }

  onPropertyChange(property: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = property === 'fontSize' || property === 'strokeWidth' ? Number(target.value) : target.value;

    this.propertyChange.emit({ property, value });
  }

  onOpacityChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.propertyChange.emit({
      property: 'opacity',
      value: Number(target.value),
    });
  }

  onGridToggle() {
    this.gridToggle.emit();
  }

  onSnapToggle() {
    this.snapToggle.emit();
  }

  onDelete() {
    this.deleteSelected.emit();
  }

  onAlignmentChange(alignment: AlignmentType) {
    this.alignmentChange.emit(alignment);
  }

  toggleBold() {
    const currentValue = this.isBold();
    this.propertyChange.emit({
      property: 'fontWeight',
      value: currentValue ? 'normal' : 'bold',
    });
  }

  toggleItalic() {
    const currentValue = this.isItalic();
    this.propertyChange.emit({
      property: 'fontStyle',
      value: currentValue ? 'normal' : 'italic',
    });
  }

  onLineStyleChange(style: string) {
    const width = this.strokeWidthValue();
    let dasharray = '';

    switch (style) {
      case 'dashed':
        dasharray = `${width * 3},${width * 3}`;
        break;
      case 'dotted':
        dasharray = `${width},${width * 2}`;
        break;
      case 'dashdot':
        dasharray = `${width * 5},${width * 2},${width},${width * 2}`;
        break;
      default:
        dasharray = ''; // solid
    }

    this.propertyChange.emit({
      property: 'dasharray',
      value: dasharray,
    });
  }
}
