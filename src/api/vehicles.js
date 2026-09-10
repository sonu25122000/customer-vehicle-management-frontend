import api from './client';

function idsParam(customerIds) {
  return Array.isArray(customerIds) && customerIds.length ? customerIds.join(',') : '';
}

export function fetchVehicles({
  search = '',
  page = 1,
  limit = 10,
  minRating = '',
  startDate = '',
  endDate = '',
  customerIds = [],
} = {}) {
  return api
    .get('/vehicles', { params: { search, page, limit, minRating, startDate, endDate, customerIds: idsParam(customerIds) } })
    .then((res) => res.data);
}

export function fetchVehicle(id) {
  return api.get(`/vehicles/${id}`).then((res) => res.data.data);
}

export function fetchVehicleOptions({ activeOnly = false } = {}) {
  return api.get('/vehicles/options', { params: { activeOnly } }).then((res) => res.data.data);
}

export function fetchVehicleStats() {
  return api.get('/vehicles/stats').then((res) => res.data.data);
}

export function createVehicle(payload) {
  return api.post('/vehicles', payload).then((res) => res.data);
}

export function updateVehicle(id, payload) {
  return api.put(`/vehicles/${id}`, payload).then((res) => res.data);
}

export function deleteVehicle(id) {
  return api.delete(`/vehicles/${id}`).then((res) => res.data);
}

export function uploadVehicleDocuments(id, files) {
  const form = new FormData();
  Object.entries(files).forEach(([field, file]) => {
    if (file) form.append(field, file);
  });
  return api
    .post(`/vehicles/${id}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

export function uploadVehiclePhotos(id, files) {
  const form = new FormData();
  Object.entries(files).forEach(([field, value]) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach((file) => form.append(field, file));
    } else {
      form.append(field, value);
    }
  });
  return api.post(`/vehicles/${id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);
}

export function deleteVehiclePhoto(id, slot) {
  return api.delete(`/vehicles/${id}/photos/${encodeURIComponent(slot)}`).then((res) => res.data);
}
