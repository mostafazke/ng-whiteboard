const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]',
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(',');

export function getFocusableElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

/** Keeps Tab / Shift+Tab cycling inside `root`. Returns true when it moved focus. */
export function wrapTabFocus(event: KeyboardEvent, root: HTMLElement): boolean {
  if (event.key !== 'Tab') return false;
  const items = getFocusableElements(root);
  if (items.length === 0) {
    event.preventDefault();
    return true;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = root.ownerDocument.activeElement;
  const target = event.shiftKey ? (active === first || active === root ? last : null) : active === last ? first : null;
  if (!target) return false;
  event.preventDefault();
  target.focus();
  return true;
}
