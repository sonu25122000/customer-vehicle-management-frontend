// Uploaded files come back as short-lived S3 links (…/KA01AB1234_MARUTI-SWIFT_RC_….pdf?X-Amz-…) — or,
// for files from before S3, as data: URIs. Either way this tells whether one is a PDF.
export function isPdfUrl(url) {
  const value = url || '';
  return value.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(value);
}

// Same cap as the backend (middleware/upload.js).
export const MAX_FILE_BYTES = 2 * 1024 * 1024;

// '' when the file is fine to upload, otherwise the message to show.
export function fileSizeError(file) {
  if (!file || file.size <= MAX_FILE_BYTES) return '';
  return `${file.name || 'This file'} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the maximum is 2 MB`;
}
