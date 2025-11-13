import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  effect,
  inject,
} from '@angular/core';
import { ApiService } from './core/api';
import { CanvasService, InstanceService } from './core/canvas';
import { WhiteboardCanvasComponent } from './core/components/canvas/whiteboard-canvas.component';
import { ContextMenuComponent } from './core/components/context-menu/context-menu.component';
import { ContextMenuService } from './core/components/context-menu/context-menu.service';
import { ConfigService } from './core/config/config.service';
import { ElementsService, LayerManagementService, SelectionService } from './core/elements';
import { EventBusService } from './core/event-bus/event-bus.service';
import { HistoryService } from './core/history';
import { ClipboardService, DragDropService, IOService, KeyboardShortcutService } from './core/input';
import { SvgService } from './core/svg/svg.service';
import { ToolsService } from './core/tools';
import { ToolFactory } from './core/tools/tool-factory.service';
import { ToolType, WhiteboardConfig, WhiteboardElement } from './core/types';
import { WhiteboardEvent } from './core/types/events';
import { PanService, WheelHandlerService, ZoomService } from './core/viewport';

/**
 * Main whiteboard component providing a canvas with drawing tools and configuration options.
 *
 * Handles whiteboard initialization, event management, and configuration updates.
 */
@Component({
  selector: 'ng-whiteboard',
  standalone: true,
  imports: [CommonModule, WhiteboardCanvasComponent, ContextMenuComponent],
  template: `
    <div style="width: 100%; height: 100%; position: relative;">
      <ng-whiteboard-canvas></ng-whiteboard-canvas>
      <wb-context-menu></wb-context-menu>
    </div>
  `,
  providers: [
    SvgService,
    ApiService,
    ElementsService,
    CanvasService,
    IOService,
    ZoomService,
    PanService,
    SelectionService,
    ClipboardService,
    ToolsService,
    ToolFactory,
    EventBusService,
    ConfigService,
    KeyboardShortcutService,
    LayerManagementService,
    HistoryService,
    ContextMenuService,
    DragDropService,
    WheelHandlerService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgWhiteboardComponent implements OnInit, OnDestroy {
  private configService = inject(ConfigService);
  private apiService = inject(ApiService);
  private toolsService = inject(ToolsService);
  private eventBusService = inject(EventBusService);
  private cd = inject(ChangeDetectorRef);
  private instanceService = inject(InstanceService);

  /**
   * Unique identifier for this whiteboard instance.
   * Auto-generated if not provided.
   */
  @Input() boardId: string = crypto.randomUUID();

  /**
   * Whiteboard configuration options.
   */
  @Input() set config(value: Partial<WhiteboardConfig>) {
    this.configService.updateConfig(value, false);
  }

  get config(): WhiteboardConfig {
    return this.configService.getConfig();
  }

  /**
   * Whiteboard data elements.
   */
  @Input() set data(data: WhiteboardElement[]) {
    if (data && data !== this.apiService.getElements()) {
      this.apiService.setElements(data);
    }
  }

  /**
   * Active drawing tool.
   */
  @Input() set selectedTool(tool: ToolType) {
    if (tool && this.toolsService.getActiveToolType() !== tool) {
      this.toolsService.setActiveTool(tool);
    }
  }

  /**
   * Emitted when the whiteboard component is ready.
   */
  @Output() ready = new EventEmitter<void>();

  /**
   * Emitted when the whiteboard is destroyed.
   */
  @Output() destroyed = new EventEmitter<void>();

  /**
   * Emitted when the user starts drawing.
   */
  @Output() drawStart = new EventEmitter<{ x: number; y: number }>();

  /**
   * Emitted while the user is drawing.
   */
  @Output() drawing = new EventEmitter<{ x: number; y: number }>();

  /**
   * Emitted when the user stops drawing.
   */
  @Output() drawEnd = new EventEmitter<void>();

  /**
   * Emitted when elements are added.
   */
  @Output() elementsAdded = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emitted when elements are updated.
   */
  @Output() elementsUpdated = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emitted when elements are selected or deselected.
   */
  @Output() elementsSelected = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emitted when elements are removed.
   */
  @Output() elementsRemoved = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emitted when an element is double-clicked.
   */
  @Output() elementDoubleClicked = new EventEmitter<{ target: EventTarget | null; clientX: number; clientY: number }>();

  /**
   * Emitted when an undo action is triggered.
   */
  @Output() undo = new EventEmitter<void>();

  /**
   * Emitted when a redo action is triggered.
   */
  @Output() redo = new EventEmitter<void>();

  /**
   * Emitted when the whiteboard is cleared.
   */
  @Output() clear = new EventEmitter<void>();

  /**
   * Emitted when the whiteboard data changes.
   */
  @Output() dataChange = new EventEmitter<WhiteboardElement[]>();

  /**
   * Emitted when the whiteboard content is saved.
   */
  @Output() save = new EventEmitter<string>();

  /**
   * Emitted when an image is added.
   */
  @Output() imageAdded = new EventEmitter<File>();

  /**
   * Emitted when the selected drawing tool changes.
   */
  @Output() selectedToolChange = new EventEmitter<ToolType>();

  /**
   * Emitted when the configuration changes.
   */
  @Output() configChange = new EventEmitter<Partial<WhiteboardConfig>>();

  /**
   * Emitted when zoom-related configuration changes.
   */
  @Output() zoomChange = new EventEmitter<{
    zoom: number;
    center: boolean;
    canvasWidth: number;
    canvasHeight: number;
  }>();

  private readonly eventsMap = {
    [WhiteboardEvent.Ready]: this.ready,
    [WhiteboardEvent.Destroyed]: this.destroyed,
    [WhiteboardEvent.DrawStart]: this.drawStart,
    [WhiteboardEvent.Drawing]: this.drawing,
    [WhiteboardEvent.DrawEnd]: this.drawEnd,
    [WhiteboardEvent.ElementsAdded]: this.elementsAdded,
    [WhiteboardEvent.ElementsUpdated]: this.elementsUpdated,
    [WhiteboardEvent.ElementsSelected]: this.elementsSelected,
    [WhiteboardEvent.ElementsRemoved]: this.elementsRemoved,
    [WhiteboardEvent.ElementDoubleClicked]: this.elementDoubleClicked,
    [WhiteboardEvent.Undo]: this.undo,
    [WhiteboardEvent.Redo]: this.redo,
    [WhiteboardEvent.Clear]: this.clear,
    [WhiteboardEvent.DataChange]: this.dataChange,
    [WhiteboardEvent.Save]: this.save,
    [WhiteboardEvent.ImageAdded]: this.imageAdded,
    [WhiteboardEvent.ToolChange]: this.selectedToolChange,
    [WhiteboardEvent.ConfigChange]: this.configChange,
    [WhiteboardEvent.ZoomChange]: this.zoomChange,
  };

  private readonly forwardEventsEffect = effect(() => {
    const whiteboardEvent = this.eventBusService.getAllEventsSignal();
    const last = whiteboardEvent();
    if (!last) return;
    const emitter = this.eventsMap[last.type] as EventEmitter<unknown> | undefined;
    if (!emitter) return;
    if (last.payload !== undefined) {
      emitter.emit(last.payload as unknown);
    } else {
      emitter.emit();
    }
    this.cd.markForCheck();
  });

  ngOnInit(): void {
    this.instanceService.register(this.boardId, this.apiService);
  }

  ngOnDestroy(): void {
    this.instanceService.unregister(this.boardId);
    this.eventBusService.emit(WhiteboardEvent.Destroyed);
  }
}
