/**
 * Initiates the download of a file from a given URL.
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
