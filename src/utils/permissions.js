// Viewer is read-only everywhere. Moderator can create/edit everything (including Coupons &
// Offers) but can't delete anything and can't see the Users page. Admin can do everything.
// The backend enforces the same rules — these helpers only decide what the UI shows.
export function canEdit(role) {
  return role === 'moderator' || role === 'admin';
}

// Deleting/removing anything is admin-only.
export function canDelete(role) {
  return role === 'admin';
}

// Coupons & Offers page: moderator and admin (viewers don't get it at all).
export function canManageCoupons(role) {
  return role === 'moderator' || role === 'admin';
}

export function isAdmin(role) {
  return role === 'admin';
}
