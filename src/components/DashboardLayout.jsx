import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const TITLES = {
  '/customers': 'Customer Management',
  '/vehicles': 'Vehicle Management',
  '/trips': 'Trip Management',
  '/toll-prices': 'Toll Prices',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = TITLES[location.pathname] || 'Customer Management';

  return (
    <div className="flex h-dvh overflow-hidden bg-gray-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
