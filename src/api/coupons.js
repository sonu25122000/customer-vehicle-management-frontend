import api from './client';

export function fetchCoupons({ search = '', page = 1, limit = 10 } = {}) {
  return api.get('/coupons', { params: { search, page, limit } }).then((res) => res.data);
}

// Coupons the trip form can offer for this customer (live, not used up, all-customers or listing them).
export function fetchApplicableCoupons(customerId) {
  return api.get('/coupons/applicable', { params: { customer: customerId } }).then((res) => res.data.data);
}

export function fetchCoupon(id) {
  return api.get(`/coupons/${id}`).then((res) => res.data.data);
}

export function fetchCouponStats() {
  return api.get('/coupons/stats').then((res) => res.data.data);
}

export function createCoupon(payload) {
  return api.post('/coupons', payload).then((res) => res.data);
}

export function updateCoupon(id, payload) {
  return api.put(`/coupons/${id}`, payload).then((res) => res.data);
}

export function deleteCoupon(id) {
  return api.delete(`/coupons/${id}`).then((res) => res.data);
}
