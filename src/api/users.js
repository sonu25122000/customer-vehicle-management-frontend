import api from './client';

// status: 'active' | 'inactive' | 'all' (the Users page tabs). Resolves to { data, counts: { active, inactive, all } }.
export function fetchUsers(status = 'active') {
  return api.get('/auth/users', { params: { status } }).then((res) => res.data);
}

export function createUser(payload) {
  return api.post('/auth/users', payload).then((res) => res.data);
}

export function updateUserRole(id, role) {
  return api.patch(`/auth/users/${id}/role`, { role }).then((res) => res.data);
}

// Edit username / role and optionally reset the password. Only send the fields that changed.
export function updateUser(id, payload) {
  return api.patch(`/auth/users/${id}`, payload).then((res) => res.data);
}

// Soft delete — the account moves to the Inactive tab and can be reactivated.
export function deleteUser(id) {
  return api.delete(`/auth/users/${id}`).then((res) => res.data);
}

export function setUserActive(id, isActive) {
  return api.patch(`/auth/users/${id}/status`, { isActive }).then((res) => res.data);
}
