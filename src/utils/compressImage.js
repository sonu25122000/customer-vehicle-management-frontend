// Client-side image compression via the Canvas API — no external dependency, matching this
// project's pattern of hand-building small utilities (see DateRangeCalendar) rather than
// pulling in a library. Any image, regardless of original size, gets resized/re-encoded down
// toward ~1-1.5MB before it's ever sent to the server; the backend's own size cap (see
// backend/src/middleware/upload.js) is the final backstop for anything this can't shrink
// enough (e.g. a non-image PDF, or compression failing for any reason).
export async function compressImage(
  file,
  { maxDimension = 1920, targetBytes = 1.4 * 1024 * 1024, initialQuality = 0.85, minQuality = 0.5, mimeType = 'image/jpeg' } = {}
) {
  if (!file || !file.type?.startsWith('image/')) return file; // PDFs and non-images pass through untouched
  if (file.size <= targetBytes) return file; // already small enough, don't bother re-encoding

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    let quality = initialQuality;
    let blob = null;
    do {
      // eslint-disable-next-line no-await-in-loop
      blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
      if (!blob || blob.size <= targetBytes) break;
      quality -= 0.1;
    } while (quality >= minQuality);

    if (!blob || blob.size >= file.size) return file; // compression didn't help — keep the original

    const newName = file.name.replace(/\.\w+$/, '.jpg');
    return new File([blob], newName, { type: mimeType, lastModified: Date.now() });
  } catch {
    return file; // any failure falls back to the original file; the backend cap is the backstop
  }
}
