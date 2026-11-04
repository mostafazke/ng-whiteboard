import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Output } from '@angular/core';
import { ArrowheadType } from '../../../../elements';
import {
  DEFAULT_CORNER_RADIUS,
  ElementType,
  LineCap,
  ToolType,
  WhiteboardConfig,
  WhiteboardElement,
} from '../../../../types';
import { AlignmentType } from '../../utils/alignment';
import { IconComponent } from '../../icon/icon.component';
import { lineStyleOf } from '../../utils/dasharray';
import { MIXED, SelectedProperties } from '../../utils/selected-properties';
import { PropertySection, sectionsForElements, sectionsForTool } from '../../utils/shape-capabilities';
import { ColorPickerComponent } from '../../ui/color-picker/color-picker.component';
import { AlignmentControlsComponent } from '../../ui/alignment-controls/alignment-controls.component';
import { SegmentedControlComponent, SegmentedOption } from '../../ui/segmented-control/segmented-control.component';
import { ArrowheadPickerComponent } from '../../ui/arrowhead-picker/arrowhead-picker.component';
import { BrushPickerComponent, penTypeLabel } from '../../ui/brush-picker/brush-picker.component';
import { LineStylePickerComponent } from '../../ui/line-style-picker/line-style-picker.component';

interface ColorPickerEvent {
  property: 'strokeColor' | 'fillColor' | 'backgroundColor';
  value: string;
}

interface PropertyChangeEvent {
  property: string;
  value: string | number | boolean;
}

const LINE_END_OPTIONS: readonly SegmentedOption[] = [
  { value: LineCap.Round, label: 'Round' },
  { value: LineCap.Square, label: 'Square' },
  { value: LineCap.Butt, label: 'Flat' },
];

const ARROW_PATH_OPTIONS: readonly SegmentedOption[] = [
  { value: 'straight', label: 'Straight' },
  { value: 'curve', label: 'Curved' },
  { value: 'elbow', label: 'Elbow' },
];

