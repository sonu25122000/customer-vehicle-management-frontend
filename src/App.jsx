import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { fetchMe } from './store/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LoginPage from './pages/LoginPage';
import OverviewPage from './pages/OverviewPage';
import CustomersPage from './pages/CustomersPage';
import VehiclesPage from './pages/VehiclesPage';
import TripsPage from './pages/TripsPage';
import TollPricesPage from './pages/TollPricesPage';

const SESSION_POLL_MS = Number(import.meta.env.VITE_SESSION_POLL_MS) || 15000;

export default function App() {
  const dispatch = useDispatch();
  const checkedSession = useSelector((state) => state.auth.checkedSession);
  const admin = useSelector((state) => state.auth.admin);

  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);

  // While logged in, periodically re-check the session so a login on another device signs
  // this one out within a few seconds instead of waiting for the next click/navigation.
  useEffect(() => {
    if (!admin) return;
    const interval = setInterval(() => dispatch(fetchMe()), SESSION_POLL_MS);
    return () => clearInterval(interval);
  }, [admin, dispatch]);

  if (!checkedSession) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<OverviewPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/toll-prices" element={<TollPricesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
