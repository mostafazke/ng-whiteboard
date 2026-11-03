import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, EventEmitter, input, Output } from '@angular/core';
import { ArrowheadType } from '../../../../elements';
import { ElementType, LineCap, PenType, ToolType, WhiteboardConfig, WhiteboardElement } from '../../../../types';
import { AlignmentType } from '../../utils/alignment';
import { IconComponent } from '../../icon/icon.component';
import { buildDasharray } from '../../utils/dasharray';
import { MIXED, SelectedProperties } from '../../utils/selected-properties';
import { PropertySection, sectionsForElements, sectionsForTool } from '../../utils/shape-capabilities';
import { ColorPickerComponent } from '../../ui/color-picker/color-picker.component';
import { AlignmentControlsComponent } from '../../ui/alignment-controls/alignment-controls.component';
import { SegmentedControlComponent, SegmentedOption } from '../../ui/segmented-control/segmented-control.component';
import { ArrowheadPickerComponent } from '../../ui/arrowhead-picker/arrowhead-picker.component';

interface ColorPickerEvent {
  property: 'strokeColor' | 'fillColor' | 'backgroundColor';
  value: string;
}

interface PropertyChangeEvent {
  property: string;
  value: string | number | boolean;
}

const DEFAULT_CORNER_RADIUS = 5;

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

const BRUSH_OPTIONS: readonly SegmentedOption[] = [
  { value: PenType.Pen, label: 'Pen' },
  { value: PenType.Marker, label: 'Marker' },
  { value: PenType.Highlighter, label: 'Highlighter' },
  { value: PenType.Brush, label: 'Brush' },
  { value: PenType.Pencil, label: 'Pencil' },
];

