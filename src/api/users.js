import api from './client';

export function fetchUsers() {
  return api.get('/auth/users').then((res) => res.data.data);
}

export function createUser(payload) {
  return api.post('/auth/users', payload).then((res) => res.data);
}

export function updateUserRole(id, role) {
  return api.patch(`/auth/users/${id}/role`, { role }).then((res) => res.data);
}
