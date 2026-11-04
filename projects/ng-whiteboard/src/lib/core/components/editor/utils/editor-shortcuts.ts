import { MainMenuActionId } from './editor-actions';

type FileShortcutId = Extract<MainMenuActionId, 'open' | 'save' | 'save-as' | 'export' | 'copy-png'>;

const FILE_SHORTCUTS: { code: string; shift: boolean; id: FileShortcutId }[] = [
  { code: 'KeyO', shift: false, id: 'open' },
  { code: 'KeyS', shift: false, id: 'save' },
  { code: 'KeyS', shift: true, id: 'save-as' },
  { code: 'KeyE', shift: true, id: 'export' },
  { code: 'KeyC', shift: true, id: 'copy-png' },
];

/** Ctrl/Cmd+O, Ctrl/Cmd+S, Ctrl/Cmd+Shift+S, Ctrl/Cmd+Shift+E and Ctrl/Cmd+Shift+C. */
export function matchFileShortcut(event: KeyboardEvent): FileShortcutId | null {
  if (event.altKey || !(event.ctrlKey || event.metaKey)) return null;
  return FILE_SHORTCUTS.find((s) => s.code === event.code && s.shift === event.shiftKey)?.id ?? null;
}
