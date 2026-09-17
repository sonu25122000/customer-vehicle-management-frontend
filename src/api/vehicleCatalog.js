import api from './client';

// Vehicle type/category/make/model options — a single nested JSON tree
// ({ vehicleTypes: [{ name, categories, makes: [{ name, models }] }] }), admin-managed from the
// "Vehicle Catalog" tab instead of hardcoded lists.
export function fetchVehicleCatalog() {
  return api.get('/vehicle-catalog').then((res) => res.data.data);
}

export function addCatalogItem(payload) {
  return api.post('/vehicle-catalog', payload).then((res) => res.data);
}

export function removeCatalogItem(payload) {
  return api.post('/vehicle-catalog/remove', payload).then((res) => res.data);
}
