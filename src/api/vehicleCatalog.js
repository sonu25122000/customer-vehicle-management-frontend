import api from './client';

// Vehicle type/category/make/model options — a single nested JSON tree
// ({ vehicleTypes: [{ name, categories, makes: [{ name, models }] }] }), admin-managed from the
// "Vehicle Catalog" tab instead of hardcoded lists.
//
// By default only active entries come back, as plain names — what the Vehicle form's dropdowns use.
// { includeInactive: true } (the Vehicle Catalog page only) also returns disabled entries, and every
// entry is then an object { name, isActive } at every level.
function params(includeInactive) {
  return includeInactive ? { includeInactive: true } : undefined;
}

export function fetchVehicleCatalog({ includeInactive = false } = {}) {
  return api.get('/vehicle-catalog', { params: params(includeInactive) }).then((res) => res.data.data);
}

export function addCatalogItem(payload, { includeInactive = false } = {}) {
  return api.post('/vehicle-catalog', payload, { params: params(includeInactive) }).then((res) => res.data);
}

export function removeCatalogItem(payload, { includeInactive = false } = {}) {
  return api.post('/vehicle-catalog/remove', payload, { params: params(includeInactive) }).then((res) => res.data);
}

// Enables a disabled entry again (admin only).
export function restoreCatalogItem(payload, { includeInactive = false } = {}) {
  return api.post('/vehicle-catalog/restore', payload, { params: params(includeInactive) }).then((res) => res.data);
}
