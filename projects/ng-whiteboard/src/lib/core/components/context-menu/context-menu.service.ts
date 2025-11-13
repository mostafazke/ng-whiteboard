import { Injectable, Signal, computed, signal } from '@angular/core';
import { ApiService } from '../../api/api.service';
import { AlignmentType } from '../../types';

export const CONTEXT_MENU_ICONS: Record<string, string> = {
  // Clipboard
  cut: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 2.5a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0v-11Zm9 0a.5.5 0 0 0-1 0v11a.5.5 0 0 0 1 0v-11ZM5 1a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1h.5A1.5 1.5 0 0 1 13 3.5V12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3.5A1.5 1.5 0 0 1 4.5 2H5V1Zm1 0v1h4V1H6Z"/></svg>',
  copy: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V2Zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6ZM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1H2Z"/></svg>',
  paste:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-7Zm-1.5.5A1.5 1.5 0 0 1 4.5 2h7A1.5 1.5 0 0 1 13 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 3 12.5v-9ZM6 1a1 1 0 0 0-1 1h6a1 1 0 0 0-1-1H6Z"/></svg>',
  duplicate:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 2a2 2 0 0 1 2 2v6.5a.5.5 0 0 1-1 0V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h6.5a.5.5 0 0 1 0 1H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7Zm4.854 5.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 0 1 .708-.708L12.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0Z"/></svg>',

  // Selection
  'select-all':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13ZM1 3.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5V13a.5.5 0 0 1-.5.5h-13A.5.5 0 0 1 1 13V3.5Z"/></svg>',
  delete:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/></svg>',

  // Order
  order:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 3a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H6a.5.5 0 0 1 0-1h1.5V3.5A.5.5 0 0 1 8 3Zm0 7a.5.5 0 0 1 .5.5V12H10a.5.5 0 0 1 0 1H8a.5.5 0 0 1-.5-.5v-2A.5.5 0 0 1 8 10Zm-5-3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm5 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/></svg>',
  'bring-to-front':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 0a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2Zm6 9v5a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2H9Z"/></svg>',
  'bring-forward':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2Zm1 0v4h6V2H2Zm6 6v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1Zm6-6v4a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1Zm-1 0H9v4h5V2Z"/></svg>',
  'send-backward':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 2a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2Zm1 0v4h5V2H1Zm0 6v6a1 1 0 0 1 1 1h6a1 1 0 0 1-1-1V8a1 1 0 0 1-1-1H1Zm8-6v4a1 1 0 0 1 1 1h5a1 1 0 0 1 1-1V2a1 1 0 0 1-1-1H9a1 1 0 0 1 1 1Z"/></svg>',
  'send-to-back':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2Zm8 7h6a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V9Z"/></svg>',

  // Align
  align:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v13A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 14.5 0h-13ZM1 1.5a.5.5 0 0 1 .5-.5H4v3.5H1V1.5ZM5 4.5h6V1H5v3.5ZM12 5h3v6h-3V5Zm-1 6H5V5h6v6Zm-7-6H1v6h3V5Z"/></svg>',
  'align-left':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1a.5.5 0 0 0-1 0v14a.5.5 0 0 0 1 0V1Zm3 0a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V1Zm0 7a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V8Z"/></svg>',
  'align-center':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 1 0v-13A.5.5 0 0 0 8 1ZM2 4.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-1Zm2 5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-1Z"/></svg>',
  'align-right':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M14.5 1a.5.5 0 0 1 1 0v14a.5.5 0 0 1-1 0V1Zm-2.5 0a.5.5 0 0 1 .5-.5H5a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h7a.5.5 0 0 1-.5-.5V1Zm0 7a.5.5 0 0 1 .5-.5H2a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h10a.5.5 0 0 1-.5-.5V8Z"/></svg>',
  'align-top':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 1.5a.5.5 0 0 0 1 0V1h13v.5a.5.5 0 0 0 1 0V1a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v.5Zm4 1a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5Zm6 0a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0V3a.5.5 0 0 1 .5-.5Z"/></svg>',
  'align-middle':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 8a.5.5 0 0 0 .5.5H15a.5.5 0 0 0 0-1H1.5A.5.5 0 0 0 1 8Zm3.5-5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9a.5.5 0 0 1 .5-.5Zm7 0a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-1 0v-9a.5.5 0 0 1 .5-.5Z"/></svg>',
  'align-bottom':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 14.5a.5.5 0 0 1 1 0V15h13v-.5a.5.5 0 0 1 1 0V15a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-.5Zm4-1a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-1 0v10a.5.5 0 0 0 .5.5Zm6 0a.5.5 0 0 0 .5-.5V6a.5.5 0 0 0-1 0v7a.5.5 0 0 0 .5.5Z"/></svg>',

  // Distribute
  distribute:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 1.5a.5.5 0 0 1 1 0v13a.5.5 0 0 1-1 0v-13Zm14 0a.5.5 0 0 0-1 0v13a.5.5 0 0 0 1 0v-13ZM5 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5Z"/></svg>',
  'distribute-horizontal':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 1.5a.5.5 0 0 1 1 0v13a.5.5 0 0 1-1 0v-13Zm14 0a.5.5 0 0 0-1 0v13a.5.5 0 0 0 1 0v-13ZM4 5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm5 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1V5Z"/></svg>',
  'distribute-vertical':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1a.5.5 0 0 0 0 1h13a.5.5 0 0 0 0-1h-13Zm0 14a.5.5 0 0 1 0-1h13a.5.5 0 0 1 0 1h-13ZM5 4a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H5Zm0 5a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-1a1 1 0 0 0-1-1H5Z"/></svg>',

  // Flip
  flip: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-1 0V.5A.5.5 0 0 1 8 0ZM2.5 2A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h4a.5.5 0 0 0 0-1h-4Zm7 0a.5.5 0 0 0 0 1h4a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-4a.5.5 0 0 0 0 1h4a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 13.5 2h-4Z"/></svg>',
  'flip-horizontal':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a.5.5 0 0 1 .5.5v15a.5.5 0 0 1-1 0V.5A.5.5 0 0 1 8 0ZM2.5 2A1.5 1.5 0 0 0 1 3.5v9A1.5 1.5 0 0 0 2.5 14h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h4a.5.5 0 0 0 0-1h-4Zm7 0a.5.5 0 0 0 0 1h4a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-4a.5.5 0 0 0 0 1h4a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 13.5 2h-4Z"/></svg>',
  'flip-vertical':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M.5 8a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 0-1H1A.5.5 0 0 0 .5 8ZM2 2.5A1.5 1.5 0 0 1 3.5 1h9A1.5 1.5 0 0 1 14 2.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4Zm0 11v-4a.5.5 0 0 1 1 0v4a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 1 0v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5Z"/></svg>',

  // Group
  group:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3A1.5 1.5 0 0 0 0 4.5v7A1.5 1.5 0 0 0 1.5 13H7a.5.5 0 0 0 0-1H1.5a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5H7a.5.5 0 0 0 0-1H1.5ZM9 4a.5.5 0 0 0 0 1h5.5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5H9a.5.5 0 0 0 0 1h5.5a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 3H9Z"/></svg>',
  ungroup:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.5A1.5 1.5 0 0 1 1.5 0h5A1.5 1.5 0 0 1 8 1.5V7H1.5A1.5 1.5 0 0 1 0 5.5v-4Zm8 0V7h6.5A1.5 1.5 0 0 0 16 5.5v-4A1.5 1.5 0 0 0 14.5 0h-5A1.5 1.5 0 0 0 8 1.5Zm-8 8A1.5 1.5 0 0 1 1.5 8H8v6.5A1.5 1.5 0 0 1 6.5 16h-5A1.5 1.5 0 0 1 0 14.5v-5Zm8 0V16h6a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 14 8H8Z"/></svg>',
  lock: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/></svg>',
  unlock:
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 1a2 2 0 0 0-2 2v4a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h5V3a3 3 0 0 1 6 0v4a.5.5 0 0 1-1 0V3a2 2 0 0 0-2-2zM3 8a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H3z"/></svg>',

  // Submenu arrow
  'arrow-right':
    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/></svg>',
};

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  enabled: boolean;
  visible: boolean;
  action?: () => void;
  divider?: boolean;
  submenu?: ContextMenuItem[];
}

