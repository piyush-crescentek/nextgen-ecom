/** Stored in place of a File so Zustand/localStorage JSON can round-trip. */
export type PersistedFilePayload = {
    __persistedFile__: true;
    name: string;
    type: string;
    dataUrl: string;
};

export type PersistedFileSkippedPayload = {
    __persistedFileSkipped__: true;
    name: string;
};

import { WEB_STORAGE_MAX_STRING_CHARS } from "@/lib/sanitizeForWebStorage";

/** Form draft persistence — much lower than API upload limit to fit localStorage quota. */
const MAX_PERSIST_DATA_URL_CHARS = WEB_STORAGE_MAX_STRING_CHARS;

function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

function isPersistedFile(v: unknown): v is PersistedFilePayload {
    return !!v && typeof v === "object" && (v as PersistedFilePayload).__persistedFile__ === true;
}

function isSkipped(v: unknown): v is PersistedFileSkippedPayload {
    return !!v && typeof v === "object" && (v as PersistedFileSkippedPayload).__persistedFileSkipped__ === true;
}

/**
 * Replace File values with serializable payloads for localStorage persistence.
 */
export async function serializeFormDataForPersist(fd: Record<string, unknown>): Promise<Record<string, unknown>> {
    const next: Record<string, unknown> = { ...fd };
    for (const key of Object.keys(next)) {
        const v = next[key];
        if (typeof v === "string" && v.startsWith("data:") && v.length > MAX_PERSIST_DATA_URL_CHARS) {
            next[key] = { __persistedFileSkipped__: true, name: "attachment" };
            continue;
        }
        if (v instanceof File) {
            try {
                const dataUrl = await readFileAsDataURL(v);
                if (dataUrl.length > MAX_PERSIST_DATA_URL_CHARS) {
                    next[key] = { __persistedFileSkipped__: true, name: v.name };
                } else {
                    next[key] = {
                        __persistedFile__: true,
                        name: v.name,
                        type: v.type,
                        dataUrl,
                    };
                }
            } catch {
                next[key] = { __persistedFileSkipped__: true, name: v.name };
            }
        }
    }
    return next;
}

/**
 * Restore File instances from persisted payloads. Returns whether any attachment was skipped (too large to save).
 */
export async function deserializeFormDataFromPersist(fd: Record<string, unknown>): Promise<[Record<string, unknown>, boolean]> {
    const next: Record<string, unknown> = { ...fd };
    let skipped = false;
    for (const key of Object.keys(next)) {
        const v = next[key];
        if (isPersistedFile(v)) {
            try {
                const res = await fetch(v.dataUrl);
                const blob = await res.blob();
                next[key] = new File([blob], v.name, { type: v.type || "application/octet-stream" });
            } catch {
                skipped = true;
                delete next[key];
            }
        } else if (isSkipped(v)) {
            skipped = true;
            delete next[key];
        }
    }
    return [next, skipped];
}
