import api from './client';

export function fetchTrips({
  search = '',
  page = 1,
  limit = 10,
  status = '',
  minRating = '',
  startDate = '',
  endDate = '',
  customerId = '',
  vehicleId = '',
} = {}) {
  return api
    .get('/trips', { params: { search, page, limit, status, minRating, startDate, endDate, customerId, vehicleId } })
    .then((res) => res.data);
}

export function fetchTrip(id) {
  return api.get(`/trips/${id}`).then((res) => res.data.data);
}

export function fetchTripStats(params = {}) {
  return api.get('/trips/stats', { params }).then((res) => res.data.data);
}

export function createTrip(payload) {
  return api.post('/trips', payload).then((res) => res.data);
}

export function updateTrip(id, payload) {
  return api.put(`/trips/${id}`, payload).then((res) => res.data);
}

export function deleteTrip(id) {
  return api.delete(`/trips/${id}`).then((res) => res.data);
}

export function rescheduleTrip(id, payload) {
  return api.post(`/trips/${id}/reschedule`, payload).then((res) => res.data);
}
