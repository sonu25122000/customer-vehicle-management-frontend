import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
  const admin = useSelector((state) => state.auth.admin);

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
