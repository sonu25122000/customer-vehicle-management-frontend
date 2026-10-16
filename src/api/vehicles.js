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

// Changes only the status. Active needs all 4 photo sides, the RC and the insurance on file.
export function updateVehicleStatus(id, status) {
  return api.patch(`/vehicles/${id}/status`, { status }).then((res) => res.data);
}

export function deleteVehicle(id) {
  return api.delete(`/vehicles/${id}`).then((res) => res.data);
}

// The pin in a Google Maps link (short maps.app.goo.gl share links too) -> { lat, lng, placeName }.
export function resolveMapLink(url) {
  return api.post('/vehicles/map-link', { url }).then((res) => res.data.data);
}
