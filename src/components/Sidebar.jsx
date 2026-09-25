import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../store/authSlice';
import { isAdmin, canManageCoupons } from '../utils/permissions';
import { UsersIcon, LogoutIcon, CarIcon, RouteIcon, MapPinIcon, TagIcon, PercentIcon, ShieldIcon } from './icons';
// Dark-background logo, cropped tight to its artwork. Its image background is #010917, the same as
// the sidebar, so there's no visible box; spacing around it comes from the wrapper below.
import logo from '../assets/logo-dark.png';

const navItems = [
  { to: '/customers', label: 'Customers', icon: UsersIcon, end: true },
  { to: '/vehicles', label: 'Vehicles', icon: CarIcon },
  { to: '/vehicle-catalog', label: 'Vehicle Catalog', icon: TagIcon },
  { to: '/trips', label: 'Trips', icon: RouteIcon },
  { to: '/toll-prices', label: 'Toll Prices', icon: MapPinIcon },
  { to: '/coupons', label: 'Coupons & Offers', icon: PercentIcon, allowed: canManageCoupons },
  { to: '/users', label: 'Users', icon: ShieldIcon, allowed: isAdmin },
];

const linkBase =
  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

export default function Sidebar({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.admin?.role);
  const visibleNavItems = navItems.filter((item) => !item.allowed || item.allowed(role));

  async function handleLogout() {
    await dispatch(logout());
    toast.success('Logged out');
    navigate('/login', { replace: true });
  }

  return (
    <>
      <aside
        className={`fixed top-0 z-40 flex h-dvh w-64 flex-shrink-0 flex-col overflow-y-auto bg-[#010917] px-4 py-5 transition-transform duration-200 ease-out md:sticky md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Compact logo, centred, with equal space above and below and a divider separating it from the menu. */}
        <div className="-mx-4 -mt-5 mb-4 flex flex-shrink-0 justify-center border-b border-white/10 py-4">
          <img src={logo} alt="Roam Wheels" className="block h-auto w-32" />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {visibleNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/40' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-100'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-800 pt-3">
          <button
            onClick={handleLogout}
            className={`${linkBase} w-full text-gray-400 hover:bg-gray-900 hover:text-red-400`}
          >
            <LogoutIcon className="h-4.5 w-4.5 flex-shrink-0" />
            Logout
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} />}
    </>
  );
}
