import api from './client';
import { fetchVehicle } from './vehicles';

// Vehicle photos and documents live in their own collections, linked to the vehicle by id, with the
// files themselves in S3 — see backend routes/vehiclePhotoRoutes.js and routes/vehicleDocumentRoutes.js.
// The `image` / `file` of each row is a short-lived link to the file.

const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

// One request per file: each file can be up to 2MB, and a request has to stay under the hosting
// platform's 4.5MB body limit. Resolves to the last response (which carries the full, updated list).
async function uploadOneByOne(path, vehicleId, files) {
  const entries = Object.entries(files).flatMap(([field, value]) =>
    (Array.isArray(value) ? value : [value]).filter(Boolean).map((file) => [field, file])
  );
  let last = null;
  for (const [field, file] of entries) {
    const form = new FormData();
    form.append('vehicle', vehicleId);
    form.append(field, file);
    // eslint-disable-next-line no-await-in-loop
    last = await api.post(path, form, MULTIPART).then((res) => res.data);
  }
  return last;
}

export function fetchVehiclePhotos(vehicleId) {
  return api.get('/vehicle-photos', { params: { vehicle: vehicleId } }).then((res) => res.data.data);
}

export function uploadVehiclePhotos(vehicleId, files) {
  return uploadOneByOne('/vehicle-photos', vehicleId, files);
}

// Resolves to { data: photos, vehicleStatus } — vehicleStatus is 'On Hold' if removing this photo took
// an Active vehicle off the site.
export function deleteVehiclePhoto(photoId) {
  return api.delete(`/vehicle-photos/${photoId}`).then((res) => res.data);
}

export function fetchVehicleDocuments(vehicleId) {
  return api.get('/vehicle-documents', { params: { vehicle: vehicleId } }).then((res) => res.data.data);
}

export function uploadVehicleDocuments(vehicleId, files) {
  return uploadOneByOne('/vehicle-documents', vehicleId, files);
}

// Resolves to { data: documents, vehicleStatus } — same as deleteVehiclePhoto.
export function deleteVehicleDocument(documentId) {
  return api.delete(`/vehicle-documents/${documentId}`).then((res) => res.data);
}

// Photo rows -> the shape the photo/view modals render:
//   photos:   { front: url, ..., additional: [url, ...] }
//   photoIds: { front: id,  ..., additional: [id, ...] }   (for deleting a single photo)
export function groupVehiclePhotos(list) {
  const photos = { additional: [] };
  const photoIds = { additional: [] };
  (list || []).forEach((p) => {
    if (p.slot === 'additional') {
      photos.additional.push(p.image);
      photoIds.additional.push(p._id);
    } else {
      photos[p.slot] = p.image;
      photoIds[p.slot] = p._id;
    }
  });
  return { photos, photoIds };
}

// Document rows -> { documents: { rc: url, insurance: url }, documentIds: { rc: id, insurance: id } }
export function groupVehicleDocuments(list) {
  return {
    documents: Object.fromEntries((list || []).map((d) => [d.type, d.file])),
    documentIds: Object.fromEntries((list || []).map((d) => [d.type, d._id])),
  };
}

// The vehicle record plus its photos and documents, for the screens that show the actual files.
export async function fetchVehicleWithMedia(vehicleId) {
  const [vehicle, photos, documents] = await Promise.all([
    fetchVehicle(vehicleId),
    fetchVehiclePhotos(vehicleId),
    fetchVehicleDocuments(vehicleId),
  ]);
  return { ...vehicle, ...groupVehiclePhotos(photos), ...groupVehicleDocuments(documents) };
}
