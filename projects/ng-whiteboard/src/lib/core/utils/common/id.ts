/**
 * Generates a unique identifier with a consistent length.
 */
export function generateId(): string {
  const randomStr = Math.random().toString(36).substring(2);
  return randomStr.padEnd(12, '0').substring(0, 12);
}

/**
 * Generates a UUID (Universally Unique Identifier).
 * Uses crypto.randomUUID() when available (secure contexts like HTTPS or localhost).
 * Falls back to a compliant UUID v4 generator for insecure contexts.
 *
 * @returns A UUID string in the format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // Try to use native crypto.randomUUID() if available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to fallback if crypto.randomUUID() throws (insecure context)
    }
  }

  // Fallback: RFC4122 compliant UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