@Component({
  selector: 'ng-properties-panel',
  standalone: true,
  imports: [
    CommonModule,
    IconComponent,
    ColorPickerComponent,
    AlignmentControlsComponent,
    SegmentedControlComponent,
    ArrowheadPickerComponent,
  ],
  template: `
    <!-- Properties Panel -->
    <div class="properties-panel">
      <div class="panel-content" [class.open]="isOpen()">
        <div class="panel-header">
          <h3 class="panel-title">Actions</h3>
          <div class="actions-bar">
            <button title="Toggle Grid" aria-label="Toggle Grid" class="icon-btn" (click)="onGridToggle()" [class.active]="config().enableGrid">
              <ng-icon name="grid"></ng-icon>
            </button>
            <button title="Snap to Grid" aria-label="Snap to Grid" class="icon-btn" (click)="onSnapToggle()" [class.active]="config().snapToGrid">
              <ng-icon name="snap"></ng-icon>
            </button>
            <button title="Delete" aria-label="Delete" class="icon-btn danger" (click)="onDelete()" [disabled]="!hasSelection()">
              <ng-icon name="clear"></ng-icon>
            </button>
            <div class="flex-spacer"></div>
            <button title="Close Panel" aria-label="Close Panel" class="icon-btn toggle-panel" (click)="togglePanel.emit()">
              <ng-icon [name]="embedded() ? 'close' : 'panelRightClose'"></ng-icon>
            </button>
          </div>
        </div>

        <div class="panel-sections">
          <!-- Canvas and fill -->
          @if (!hasSelection() || show('fill')) {
            <div class="section">
              <div class="controls">
                @if (!hasSelection()) {
                  <div class="control-row">
                    <label>Background</label>
                    <ng-color-picker
                      [value]="config().backgroundColor"
                      (colorChange)="onColorChange('backgroundColor', $event)"
                      (editStart)="editStart.emit($event)" (editEnd)="editEnd.emit($event)"
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
                      (editStart)="editStart.emit($event)" (editEnd)="editEnd.emit($event)"
                    >
                    </ng-color-picker>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Shape Properties -->
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
                        (editStart)="editStart.emit($event)" (editEnd)="editEnd.emit($event)"
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
                      <label>Line Style</label>
                      <div class="line-style-buttons">
                        <button
                          class="line-style-btn"
                          [class.active]="dashArrayValue() === ''"
                          (click)="onLineStyleChange('')"
                          title="Solid" aria-label="Solid"
                        >
                          <svg width="32" height="4" viewBox="0 0 32 4">
                            <line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2" />
                          </svg>
                        </button>
                        <button
                          class="line-style-btn"
                          [class.active]="isDashedActive()"
                          (click)="onLineStyleChange('dashed')"
                          title="Dashed" aria-label="Dashed"
                        >
                          <svg width="32" height="4" viewBox="0 0 32 4">
                            <line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="5,5" />
                          </svg>
                        </button>
                        <button
                          class="line-style-btn"
                          [class.active]="isDottedActive()"
                          (click)="onLineStyleChange('dotted')"
                          title="Dotted" aria-label="Dotted"
                        >
                          <svg width="32" height="4" viewBox="0 0 32 4">
                            <line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="2,2" />
                          </svg>
                        </button>
                        <button
                          class="line-style-btn"
                          [class.active]="isDashDotActive()"
                          (click)="onLineStyleChange('dashdot')"
                          title="Dash-Dot" aria-label="Dash-Dot"
                        >
                          <svg width="32" height="4" viewBox="0 0 32 4">
                            <line x1="0" y1="2" x2="32" y2="2" stroke="currentColor" stroke-width="2" stroke-dasharray="10,5,2,5" />
                          </svg>
                        </button>
                      </div>
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
                      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 3 4 7l4 4" /><path d="M4 7h16" /><path d="m16 21 4-4-4-4" /><path d="M20 17H4" />
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
                    <label>Brush</label>
                    <wb-segmented-control
                      label="Brush"
                      [options]="brushOptions"
                      [value]="config().penType"
                      (valueChange)="emitChange('penType', $event)"
                    ></wb-segmented-control>
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
                    <option *ngIf="isMixed(fontFamilyValue())" value="" disabled selected>Mixed</option>
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

                <div class="control-group">
                  <label class="group-label">Text Style</label>
                  <div class="button-group">
                    <button class="style-btn" [class.active]="isBold()" (click)="toggleBold()" title="Bold" aria-label="Bold">
                      <strong>B</strong>
                    </button>
                    <button class="style-btn" [class.active]="isItalic()" (click)="toggleItalic()" title="Italic" aria-label="Italic">
                      <em>I</em>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Panel Toggle Button -->
      <button
        *ngIf="!isOpen() && !embedded()"
        class="panel-toggle-btn"
        title="Open Properties Panel" aria-label="Open Properties Panel"
        (click)="togglePanel.emit()"
      >
        <ng-icon name="panelRightOpen"></ng-icon>
      </button>
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
  protected readonly brushOptions = BRUSH_OPTIONS;

  // Computed properties for better performance
  selectedElement = computed(() => this.selectedElements()[0] || null);
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

  strokeColorValue = computed(() => {
    const props = this.selectedProperties();
    if (props) return props.strokeColor;
    const element = this.selectedElement();
    if (!element) return this.config().strokeColor;
    return element.style.strokeColor || this.config().strokeColor;
  });

  fillColorValue = computed(() => {
    const props = this.selectedProperties();
    if (props) return props.fillColor;
    const element = this.selectedElement();
    if (!element) return this.config().fill;
    return element.style.fill || this.config().fill;
  });

  strokeWidthValue = computed(() => {
    const props = this.selectedProperties();
    if (props) return props.strokeWidth;
    const element = this.selectedElement();
    if (!element) return this.config().strokeWidth;
    return element.style.strokeWidth || this.config().strokeWidth;
  });

  opacityValue = computed(() => {
    const props = this.selectedProperties();
    if (props) return props.opacity;
    const element = this.selectedElement();
    if (!element) return 100;
    return element.opacity ?? 100;
  });

  fontSizeValue = computed(() => {
    const props = this.selectedProperties();
    if (props?.fontSize !== undefined) return props.fontSize;
    const element = this.selectedElement();
    if (!element || element.type !== ElementType.Text) return this.config().fontSize;
    return element.style.fontSize || this.config().fontSize;
  });

  fontFamilyValue = computed(() => {
    const props = this.selectedProperties();
    if (props?.fontFamily !== undefined) return props.fontFamily;
    const element = this.selectedElement();
    if (!element || element.type !== ElementType.Text) return this.config().fontFamily;
    return element.style.fontFamily || this.config().fontFamily;
  });

  dashArrayValue = computed(() => {
    const props = this.selectedProperties();
    if (props) return props.dasharray;
    const element = this.selectedElement();
    if (!element) return this.config().dasharray || '';
    return element.style.dasharray || '';
  });

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

  isDashedActive = computed(() => {
    const dasharray = this.dashArrayValue();
    const width = this.strokeWidthNumber();
    // Dashed pattern: dash length ~3x width, gap ~3x width
    return dasharray === buildDasharray('dashed', width);
  });

  isDottedActive = computed(() => {
    const dasharray = this.dashArrayValue();
    const width = this.strokeWidthNumber();
    // Dotted pattern: dash length ~1x width, gap ~2x width
    return dasharray === buildDasharray('dotted', width);
  });

  isDashDotActive = computed(() => {
    const dasharray = this.dashArrayValue();
    const width = this.strokeWidthNumber();
    // Dash-dot pattern: long dash ~5x, gap ~2x, short dash ~1x, gap ~2x
    return dasharray === buildDasharray('dashdot', width);
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
    this.propertyChange.emit({ property: 'lineStyle', value: style });
  }
}