export interface ContextMenuSection {
  id: string;
  items: ContextMenuItem[];
}

@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  private readonly contextMenuVisibleSignal = signal(false);
  private readonly contextMenuPositionSignal = signal({ x: 0, y: 0 });
  private readonly containerBoundsSignal = signal<DOMRect | null>(null);

  // Keyboard navigation state
  private readonly focusedItemIndexSignal = signal<number>(-1);
  private readonly focusedSubmenuIdSignal = signal<string | null>(null);

  constructor(private apiService: ApiService) {}

  // Computed cache of all menu items for keyboard navigation
  private readonly allMenuItemsCache = computed(() => {
    const sections = this.getContextMenuSections()();
    const allItems: ContextMenuItem[] = [];
    sections.forEach((section) => {
      section.items.forEach((item) => {
        allItems.push(item);
        if (item.submenu && this.focusedSubmenuIdSignal() === item.id) {
          item.submenu.forEach((subItem) => {
            allItems.push(subItem);
          });
        }
      });
    });
    return allItems;
  });

  // Getters for context menu state
  getContextMenuVisible(): Signal<boolean> {
    return this.contextMenuVisibleSignal.asReadonly();
  }

  getContextMenuPosition(): Signal<{ x: number; y: number }> {
    return this.contextMenuPositionSignal.asReadonly();
  }

  getContainerBounds(): Signal<DOMRect | null> {
    return this.containerBoundsSignal.asReadonly();
  }

  getFocusedItemIndex(): Signal<number> {
    return this.focusedItemIndexSignal.asReadonly();
  }

  getFocusedSubmenuId(): Signal<string | null> {
    return this.focusedSubmenuIdSignal.asReadonly();
  }

  // Context menu control methods
  showContextMenu(x: number, y: number, containerBounds?: DOMRect): void {
    this.contextMenuPositionSignal.set({ x, y });
    this.containerBoundsSignal.set(containerBounds || null);
    this.contextMenuVisibleSignal.set(true);
    this.focusedItemIndexSignal.set(-1);
    this.focusedSubmenuIdSignal.set(null);
  }

  hideContextMenu(): void {
    this.contextMenuVisibleSignal.set(false);
    this.focusedItemIndexSignal.set(-1);
    this.focusedSubmenuIdSignal.set(null);
  }

  // Get context menu sections with dynamic enable/disable logic
  getContextMenuSections(): Signal<ContextMenuSection[]> {
    return computed(() => {
      const selectedElements = this.apiService.getSelectedElements();
      const hasSelection = selectedElements.length > 0;
      const hasMultipleSelection = selectedElements.length > 1;
      const canDistribute = selectedElements.length > 2;
      const clipboardInfo = this.apiService.getClipboardInfo();
      const hasClipboardData = clipboardInfo !== null && clipboardInfo.elementCount > 0;
      const hasGroupedElements = hasSelection && selectedElements.some((el) => el.groupId);
      const hasLockedElements = hasSelection && selectedElements.some((el) => el.locked);
      const hasUnlockedElements = hasSelection && selectedElements.some((el) => !el.locked);

      const sections: ContextMenuSection[] = [
        // 📋 CLIPBOARD
        {
          id: 'clipboard',
          items: [
            {
              id: 'cut',
              label: 'Cut',
              shortcut: 'Ctrl+X',
              enabled: hasSelection,
              visible: hasSelection,
              action: () => this.apiService.cutElements(),
            },
            {
              id: 'copy',
              label: 'Copy',
              shortcut: 'Ctrl+C',
              enabled: hasSelection,
              visible: hasSelection,
              action: () => this.apiService.copyElements(),
            },
            {
              id: 'paste',
              label: 'Paste',
              shortcut: 'Ctrl+V',
              enabled: hasClipboardData,
              visible: hasClipboardData,
              action: () => this.apiService.pasteElements(),
            },
            {
              id: 'duplicate',
              label: 'Duplicate',
              shortcut: 'Ctrl+D',
              enabled: hasSelection,
              visible: hasSelection,
              divider: true,
              action: () => this.apiService.duplicateElements(),
            },
          ],
        },

        // 🎯 SELECTION
        {
          id: 'selection',
          items: [
            {
              id: 'select-all',
              label: 'Select All',
              shortcut: 'Ctrl+A',
              enabled: true,
              visible: true,
              action: () => this.apiService.selectAll(),
            },
            {
              id: 'delete',
              label: 'Delete',
              shortcut: 'Del',
              enabled: hasSelection,
              visible: hasSelection,
              divider: true,
              action: () => this.apiService.deleteSelectedElements(),
            },
          ],
        },

        // 🎨 ARRANGE
        {
          id: 'arrange',
          items: [
            {
              id: 'order',
              label: 'Order',
              enabled: hasSelection,
              visible: hasSelection,
              submenu: [
                {
                  id: 'bring-to-front',
                  label: 'Bring to Front',
                  shortcut: 'Ctrl+Shift+]',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.bringToFront(),
                },
                {
                  id: 'bring-forward',
                  label: 'Bring Forward',
                  shortcut: 'Ctrl+]',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.bringForward(),
                },
                {
                  id: 'send-backward',
                  label: 'Send Backward',
                  shortcut: 'Ctrl+[',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.sendBackward(),
                },
                {
                  id: 'send-to-back',
                  label: 'Send to Back',
                  shortcut: 'Ctrl+Shift+[',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.sendToBack(),
                },
              ],
            },
            {
              id: 'transform',
              label: 'Transform',
              enabled: hasSelection,
              visible: hasSelection,
              submenu: [
                {
                  id: 'align-left',
                  label: 'Align Left',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.alignElements(AlignmentType.Left),
                },
                {
                  id: 'align-center',
                  label: 'Align Center',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.alignElements(AlignmentType.Center),
                },
                {
                  id: 'align-right',
                  label: 'Align Right',
                  enabled: true,
                  visible: true,
                  divider: true,
                  action: () => this.apiService.alignElements(AlignmentType.Right),
                },
                {
                  id: 'align-top',
                  label: 'Align Top',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.alignElements(AlignmentType.Top),
                },
                {
                  id: 'align-middle',
                  label: 'Align Middle',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.alignElements(AlignmentType.Middle),
                },
                {
                  id: 'align-bottom',
                  label: 'Align Bottom',
                  enabled: true,
                  visible: true,
                  divider: true,
                  action: () => this.apiService.alignElements(AlignmentType.Bottom),
                },
                {
                  id: 'distribute-horizontal',
                  label: 'Distribute Horizontally',
                  enabled: canDistribute,
                  visible: canDistribute,
                  action: () => this.apiService.distributeHorizontally(),
                },
                {
                  id: 'distribute-vertical',
                  label: 'Distribute Vertically',
                  enabled: canDistribute,
                  visible: canDistribute,
                  divider: true,
                  action: () => this.apiService.distributeVertically(),
                },
                {
                  id: 'flip-horizontal',
                  label: 'Flip Horizontal',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.flipHorizontal(),
                },
                {
                  id: 'flip-vertical',
                  label: 'Flip Vertical',
                  enabled: true,
                  visible: true,
                  action: () => this.apiService.flipVertical(),
                },
              ],
            },
          ],
        },

        // � OBJECT
        {
          id: 'object',
          items: [
            {
              id: 'group',
              label: 'Group',
              shortcut: 'Ctrl+G',
              enabled: hasMultipleSelection,
              visible: hasMultipleSelection,
              action: () => this.apiService.groupSelectedElements(),
            },
            {
              id: 'ungroup',
              label: 'Ungroup',
              shortcut: 'Ctrl+Shift+G',
              enabled: hasGroupedElements,
              visible: hasGroupedElements,
              action: () => this.apiService.ungroupSelectedElements(),
            },
            {
              id: 'lock',
              label: 'Lock',
              shortcut: 'Ctrl+L',
              enabled: hasUnlockedElements,
              visible: hasUnlockedElements,
              action: () => this.apiService.lockElements(),
            },
            {
              id: 'unlock',
              label: 'Unlock',
              shortcut: 'Ctrl+Shift+L',
              enabled: hasLockedElements,
              visible: hasLockedElements,
              action: () => this.apiService.unlockElements(),
            },
          ],
        },
      ];

      // Filter out empty sections (sections with no visible items)
      const filteredSections = sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => item.visible),
        }))
        .filter((section) => section.items.length > 0);

      return filteredSections;
    });
  }

  // Execute action and hide menu
  executeAction(action: () => void): void {
    try {
      action();
    } catch (error) {
      console.error('Error executing context menu action:', error);
    } finally {
      this.hideContextMenu();
    }
  }

  // Keyboard navigation methods
  focusNextItem(): void {
    const allItems = this.allMenuItemsCache();
    const enabledItems = allItems.filter((item) => item.enabled);
    if (enabledItems.length === 0) return;

    const currentIndex = this.focusedItemIndexSignal();
    const currentItem = currentIndex >= 0 ? allItems[currentIndex] : null;
    const currentEnabledIndex = currentItem ? enabledItems.indexOf(currentItem) : -1;

    const nextEnabledIndex = (currentEnabledIndex + 1) % enabledItems.length;
    const nextItem = enabledItems[nextEnabledIndex];
    const nextIndex = allItems.indexOf(nextItem);

    this.focusedItemIndexSignal.set(nextIndex);
  }

  focusPreviousItem(): void {
    const allItems = this.allMenuItemsCache();
    const enabledItems = allItems.filter((item) => item.enabled);
    if (enabledItems.length === 0) return;

    const currentIndex = this.focusedItemIndexSignal();
    const currentItem = currentIndex >= 0 ? allItems[currentIndex] : null;
    const currentEnabledIndex = currentItem ? enabledItems.indexOf(currentItem) : -1;

    const prevEnabledIndex = currentEnabledIndex <= 0 ? enabledItems.length - 1 : currentEnabledIndex - 1;
    const prevItem = enabledItems[prevEnabledIndex];
    const prevIndex = allItems.indexOf(prevItem);

    this.focusedItemIndexSignal.set(prevIndex);
  }

  focusFirstItem(): void {
    const allItems = this.allMenuItemsCache();
    const enabledItems = allItems.filter((item) => item.enabled);
    if (enabledItems.length === 0) return;

    const firstItem = enabledItems[0];
    const firstIndex = allItems.indexOf(firstItem);
    this.focusedItemIndexSignal.set(firstIndex);
  }

  focusLastItem(): void {
    const allItems = this.allMenuItemsCache();
    const enabledItems = allItems.filter((item) => item.enabled);
    if (enabledItems.length === 0) return;

    const lastItem = enabledItems[enabledItems.length - 1];
    const lastIndex = allItems.indexOf(lastItem);
    this.focusedItemIndexSignal.set(lastIndex);
  }

  openFocusedSubmenu(): void {
    const allItems = this.allMenuItemsCache();
    const currentIndex = this.focusedItemIndexSignal();
    if (currentIndex < 0 || currentIndex >= allItems.length) return;

    const item = allItems[currentIndex];
    if (item.submenu && item.enabled) {
      this.focusedSubmenuIdSignal.set(item.id);
    }
  }

  closeFocusedSubmenu(): void {
    this.focusedSubmenuIdSignal.set(null);
  }

  executeFocusedAction(): void {
    const allItems = this.allMenuItemsCache();
    const currentIndex = this.focusedItemIndexSignal();
    if (currentIndex < 0 || currentIndex >= allItems.length) return;

    const item = allItems[currentIndex];
    if (item.enabled && item.action) {
      this.executeAction(item.action);
    } else if (item.submenu && item.enabled) {
      this.openFocusedSubmenu();
    }
  }

  // Get icon SVG
  getIcon(iconName?: string): string {
    if (!iconName) return '';
    return CONTEXT_MENU_ICONS[iconName] || '';
  }

  // Get all menu items (for keyboard navigation)
  getAllMenuItems(): ContextMenuItem[] {
    return this.allMenuItemsCache();
  }
}
