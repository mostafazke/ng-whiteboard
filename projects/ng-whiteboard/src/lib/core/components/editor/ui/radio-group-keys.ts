export function nextRadioIndex(key: string, index: number, count: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** Index of the checked option, or the first one when none is checked, so the group always has a tab stop. */
export function tabbableRadioIndex(options: readonly { value: unknown }[], value: unknown): number {
  const index = options.findIndex((option) => option.value === value);
  return index < 0 ? 0 : index;
}

/** Arrow/Home/End selection for a radio group inside `host`: selects the next option and moves focus to it. */
export function handleRadioKeydown(
  event: KeyboardEvent,
  index: number,
  count: number,
  host: HTMLElement,
  select: (next: number) => void
): void {
  const next = nextRadioIndex(event.key, index, count);
  if (next === null) return;
  event.preventDefault();
  event.stopPropagation();
  select(next);
  host.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
}
