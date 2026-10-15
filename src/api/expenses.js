import api from './client';

// Vehicle expenses — feed the reports' "Vehicle Expense". Resolves to { data, totalAmount, categories, pagination }.
export function fetchExpenses({ page = 1, limit = 20, vehicle = '', from = '', to = '' } = {}) {
  return api
    .get('/expenses', { params: { page, limit, vehicle: vehicle || undefined, from: from || undefined, to: to || undefined } })
    .then((res) => res.data);
}

export function createExpense(payload) {
  return api.post('/expenses', payload).then((res) => res.data);
}

export function updateExpense(id, payload) {
  return api.put(`/expenses/${id}`, payload).then((res) => res.data);
}

export function deleteExpense(id) {
  return api.delete(`/expenses/${id}`).then((res) => res.data);
}
