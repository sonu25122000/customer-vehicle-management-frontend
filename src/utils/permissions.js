// Viewer is read-only everywhere; moderator and admin can create/edit/delete records.
// Coupons & Offers and staff account management are admin-only — see RoleRoute.jsx.
export function canEdit(role) {
  return role === 'moderator' || role === 'admin';
}

export function isAdmin(role) {
  return role === 'admin';
}
