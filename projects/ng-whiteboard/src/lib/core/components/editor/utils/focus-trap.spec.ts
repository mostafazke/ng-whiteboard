import { getFocusableElements, wrapTabFocus } from './focus-trap';

describe('focus-trap', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    root.innerHTML = `
      <button id="first">First</button>
      <div role="menu">
        <button id="active" role="menuitem">Active</button>
        <button id="roving" role="menuitem" tabindex="-1">Roving</button>
      </div>
      <button id="disabled" disabled>Disabled</button>`;
    document.body.appendChild(root);
  });

  afterEach(() => root.remove());

  it('skips disabled controls and roving-tabindex items', () => {
    expect(getFocusableElements(root).map((el) => el.id)).toEqual(['first', 'active']);
  });

  it('wraps Tab from the last tab stop to the first', () => {
    root.querySelector<HTMLElement>('#active')?.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    expect(wrapTabFocus(event, root)).toBe(true);
    expect(document.activeElement?.id).toBe('first');
  });
});
