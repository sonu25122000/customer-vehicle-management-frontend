import api from './client';
import { fetchVehicle } from './vehicles';

// Vehicle photos and documents live in their own collections, linked to the vehicle by id — see
// backend routes/vehiclePhotoRoutes.js and routes/vehicleDocumentRoutes.js.

function toFormData(vehicleId, files) {
  const form = new FormData();
  form.append('vehicle', vehicleId);
  Object.entries(files).forEach(([field, value]) => {
    if (!value) return;
    if (Array.isArray(value)) value.forEach((file) => form.append(field, file));
    else form.append(field, value);
  });
  return form;
}

export function fetchVehiclePhotos(vehicleId) {
  return api.get('/vehicle-photos', { params: { vehicle: vehicleId } }).then((res) => res.data.data);
}

export function uploadVehiclePhotos(vehicleId, files) {
  return api
    .post('/vehicle-photos', toFormData(vehicleId, files), { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function deleteVehiclePhoto(photoId) {
  return api.delete(`/vehicle-photos/${photoId}`).then((res) => res.data);
}

export function fetchVehicleDocuments(vehicleId) {
  return api.get('/vehicle-documents', { params: { vehicle: vehicleId } }).then((res) => res.data.data);
}

export function uploadVehicleDocuments(vehicleId, files) {
  return api
    .post('/vehicle-documents', toFormData(vehicleId, files), { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

// Photo rows -> the shape the photo/view modals render:
//   photos:   { front: dataUri, ..., additional: [dataUri, ...] }
//   photoIds: { front: id,      ..., additional: [id, ...] }   (for deleting a single photo)
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

// Document rows -> { rc: dataUri, insurance: dataUri }
export function groupVehicleDocuments(list) {
  return Object.fromEntries((list || []).map((d) => [d.type, d.file]));
}

// The vehicle record plus its photos and documents, for the screens that show the actual files.
export async function fetchVehicleWithMedia(vehicleId) {
  const [vehicle, photos, documents] = await Promise.all([
    fetchVehicle(vehicleId),
    fetchVehiclePhotos(vehicleId),
    fetchVehicleDocuments(vehicleId),
  ]);
  return { ...vehicle, ...groupVehiclePhotos(photos), documents: groupVehicleDocuments(documents) };
}
