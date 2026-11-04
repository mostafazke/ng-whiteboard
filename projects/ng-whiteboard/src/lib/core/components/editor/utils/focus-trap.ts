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

/** Escape closes, Tab cycles inside `root`: the keyboard contract shared by dialogs and sheets. */
export function handleModalKeydown(event: KeyboardEvent, root: HTMLElement | undefined, close: () => void): void {
  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    close();
    return;
  }
  if (root) wrapTabFocus(event, root);
}

/** Focuses the first control in `root` and returns the element focus should go back to on close. */
export function enterFocus(root: HTMLElement, opener: HTMLElement | null): HTMLElement | null {
  const active = root.ownerDocument.activeElement;
  const back = opener ?? (active instanceof HTMLElement && active !== root.ownerDocument.body ? active : null);
  (getFocusableElements(root)[0] ?? root).focus();
  return back;
}

/** Returns focus to `target`, or to `fallback` when `target` has left the DOM. */
export function returnFocus(target: HTMLElement | null, fallback: HTMLElement | null): void {
  if (target?.isConnected) target.focus();
  else if (target) fallback?.focus({ preventScroll: true });
}
