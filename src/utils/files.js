// Uploaded files come back as short-lived S3 links (…/KA01AB1234_MARUTI-SWIFT_RC_….pdf?X-Amz-…) — or,
// for files from before S3, as data: URIs. Either way this tells whether one is a PDF.
export function isPdfUrl(url) {
  const value = url || '';
  return value.startsWith('data:application/pdf') || /\.pdf(\?|$)/i.test(value);
}

// Same caps as the backend (middleware/upload.js): photos 1.5 MB (they're compressed below that before
// upload — utils/compressImage.js), PDFs 2 MB.
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

// '' when the file is fine to upload, otherwise the message to show.
export function fileSizeError(file) {
  if (!file) return '';
  const isImage = file.type?.startsWith('image/');
  if (file.size <= (isImage ? MAX_PHOTO_BYTES : MAX_FILE_BYTES)) return '';
  const size = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
  return isImage
    ? `${file.name || 'This photo'} is still ${size} after compressing — please use a smaller photo (max 1.5 MB)`
    : `${file.name || 'This file'} is ${size} — the maximum is 2 MB`;
}
