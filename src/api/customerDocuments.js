import api from './client';

// Customer verification documents live in their own collection, linked to the customer by id —
// see backend routes/customerDocumentRoutes.js.

export function fetchCustomerDocuments(customerId) {
  return api.get('/customer-documents', { params: { customer: customerId } }).then((res) => res.data.data);
}

export function uploadCustomerDocuments(customerId, files) {
  const form = new FormData();
  form.append('customer', customerId);
  Object.entries(files).forEach(([type, file]) => {
    if (file) form.append(type, file);
  });
  return api
    .post('/customer-documents', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then((res) => res.data);
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
