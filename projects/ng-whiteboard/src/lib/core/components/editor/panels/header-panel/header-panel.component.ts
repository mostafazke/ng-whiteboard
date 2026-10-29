import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, input, Output } from '@angular/core';
import { EditorStateService } from '../../editor-state.service';
import { FormsModule } from '@angular/forms';
import { EditorConfig } from '../../../../types';
import { Layer } from '../../editor-state.service';
import { IconComponent } from '../../icon/icon.component';
import { IconName } from '../../icon/icons';
import {
  LayerPanelComponent,
  WhiteboardLayer,
  LayerMoveEvent,
  LayerOpacityEvent,
  LayerRenameEvent,
  LayerBlendModeEvent,
} from '../layer-panel/layer-panel.component';

interface HeaderAction {
  id: string;
  label: string;
  icon: IconName;
  action: () => void;
  disabled?: boolean;
}

@Component({
  selector: 'ng-header-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LayerPanelComponent],
  template: `
    <div class="header-panel">
      <!-- Left Section: Layers & Title -->
      <div class="header-left">
        <div class="dropdown-wrapper">
          <button (click)="toggleLayers()" class="icon-btn layers-button" [class.active]="showLayers()">
            <ng-icon name="layers"></ng-icon>
          </button>

          <div class="layers-dropdown" *ngIf="showLayers()">
            <div class="dropdown-header">
              <h4>Layers</h4>
              <button class="close-btn" (click)="closeLayers()">
                <ng-icon name="close"></ng-icon>
              </button>
            </div>

            <div class="layer-panel-wrapper">
              <ng-ng-layer-panel
                [layers]="convertLayersToWhiteboardLayers()"
                [activeLayerId]="getActiveLayerId()"
                (layerSelected)="onLayerSelected($event)"
                (layerAdded)="onLayerAdded()"
                (layerDeleted)="onLayerDeleted($event)"
                (layerRenamed)="onLayerRenamed($event)"
                (layerVisibilityToggled)="onLayerVisibilityToggled($event)"
                (layerLockToggled)="onLayerLockToggled($event)"
                (layerOpacityChanged)="onLayerOpacityChanged($event)"
                (layerMoved)="onLayerMoved($event)"
                (layerBlendModeChanged)="onLayerBlendModeChanged($event)"
              >
              </ng-ng-layer-panel>
            </div>
          </div>
        </div>

        <div class="title-section">
          <ng-container *ngIf="isEditingTitle(); else titleDisplay">
            <input
              #titleInput
              type="text"
              class="title-input"
              [value]="editorConfig().title"
              (blur)="onTitleBlur($event)"
              (keyup.enter)="onTitleBlur($event)"
              autoFocus
            />
          </ng-container>
          <ng-template #titleDisplay>
            <h1 (click)="startTitleEdit()">{{ editorConfig().title }}</h1>
          </ng-template>
        </div>
      </div>

      <!-- Right Section: Actions -->
      <div class="header-right">
        <div class="actions">
          <button
            *ngFor="let action of headerActions; trackBy: trackByAction"
            class="action-btn"
            [disabled]="action.disabled"
            [title]="action.label"
            (click)="action.action()"
          >
            <ng-icon [name]="action.icon"></ng-icon>
            <span class="action-label">{{ action.label }}</span>
          </button>
          <button
            class="theme-toggle-btn"
            (click)="editorState.toggleTheme()"
            [attr.aria-label]="'Switch to ' + (editorState.themeSignal() === 'light' ? 'dark' : 'light') + ' mode'"
          >
            {{ editorState.themeSignal() === 'dark' ? 'Light Mode' : 'Dark Mode' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './header-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderPanelComponent {
  constructor(public editorState: EditorStateService) {}
  editorConfig = input<EditorConfig>({} as EditorConfig);
  layers = input<Layer[]>([]);
  activeLayerId = input<string>(''); // Add activeLayerId as input
  showLayers = input<boolean>(false);
  isEditingTitle = input<boolean>(false);

  @Output() titleChange = new EventEmitter<string>();
  @Output() titleEditStart = new EventEmitter<void>();
  @Output() titleEditEnd = new EventEmitter<void>();
  @Output() layersToggle = new EventEmitter<void>();
  @Output() layerVisibilityToggle = new EventEmitter<Layer>();
  @Output() layerLockToggle = new EventEmitter<Layer>();
  @Output() layerAdd = new EventEmitter<void>();
  @Output() layerMenuShow = new EventEmitter<Layer>();
  @Output() newDocument = new EventEmitter<void>();
  @Output() saveDocument = new EventEmitter<void>();
  @Output() exportDocument = new EventEmitter<void>();

  // New layer panel events
  @Output() layerSelected = new EventEmitter<string>();
  @Output() layerDeleted = new EventEmitter<string>();
  @Output() layerRenamed = new EventEmitter<LayerRenameEvent>();
  @Output() layerOpacityChanged = new EventEmitter<LayerOpacityEvent>();
  @Output() layerMoved = new EventEmitter<LayerMoveEvent>();
  @Output() layerBlendModeChanged = new EventEmitter<LayerBlendModeEvent>();

  headerActions: HeaderAction[] = [
    {
      id: 'new',
      label: 'New',
      icon: 'new',
      action: () => this.newDocument.emit(),
    },
    {
      id: 'save',
      label: 'Save',
      icon: 'save',
      action: () => this.saveDocument.emit(),
    },
    {
      id: 'export',
      label: 'Export',
      icon: 'download',
      action: () => this.exportDocument.emit(),
    },
  ];

  toggleLayers() {
    this.layersToggle.emit();
  }

  closeLayers() {
    this.layersToggle.emit();
  }

  startTitleEdit() {
    this.titleEditStart.emit();
  }

  onTitleBlur(event: Event) {
    const target = event.target as HTMLInputElement;
    const newTitle = target.value.trim() || 'Untitled Whiteboard';
    this.titleChange.emit(newTitle);
    this.titleEditEnd.emit();
  }

  toggleLayerVisibility(layer: Layer) {
    this.layerVisibilityToggle.emit(layer);
  }

  toggleLayerLock(layer: Layer) {
    this.layerLockToggle.emit(layer);
  }

  addLayer() {
    this.layerAdd.emit();
  }

  showLayerMenu(layer: Layer) {
    this.layerMenuShow.emit(layer);
  }

  trackByLayer(index: number, layer: Layer): string {
    return layer.id;
  }

  trackByAction(index: number, action: HeaderAction): string {
    return action.id;
  }

  // Layer panel helper methods
  convertLayersToWhiteboardLayers(): WhiteboardLayer[] {
    return this.layers().map((layer) => ({
      id: layer.id,
      name: layer.name,
      visible: layer.visible,
      locked: layer.locked,
      opacity: (layer.opacity || 1) * 100, // Convert to percentage
      zIndex: layer.zIndex,
      type: 'drawing' as const, // Default type
      elements: [], // Elements are managed separately in the data service
      blendMode: layer.blendMode || 'normal', // Use actual blend mode
    }));
  }

  getActiveLayerId(): string {
    return this.activeLayerId();
  }

  // Layer panel event handlers
  onLayerSelected(layerId: string) {
    this.layerSelected.emit(layerId);
  }

  onLayerAdded() {
    this.layerAdd.emit();
  }

  onLayerDeleted(layerId: string) {
    this.layerDeleted.emit(layerId);
  }

  onLayerRenamed(event: LayerRenameEvent) {
    this.layerRenamed.emit(event);
  }

  onLayerVisibilityToggled(event: { layerId: string; visible: boolean }) {
    const layer = this.layers().find((l) => l.id === event.layerId);
    if (layer) {
      this.layerVisibilityToggle.emit(layer);
    }
  }

  onLayerLockToggled(event: { layerId: string; locked: boolean }) {
    const layer = this.layers().find((l) => l.id === event.layerId);
    if (layer) {
      this.layerLockToggle.emit(layer);
    }
  }

  onLayerOpacityChanged(event: LayerOpacityEvent) {
    this.layerOpacityChanged.emit(event);
  }

  onLayerMoved(event: LayerMoveEvent) {
    this.layerMoved.emit(event);
  }

  onLayerBlendModeChanged(event: LayerBlendModeEvent) {
    this.layerBlendModeChanged.emit(event);
  }
}
