import api from './client';

// The reviews carousel on the website's home page (backend routes/testimonialRoutes.js).

// Resolves to { data: slides in order, maxActive }.
export function fetchTestimonials() {
  return api.get('/testimonials').then((res) => res.data);
}

// Customers' trip reviews that can be added as slides.
export function fetchReviewCandidates() {
  return api.get('/testimonials/reviews').then((res) => res.data.data);
}

export function createTestimonial(payload) {
  return api.post('/testimonials', payload).then((res) => res.data);
}

export function updateTestimonial(id, payload) {
  return api.put(`/testimonials/${id}`, payload).then((res) => res.data);
}

export function reorderTestimonials(ids) {
  return api.put('/testimonials/order', { ids }).then((res) => res.data);
}

export function deleteTestimonial(id) {
  return api.delete(`/testimonials/${id}`).then((res) => res.data);
}
