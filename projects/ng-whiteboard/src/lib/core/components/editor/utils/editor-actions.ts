import { IconName } from '../icon/icons';
import { MenuItem } from '../ui/menu/menu.component';

export interface EditorAction<Id extends string> {
  id: Id;
  label: string;
  icon: IconName;
  requiresSelection?: boolean;
}

export type MainMenuActionId = 'open' | 'save' | 'save-as' | 'export' | 'copy-png' | 'theme' | 'reset';
export type ZoomActionId = 'fit' | 'selection' | 'reset';

export interface MainMenuAction extends EditorAction<MainMenuActionId> {
  shortcut?: string;
  separatorBefore?: boolean;
}

export const MAIN_MENU_ACTIONS: readonly MainMenuAction[] = [
  { id: 'open', label: 'Open…', icon: 'folder-open', shortcut: 'Ctrl+O' },
  { id: 'save', label: 'Save', icon: 'save', shortcut: 'Ctrl+S' },
  { id: 'save-as', label: 'Save as…', icon: 'file-json', shortcut: 'Ctrl+Shift+S' },
  { id: 'export', label: 'Export image…', icon: 'image-down', shortcut: 'Ctrl+Shift+E' },
  { id: 'copy-png', label: 'Copy as PNG', icon: 'clipboard-copy', shortcut: 'Ctrl+Shift+C' },
  { id: 'theme', label: 'Dark mode', icon: 'moon', separatorBefore: true },
  { id: 'reset', label: 'Reset canvas…', icon: 'rotate-ccw', separatorBefore: true },
];

export const ZOOM_ACTIONS: readonly EditorAction<ZoomActionId>[] = [
  { id: 'fit', label: 'Zoom to Fit', icon: 'fit' },
  { id: 'selection', label: 'Zoom to Selection', icon: 'selection', requiresSelection: true },
  { id: 'reset', label: 'Reset Zoom', icon: 'reset' },
];

export type ConfirmKind = 'reset' | 'open';

export const CONFIRM_COPY: Record<ConfirmKind, { message: string; confirmLabel: string }> = {
  reset: { message: 'Reset the canvas? This clears the board.', confirmLabel: 'Reset' },
  open: { message: 'Replace the current board?', confirmLabel: 'Replace' },
};

export interface MainMenuItem extends MenuItem {
  id: MainMenuActionId;
}

export function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
}

export function formatShortcut(shortcut: string, mac: boolean): string {
  return mac ? shortcut.replace('Ctrl+Shift+', '⇧⌘').replace('Ctrl+', '⌘') : shortcut;
}

export interface MainMenuOptions {
  theme: string;
  canCopyImage: boolean;
  mac: boolean;
  /** The browser can write back to a picked file; without it Save downloads a copy and Save as… is hidden. */
  canSaveInPlace: boolean;
}

function menuLabel(action: MainMenuAction, options: MainMenuOptions): string {
  if (action.id === 'theme') return options.theme === 'dark' ? 'Light mode' : 'Dark mode';
  if (action.id === 'save' && !options.canSaveInPlace) return 'Save to file';
  return action.label;
}

export function buildMainMenu(options: MainMenuOptions): MainMenuItem[] {
  const dark = options.theme === 'dark';
  return MAIN_MENU_ACTIONS.filter(
    (action) =>
      (action.id !== 'copy-png' || options.canCopyImage) && (action.id !== 'save-as' || options.canSaveInPlace)
  ).map((action) => ({
    id: action.id,
    label: menuLabel(action, options),
    icon: action.id === 'theme' ? (dark ? 'sun' : 'moon') : action.icon,
    shortcut: action.shortcut ? formatShortcut(action.shortcut, options.mac) : undefined,
    separatorBefore: action.separatorBefore,
  }));
}
