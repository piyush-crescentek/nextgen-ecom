import { sanitizeForWebStorage } from "@/lib/sanitizeForWebStorage";
import type { StateStorage } from "zustand/middleware";

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.code === 22 ||
    error.code === 1014
  );
}

/** Zustand storage adapter that never throws QuotaExceededError to the UI. */
export function createQuotaSafeStorage(store: Storage): StateStorage {
  return {
    getItem: (name) => store.getItem(name),
    removeItem: (name) => store.removeItem(name),
    setItem: (name, value) => {
      try {
        store.setItem(name, value);
        return;
      } catch (error) {
        if (!isQuotaError(error)) throw error;
      }

      try {
        const parsed = JSON.parse(value) as unknown;
        const sanitized = sanitizeForWebStorage(parsed);
        store.setItem(name, JSON.stringify(sanitized));
      } catch (retryError) {
        if (!isQuotaError(retryError)) {
          console.warn(`[storage] Failed to persist "${name}"`, retryError);
        } else {
          console.warn(
            `[storage] Quota exceeded for "${name}" — large attachments were omitted from saved state.`,
          );
        }
      }
    },
  };
}
