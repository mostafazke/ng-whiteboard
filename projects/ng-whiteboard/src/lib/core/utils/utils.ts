/**
 * Generates a unique identifier using the current timestamp and a random string.
 * @returns {string} A unique string ID.
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Snaps a given number to the nearest grid point.
 * @param {number} n - The number to snap.
 * @param {number} gridSize - The grid size to snap to.
 * @returns {number} The snapped number.
 */
export function snapToGrid(n: number, gridSize: number): number {
  const snap = gridSize;
  const n1 = Math.round(n / snap) * snap;
  return n1;
}

/**
 * Snaps a point (x2, y2) to the closest 45-degree angle relative to (x1, y1).
 * @param {number} x1 - The x-coordinate of the starting point.
 * @param {number} y1 - The y-coordinate of the starting point.
 * @param {number} x2 - The x-coordinate of the target point.
 * @param {number} y2 - The y-coordinate of the target point.
 * @returns {{ x: number, y: number, a: number }} The new coordinates and the snapped angle in radians.
 */
export function snapToAngle(x1: number, y1: number, x2: number, y2: number): { x: number; y: number; a: number } {
  const snap = Math.PI / 4; // 45 degrees
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);
  const dist = Math.sqrt(dx * dx + dy * dy);
  const snapangle = Math.round(angle / snap) * snap;
  const x = x1 + dist * Math.cos(snapangle);
  const y = y1 + dist * Math.sin(snapangle);
  return { x: x, y: y, a: snapangle };
}

/**
 * Initiates the download of a file from a given URL.
 * @param {string} url - The URL of the file to download.
 * @param {string} [name] - The optional name of the downloaded file.
 */
export function downloadFile(url: string, name?: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('visibility', 'hidden');
  link.download = name || 'new white-board';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a debounced function that delays invoking the provided function until after a specified wait time.
 * @template T - The function type.
 * @param {T} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds before the function is executed.
 * @returns {(...args: Parameters<T>) => void} The debounced function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}
