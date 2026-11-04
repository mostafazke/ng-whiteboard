import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  input,
  Output,
  viewChild,
} from '@angular/core';
import { WhiteboardConfig } from '../../../../types';
import { IconComponent } from '../../icon/icon.component';
import { MIN_ZOOM, MAX_ZOOM } from '../../../../constants';
import { ZOOM_ACTIONS, ZoomActionId } from '../../utils/editor-actions';

let nextMenuId = 0;

@Component({
  selector: 'ng-controls-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="controls-panel">
      <div class="zoom-controls">
        <button title="Zoom In" aria-label="Zoom in" class="icon-btn" (click)="onZoomIn()" [disabled]="isMaxZoom()">
          <ng-icon name="plus"></ng-icon>
        </button>

        <div class="dropdown-wrapper" #zoomWrapper (keydown.escape)="onEscape($event)">
          <button
            class="zoom-value"
            #zoomTrigger
            title="Zoom options"
            [attr.aria-label]="'Zoom options, ' + formatZoom(config().zoom)"
            [attr.aria-expanded]="showZoomMenu()"
            [attr.aria-controls]="showZoomMenu() && !compact() ? zoomMenuId : null"
            (click)="toggleZoomMenu($event)"
            (dblclick)="onCenterView()"
            [class.active]="showZoomMenu()"
          >
            {{ formatZoom(config().zoom) }}
          </button>

          <div class="zoom-dropdown" [id]="zoomMenuId" *ngIf="showZoomMenu() && !compact()">
            <div class="zoom-actions">
              @for (action of zoomActions; track action.id) {
                <button
                  class="zoom-action"
                  [disabled]="action.requiresSelection && !hasSelection()"
                  (click)="runZoomAction(action.id)"
                >
                  <ng-icon [name]="action.icon"></ng-icon>
                  {{ action.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <button title="Zoom Out" aria-label="Zoom out" class="icon-btn" (click)="onZoomOut()" [disabled]="isMinZoom()">
          <ng-icon name="minus"></ng-icon>
        </button>
      </div>
    </div>
  `,
  styleUrl: './controls-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ControlsPanelComponent {
  config = input<WhiteboardConfig>({} as WhiteboardConfig);
  showZoomMenu = input<boolean>(false);
  hasSelection = input<boolean>(false);
  compact = input<boolean>(false);

  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() zoomToFit = new EventEmitter<void>();
  @Output() zoomToSelection = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() zoomMenuToggle = new EventEmitter<HTMLElement | null>();
  @Output() centerView = new EventEmitter<void>();

  private zoomTrigger = viewChild<ElementRef<HTMLButtonElement>>('zoomTrigger');
  private zoomWrapper = viewChild<ElementRef<HTMLElement>>('zoomWrapper');

  readonly zoomMenuId = `wb-zoom-menu-${nextMenuId++}`;
  readonly zoomActions = ZOOM_ACTIONS;
  readonly minZoom = MIN_ZOOM;
  readonly maxZoom = MAX_ZOOM;

  formatZoom(zoom: number): string {
    return `${Math.round(zoom * 100)}%`;
  }

  isMinZoom(): boolean {
    return this.config().zoom <= this.minZoom;
  }

  isMaxZoom(): boolean {
    return this.config().zoom >= this.maxZoom;
  }

  onZoomIn() {
    this.zoomIn.emit();
  }

  onZoomOut() {
    this.zoomOut.emit();
  }

  runZoomAction(id: ZoomActionId) {
    const outputs = { fit: this.zoomToFit, selection: this.zoomToSelection, reset: this.resetZoom };
    outputs[id].emit();
    this.zoomTrigger()?.nativeElement.focus();
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event) {
    if (!this.showZoomMenu() || this.compact()) return;
    const target = event.target;
    if (target instanceof Node && this.zoomWrapper()?.nativeElement.contains(target)) return;
    this.zoomMenuToggle.emit(this.zoomTrigger()?.nativeElement ?? null);
  }

  onEscape(event: Event) {
    if (!this.showZoomMenu() || this.compact()) return;
    event.stopPropagation();
    this.zoomMenuToggle.emit(this.zoomTrigger()?.nativeElement ?? null);
    this.zoomTrigger()?.nativeElement.focus();
  }

  toggleZoomMenu(event?: Event) {
    this.zoomMenuToggle.emit((event?.currentTarget as HTMLElement | null) ?? null);
  }

  onCenterView() {
    this.centerView.emit();
  }
}
