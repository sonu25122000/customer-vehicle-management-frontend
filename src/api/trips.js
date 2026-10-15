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

// New OTP for the customer to start ('start') or end ('end') the trip on the customer site. Every call
// gives a new code; the previous one stops working. Resolves to { start, end } — the live codes.
export function generateTripOtp(id, purpose) {
  return api.post(`/trips/${id}/otp`, { purpose }).then((res) => res.data.data);
}

export function rescheduleTrip(id, payload) {
  return api.post(`/trips/${id}/reschedule`, payload).then((res) => res.data);
}
