// Client-side image compression via the Canvas API — no external dependency, matching this
// project's pattern of hand-building small utilities (see DateRangeCalendar) rather than
// pulling in a library. Every photo uploaded from the admin portal ends up at most MAX_PHOTO_BYTES
// (1.5 MB): anything bigger is re-encoded as JPEG at a lower quality, and if that isn't enough it's
// scaled down step by step until it fits. PDFs pass through untouched (the backend caps them at 2 MB).
// The backend also refuses photos over 1.5 MB (backend/src/middleware/upload.js), as a backstop.
export const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;
// Aim a little under the limit.
const TARGET_BYTES = 1.4 * 1024 * 1024;
const QUALITIES = [0.85, 0.75, 0.65, 0.55];
const SCALE_STEP = 0.8;
const MIN_DIMENSION = 480;

function toBlob(canvas, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
}

const jpegName = (name) => `${(name || 'photo').replace(/\.\w+$/, '')}.jpg`;

// Draws `bitmap` (or its `crop` area) at `width` x `height` and returns the first JPEG under the
// target — trying lower qualities, then smaller sizes. Falls back to the smallest one made.
async function encodeUnderTarget(bitmap, { crop, width, height }) {
  const source = crop || { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height };
  let scale = 1;
  let smallest = null;
  for (;;) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, source.sx, source.sy, source.sw, source.sh, 0, 0, canvas.width, canvas.height);
    for (const quality of QUALITIES) {
      // eslint-disable-next-line no-await-in-loop
      const blob = await toBlob(canvas, quality);
      if (blob && (!smallest || blob.size < smallest.size)) smallest = blob;
      if (blob && blob.size <= TARGET_BYTES) return blob;
    }
    if (Math.max(canvas.width, canvas.height) <= MIN_DIMENSION) return smallest;
    scale *= SCALE_STEP;
  }
}

// The image at most `maxDimension` px on its longest side, re-encoded as JPEG under 1.5 MB. Returns the
// original file when it's already small enough, isn't an image, or the browser can't read it.
export async function compressImage(file, { maxDimension = 1920 } = {}) {
  if (!file || !file.type?.startsWith('image/')) return file; // PDFs and non-images pass through untouched
  if (file.size <= TARGET_BYTES) return file; // already small enough, don't bother re-encoding

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file; // unreadable here — the size check before upload decides
  }
  try {
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const blob = await encodeUnderTarget(bitmap, { width: bitmap.width * scale, height: bitmap.height * scale });
    if (!blob || blob.size >= file.size) return file; // compression didn't help — keep the original
    return new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    bitmap.close?.();
  }
}

// Car photos are shown everywhere in one 4:3 landscape frame (the ratio Google's vehicle ads and
// Cars.com use for listings, and what phone cameras shoot natively), so every photo is centre-cropped to
// 4:3 and sized to CAR_PHOTO_WIDTH x CAR_PHOTO_HEIGHT on upload — what the admin previews is exactly what
// customers see, nothing gets cut off differently on different screens, and every photo is under 1.5 MB.
export const CAR_PHOTO_WIDTH = 1600;
export const CAR_PHOTO_HEIGHT = 1200;

export async function prepareCarPhoto(file) {
  if (!file || !file.type?.startsWith('image/')) return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return compressImage(file);
  }
  try {
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

    const blob = await encodeUnderTarget(bitmap, { crop: { sx, sy, sw, sh }, width, height });
    if (!blob) return file;
    return new File([blob], jpegName(file.name), { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    bitmap.close?.();
  }
}
