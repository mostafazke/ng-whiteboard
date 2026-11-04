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
import { EditorConfig, WhiteboardLayer } from '../../../../types';
import { SaveState } from '../../editor-state.service';
import { IconComponent } from '../../icon/icon.component';
import { EditableTitleComponent } from '../../ui/editable-title/editable-title.component';
import { MenuComponent } from '../../ui/menu/menu.component';
import { MainMenuActionId, MainMenuItem } from '../../utils/editor-actions';
import { LayerPanelAction, LayerPanelComponent } from '../layer-panel/layer-panel.component';

let nextMenuId = 0;

@Component({
  selector: 'ng-header-panel',
  standalone: true,
  imports: [IconComponent, LayerPanelComponent, MenuComponent, EditableTitleComponent],
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

        <ng-editable-title
          [value]="editorConfig().title"
          [unsaved]="saveState() === 'unsaved'"
          [fileName]="fileName()"
          (valueChange)="titleChange.emit($event)"
        >
        </ng-editable-title>

        <div class="dropdown-wrapper layers-wrapper" (keydown.escape)="onEscape($event)">
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

          @if (showLayers() && !compact()) {
            <div class="layers-dropdown" [id]="layersMenuId">
              <ng-layer-panel
                [layers]="layers()"
                [activeLayerId]="activeLayerId()"
                [showClose]="true"
                (action)="layerAction.emit($event)"
                (closed)="closeLayers()"
              >
              </ng-layer-panel>
            </div>
          }
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
  layers = input<WhiteboardLayer[]>([]);
  activeLayerId = input<string>('');
  showLayers = input<boolean>(false);
  compact = input<boolean>(false);
  hasSelection = input<boolean>(false);
  propertiesOpen = input<boolean>(false);
  /** Whether the parent's compact menu sheet is open. */
  menuOpen = input<boolean>(false);
  menuItems = input<readonly MainMenuItem[]>([]);
  saveState = input<SaveState>('none');
  fileName = input<string | null>(null);

  protected menuPopoverOpen = signal(false);

  @Output() titleChange = new EventEmitter<string>();
  @Output() layersToggle = new EventEmitter<HTMLElement | null>();
  @Output() layerAction = new EventEmitter<LayerPanelAction>();
  @Output() propertiesToggle = new EventEmitter<HTMLElement | null>();
  @Output() menuToggle = new EventEmitter<HTMLElement | null>();
  @Output() menuAction = new EventEmitter<{ id: MainMenuActionId; opener: HTMLElement | null }>();

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

  toggleLayers(event: Event) {
    this.layersToggle.emit(event.currentTarget as HTMLElement);
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
}
