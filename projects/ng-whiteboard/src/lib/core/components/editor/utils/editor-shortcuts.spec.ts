import { matchFileShortcut } from './editor-shortcuts';

const press = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);

describe('matchFileShortcut', () => {
  it('matches Ctrl/Cmd+O, S and Ctrl/Cmd+Shift+E, C', () => {
    expect(matchFileShortcut(press({ code: 'KeyO', ctrlKey: true }))).toBe('open');
    expect(matchFileShortcut(press({ code: 'KeyS', metaKey: true }))).toBe('save');
    expect(matchFileShortcut(press({ code: 'KeyE', ctrlKey: true, shiftKey: true }))).toBe('export');
    expect(matchFileShortcut(press({ code: 'KeyC', metaKey: true, shiftKey: true }))).toBe('copy-png');
  });

  it('ignores unmodified, wrong-shift and Alt chords', () => {
    expect(matchFileShortcut(press({ code: 'KeyS' }))).toBeNull();
    expect(matchFileShortcut(press({ code: 'KeyS', ctrlKey: true, shiftKey: true }))).toBeNull();
    expect(matchFileShortcut(press({ code: 'KeyE', ctrlKey: true }))).toBeNull();
    expect(matchFileShortcut(press({ code: 'KeyC', ctrlKey: true }))).toBeNull();
    expect(matchFileShortcut(press({ code: 'KeyS', ctrlKey: true, altKey: true }))).toBeNull();
  });
});
