import { Component, computed, ElementRef, HostListener, OnDestroy, OnInit, Signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextMenuService, ContextMenuItem, ContextMenuSection } from './context-menu.service';

@Component({
  selector: 'wb-context-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      #contextMenu
      class="context-menu"
      [class.visible]="isVisible()"
      [style.left.px]="position().x"
      [style.top.px]="position().y"
      (click)="$event.stopPropagation()"
    >
      <div class="context-menu-content">
        @for (section of sections(); track section.id) {
        <div class="context-menu-section">
          @for (item of section.items; track item.id) {
          <div
            class="context-menu-item"
            [class.disabled]="!item.enabled"
            [class.divider-after]="item.divider"
            [class.has-submenu]="item.submenu"
            [class.active]="hoveredItem === item"
            [class.focused]="isFocused(item)"
            (click)="onItemClick(item, $event)"
            (mouseenter)="onItemHover(item, $event)"
            (mouseleave)="onItemLeave()"
            [attr.title]="item.shortcut || null"
          >
            <div class="item-content">
              <span class="item-label">{{ item.label }}</span>
              @if (item.shortcut) {
              <span class="item-shortcut">{{ item.shortcut }}</span>
              } @if (item.submenu) {
              <span class="item-arrow">›</span>
              }
            </div>
          </div>
          }
        </div>
        }
      </div>
    </div>

    <!-- Submenu rendered separately outside main menu -->
    @if (hoveredItem && hoveredItem.submenu) {
    <div
      class="submenu"
      [style.left.px]="submenuPosition.left"
      [style.top.px]="submenuPosition.top"
      (mouseenter)="onSubmenuEnter()"
      (mouseleave)="onSubmenuLeave()"
      (click)="$event.stopPropagation()"
    >
      @for (subitem of hoveredItem.submenu; track subitem.id) {
      <div
        class="context-menu-item submenu-item"
        [class.disabled]="!subitem.enabled"
        [class.divider-after]="subitem.divider"
        [class.focused]="isFocused(subitem)"
        (click)="onItemClick(subitem, $event)"
        [attr.title]="subitem.shortcut || null"
      >
        <div class="item-content">
          <span class="item-label">{{ subitem.label }}</span>
          @if (subitem.shortcut) {
          <span class="item-shortcut">{{ subitem.shortcut }}</span>
          }
        </div>
      </div>
      }
    </div>
    }
  `,
  styles: [
    `
      .context-menu {
        position: absolute;
        z-index: 10000;
        opacity: 0;
        visibility: hidden;
        transform: scale(0.95);
        transition: all 0.1s ease-out;
        pointer-events: none;
      }

      .context-menu.visible {
        opacity: 1;
        visibility: visible;
        transform: scale(1);
        pointer-events: auto;
      }

      .context-menu-content {
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 4px 0;
        min-width: 200px;
        max-width: 300px;
        max-height: 400px;
        overflow-y: auto;
        user-select: none;
      }

      /* Custom scrollbar for context menu */
      .context-menu-content::-webkit-scrollbar {
        width: 6px;
      }

      .context-menu-content::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }

      .context-menu-content::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }

      .context-menu-content::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }

      .context-menu-section:not(:last-child) {
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 4px;
        padding-bottom: 4px;
      }

      .context-menu-item {
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.1s ease;
        position: relative;
      }

      .context-menu-item:hover:not(.disabled) {
        background-color: #f5f5f5;
      }

      .context-menu-item.focused:not(.disabled) {
        background-color: #e3f2fd;
        outline: 2px solid #2196f3;
        outline-offset: -2px;
      }

      .context-menu-item.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .context-menu-item.divider-after::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 16px;
        right: 16px;
        height: 1px;
        background-color: #e0e0e0;
        margin-bottom: -4px;
      }

      .item-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
      }

      .item-label {
        flex: 1;
        font-size: 14px;
        color: #333;
        font-weight: 400;
      }

      .item-shortcut {
        font-size: 12px;
        color: #666;
        margin-left: 16px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      }

      .item-arrow {
        margin-left: 8px;
        font-size: 16px;
        color: #999;
      }

      .context-menu-item.has-submenu {
        position: relative;
      }

      .context-menu-item.has-submenu.active {
        background-color: #f5f5f5;
      }

      .submenu {
        position: absolute;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 4px 0;
        min-width: 200px;
        max-width: 300px;
        user-select: none;
        z-index: 10001;
        opacity: 1;
        transform: scale(1);
        transition: opacity 0.1s ease, transform 0.1s ease;
      }

      .submenu-item {
        padding: 8px 16px;
      }

      .submenu-item:hover:not(.disabled) {
        background-color: #f5f5f5;
      }

      .context-menu-item.disabled .item-label,
      .context-menu-item.disabled .item-shortcut,
      .context-menu-item.disabled .item-arrow {
        color: #999;
      }

      /* Dark theme support */
      @media (prefers-color-scheme: dark) {
        .context-menu-content,
        .submenu {
          background: #2a2a2a;
          border-color: #404040;
        }

        .context-menu-content::-webkit-scrollbar-track {
          background: #3a3a3a;
        }

        .context-menu-content::-webkit-scrollbar-thumb {
          background: #666666;
        }

        .context-menu-content::-webkit-scrollbar-thumb:hover {
          background: #777777;
        }

        .context-menu-item:hover:not(.disabled) {
          background-color: #404040;
        }

        .context-menu-item.focused:not(.disabled) {
          background-color: #1e3a5f;
          outline: 2px solid #1976d2;
        }

        .context-menu-item.has-submenu.active {
          background-color: #404040;
        }

        .submenu-item:hover:not(.disabled) {
          background-color: #404040;
        }

        .item-label {
          color: #e0e0e0;
        }

        .item-shortcut {
          color: #a0a0a0;
        }

        .item-arrow {
          color: #666;
        }

        .context-menu-item.disabled .item-label,
        .context-menu-item.disabled .item-shortcut,
        .context-menu-item.disabled .item-arrow {
          color: #666;
        }

        .context-menu-section:not(:last-child) {
          border-bottom-color: #404040;
        }

        .context-menu-item.divider-after::after {
          background-color: #404040;
        }
      }
    `,
  ],
})
export class ContextMenuComponent implements OnInit, OnDestroy {
  @ViewChild('contextMenu', { static: true }) contextMenu!: ElementRef<HTMLDivElement>;

  isVisible: Signal<boolean>;
  position: Signal<{ x: number; y: number }>;
  sections: Signal<ContextMenuSection[]>;
  containerBounds: Signal<DOMRect | null>;
  focusedItem: Signal<ContextMenuItem | null>;

  hoveredItem: ContextMenuItem | null = null;
  submenuPosition = { left: 0, top: 0 };
  private submenuTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private contextMenuService: ContextMenuService) {
    this.isVisible = this.contextMenuService.getContextMenuVisible();
    this.position = this.contextMenuService.getContextMenuPosition();
    this.sections = this.contextMenuService.getContextMenuSections();
    this.containerBounds = this.contextMenuService.getContainerBounds();

    // Create a computed signal that returns the focused item directly
    this.focusedItem = computed(() => {
      const focusedIndex = this.contextMenuService.getFocusedItemIndex()();
      const allItems = this.contextMenuService.getAllMenuItems();
      return allItems[focusedIndex] || null;
    });
  }

  ngOnInit(): void {
    this.position = computed(() => {
      const pos = this.contextMenuService.getContextMenuPosition()();
      const containerBounds = this.containerBounds();

      let x = pos.x;
      let y = pos.y;

      if (containerBounds) {
        x = pos.x - containerBounds.left;
        y = pos.y - containerBounds.top;
      }

      return this.adjustPosition(x, y);
    });
  }

  ngOnDestroy(): void {
    this.contextMenuService.hideContextMenu();
    if (this.submenuTimeout) {
      clearTimeout(this.submenuTimeout);
    }
  }

  onItemClick(item: ContextMenuItem, event: MouseEvent): void {
    if (!item.enabled) return;

    if (item.submenu) {
      event.stopPropagation();
      return;
    }

    if (item.action) {
      this.contextMenuService.executeAction(item.action);
    }
  }

  onItemHover(item: ContextMenuItem, event: MouseEvent): void {
    if (this.submenuTimeout) {
      clearTimeout(this.submenuTimeout);
      this.submenuTimeout = null;
    }

    if (item.submenu && item.enabled) {
      this.hoveredItem = item;
      const target = event.currentTarget as HTMLElement;
      this.calculateSubmenuPosition(target);
    } else {
      this.hoveredItem = null;
    }
  }

  onItemLeave(): void {
    if (this.submenuTimeout) {
      clearTimeout(this.submenuTimeout);
    }
    this.submenuTimeout = setTimeout(() => {
      this.hoveredItem = null;
    }, 100);
  }

  onSubmenuEnter(): void {
    if (this.submenuTimeout) {
      clearTimeout(this.submenuTimeout);
      this.submenuTimeout = null;
    }
  }

  onSubmenuLeave(): void {
    if (this.submenuTimeout) {
      clearTimeout(this.submenuTimeout);
    }
    this.submenuTimeout = setTimeout(() => {
      this.hoveredItem = null;
    }, 100);
  }

  private calculateSubmenuPosition(itemElement: HTMLElement): void {
    const itemRect = itemElement.getBoundingClientRect();
    const containerBounds = this.containerBounds();

    if (!containerBounds) {
      this.submenuPosition = {
        left: itemRect.right + 4,
        top: itemRect.top - 4,
      };
      return;
    }

    const submenuWidth = 200;
    const padding = 4;

    const itemRelativeLeft = itemRect.left - containerBounds.left;
    const itemRelativeRight = itemRect.right - containerBounds.left;
    const itemRelativeTop = itemRect.top - containerBounds.top;

    const contextMenuElement = this.contextMenu?.nativeElement;
    const contextMenuRect = contextMenuElement?.getBoundingClientRect();
    const contextMenuTop = contextMenuRect ? contextMenuRect.top - containerBounds.top : padding;
    const contextMenuBottom = contextMenuRect
      ? contextMenuRect.bottom - containerBounds.top
      : containerBounds.height - padding;

    // Calculate horizontal position
    let left = itemRelativeRight + padding;

    const spaceOnRight = containerBounds.width - itemRelativeRight - padding;
    const spaceOnLeft = itemRelativeLeft - padding;

    if (spaceOnRight < submenuWidth && spaceOnLeft > spaceOnRight) {
      left = itemRelativeLeft - submenuWidth - padding;
    }

    // Calculate vertical position - align with item initially
    let top = itemRelativeTop;

    // Estimate submenu height (will be calculated dynamically based on items)
    const estimatedItemHeight = 32; // Approximate height per item
    const submenuItemCount = this.hoveredItem?.submenu?.length || 0;
    const submenuHeight = submenuItemCount * estimatedItemHeight + 8; // +8 for padding

    // Ensure submenu doesn't exceed context menu bottom
    const submenuBottom = top + submenuHeight;
    if (submenuBottom > contextMenuBottom) {
      top = contextMenuBottom - submenuHeight;
    }

    // Ensure submenu doesn't go above context menu top
    if (top < contextMenuTop) {
      top = contextMenuTop;
    }

    // Final horizontal bounds check
    if (left < padding) {
      left = padding;
    }
    if (left + submenuWidth > containerBounds.width - padding) {
      left = containerBounds.width - submenuWidth - padding;
    }

    this.submenuPosition = { left, top };
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isVisible()) return;

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.contextMenuService.hideContextMenu();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.contextMenuService.focusNextItem();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.contextMenuService.focusPreviousItem();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.contextMenuService.openFocusedSubmenu();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.contextMenuService.closeFocusedSubmenu();
        break;
      case 'Enter':
        event.preventDefault();
        this.contextMenuService.executeFocusedAction();
        break;
      case 'Home':
        event.preventDefault();
        this.contextMenuService.focusFirstItem();
        break;
      case 'End':
        event.preventDefault();
        this.contextMenuService.focusLastItem();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isVisible() && this.contextMenu?.nativeElement) {
      const contextMenuElement = this.contextMenu.nativeElement;
      const target = event.target as Node;

      if (!contextMenuElement.contains(target)) {
        this.contextMenuService.hideContextMenu();
      }
    }
  }

  private adjustPosition(x: number, y: number): { x: number; y: number } {
    if (!this.contextMenu?.nativeElement) {
      return { x, y };
    }

    const menu = this.contextMenu.nativeElement;
    const menuRect = menu.getBoundingClientRect();
    const containerBounds = this.containerBounds();

    if (!containerBounds) {
      return { x, y };
    }

    let adjustedX = x;
    let adjustedY = y;

    const padding = 10;
    const maxMenuHeight = 400;

    if (x + menuRect.width > containerBounds.width - padding) {
      adjustedX = Math.max(padding, x - menuRect.width);
    }
    if (adjustedX < padding) {
      adjustedX = padding;
    }

    const availableHeight = containerBounds.height - y - padding;
    const requiredHeight = Math.min(menuRect.height, maxMenuHeight);

    if (requiredHeight > availableHeight) {
      const availableHeightAbove = y - padding;
      if (requiredHeight <= availableHeightAbove) {
        adjustedY = y - requiredHeight;
      } else {
        if (availableHeightAbove > availableHeight) {
          adjustedY = y - Math.min(requiredHeight, availableHeightAbove);
        } else {
          adjustedY = Math.max(padding, containerBounds.height - requiredHeight - padding);
        }
      }
    }

    if (adjustedY < padding) {
      adjustedY = padding;
    }
    if (adjustedY + requiredHeight > containerBounds.height - padding) {
      adjustedY = containerBounds.height - requiredHeight - padding;
    }

    return { x: adjustedX, y: adjustedY };
  }

  isFocused(item: ContextMenuItem): boolean {
    return this.focusedItem() === item;
  }
}
