import { Component } from '@angular/core';

interface ShortcutCategory {
  title: string;
  shortcuts: Shortcut[];
}

interface Shortcut {
  keys: string[];
  action: string;
  description?: string;
  modifierKeys?: string[];
  arrowKeys?: string[];
}

@Component({
  selector: 'app-keyboard-shortcuts',
  templateUrl: './keyboard-shortcuts.component.html',
  styleUrls: ['./keyboard-shortcuts.component.scss'],
  standalone: true,
})
export class KeyboardShortcutsComponent {
  shortcutCategories: ShortcutCategory[] = [
    {
      title: '🛠 Tools',
      shortcuts: [
        { keys: ['V'], action: 'Select tool' },
        { keys: ['D'], action: 'Draw (Pen) tool' },
        { keys: ['E'], action: 'Eraser tool' },
        { keys: ['H'], action: 'Hand (Pan) tool' },
        { keys: ['R'], action: 'Rectangle tool' },
        { keys: ['O'], action: 'Ellipse tool' },
        { keys: ['A'], action: 'Arrow tool' },
        { keys: ['L'], action: 'Line tool' },
        { keys: ['T'], action: 'Text tool' },
        { keys: ['Space'], action: 'Temporary Hand tool', description: 'Hold to pan' },
      ],
    },
    {
      title: '# Grid',
      shortcuts: [
        { keys: ['Ctrl', "'"], action: 'Toggle grid visibility' },
        { keys: ['Ctrl', 'Shift', ';'], action: 'Toggle snap to grid' },
      ],
    },
    {
      title: '🧭 Navigation',
      shortcuts: [
        {
          keys: ['↑', '↓', '←', '→'],
          action: 'Move selected elements by 1 pixel',
          modifierKeys: [],
          arrowKeys: ['↑', '↓', '←', '→'],
        },
        {
          keys: ['Shift', '↑', '↓', '←', '→'],
          action: 'Move selected elements by 10 pixels',
          modifierKeys: ['Shift'],
          arrowKeys: ['↑', '↓', '←', '→'],
        },
      ],
    },
    {
      title: '✏️ Edit',
      shortcuts: [
        { keys: ['Ctrl', 'Z'], action: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], action: 'Redo' },
        { keys: ['Ctrl', 'Y'], action: 'Redo (alternative)' },
        { keys: ['Ctrl', 'X'], action: 'Cut' },
        { keys: ['Ctrl', 'C'], action: 'Copy' },
        { keys: ['Ctrl', 'V'], action: 'Paste' },
        { keys: ['Ctrl', 'A'], action: 'Select all' },
        { keys: ['Ctrl', 'D'], action: 'Duplicate' },
        { keys: ['Delete'], action: 'Delete selected elements' },
        { keys: ['Backspace'], action: 'Delete selected elements' },
        { keys: ['Escape'], action: 'Clear selection' },
      ],
    },
    {
      title: '🗂 Grouping',
      shortcuts: [
        { keys: ['Ctrl', 'G'], action: 'Group selected elements' },
        { keys: ['Ctrl', 'Shift', 'G'], action: 'Ungroup selected elements' },
      ],
    },
    {
      title: '🔄 Flip',
      shortcuts: [
        { keys: ['Shift', 'H'], action: 'Flip horizontally' },
        { keys: ['Shift', 'V'], action: 'Flip vertically' },
      ],
    },
    {
      title: '📏 Alignment',
      shortcuts: [
        { keys: ['Alt', 'W'], action: 'Align top' },
        { keys: ['Alt', 'V'], action: 'Align middle (vertically)' },
        { keys: ['Alt', 'S'], action: 'Align bottom' },
        { keys: ['Alt', 'A'], action: 'Align left' },
        { keys: ['Alt', 'H'], action: 'Align center (horizontally)' },
        { keys: ['Alt', 'D'], action: 'Align right' },
      ],
    },
    {
      title: '📐 Layer Order',
      shortcuts: [
        { keys: [']'], action: 'Bring to front' },
        { keys: ['Alt', ']'], action: 'Bring forward' },
        { keys: ['Alt', '['], action: 'Send backward' },
        { keys: ['['], action: 'Send to back' },
      ],
    },
    {
      title: '🔍 View',
      shortcuts: [
        { keys: ['Ctrl', '+'], action: 'Zoom in' },
        { keys: ['Ctrl', '-'], action: 'Zoom out' },
        { keys: ['Shift', '0'], action: 'Zoom to 100%' },
        { keys: ['Shift', '1'], action: 'Zoom to fit all elements' },
        { keys: ['Shift', '2'], action: 'Zoom to selection' },
      ],
    },
  ];
}
