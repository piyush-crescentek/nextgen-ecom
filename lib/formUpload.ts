/** Max file size for consultation form uploads (all `file` fields). */
export const FORM_MAX_FILE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const FORM_MAX_FILE_UPLOAD_MB = 5;

export function isFileWithinUploadLimit(
  size: number,
  maxBytes: number = FORM_MAX_FILE_UPLOAD_BYTES,
): boolean {
  return size <= maxBytes;
}

export function getFileTooLargeMessage(maxMb: number = FORM_MAX_FILE_UPLOAD_MB): string {
  return `File size must be less than ${maxMb}MB.`;
}

export function getIdProofTooLargeMessage(): string {
  return `ID document must be under ${FORM_MAX_FILE_UPLOAD_MB}MB (images are compressed automatically when possible).`;
}
