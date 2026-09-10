import api from './client';

function idsParam(customerIds) {
  return Array.isArray(customerIds) && customerIds.length ? customerIds.join(',') : '';
}

export function fetchCustomers({
  search = '',
  page = 1,
  limit = 10,
  sort = 'newest',
  minRating = '',
  startDate = '',
  endDate = '',
  customerIds = [],
} = {}) {
  return api
    .get('/customers', {
      params: { search, page, limit, sort, minRating, startDate, endDate, customerIds: idsParam(customerIds) },
    })
    .then((res) => res.data);
}

export function fetchCustomer(id) {
  return api.get(`/customers/${id}`).then((res) => res.data.data);
}

export function fetchCustomerOptions() {
  return api.get('/customers/options').then((res) => res.data.data);
}

export function fetchCustomerStats({
  search = '',
  minRating = '',
  startDate = '',
  endDate = '',
  customerIds = [],
} = {}) {
  return api
    .get('/customers/stats', { params: { search, minRating, startDate, endDate, customerIds: idsParam(customerIds) } })
    .then((res) => res.data.data);
}

export function createCustomer(payload) {
  return api.post('/customers', payload).then((res) => res.data);
}

export function updateCustomer(id, payload) {
  return api.put(`/customers/${id}`, payload).then((res) => res.data);
}

export function deleteCustomer(id) {
  return api.delete(`/customers/${id}`).then((res) => res.data);
}

export function uploadCustomerDocuments(id, files) {
  const form = new FormData();
  Object.entries(files).forEach(([field, file]) => {
    if (file) form.append(field, file);
  });
  return api
    .post(`/customers/${id}/documents`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
}

