import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Gates admin-only pages (Coupons & Offers, Users) — ProtectedRoute already guarantees the
// visitor is logged in by the time this renders, so a role mismatch just bounces them back to
// the app instead of the login page.
export default function RoleRoute({ allow, children }) {
  const role = useSelector((state) => state.auth.admin?.role);

  if (!allow.includes(role)) {
    return <Navigate to="/customers" replace />;
  }

  return children;
}