@Component({
  selector: 'ng-properties-panel',
  standalone: true,
  imports: [
    IconComponent,
    ColorPickerComponent,
    AlignmentControlsComponent,
    SegmentedControlComponent,
    ArrowheadPickerComponent,
    BrushPickerComponent,
    LineStylePickerComponent,
  ],
  template: `
    <div class="properties-panel">
      <div class="panel-content" [class.open]="isOpen()">
        <div class="panel-header">
          <h3 class="panel-title">Actions</h3>
          <div class="actions-bar">
            <button
              title="Toggle Grid"
              aria-label="Toggle Grid"
              class="icon-btn"
              (click)="gridToggle.emit()"
              [class.active]="config().enableGrid"
            >
              <ng-icon name="grid"></ng-icon>
            </button>
            <button
              title="Snap to Grid"
              aria-label="Snap to Grid"
              class="icon-btn"
              (click)="snapToggle.emit()"
              [class.active]="config().snapToGrid"
            >
              <ng-icon name="snap"></ng-icon>
            </button>
            <button
              title="Delete"
              aria-label="Delete"
              class="icon-btn danger"
              (click)="deleteSelected.emit()"
              [disabled]="!hasSelection()"
            >
              <ng-icon name="clear"></ng-icon>
            </button>
            <div class="flex-spacer"></div>
            <button title="Close Panel" aria-label="Close Panel" class="icon-btn" (click)="togglePanel.emit()">
              <ng-icon [name]="embedded() ? 'close' : 'panelRightClose'"></ng-icon>
            </button>
          </div>
        </div>

        <div class="panel-sections">
          @if (!hasSelection() || show('fill')) {
            <div class="section">
              <div class="controls">
                @if (!hasSelection()) {
                  <div class="control-row">
                    <label>Background</label>
                    <ng-color-picker
                      [value]="config().backgroundColor"
                      (colorChange)="onColorChange('backgroundColor', $event)"
                      (editStart)="editStart.emit($event)"
                      (editEnd)="editEnd.emit($event)"
                    >
                    </ng-color-picker>
                  </div>
                }

                @if (show('fill')) {
                  <div class="control-row">
                    <label>Fill</label>
                    <ng-color-picker
                      [value]="fillColorValue()"
                      (colorChange)="onColorChange('fillColor', $event)"
                      (editStart)="editStart.emit($event)"
                      (editEnd)="editEnd.emit($event)"
                    >
                    </ng-color-picker>
                  </div>
                }
              </div>
            </div>
          }

          <div class="section">
            <div class="controls">
              @if (show('stroke') || show('strokeWidth') || show('strokeStyle') || show('lineEnds')) {
                <div class="control-group">
                  @if (show('stroke')) {
                    <div class="control-row">
                      <label>{{ textOnly() ? 'Text color' : 'Stroke' }}</label>
                      <ng-color-picker
                        [value]="strokeColorValue()"
                        (colorChange)="onColorChange('strokeColor', $event)"
                        (editStart)="editStart.emit($event)"
                        (editEnd)="editEnd.emit($event)"
                      >
                      </ng-color-picker>
                    </div>
                  }

                  @if (show('strokeWidth')) {
                    <div class="control-slider">
                      <label class="slider-label">Width</label>
                      <div class="slider-container">
                        <input
                          type="range"
                          min="1"
                          max="20"
                          aria-label="Stroke width"
                          [value]="strokeWidthNumber()"
                          (input)="onSliderInput('strokeWidth', $event)"
                          (change)="editEnd.emit($any($event.target))"
                          (blur)="editEnd.emit($any($event.target))"
                        />
                        <span class="value-display">{{
                          isMixed(strokeWidthValue()) ? '—' : strokeWidthNumber() + 'px'
                        }}</span>
                      </div>
                    </div>
                  }

                  @if (show('strokeStyle')) {
                    <div class="control-row">
                      <label>Line style</label>
                      <wb-line-style-picker
                        label="Line style"
                        [value]="lineStyleValue()"
                        [color]="strokeColorValue()"
                        [width]="strokeWidthNumber()"
                        [lineCap]="lineCapValue()"
                        (valueChange)="emitChange('lineStyle', $event)"
                      ></wb-line-style-picker>
                    </div>
                  }

                  @if (show('lineEnds')) {
                    <div class="control-row">
                      <label>Line ends</label>
                      <wb-segmented-control
                        label="Line ends"
                        [options]="lineEndOptions"
                        [value]="lineCapValue()"
                        (valueChange)="emitChange('lineCap', $event)"
                      ></wb-segmented-control>
                    </div>
                  }
                </div>
              }

              @if (show('cornerRadius')) {
                <div class="control-group">
                  <div class="control-slider">
                    <label class="slider-label">Corner radius</label>
                    <div class="slider-container">
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        aria-label="Corner radius"
                        [value]="cornerRadiusNumber()"
                        (input)="onSliderInput('cornerRadius', $event)"
                        (change)="editEnd.emit($any($event.target))"
                        (blur)="editEnd.emit($any($event.target))"
                      />
                      <span class="value-display">{{
                        isMixed(cornerRadiusValue()) ? '—' : cornerRadiusNumber() + 'px'
                      }}</span>
                    </div>
                  </div>
                </div>
              }

              @if (show('arrowHeads')) {
                <div class="control-group">
                  <div class="group-header">
                    <label class="group-label">Arrow heads</label>
                    <button
                      type="button"
                      class="swap-btn"
                      title="Swap arrow heads"
                      aria-label="Swap arrow heads"
                      (click)="emitChange('swapArrowHeads', true)"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        aria-hidden="true"
                        focusable="false"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M8 3 4 7l4 4" />
                        <path d="M4 7h16" />
                        <path d="m16 21 4-4-4-4" />
                        <path d="M20 17H4" />
                      </svg>
                    </button>
                  </div>
                  <div class="control-row">
                    <label>Start</label>
                    <wb-arrowhead-picker
                      label="Start"
                      end="start"
                      [value]="startHeadValue()"
                      (valueChange)="emitChange('startHead', $event)"
                    ></wb-arrowhead-picker>
                  </div>
                  <div class="control-row">
                    <label>End</label>
                    <wb-arrowhead-picker
                      label="End"
                      end="end"
                      [value]="endHeadValue()"
                      (valueChange)="emitChange('endHead', $event)"
                    ></wb-arrowhead-picker>
                  </div>
                </div>
              }

              @if (show('arrowPath')) {
                <div class="control-group">
                  <div class="control-row">
                    <label>Arrow path</label>
                    <wb-segmented-control
                      label="Arrow path"
                      [options]="arrowPathOptions"
                      [value]="arrowPathValue()"
                      (valueChange)="emitChange('arrowPath', $event)"
                    ></wb-segmented-control>
                  </div>
                </div>
              }

              @if (show('brush')) {
                <div class="control-group brush">
                  <div class="control-row">
                    <div class="brush-header">
                      <label>Brush</label>
                      <span class="brush-name">{{ brushName() }}</span>
                    </div>
                    <wb-brush-picker
                      label="Brush"
                      [value]="config().penType"
                      [color]="strokeColorValue()"
                      (valueChange)="emitChange('penType', $event)"
                    ></wb-brush-picker>
                  </div>
                </div>
              }

              @if (show('opacity')) {
                <div class="control-group">
                  <div class="control-slider">
                    <label class="slider-label">Opacity</label>
                    <div class="slider-container">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        aria-label="Opacity"
                        [value]="opacityNumber()"
                        (input)="onSliderInput('opacity', $event)"
                        (change)="editEnd.emit($any($event.target))"
                        (blur)="editEnd.emit($any($event.target))"
                      />
                      <span class="value-display">{{ isMixed(opacityValue()) ? '—' : opacityNumber() + '%' }}</span>
                    </div>
                  </div>
                </div>
              }

              @if (selectedElements().length > 1) {
                <div class="control-group">
                  <label class="group-label">Alignment</label>
                  <ng-alignment-controls
                    [selectedElements]="selectedElements()"
                    (alignmentChange)="alignmentChange.emit($event)"
                  >
                  </ng-alignment-controls>
                </div>
              }
            </div>
          </div>

          @if (show('font')) {
            <div class="section">
              <div class="controls">
                <div class="control-row">
                  <label>Font Family</label>
                  <select
                    aria-label="Font family"
                    [value]="isMixed(fontFamilyValue()) ? '' : fontFamilyValue()"
                    (change)="onPropertyChange('fontFamily', $event)"
                  >
                    @if (isMixed(fontFamilyValue())) {
                      <option value="" disabled selected>Mixed</option>
                    }
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
                      aria-label="Font size"
                      [value]="fontSizeNumber()"
                      (input)="onSliderInput('fontSize', $event)"
                      (change)="editEnd.emit($any($event.target))"
                      (blur)="editEnd.emit($any($event.target))"
                    />
                    <span class="value-display">{{ isMixed(fontSizeValue()) ? '—' : fontSizeNumber() + 'px' }}</span>
                  </div>
                </div>

                @if (hasSelection()) {
                  <div class="control-group">
                    <label class="group-label">Text Style</label>
                    <div class="button-group">
                      <button
                        class="style-btn"
                        [class.active]="isBold()"
                        (click)="toggleBold()"
                        title="Bold"
                        aria-label="Bold"
                      >
                        <strong>B</strong>
                      </button>
                      <button
                        class="style-btn"
                        [class.active]="isItalic()"
                        (click)="toggleItalic()"
                        title="Italic"
                        aria-label="Italic"
                      >
                        <em>I</em>
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>

      @if (!isOpen() && !embedded()) {
        <button
          class="panel-toggle-btn"
          title="Open Properties Panel"
          aria-label="Open Properties Panel"
          (click)="togglePanel.emit()"
        >
          <ng-icon name="panelRightOpen"></ng-icon>
        </button>
      }
    </div>
  `,
  styleUrl: './properties-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.embedded]': 'embedded()' },
})
export class PropertiesPanelComponent {
  config = input<WhiteboardConfig>({} as WhiteboardConfig);
  selectedElements = input<WhiteboardElement[]>([]);
  selectedProperties = input<SelectedProperties | null>(null);
  isOpen = input<boolean>(true);
  embedded = input<boolean>(false);
  /** Drives the sections shown when nothing is selected. */
  activeTool = input<ToolType>(ToolType.Select);

