/**
 * Generates a unique identifier with a consistent length.
 */
export function generateId(): string {
  const randomStr = Math.random().toString(36).substring(2);
  return randomStr.padEnd(12, '0').substring(0, 12);
}
