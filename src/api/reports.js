import api from './client';

// Reports filled by the backend's nightly report engine (backend utils/reportEngine.js). Admin only.
// Every list resolves to { data, metrics: [{ key, label }] , ... }.

export function fetchDailyReports({ from, to } = {}) {
  return api.get('/reports/daily', { params: { from: from || undefined, to: to || undefined } }).then((res) => res.data);
}

export function fetchMonthlyReports(year) {
  return api.get('/reports/monthly', { params: { year: year || undefined } }).then((res) => res.data);
}

export function fetchYearlyReports() {
  return api.get('/reports/yearly').then((res) => res.data);
}

// Worked out live from the trips for any range.
export function fetchCustomReport(from, to) {
  return api.get('/reports/custom', { params: { from, to } }).then((res) => res.data);
}

export function fetchReportJobs({ page = 1, limit = 20, status = '' } = {}) {
  return api.get('/reports/jobs', { params: { page, limit, status: status || undefined } }).then((res) => res.data);
}

// Runs the engine now for one day (or each day from..to, at most 31).
export function runReports(from, to) {
  return api.post('/reports/jobs', { from, to: to || undefined }).then((res) => res.data);
}

export function retryReportJob(id) {
  return api.post(`/reports/jobs/${id}/retry`).then((res) => res.data);
}
