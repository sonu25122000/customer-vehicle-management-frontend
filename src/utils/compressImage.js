// Client-side image compression via the Canvas API — no external dependency, matching this
// project's pattern of hand-building small utilities (see DateRangeCalendar) rather than
// pulling in a library. Images are resized/re-encoded to stay under the backend's 2MB per-file
// cap (backend/src/middleware/upload.js), which is the final backstop for anything this can't
// shrink enough (e.g. a non-image PDF, or compression failing for any reason).
const DEFAULT_TARGET_BYTES = 1.8 * 1024 * 1024;

async function encode(canvas, { targetBytes, initialQuality, minQuality, mimeType }) {
  let quality = initialQuality;
  let blob = null;
  do {
    // eslint-disable-next-line no-await-in-loop
    blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
    if (!blob || blob.size <= targetBytes) break;
    quality -= 0.1;
  } while (quality >= minQuality);
  return blob;
}

export async function compressImage(
  file,
  { maxDimension = 1920, targetBytes = DEFAULT_TARGET_BYTES, initialQuality = 0.85, minQuality = 0.5, mimeType = 'image/jpeg' } = {}
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

    const blob = await encode(canvas, { targetBytes, initialQuality, minQuality, mimeType });
    if (!blob || blob.size >= file.size) return file; // compression didn't help — keep the original

    const newName = file.name.replace(/\.\w+$/, '.jpg');
    return new File([blob], newName, { type: mimeType, lastModified: Date.now() });
  } catch {
    return file; // any failure falls back to the original file; the backend cap is the backstop
  }
}

// Car photos are shown everywhere in one 4:3 landscape frame (the ratio Google's vehicle ads and
// Cars.com use for listings, and what phone cameras shoot natively), so every photo is centre-cropped to
// 4:3 and sized to CAR_PHOTO_WIDTH x CAR_PHOTO_HEIGHT on upload — what the admin previews is exactly what
// customers see, nothing gets cut off differently on different screens, and every photo is well under 2MB.
export const CAR_PHOTO_WIDTH = 1600;
export const CAR_PHOTO_HEIGHT = 1200;

export async function prepareCarPhoto(file) {
  if (!file || !file.type?.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const target = CAR_PHOTO_WIDTH / CAR_PHOTO_HEIGHT;
    // Largest 4:3 area of the original, centred.
    let sw = bitmap.width;
    let sh = bitmap.height;
    if (sw / sh > target) sw = Math.round(sh * target);
    else sh = Math.round(sw / target);
    const sx = Math.round((bitmap.width - sw) / 2);
    const sy = Math.round((bitmap.height - sh) / 2);
    // Never upscale a small photo — keep its own (cropped) size.
    const width = Math.min(CAR_PHOTO_WIDTH, sw);
    const height = Math.round(width / target);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, width, height);
    bitmap.close?.();

    const blob = await encode(canvas, { targetBytes: DEFAULT_TARGET_BYTES, initialQuality: 0.85, minQuality: 0.5, mimeType: 'image/jpeg' });
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return compressImage(file);
  }
}
