/**
 * ID proof uploads are sent as the raw `File` via multipart/form-data on the
 * checkout request (key: `vue_form_upload_id_proof`). Image files are still
 * compressed/resized to keep the upload under FORM_MAX_FILE_UPLOAD_BYTES.
 */

import {
  FORM_MAX_FILE_UPLOAD_BYTES,
  FORM_MAX_FILE_UPLOAD_MB,
} from "@/lib/formUpload";

export const ID_PROOF_MAX_FILE_BYTES = FORM_MAX_FILE_UPLOAD_BYTES;

/**
 * Phrases that identify an ID proof / identification field in a form.
 *
 * Stored in normalized form (lowercase, separators collapsed to a single space)
 * so that variants like "ID Proof", "id_proof", "id-proof", "ID  Proof" all
 * compare equal after `normalizeIdProofToken`.
 */
const ID_PROOF_LABEL_TERMS = [
    "id proof",
    "proof of id",
    "proof of identity",
    "proof of identification",
    "proof of identification (passport or driving licence)",
    "proof of identification (passport or driving license)",
    "identity proof",
    "identity document",
    "identification document",
    "id document",
    "id verification",
    "id card",
    "national id",
    "passport or driving licence",
    "passport or driving license",
    "upload id",
] as const;

/** Lowercase + collapse any run of whitespace / `_` / `-` / `.` into a single space. */
function normalizeIdProofToken(value: string): string {
    return value.toLowerCase().replace(/[\s_\-.]+/g, " ").trim();
}

/**
 * Detects whether a single string (typically a field label, but also works on
 * field keys/ids) refers to the ID proof upload. Robust to separator and
 * casing variants — e.g. "ID Proof", "id_proof", "id-proof", "Upload ID Proof",
 * "Proof of Identification" all return true.
 */
export function isIdProofFieldLabel(label: string | null | undefined): boolean {
    if (!label) return false;
    const normalized = normalizeIdProofToken(String(label));
    if (!normalized) return false;
    return ID_PROOF_LABEL_TERMS.some((term) => normalized.includes(term));
}

/**
 * Field-shape aware detector. Returns true if any of the provided identifiers
 * (key, id, label, title) looks like an ID proof field. Prefer this over
 * `isIdProofFieldLabel` whenever both the field key and label are available
 * — different form configurations expose the marker in different places.
 */
export function isIdProofField(
    field: {
        id?: string | null;
        key?: string | null;
        label?: string | null;
        title?: string | null;
    } | null | undefined,
): boolean {
    if (!field) return false;
    return (
        isIdProofFieldLabel(field.id) ||
        isIdProofFieldLabel(field.key) ||
        isIdProofFieldLabel(field.label) ||
        isIdProofFieldLabel(field.title)
    );
}

function baseName(file: File): string {
    return file.name.replace(/\.[^.]+$/, "") || "document";
}

/**
 * Resize + JPEG re-encode until under maxBytes (or throw).
 */
export async function compressImageUnderCap(file: File, maxBytes: number): Promise<File> {
    const bitmap = await createImageBitmap(file);
    let maxEdge = 2200;
    let quality = 0.9;

    try {
        for (let i = 0; i < 18; i++) {
            const { width: iw, height: ih } = bitmap;
            let tw = iw;
            let th = ih;
            const long = Math.max(iw, ih);
            if (long > maxEdge) {
                const r = maxEdge / long;
                tw = Math.round(iw * r);
                th = Math.round(ih * r);
            }

            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, tw);
            canvas.height = Math.max(1, th);
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas not available");
            ctx.drawImage(bitmap, 0, 0, tw, th);

            const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
            );
            if (blob && blob.size <= maxBytes) {
                return new File([blob], `${baseName(file)}.jpg`, { type: "image/jpeg" });
            }

            if (quality > 0.52) {
                quality -= 0.06;
            } else {
                quality = 0.88;
                maxEdge = Math.floor(maxEdge * 0.82);
            }
            if (maxEdge < 560) {
                throw new Error(
                    `Could not compress the image under ${Math.round(maxBytes / 1024)} KB. Try a smaller photo or a compressed PDF.`
                );
            }
        }
        throw new Error(
            `Could not compress the image under ${Math.round(maxBytes / 1024)} KB. Try a smaller photo or a compressed PDF.`
        );
    } finally {
        bitmap.close();
    }
}

/**
 * Returns a File ready to upload (PDF unchanged if under cap; images compressed if needed).
 */
export async function prepareIdProofFileForUpload(file: File): Promise<File> {
    if (file.type === "application/pdf") {
        if (file.size > ID_PROOF_MAX_FILE_BYTES) {
            throw new Error(
                `ID proof PDF must be under ${FORM_MAX_FILE_UPLOAD_MB}MB. Please compress the file and try again.`,
            );
        }
        return file;
    }
    if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
        if (file.size <= ID_PROOF_MAX_FILE_BYTES) {
            return file;
        }
        return compressImageUnderCap(file, ID_PROOF_MAX_FILE_BYTES);
    }
    throw new Error("Invalid ID proof file type.");
}
