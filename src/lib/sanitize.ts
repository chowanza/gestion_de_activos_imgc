export function sanitizeStringOrNull(value: any): string | null {
  if (value === null) return null;
  if (value === undefined) return null;
  if (typeof value === 'string') {
    const v = value.trim();
    return v === '' ? null : v;
  }
  // If it's an array of strings, join with commas
  if (Array.isArray(value)) {
    try {
      const arr = value.map((x) => (typeof x === 'string' ? x.trim() : String(x))).filter(Boolean);
      return arr.length > 0 ? arr.join(',') : null;
    } catch (e) {
      return null;
    }
  }
  // Other types (object, number, etc.) are not acceptable for path fields
  return null;
}
