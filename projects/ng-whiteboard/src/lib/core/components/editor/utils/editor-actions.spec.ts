import { buildMainMenu, formatShortcut, MAIN_MENU_ACTIONS } from './editor-actions';

describe('buildMainMenu', () => {
  const base = { theme: 'light', canCopyImage: true, mac: false };

  it('lists the six items in order with the specified copy', () => {
    const items = buildMainMenu(base);
    expect(items.map((i) => i.id)).toEqual(['open', 'save', 'export', 'copy-png', 'theme', 'reset']);
    expect(items.map((i) => i.label)).toEqual([
      'Open…',
      'Save to file',
      'Export image…',
      'Copy as PNG',
      'Dark mode',
      'Reset canvas…',
    ]);
    expect(items.map((i) => i.shortcut)).toEqual([
      'Ctrl+O',
      'Ctrl+S',
      'Ctrl+Shift+E',
      'Ctrl+Shift+C',
      undefined,
      undefined,
    ]);
  });

  it('puts separators before the theme toggle and before Reset', () => {
    const items = buildMainMenu(base);
    expect(items.filter((i) => i.separatorBefore).map((i) => i.id)).toEqual(['theme', 'reset']);
  });

  it('omits Copy as PNG when image clipboard is unsupported', () => {
    expect(buildMainMenu({ ...base, canCopyImage: false }).map((i) => i.id)).not.toContain('copy-png');
  });

  it('names the theme the toggle switches to', () => {
    const theme = buildMainMenu({ ...base, theme: 'dark' }).find((i) => i.id === 'theme');
    expect(theme?.label).toBe('Light mode');
    expect(theme?.icon).toBe('sun');
  });

  it('shows Mac glyphs for shortcuts', () => {
    expect(buildMainMenu({ ...base, mac: true }).map((i) => i.shortcut)).toEqual([
      '⌘O',
      '⌘S',
      '⇧⌘E',
      '⇧⌘C',
      undefined,
      undefined,
    ]);
  });

  it('declares every menu action once', () => {
    expect(new Set(MAIN_MENU_ACTIONS.map((a) => a.id)).size).toBe(MAIN_MENU_ACTIONS.length);
    expect(formatShortcut('Ctrl+S', false)).toBe('Ctrl+S');
  });
});