  @Output() colorChange = new EventEmitter<ColorPickerEvent>();
  @Output() propertyChange = new EventEmitter<PropertyChangeEvent>();
  @Output() gridToggle = new EventEmitter<void>();
  @Output() snapToggle = new EventEmitter<void>();
  @Output() deleteSelected = new EventEmitter<void>();
  @Output() togglePanel = new EventEmitter<void>();
  @Output() alignmentChange = new EventEmitter<AlignmentType>();
  /** A continuous edit (slider drag, native color picker) started; closed by `editEnd`. */
  @Output() editStart = new EventEmitter<EventTarget | null>();
  @Output() editEnd = new EventEmitter<EventTarget | null>();

  protected readonly lineEndOptions = LINE_END_OPTIONS;
  protected readonly arrowPathOptions = ARROW_PATH_OPTIONS;
  protected brushName = computed(() => penTypeLabel(this.config().penType));

  hasSelection = computed(() => this.selectedElements().length > 0);

  sections = computed(() =>
    this.hasSelection()
      ? sectionsForElements(this.selectedElements().map((el) => el.type))
      : sectionsForTool(this.activeTool())
  );

  textOnly = computed(() =>
    this.hasSelection()
      ? this.selectedElements().every((el) => el.type === ElementType.Text)
      : this.activeTool() === ToolType.Text
  );

