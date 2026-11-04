/** A ResizeObserver stand-in that measures the editor root as a wide 1440×900 container on observe. */
export function wideEditorResizeObserver(): typeof ResizeObserver {
  return class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) {
      if (!target.classList.contains('editor')) return;
      const entry = { target, contentRect: { width: 1440, height: 900 } } as unknown as ResizeObserverEntry;
      this.callback([entry], this as unknown as ResizeObserver);
    }
    unobserve() {
      /* noop */
    }
    disconnect() {
      /* noop */
    }
  } as unknown as typeof ResizeObserver;
}
