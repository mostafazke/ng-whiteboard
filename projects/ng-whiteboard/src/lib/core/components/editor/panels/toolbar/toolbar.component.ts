import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  Injector,
  input,
  output,
  Output,
  signal,
} from '@angular/core';
import { AvailableShape } from '../../../../elements/shapes';
import { SHAPE_TOOLS, toolGroups, ToolShortcut } from '../../../../input/tool-shortcuts';
import { ToolType } from '../../../../types';
import { IconName } from '../../icon/icons';
import { nextRadioIndex } from '../../ui/radio-group-keys';
import { IconComponent } from '../../icon/icon.component';
import { clampCenter } from './flyout-position';

const GRID_COLUMNS = 4;

type ToolbarMenu = 'tools' | 'shapes';
const FLYOUT_NAV_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

@Component({
  selector: 'ng-toolbar',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div
      class="toolbar-floating"
      [class.vertical]="vertical()"
      role="toolbar"
      aria-label="Tools"
      [attr.aria-orientation]="vertical() ? 'vertical' : 'horizontal'"
      (keydown)="onKeydown($event)"
    >
      <div class="toolbar-group">
        <button
          class="icon-btn tool-btn lock-btn"
          [class.active]="locked()"
          data-tooltip="Keep tool active (Q)"
          aria-label="Keep tool active"
          aria-keyshortcuts="Q"
          [attr.aria-pressed]="locked()"
          tabindex="-1"
          (click)="lockToggle.emit()"
        >
          <ng-icon [name]="locked() ? 'lock' : 'unlock'"></ng-icon>
        </button>
        <div class="toolbar-separator"></div>
      </div>
      @for (group of groups(); track $index; let last = $last) {
        <div class="toolbar-group">
          @if (compact() && isShapeGroup(group)) {
            @let shape = flyoutShape(group);
            <button
              class="icon-btn tool-btn flyout-trigger"
              [class.active]="isShape(selectedTool())"
              [attr.data-tool]="shape.tool"
              data-menu="tools"
              data-tooltip="Shapes"
              [attr.aria-label]="'Shapes, ' + shape.label"
              aria-haspopup="menu"
              [attr.aria-expanded]="openMenu() === 'tools'"
              [attr.tabindex]="shape.tool === tabStop() ? 0 : -1"
              (click)="toggleMenu($event, 'tools')"
            >
              <ng-icon [name]="icons[shape.tool]"></ng-icon>
              <span class="flyout-caret" aria-hidden="true"></span>
            </button>
          } @else {
            @for (tool of group; track tool.tool) {
              @if (tool.tool === shapeTool) {
                <button
                  class="icon-btn tool-btn flyout-trigger"
                  [class.active]="tool.tool === selectedTool()"
                  [attr.data-tool]="tool.tool"
                  data-menu="shapes"
                  [attr.data-tooltip]="getTooltip(tool)"
                  [attr.aria-label]="tool.label"
                  [attr.aria-keyshortcuts]="getAriaShortcuts(tool)"
                  [attr.aria-pressed]="tool.tool === selectedTool()"
                  aria-haspopup="menu"
                  [attr.aria-expanded]="openMenu() === 'shapes'"
                  [attr.tabindex]="tool.tool === tabStop() ? 0 : -1"
                  (click)="toggleMenu($event, 'shapes')"
                >
                  <ng-icon name="more"></ng-icon>
                </button>
              } @else {
                <button
                  [class.active]="tool.tool === selectedTool()"
                  (click)="toolSelect.emit(tool.tool)"
                  [attr.data-tooltip]="getTooltip(tool)"
                  [attr.aria-label]="tool.label"
                  [attr.aria-keyshortcuts]="getAriaShortcuts(tool)"
                  [attr.aria-pressed]="tool.tool === selectedTool()"
                  [attr.tabindex]="tool.tool === tabStop() ? 0 : -1"
                  class="icon-btn tool-btn"
                  [attr.data-tool]="tool.tool"
                >
                  <ng-icon [name]="icons[tool.tool]"></ng-icon>
                  @if (tool.digit) {
                    <span class="tool-digit" aria-hidden="true">{{ tool.digit }}</span>
                  }
                </button>
              }
            }
          }
          @if (!last) {
            <div class="toolbar-separator"></div>
          }
        </div>
      }
    </div>
    @if (openMenu(); as menu) {
      <div
        class="flyout-menu"
        [class.beside]="vertical()"
        [attr.role]="menu === 'tools' ? 'group' : null"
        [attr.aria-label]="menu === 'tools' ? 'Shapes' : null"
        [style.left.px]="vertical() ? null : flyoutLeft()"
        [style.top.px]="vertical() ? flyoutTop() : null"
        (keydown)="onFlyoutKeydown($event)"
        (focusout)="onFlyoutFocusOut($event)"
      >
        @if (menu === 'tools') {
          <div class="flyout-row">
            @for (tool of shapeGroup(); track tool.tool) {
              <button
                class="icon-btn flyout-item flyout-tool"
                [class.active]="tool.tool === selectedTool()"
                [attr.data-tool]="tool.tool"
                [attr.aria-label]="tool.label"
                [attr.aria-pressed]="tool.tool === selectedTool()"
                (click)="pickShape(tool.tool)"
              >
                <ng-icon [name]="icons[tool.tool]"></ng-icon>
              </button>
            }
          </div>
        }
        @if (menu === 'shapes') {
          <div class="shape-grid" role="menu" aria-label="Shapes" [style.--wb-shape-columns]="gridColumns">
            @for (shape of shapes(); track shape.id) {
              <button
                class="icon-btn flyout-item shape-item"
                [class.active]="selectedTool() === shapeTool && shape.id === activeShape()?.id"
                role="menuitemradio"
                [attr.aria-checked]="shape.id === activeShape()?.id"
                [attr.aria-label]="shape.name"
                [title]="shape.name"
                (click)="pickLibraryShape(shape.id)"
              >
                <ng-icon [path]="shape.path" [aspectRatio]="shape.aspectRatio"></ng-icon>
              </button>
            }
          </div>
        }
      </div>
    }
  `,
  styleUrl: './toolbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  selectedTool = input<ToolType>(ToolType.Pen);
  /** Tools to show; all when unset. */
  tools = input<readonly ToolType[] | undefined>(undefined);
  position = input<'bottom' | 'left'>('bottom');
  compact = input(false);
  locked = input(false);
  shapes = input<AvailableShape[]>([]);
  activeShapeId = input<string | undefined>();

  @Output() toolSelect = new EventEmitter<ToolType>();
  @Output() lockToggle = new EventEmitter<void>();
  readonly shapeSelect = output<string>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly shapeTool = ToolType.Shape;
  readonly gridColumns = GRID_COLUMNS;

  /** Without any shapes the Shape tool has nothing to draw, so it is left out. */
  readonly groups = computed(() => {
    const groups = toolGroups(this.tools());
    if (this.shapes().length) return groups;
    return groups.map((g) => g.filter((t) => t.tool !== ToolType.Shape)).filter((g) => g.length > 0);
  });
  readonly vertical = computed(() => this.position() === 'left' && !this.compact());
  readonly shapeGroup = computed(() => this.groups().find((g) => this.isShapeGroup(g)) ?? []);
  readonly activeShape = computed(() => {
    const shapes = this.shapes();
    return shapes.find((s) => s.id === this.activeShapeId()) ?? shapes[0];
  });

  readonly openMenu = signal<ToolbarMenu | null>(null);
  readonly flyoutLeft = signal(0);
  readonly flyoutTop = signal(0);
  private readonly lastShape = signal<ToolType>(ToolType.Rectangle);

  readonly icons: { readonly [tool: string]: IconName } = {
    [ToolType.Hand]: 'Hand',
    [ToolType.ZoomArea]: 'ZoomArea',
    [ToolType.Select]: 'Select',
    [ToolType.Pen]: 'Pen',
    [ToolType.Eraser]: 'Eraser',
    [ToolType.Rectangle]: 'Rectangle',
    [ToolType.Ellipse]: 'Ellipse',
    [ToolType.Line]: 'Line',
    [ToolType.Arrow]: 'Arrow',
    [ToolType.Text]: 'Text',
    [ToolType.Image]: 'Image',
  };

  constructor() {
    effect(() => {
      const tool = this.selectedTool();
      if (this.isShape(tool)) this.lastShape.set(tool);
      this.openMenu.set(null);
    });
    effect(() => {
      this.compact();
      this.openMenu.set(null);
    });
  }

  isShape(tool: ToolType): boolean {
    return SHAPE_TOOLS.includes(tool);
  }

  isShapeGroup(group: ToolShortcut[]): boolean {
    return group.every((t) => this.isShape(t.tool));
  }

  /** The shape the collapsed button shows: the active shape, else the last one used. */
  flyoutShape(group: ToolShortcut[]): ToolShortcut {
    const selected = this.selectedTool();
    return group.find((t) => t.tool === selected) ?? group.find((t) => t.tool === this.lastShape()) ?? group[0];
  }

  /** The tool whose button is tabbable; a collapsed shape counts through its trigger. */
  tabStop(): ToolType {
    const selected = this.selectedTool();
    const visible = this.groups().flatMap((g) => (this.compact() && this.isShapeGroup(g) ? [this.flyoutShape(g)] : g));
    return visible.some((t) => t.tool === selected) ? selected : visible[0]?.tool;
  }

  toggleMenu(event: MouseEvent, menu: ToolbarMenu) {
    const button = event.currentTarget as HTMLElement;
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    this.flyoutLeft.set(rect.left + rect.width / 2 - hostRect.left);
    this.flyoutTop.set(rect.top + rect.height / 2 - hostRect.top);
    // Removing the old menu's focused item would fire a focusout that closes the new menu.
    if (this.openMenu() && this.openMenu() !== menu) button.focus();
    this.openMenu.update((open) => (open === menu ? null : menu));
    if (this.openMenu()) {
      afterNextRender(
        () => {
          this.keepMenuInside();
          this.host.nativeElement.querySelector<HTMLButtonElement>('.flyout-item')?.focus();
        },
        { injector: this.injector }
      );
    }
  }

  private keepMenuInside() {
    const menu = this.host.nativeElement.querySelector<HTMLElement>('.flyout-menu');
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    if (!menu || !hostRect.width) return;
    const menuRect = menu.getBoundingClientRect();
    if (this.vertical()) {
      this.flyoutTop.set(clampCenter(this.flyoutTop(), menuRect.height, hostRect.height));
    } else {
      this.flyoutLeft.set(clampCenter(this.flyoutLeft(), menuRect.width, hostRect.width));
    }
  }

  pickShape(tool: ToolType) {
    this.closeMenu();
    this.toolSelect.emit(tool);
  }

  pickLibraryShape(id: string) {
    this.closeMenu();
    this.shapeSelect.emit(id);
  }

  onFlyoutKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeMenu();
    } else if (FLYOUT_NAV_KEYS.includes(event.key)) {
      this.flyoutKeyTarget(event.key, event.target as HTMLButtonElement)?.focus();
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  /** Left/Right wrap within the open menu; Up/Down move by a grid row. */
  private flyoutKeyTarget(key: string, target: HTMLButtonElement): HTMLButtonElement | undefined {
    const inGrid = this.openMenu() === 'shapes';
    const list = this.flyoutButtons(inGrid ? '.shape-item' : '.flyout-tool');
    const index = list.indexOf(target);
    switch (key) {
      case 'ArrowRight':
        return list[(index + 1) % list.length];
      case 'ArrowLeft':
        return list[(index - 1 + list.length) % list.length];
      case 'Home':
        return list[0];
      case 'End':
        return list[list.length - 1];
      case 'ArrowDown':
        return inGrid ? list[index + GRID_COLUMNS] : undefined;
      case 'ArrowUp':
        return inGrid ? list[index - GRID_COLUMNS] : undefined;
      default:
        return undefined;
    }
  }

  private flyoutButtons(selector: string): HTMLButtonElement[] {
    return Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>(`.flyout-menu ${selector}`));
  }

  onFlyoutFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Element | null;
    if (next?.closest('.flyout-menu, .flyout-trigger')) return;
    this.openMenu.set(null);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent) {
    if (!this.openMenu()) return;
    const target = event.target as Element | null;
    if (target?.closest('.flyout-menu, .flyout-trigger')) return;
    this.openMenu.set(null);
  }

  onKeydown(event: KeyboardEvent) {
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button.tool-btn'));
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    const next = nextRadioIndex(event.key, current, buttons.length);
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    buttons[next].focus();
  }

  getTooltip(tool: ToolShortcut): string {
    return `${tool.label} (${tool.keys[0].toUpperCase()})`;
  }

  getAriaShortcuts(tool: ToolShortcut): string {
    return [...tool.keys.map((k) => k.toUpperCase()), ...(tool.digit ? [tool.digit] : [])].join(' ');
  }

  /** Closes the open menu and returns focus to the button that opened it. */
  private closeMenu() {
    const menu = this.openMenu();
    this.openMenu.set(null);
    if (menu) this.host.nativeElement.querySelector<HTMLButtonElement>(`.flyout-trigger[data-menu="${menu}"]`)?.focus();
  }
}