  strokeColorValue = computed(() => this.selectedProperties()?.strokeColor ?? this.config().strokeColor);
  fillColorValue = computed(() => this.selectedProperties()?.fillColor ?? this.config().fill);
  strokeWidthValue = computed(() => this.selectedProperties()?.strokeWidth ?? this.config().strokeWidth);
  opacityValue = computed(() => this.selectedProperties()?.opacity ?? 100);
  fontSizeValue = computed(() => this.selectedProperties()?.fontSize ?? this.config().fontSize);
  fontFamilyValue = computed(() => this.selectedProperties()?.fontFamily ?? this.config().fontFamily);
  dashArrayValue = computed(() => this.selectedProperties()?.dasharray ?? (this.config().dasharray || ''));

  lineCapValue = computed(() => this.selectedProperties()?.lineCap ?? this.config().lineCap);
  cornerRadiusValue = computed(
    () => this.selectedProperties()?.cornerRadius ?? this.config().cornerRadius ?? DEFAULT_CORNER_RADIUS
  );
  startHeadValue = computed(
    () => this.selectedProperties()?.startHead ?? (this.config().arrowConfig?.startHeadStyle as ArrowheadType)
  );
  endHeadValue = computed(
    () => this.selectedProperties()?.endHead ?? (this.config().arrowConfig?.endHeadStyle as ArrowheadType)
  );
  arrowPathValue = computed(() => this.selectedProperties()?.arrowPath ?? this.config().arrowConfig?.lineStyle);

  strokeWidthNumber = computed(() => this.numberOr(this.strokeWidthValue(), this.config().strokeWidth));
  opacityNumber = computed(() => this.numberOr(this.opacityValue(), 100));
  fontSizeNumber = computed(() => this.numberOr(this.fontSizeValue(), this.config().fontSize));
  cornerRadiusNumber = computed(() => this.numberOr(this.cornerRadiusValue(), DEFAULT_CORNER_RADIUS));

  isBold = computed(() => {
    const texts = this.selectedElements().filter((el) => el.type === ElementType.Text);
    return texts.length > 0 && texts.every((el) => el.style.fontWeight === 'bold');
  });

  isItalic = computed(() => {
    const texts = this.selectedElements().filter((el) => el.type === ElementType.Text);
    return texts.length > 0 && texts.every((el) => el.style.fontStyle === 'italic');
  });

  /** The style is read from the pattern's proportions, so it survives stroke width changes. */
  lineStyleValue = computed(() => {
    const dasharray = this.dashArrayValue();
    if (dasharray !== MIXED) return lineStyleOf(dasharray);
    const styles = new Set(this.selectedElements().map((el) => lineStyleOf(el.style?.dasharray)));
    return styles.size === 1 ? [...styles][0] : MIXED;
  });

  show(section: PropertySection): boolean {
    return this.sections().has(section);
  }

  isMixed(value: unknown): boolean {
    return value === MIXED;
  }

  private numberOr(value: number | typeof MIXED, fallback: number): number {
    return value === MIXED ? fallback : value;
  }

  onColorChange(property: ColorPickerEvent['property'], value: string) {
    this.colorChange.emit({ property, value });
  }

  onPropertyChange(property: string, event: Event) {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    this.propertyChange.emit({ property, value: target.value });
  }

  emitChange(property: string, value: string | boolean) {
    this.propertyChange.emit({ property, value });
  }

  onSliderInput(property: 'strokeWidth' | 'opacity' | 'fontSize' | 'cornerRadius', event: Event) {
    this.editStart.emit(event.target);
    this.propertyChange.emit({ property, value: Number((event.target as HTMLInputElement).value) });
  }

  toggleBold() {
    this.emitChange('fontWeight', this.isBold() ? 'normal' : 'bold');
  }

  toggleItalic() {
    this.emitChange('fontStyle', this.isItalic() ? 'normal' : 'italic');
  }
}
