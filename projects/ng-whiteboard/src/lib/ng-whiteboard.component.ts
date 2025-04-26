import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ActionHandlerService } from './core/action-handler/action-handler.service';
import { ConfigService } from './core/config/config.service';
import { DataService } from './core/data/data.service';
import { EventBusService } from './core/event-bus/event-bus.service';
import { SvgService } from './core/svg/svg.service';
import { ToolManagerService } from './core/tools/tool-manager.service';
import {
  ElementType,
  LineCap,
  LineJoin,
  ToolType,
  WhiteboardConfig,
  WhiteboardElement,
  WhiteboardOptions,
} from './core/types';
import { WhiteboardEvent } from './core/types/events';
import { InputConfig } from './decorators/input-config.decorator';
import { NgWhiteboardService } from './ng-whiteboard.service';
import { GripCursorPipe } from './core/pipes';

/**
 * The `NgWhiteboardComponent` is the main component for the ng-whiteboard library. It provides a whiteboard canvas with various drawing tools and configuration options.
 *
 * The component handles the initialization and management of the whiteboard, including:
 * - Subscribing to events from the `EventBusService` and emitting corresponding output events
 * - Initializing the whiteboard canvas and data service
 * - Updating the whiteboard configuration based on input changes
 */
@Component({
  selector: 'ng-whiteboard',
  templateUrl: './ng-whiteboard.component.html',
  styleUrls: ['./ng-whiteboard.component.scss'],
  providers: [SvgService, DataService, ToolManagerService, EventBusService, ConfigService, ActionHandlerService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgWhiteboardComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @ViewChild('svgContainer', { static: false })
  svgContainer!: ElementRef<SVGSVGElement>;

  /**
   * The whiteboard configuration options.
   * @type {WhiteboardOptions}
   */
  @Input() options!: WhiteboardOptions;

  /**
   * Sets the whiteboard data.
   * @type {WhiteboardElement[]}
   */
  @Input() set data(data: WhiteboardElement[]) {
    if (data && data !== this.dataService.getData()) {
      this.dataService.setData(data);
    }
  }

  get data$(): Observable<WhiteboardElement[]> {
    return this.dataService.getData$();
  }

  /**
   * Sets the active tool for the whiteboard.
   * @type {ToolType}
   */
  @Input() set selectedTool(tool: ToolType) {
    if (tool && this.dataService.getActiveTool() !== tool) {
      this.dataService.setActiveTool(tool);
    }
  }

  get selectedTool(): ToolType {
    return this.dataService.getActiveTool();
  }

  /**
   * Indicates whether drawing is enabled on the whiteboard.
   * @type {boolean}
   */
  @Input() @InputConfig() drawingEnabled!: boolean;
  /**
   * The width of the canvas element.
   * @type {number}
   */
  @Input() @InputConfig() canvasWidth!: number;
  /**
   * The height of the canvas element.
   * @type {number}
   */
  @Input() @InputConfig() canvasHeight!: number;
  /**
   * Indicates whether the whiteboard should be displayed in full screen mode.
   * @type {boolean}
   */
  @Input() @InputConfig() fullScreen!: boolean;
  /**
   * Indicates whether the whiteboard content should be centered.
   * @type {boolean}
   */
  @Input() @InputConfig() center!: boolean;
  /**
   * The color of the stroke to be used in the whiteboard.
   * @type {string}
   */
  @Input() @InputConfig() strokeColor!: string;
  /**
   * The width of the stroke to be used in the whiteboard.
   * @type {number}
   */
  @Input() @InputConfig() strokeWidth!: number;
  /**
   * The background color of the whiteboard component.
   * @type {string}
   */
  @Input() @InputConfig() backgroundColor!: string;
  /**
   * Specifies the type of corner created when two lines meet.
   * @type {LineJoin}
   */
  @Input() @InputConfig() lineJoin!: LineJoin;
  /**
   * Specifies the shape to be used at the end of open sub-paths when they are stroked.
   *
   * @type {LineCap}
   */
  @Input() @InputConfig() lineCap!: LineCap;
  /**
   * The fill property specifies the fill color for the whiteboard component.
   * @type {string}
   */
  @Input() @InputConfig() fill!: string;
  /**
   * The zoom level for the whiteboard component.
   * @type {number}
   */
  @Input() @InputConfig() zoom!: number;
  /**
   * The font family to be used for the whiteboard text.
   * @type {string}
   */
  @Input() @InputConfig() fontFamily!: string;
  /**
   * The font size to be used in the whiteboard component.
   * @type {number}
   */
  @Input() @InputConfig() fontSize!: number;
  /**
   * Specifies the pattern of dashes and gaps used to stroke paths.
   * @type {string}
   */
  @Input() @InputConfig() dasharray!: string;
  /**
   * The dashoffset property for the whiteboard component.
   * @type {number}
   */
  @Input() @InputConfig() dashoffset!: number;
  /**
   * The x coordinate for the whiteboard component.
   * @type {number}
   */
  @Input() @InputConfig() x!: number;
  /**
   * The y coordinate for the whiteboard component.
   * @type {number}
   */
  @Input() @InputConfig() y!: number;
  /**
   * Enables or disables the grid overlay in the whiteboard component.
   * @type {boolean}
   */
  @Input() @InputConfig() enableGrid!: boolean;
  /**
   * The size of the grid for the whiteboard component.
   * @type {number}
   */
  @Input() @InputConfig() gridSize!: number;
  /**
   * Determines whether the whiteboard should snap drawn elements to a grid.
   * @type {boolean}
   */
  @Input() @InputConfig() snapToGrid!: boolean;

  /**
   * Emits when the whiteboard component is ready.
   * @event
   */
  @Output() ready = new EventEmitter<void>();

  /**
   * Emits when the whiteboard is destroyed.
   * @event
   */
  @Output() destroyed = new EventEmitter<void>();

  /**
   * Emits when the user starts drawing on the whiteboard.
   * @event
   * @emits { x: number, y: number }
   */
  @Output() drawStart = new EventEmitter<{ x: number; y: number }>();

  /**
   * Emits while the user is drawing on the whiteboard.
   * @event
   * @emits { x: number, y: number }
   */
  @Output() drawing = new EventEmitter<{ x: number; y: number }>();

  /**
   * Emits when the user stops drawing on the whiteboard.
   * @event
   */
  @Output() drawEnd = new EventEmitter<void>();

  /**
   * Emits when a new element is added to the whiteboard.
   * @event
   * @emits WhiteboardElement
   */
  @Output() elementsAdded = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emits when an element on the whiteboard is updated.
   * @event
   * @emits WhiteboardElement
   */
  @Output() elementsUpdated = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emits when an element is selected or deselected.
   * @event
   * @emits WhiteboardElement | null
   */
  @Output() elementsSelected = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emits when an element is deleted from the whiteboard.
   * @event
   * @emits WhiteboardElement
   */
  @Output() elementsDeleted = new EventEmitter<void>();

  /**
   * Emits when an undo action is triggered.
   * @event
   */
  @Output() undo = new EventEmitter<void>();

  /**
   * Emits when a redo action is triggered.
   * @event
   */
  @Output() redo = new EventEmitter<void>();

  /**
   * Emits when the whiteboard is cleared.
   * @event
   */
  @Output() clear = new EventEmitter<void>();

  /**
   * Emits when the whiteboard data changes.
   * @event
   * @emits WhiteboardElement[]
   */
  @Output() dataChange = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emits when the whiteboard content is saved.
   * @event
   * @emits string - The saved whiteboard data as a string.
   */
  @Output() save = new EventEmitter<string>();

  /**
   * Emits when an image is added to the whiteboard.
   * @event
   * @emits File - The image file that was added.
   */
  @Output() imageAdded = new EventEmitter<File>();

  /**
   * Emits when the selected drawing tool changes.
   * @event
   * @emits ToolType
   */
  @Output() selectedToolChange = new EventEmitter<ToolType>();

  /**
   * Emits when the whiteboard configuration options change.
   * @event
   * @emits WhiteboardOptions
   */
  @Output() configChanged = new EventEmitter<WhiteboardOptions>();

  types = ElementType;
  tools = ToolType;

  private readonly eventsMap = {
    [WhiteboardEvent.Ready]: this.ready,
    [WhiteboardEvent.Destroyed]: this.destroyed,
    [WhiteboardEvent.DrawStart]: this.drawStart,
    [WhiteboardEvent.Drawing]: this.drawing,
    [WhiteboardEvent.DrawEnd]: this.drawEnd,
    [WhiteboardEvent.ElementsAdded]: this.elementsAdded,
    [WhiteboardEvent.ElementsUpdated]: this.elementsUpdated,
    [WhiteboardEvent.ElementsSelected]: this.elementsSelected,
    [WhiteboardEvent.ElementsDeleted]: this.elementsDeleted,
    [WhiteboardEvent.Undo]: this.undo,
    [WhiteboardEvent.Redo]: this.redo,
    [WhiteboardEvent.Clear]: this.clear,
    [WhiteboardEvent.DataChange]: this.dataChange,
    [WhiteboardEvent.Save]: this.save,
    [WhiteboardEvent.ImageAdded]: this.imageAdded,
    [WhiteboardEvent.ToolChange]: this.selectedToolChange,
    [WhiteboardEvent.ConfigChange]: this.configChanged,
  };

  constructor(
    private whiteboardService: NgWhiteboardService,
    private actionHandler: ActionHandlerService,
    private configService: ConfigService,
    private dataService: DataService,
    private eventBusService: EventBusService,
    private cd: ChangeDetectorRef
  ) {
    this.initObservables();
  }

  ngOnInit(): void {
    if (this.options) {
      this.populateInputsFromOptions(this.options);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options']) {
      if (changes['options'].currentValue) {
        this.populateInputsFromOptions(changes['options'].currentValue);
      }
    }
  }

  ngAfterViewInit() {
    this.dataService.initializeWhiteboard(this.svgContainer.nativeElement);
  }

  ngOnDestroy(): void {
    this.eventBusService.emit(WhiteboardEvent.Destroyed);
  }

  get gridTranslation() {
    return this.getConfigValue('gridTranslation');
  }

  get elementsTranslation() {
    return this.getConfigValue('elementsTranslation');
  }

  get selectionBox$() {
    return this.dataService.selectionBox$;
  }

  get boundingBox$() {
    return this.dataService.boundingBox$;
  }

  /**
   * Retrieves a configuration value from the WhiteboardConfig.
   *
   * @template K - The key type of the configuration.
   * @param {K} key - The key of the configuration value to retrieve.
   * @returns {WhiteboardConfig[K]} The configuration value associated with the specified key.
   */
  getConfigValue<K extends keyof WhiteboardConfig>(key: K): WhiteboardConfig[K] {
    return this.configService.getConfig()[key];
  }

  /**
   * Updates the configuration value for the specified key if it is different from the current value.
   * If the key is related to canvas resizing properties ('canvasWidth', 'canvasHeight', 'zoom'),
   * it will center the canvas if the `center` property is true and `fullScreen` is false.
   *
   * @template K - The type of the configuration key.
   * @param {K} key - The configuration key to update.
   * @param {WhiteboardConfig[K]} value - The new value for the configuration key.
   * @returns {void}
   */
  setConfigValue<K extends keyof WhiteboardConfig>(key: K, value: WhiteboardConfig[K]): void {
    if (!this.configService.isConfigDifferent(key, value)) return;

    this.configService.updateConfigValue(key, value);
    const resizeProperties = ['canvasWidth', 'canvasHeight', 'zoom'];
    if (resizeProperties.includes(key)) {
      if (this.center && !this.fullScreen) {
        this.dataService.centerCanvas();
      }
    }
  }

  /**
   * Populates the component's configuration inputs from the provided options.
   *
   * @param options - An object containing the whiteboard options to be applied.
   * If the options object is not provided, the function will return immediately.
   */
  private populateInputsFromOptions(options: WhiteboardOptions): void {
    if (!options) return;

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        this.setConfigValue(key as keyof WhiteboardConfig, value);
      }
    });
  }

  /**
   * Initializes observables to listen for events from the EventBusService.
   * Subscribes to the event stream and emits corresponding events.
   */
  private initObservables(): void {
    this.eventBusService
      .listen()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (event) => {
          if (event.payload) {
            this.eventsMap[event.type].emit(event.payload as any);
          } else {
            this.eventsMap[event.type].emit();
          }
          this.cd.detectChanges();
        },
        error: (err) => console.error('Error occurred while listening to events:', err),
      });
  }
}
