/**
 * Browser storage (localStorage / sessionStorage) is typically ~5MB per origin.
 * Keep persisted JSON small — never store multi‑MB base64 blobs.
 */

/** Max length for a single string written to web storage (~375KB file as base64). */
export const WEB_STORAGE_MAX_STRING_CHARS = 512_000;

export function isOversizedForWebStorage(value: unknown): boolean {
  return typeof value === "string" && value.length > WEB_STORAGE_MAX_STRING_CHARS;
}

export function isDataUrlString(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:");
}

/** Deep-clone and strip/truncate values that would exceed storage quota. */
export function sanitizeForWebStorage<T>(value: T, depth = 0): T {
  if (depth > 25) return value;

  if (typeof value === "string") {
    if (value.length <= WEB_STORAGE_MAX_STRING_CHARS) return value;
    if (value.startsWith("data:")) return "" as T;
    return `${value.slice(0, WEB_STORAGE_MAX_STRING_CHARS)}…[truncated]` as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForWebStorage(item, depth + 1)) as T;
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (
        (key === "vue_form_upload_id_proof" || key === "id_proof") &&
        typeof child === "string" &&
        child.length > 1_000
      ) {
        out[key] = "";
        continue;
      }
      out[key] = sanitizeForWebStorage(child, depth + 1);
    }
    return out as T;
  }

  return value;
}
