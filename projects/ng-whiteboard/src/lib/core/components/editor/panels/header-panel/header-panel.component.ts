import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  input,
  Output,
  signal,
  viewChild,
} from '@angular/core';
import { EditorConfig } from '../../../../types';
import { Layer } from '../../editor-state.service';
import { IconComponent } from '../../icon/icon.component';
import { EditableTitleComponent } from '../../ui/editable-title/editable-title.component';
import { MenuComponent } from '../../ui/menu/menu.component';
import { MainMenuActionId, MainMenuItem } from '../../utils/editor-actions';
import { toWhiteboardLayers } from '../../utils/whiteboard-layers';
import {
  LayerPanelComponent,
  WhiteboardLayer,
  LayerMoveEvent,
  LayerOpacityEvent,
  LayerRenameEvent,
  LayerBlendModeEvent,
} from '../layer-panel/layer-panel.component';

let nextMenuId = 0;

@Component({
  selector: 'ng-header-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, LayerPanelComponent, MenuComponent, EditableTitleComponent],
  template: `
    <div class="header-panel">
      <div class="header-left">
        <div #menuWrapper class="dropdown-wrapper">
          <button
            #menuTrigger
            type="button"
            (click)="toggleMenu($event)"
            class="menu-btn"
            [class.active]="isMenuExpanded()"
            title="Menu"
            aria-label="Menu"
            aria-haspopup="menu"
            [attr.aria-expanded]="isMenuExpanded()"
            [attr.aria-controls]="menuPopoverOpen() ? mainMenuId : null"
          >
            <ng-icon name="menu"></ng-icon>
          </button>

          @if (menuPopoverOpen() && !compact()) {
            <div class="menu-popover" [id]="mainMenuId">
              <ng-menu [items]="menuItems()" (itemSelected)="chooseMenuItem($event)" (closeRequested)="closeMenu(true)">
              </ng-menu>
            </div>
          }
        </div>

        <ng-editable-title [value]="editorConfig().title" (valueChange)="titleChange.emit($event)"> </ng-editable-title>

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
      </div>

      @if (compact()) {
        <div class="header-right">
          <div class="actions">
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
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './header-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderPanelComponent {
  readonly layersMenuId = `wb-layers-menu-${nextMenuId}`;
  readonly mainMenuId = `wb-main-menu-${nextMenuId++}`;
  private layersTrigger = viewChild<ElementRef<HTMLButtonElement>>('layersTrigger');
  private menuTrigger = viewChild<ElementRef<HTMLButtonElement>>('menuTrigger');
  private menuWrapper = viewChild<ElementRef<HTMLElement>>('menuWrapper');
  editorConfig = input<EditorConfig>({} as EditorConfig);
  layers = input<Layer[]>([]);
  activeLayerId = input<string>(''); // Add activeLayerId as input
  showLayers = input<boolean>(false);
  compact = input<boolean>(false);
  hasSelection = input<boolean>(false);
  propertiesOpen = input<boolean>(false);
  /** Whether the parent's compact menu sheet is open. */
  menuOpen = input<boolean>(false);
  menuItems = input<readonly MainMenuItem[]>([]);

  protected menuPopoverOpen = signal(false);

  @Output() titleChange = new EventEmitter<string>();
  @Output() layersToggle = new EventEmitter<HTMLElement | null>();
  @Output() layerVisibilityToggle = new EventEmitter<Layer>();
  @Output() layerLockToggle = new EventEmitter<Layer>();
  @Output() layerAdd = new EventEmitter<void>();
  @Output() layerMenuShow = new EventEmitter<Layer>();
  @Output() propertiesToggle = new EventEmitter<HTMLElement | null>();
  @Output() menuToggle = new EventEmitter<HTMLElement | null>();
  @Output() menuAction = new EventEmitter<{ id: MainMenuActionId; opener: HTMLElement | null }>();

  // New layer panel events
  @Output() layerSelected = new EventEmitter<string>();
  @Output() layerDeleted = new EventEmitter<string>();
  @Output() layerRenamed = new EventEmitter<LayerRenameEvent>();
  @Output() layerOpacityChanged = new EventEmitter<LayerOpacityEvent>();
  @Output() layerMoved = new EventEmitter<LayerMoveEvent>();
  @Output() layerBlendModeChanged = new EventEmitter<LayerBlendModeEvent>();

  constructor() {
    effect(() => {
      if (this.compact()) this.menuPopoverOpen.set(false);
    });
  }

  isMenuExpanded(): boolean {
    return this.compact() ? this.menuOpen() : this.menuPopoverOpen();
  }

  toggleMenu(event: Event) {
    if (this.compact()) {
      this.menuToggle.emit(event.currentTarget as HTMLElement);
      return;
    }
    this.menuPopoverOpen.update((open) => !open);
  }

  closeMenu(refocus: boolean) {
    this.menuPopoverOpen.set(false);
    if (refocus) this.menuTrigger()?.nativeElement.focus();
  }

  chooseMenuItem(id: string) {
    this.menuPopoverOpen.set(false);
    this.menuAction.emit({ id: id as MainMenuActionId, opener: this.menuTrigger()?.nativeElement ?? null });
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event) {
    if (!this.menuPopoverOpen()) return;
    const target = event.target;
    if (target instanceof Node && this.menuWrapper()?.nativeElement.contains(target)) return;
    this.closeMenu(false);
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
