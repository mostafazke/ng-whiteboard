import { MainMenuActionId } from './editor-actions';

type FileShortcutId = Extract<MainMenuActionId, 'open' | 'save' | 'export' | 'copy-png'>;

const FILE_SHORTCUTS: Record<string, { id: FileShortcutId; shift: boolean }> = {
  KeyO: { id: 'open', shift: false },
  KeyS: { id: 'save', shift: false },
  KeyE: { id: 'export', shift: true },
  KeyC: { id: 'copy-png', shift: true },
};

/** Ctrl/Cmd+O, Ctrl/Cmd+S, Ctrl/Cmd+Shift+E and Ctrl/Cmd+Shift+C. */
export function matchFileShortcut(event: KeyboardEvent): FileShortcutId | null {
  if (event.altKey || !(event.ctrlKey || event.metaKey)) return null;
  const match = FILE_SHORTCUTS[event.code];
  return match && match.shift === event.shiftKey ? match.id : null;
}
