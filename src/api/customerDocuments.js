import api from './client';

// Customer verification documents live in their own collection, linked to the customer by id, with the
// files themselves in S3 — see backend routes/customerDocumentRoutes.js. Each row's `file` is a
// short-lived link to the file.

export function fetchCustomerDocuments(customerId) {
  return api.get('/customer-documents', { params: { customer: customerId } }).then((res) => res.data.data);
}

// One request per file: each can be up to 2MB, and a request has to stay under the hosting platform's
// 4.5MB body limit. Resolves to the last response (which carries the full, updated list).
export async function uploadCustomerDocuments(customerId, files) {
  let last = null;
  for (const [type, file] of Object.entries(files).filter(([, f]) => f)) {
    const form = new FormData();
    form.append('customer', customerId);
    form.append(type, file);
    // eslint-disable-next-line no-await-in-loop
    last = await api.post('/customer-documents', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);
  }
  return last;
}

// Approve or reject documents — one ({ documents: [id] }), several, or all of the customer's documents
// (documents omitted). Rejecting needs a reason, which the customer sees on the customer site.
// Resolves to { data: documents, profileVerified, message }.
export function reviewCustomerDocuments(customerId, { status, documents, reason }) {
  return api
    .post('/customer-documents/review', { customer: customerId, status, documents, reason })
    .then((res) => res.data);
}

export function deleteCustomerDocument(id) {
  return api.delete(`/customer-documents/${id}`).then((res) => res.data);
}

// [{ type, file }, ...] -> { selfie: dataUri, aadhaar: dataUri, ... }
export function documentsByType(list) {
  return Object.fromEntries((list || []).map((d) => [d.type, d.file]));
}
