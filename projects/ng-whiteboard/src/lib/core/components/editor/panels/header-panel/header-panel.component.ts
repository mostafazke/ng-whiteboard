import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, input, Output, viewChild } from '@angular/core';
import { EditorStateService } from '../../editor-state.service';
import { EditorConfig } from '../../../../types';
import { Layer } from '../../editor-state.service';
import { IconComponent } from '../../icon/icon.component';
import { DOCUMENT_ACTIONS, DocumentActionId, EditorAction } from '../../utils/editor-actions';
import {
  LayerPanelComponent,
  WhiteboardLayer,
  LayerMoveEvent,
  LayerOpacityEvent,
  LayerRenameEvent,
  LayerBlendModeEvent,
} from '../layer-panel/layer-panel.component';

export function themeToggleLabel(theme: string): string {
  return theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

export function toWhiteboardLayers(layers: Layer[]): WhiteboardLayer[] {
  return layers.map((layer) => ({
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity ?? 1,
    zIndex: layer.zIndex,
    type: 'drawing' as const,
    elements: [],
    blendMode: layer.blendMode || 'normal',
  }));
}

let nextMenuId = 0;

@Component({
  selector: 'ng-header-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, LayerPanelComponent],
  template: `
    <div class="header-panel">
      <!-- Left Section: Layers & Title -->
      <div class="header-left">
        <div class="dropdown-wrapper" (keydown.escape)="onEscape($event)">
          <button
            #layersTrigger
            (click)="toggleLayers($event)"
            class="icon-btn layers-button"
            [class.active]="showLayers()"
            title="Layers"
            aria-label="Layers"
            [attr.aria-expanded]="showLayers()"
            [attr.aria-controls]="showLayers() && !compact() ? layersMenuId : null"
          >
            <ng-icon name="layers"></ng-icon>
          </button>

          <div class="layers-dropdown" [id]="layersMenuId" *ngIf="showLayers() && !compact()">
            <div class="dropdown-header">
              <h4>Layers</h4>
              <button class="close-btn" aria-label="Close layers" title="Close" (click)="closeLayers()">
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
        <div class="actions" *ngIf="compact(); else fullActions">
          <button
            class="action-btn properties-btn"
            [class.has-selection]="hasSelection()"
            [class.active]="propertiesOpen()"
            title="Properties"
            aria-label="Properties"
            [attr.aria-expanded]="propertiesOpen()"
            (click)="propertiesToggle.emit($any($event.currentTarget))"
          >
            <ng-icon name="properties"></ng-icon>
          </button>
          <button
            class="action-btn menu-btn"
            [class.active]="menuOpen()"
            title="Menu"
            aria-label="Menu"
            [attr.aria-expanded]="menuOpen()"
            (click)="menuToggle.emit($any($event.currentTarget))"
          >
            <ng-icon name="menu"></ng-icon>
          </button>
        </div>
        <ng-template #fullActions>
          <div class="actions">
            <button
              *ngFor="let action of documentActions; trackBy: trackByAction"
              class="action-btn"
              [title]="action.label"
              [attr.aria-label]="action.label"
              (click)="runDocumentAction(action.id)"
            >
              <ng-icon [name]="action.icon"></ng-icon>
              <span class="action-label">{{ action.label }}</span>
            </button>
            <button
              class="action-btn theme-btn"
              (click)="editorState.toggleTheme()"
              [title]="themeToggleLabel()"
              [attr.aria-label]="themeToggleLabel()"
            >
              <ng-icon [name]="editorState.themeSignal() === 'dark' ? 'sun' : 'moon'"></ng-icon>
            </button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styleUrl: './header-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderPanelComponent {
  constructor(public editorState: EditorStateService) {}
  readonly layersMenuId = `wb-layers-menu-${nextMenuId++}`;
  private layersTrigger = viewChild<ElementRef<HTMLButtonElement>>('layersTrigger');
  editorConfig = input<EditorConfig>({} as EditorConfig);
  layers = input<Layer[]>([]);
  activeLayerId = input<string>(''); // Add activeLayerId as input
  showLayers = input<boolean>(false);
  isEditingTitle = input<boolean>(false);
  compact = input<boolean>(false);
  hasSelection = input<boolean>(false);
  propertiesOpen = input<boolean>(false);
  menuOpen = input<boolean>(false);

  @Output() titleChange = new EventEmitter<string>();
  @Output() titleEditStart = new EventEmitter<void>();
  @Output() titleEditEnd = new EventEmitter<void>();
  @Output() layersToggle = new EventEmitter<HTMLElement | null>();
  @Output() layerVisibilityToggle = new EventEmitter<Layer>();
  @Output() layerLockToggle = new EventEmitter<Layer>();
  @Output() layerAdd = new EventEmitter<void>();
  @Output() layerMenuShow = new EventEmitter<Layer>();
  @Output() newDocument = new EventEmitter<void>();
  @Output() saveDocument = new EventEmitter<void>();
  @Output() exportDocument = new EventEmitter<void>();
  @Output() propertiesToggle = new EventEmitter<HTMLElement | null>();
  @Output() menuToggle = new EventEmitter<HTMLElement | null>();

  // New layer panel events
  @Output() layerSelected = new EventEmitter<string>();
  @Output() layerDeleted = new EventEmitter<string>();
  @Output() layerRenamed = new EventEmitter<LayerRenameEvent>();
  @Output() layerOpacityChanged = new EventEmitter<LayerOpacityEvent>();
  @Output() layerMoved = new EventEmitter<LayerMoveEvent>();
  @Output() layerBlendModeChanged = new EventEmitter<LayerBlendModeEvent>();

  readonly documentActions = DOCUMENT_ACTIONS;

  runDocumentAction(id: DocumentActionId) {
    const outputs = { new: this.newDocument, save: this.saveDocument, export: this.exportDocument };
    outputs[id].emit();
  }

  themeToggleLabel(): string {
    return themeToggleLabel(this.editorState.themeSignal());
  }

  toggleLayers(event?: Event) {
    this.layersToggle.emit((event?.currentTarget as HTMLElement | null) ?? null);
  }

  onEscape(event: Event) {
    if (!this.showLayers() || this.compact()) return;
    event.stopPropagation();
    this.layersToggle.emit(this.layersTrigger()?.nativeElement ?? null);
    this.layersTrigger()?.nativeElement.focus();
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

  trackByAction(index: number, action: EditorAction<DocumentActionId>): string {
    return action.id;
  }

  // Layer panel helper methods
  convertLayersToWhiteboardLayers(): WhiteboardLayer[] {
    return toWhiteboardLayers(this.layers());
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
