import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { WhiteboardConfig } from '../../../../types';
import { IconComponent } from '../../icon/icon.component';
import { MIN_ZOOM, MAX_ZOOM } from '../../../../constants';

interface ZoomLevel {
  label: string;
  value: number;
}

@Component({
  selector: 'ng-controls-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="controls-panel">
      <!-- Zoom Controls -->
      <div class="zoom-controls">
        <button title="Zoom In" class="icon-btn" (click)="onZoomIn()" [disabled]="isMaxZoom()">
          <ng-icon name="plus"></ng-icon>
        </button>

        <div class="dropdown-wrapper">
          <button
            class="zoom-value"
            (click)="toggleZoomMenu()"
            (dblclick)="onCenterView()"
            [class.active]="showZoomMenu()"
          >
            {{ formatZoom(config().zoom) }}
          </button>

          <div class="zoom-dropdown" *ngIf="showZoomMenu()">
            <div class="zoom-actions">
              <button class="zoom-action" (click)="onZoomToFit()">
                <ng-icon name="fit"></ng-icon>
                Zoom to Fit
              </button>
              <button class="zoom-action" (click)="onZoomToSelection()" [disabled]="!hasSelection()">
                <ng-icon name="selection"></ng-icon>
                Zoom to Selection
              </button>
              <button class="zoom-action" (click)="onResetZoom()">
                <ng-icon name="reset"></ng-icon>
                Reset Zoom
              </button>
            </div>
          </div>
        </div>

        <button title="Zoom Out" class="icon-btn" (click)="onZoomOut()" [disabled]="isMinZoom()">
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

  @Output() zoomIn = new EventEmitter<void>();
  @Output() zoomOut = new EventEmitter<void>();
  @Output() zoomTo = new EventEmitter<number>();
  @Output() zoomToFit = new EventEmitter<void>();
  @Output() zoomToSelection = new EventEmitter<void>();
  @Output() resetZoom = new EventEmitter<void>();
  @Output() zoomMenuToggle = new EventEmitter<void>();
  @Output() centerView = new EventEmitter<void>();

  readonly minZoom = MIN_ZOOM;
  readonly maxZoom = MAX_ZOOM;

  readonly zoomPresets: ZoomLevel[] = [
    { label: '25%', value: 0.25 },
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1.0 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2.0 },
    { label: '300%', value: 3.0 },
    { label: '400%', value: 4.0 },
    { label: '500%', value: 5.0 },
  ];

  formatZoom(zoom: number): string {
    return `${Math.round(zoom * 100)}%`;
  }

  isMinZoom(): boolean {
    return this.config().zoom <= this.minZoom;
  }

  isMaxZoom(): boolean {
    return this.config().zoom >= this.maxZoom;
  }

  isActiveZoom(value: number): boolean {
    return Math.abs(this.config().zoom - value) < 0.01;
  }

  onZoomIn() {
    this.zoomIn.emit();
  }

  onZoomOut() {
    this.zoomOut.emit();
  }

  onZoomTo(value: number) {
    this.zoomTo.emit(value);
  }

  onZoomToFit() {
    this.zoomToFit.emit();
  }

  onZoomToSelection() {
    this.zoomToSelection.emit();
  }

  onResetZoom() {
    this.resetZoom.emit();
  }

  toggleZoomMenu() {
    this.zoomMenuToggle.emit();
  }

  onCenterView() {
    this.centerView.emit();
  }

  trackByZoom(index: number, preset: ZoomLevel): number {
    return preset.value;
  }
}
