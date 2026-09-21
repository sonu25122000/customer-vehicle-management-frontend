import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../store/authSlice';
import { isAdmin } from '../utils/permissions';
import { UsersIcon, LogoutIcon, CarIcon, RouteIcon, MapPinIcon, TagIcon, PercentIcon, ShieldIcon } from './icons';
import logo from '../assets/logo.png';

const navItems = [
  { to: '/customers', label: 'Customers', icon: UsersIcon, end: true },
  { to: '/vehicles', label: 'Vehicles', icon: CarIcon },
  { to: '/vehicle-catalog', label: 'Vehicle Catalog', icon: TagIcon },
  { to: '/trips', label: 'Trips', icon: RouteIcon },
  { to: '/toll-prices', label: 'Toll Prices', icon: MapPinIcon },
  { to: '/coupons', label: 'Coupons & Offers', icon: PercentIcon, adminOnly: true },
  { to: '/users', label: 'Users', icon: ShieldIcon, adminOnly: true },
];

const linkBase =
  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors';

export default function Sidebar({ open, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const role = useSelector((state) => state.auth.admin?.role);
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin(role));

  async function handleLogout() {
    await dispatch(logout());
    toast.success('Logged out');
    navigate('/login', { replace: true });
  }

  return (
    <>
      <aside
        className={`fixed top-0 z-40 flex h-dvh w-64 flex-shrink-0 flex-col overflow-y-auto bg-gray-950 px-4 py-5 transition-transform duration-200 ease-out md:sticky md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            <img src={logo} alt="Roam Wheels" className="h-full w-full object-contain" />
          </span>
          <span className="leading-none">
            <span className="block text-sm font-extrabold tracking-tight text-white">ROAM WHEELS</span>
            <span className="block text-[0.6rem] font-bold tracking-[0.2em] text-blue-400">CAR RENTALS</span>
          </span>
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
