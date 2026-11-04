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
  Output,
  signal,
} from '@angular/core';
import { SHAPE_TOOLS, toolGroups, ToolShortcut } from '../../../../input/tool-shortcuts';
import { ToolType } from '../../../../types';
import { IconName } from '../../icon/icons';
import { IconComponent } from '../../icon/icon.component';

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
          @if (collapseShapes() && isShapeGroup(group)) {
            @let shape = flyoutShape(group);
            <button
              class="icon-btn tool-btn flyout-trigger"
              [class.active]="isShape(selectedTool())"
              [attr.data-tool]="shape.tool"
              [attr.data-tooltip]="'Shapes'"
              [attr.aria-label]="'Shapes, ' + shape.label"
              aria-haspopup="true"
              [attr.aria-expanded]="flyoutOpen()"
              [attr.tabindex]="shape.tool === tabStop() ? 0 : -1"
              (click)="toggleFlyout($event)"
            >
              <ng-icon [name]="icons[shape.tool]"></ng-icon>
              <span class="flyout-caret" aria-hidden="true"></span>
            </button>
          } @else {
            @for (tool of group; track tool.tool) {
              <button
                [class.active]="tool.tool === selectedTool()"
                (click)="onToolSelect(tool.tool)"
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
          @if (!last) {
            <div class="toolbar-separator"></div>
          }
        </div>
      }
    </div>
    @if (flyoutOpen() && shapeGroup(); as shapes) {
      <div
        class="flyout-menu"
        role="group"
        aria-label="Shapes"
        [style.left.px]="flyoutLeft()"
        (keydown)="onFlyoutKeydown($event)"
        (focusout)="onFlyoutFocusOut($event)"
      >
        @for (tool of shapes; track tool.tool) {
          <button
            class="icon-btn flyout-item"
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

  @Output() toolSelect = new EventEmitter<ToolType>();
  @Output() lockToggle = new EventEmitter<void>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  readonly groups = computed(() => toolGroups(this.tools()));
  readonly vertical = computed(() => this.position() === 'left' && !this.compact());
  readonly collapseShapes = computed(() => this.compact());
  readonly shapeGroup = computed(() => this.groups().find((g) => this.isShapeGroup(g)));

  readonly flyoutOpen = signal(false);
  readonly flyoutLeft = signal(0);
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
      this.flyoutOpen.set(false);
    });
    effect(() => {
      if (!this.collapseShapes()) this.flyoutOpen.set(false);
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
    const visible = this.groups().flatMap((g) =>
      this.collapseShapes() && this.isShapeGroup(g) ? [this.flyoutShape(g)] : g
    );
    return visible.some((t) => t.tool === selected) ? selected : visible[0]?.tool;
  }

  toggleFlyout(event: MouseEvent) {
    const button = event.currentTarget as HTMLElement;
    const hostRect = this.host.nativeElement.getBoundingClientRect();
    const rect = button.getBoundingClientRect();
    this.flyoutLeft.set(rect.left + rect.width / 2 - hostRect.left);
    this.flyoutOpen.update((open) => !open);
    if (this.flyoutOpen()) {
      afterNextRender(() => this.host.nativeElement.querySelector<HTMLButtonElement>('.flyout-item')?.focus(), {
        injector: this.injector,
      });
    }
  }

  pickShape(tool: ToolType) {
    this.flyoutOpen.set(false);
    this.toolSelect.emit(tool);
    this.focusTrigger();
  }

  onFlyoutKeydown(event: KeyboardEvent) {
    const items = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('.flyout-item'));
    const current = items.indexOf(event.target as HTMLButtonElement);
    if (event.key === 'Escape') {
      this.flyoutOpen.set(false);
      this.focusTrigger();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      const step = event.key === 'ArrowRight' ? 1 : -1;
      items[(current + step + items.length) % items.length]?.focus();
    } else {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
  }

  onFlyoutFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as Element | null;
    if (next?.closest('.flyout-menu, .flyout-trigger')) return;
    this.flyoutOpen.set(false);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent) {
    if (!this.flyoutOpen()) return;
    const target = event.target as Element | null;
    if (target?.closest('.flyout-menu, .flyout-trigger')) return;
    this.flyoutOpen.set(false);
  }

  onKeydown(event: KeyboardEvent) {
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLButtonElement>('button.tool-btn'));
    const current = buttons.indexOf(event.target as HTMLButtonElement);
    if (current < 0) return;
    let next: number;
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        next = (current + 1) % buttons.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        next = (current - 1 + buttons.length) % buttons.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = buttons.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
    buttons[next].focus();
  }

  onToolSelect(toolId: ToolType) {
    this.toolSelect.emit(toolId);
  }

  getTooltip(tool: ToolShortcut): string {
    return `${tool.label} (${tool.keys[0].toUpperCase()})`;
  }

  getAriaShortcuts(tool: ToolShortcut): string {
    return [...tool.keys.map((k) => k.toUpperCase()), ...(tool.digit ? [tool.digit] : [])].join(' ');
  }

  private focusTrigger() {
    this.host.nativeElement.querySelector<HTMLButtonElement>('.flyout-trigger')?.focus();
  }
}
