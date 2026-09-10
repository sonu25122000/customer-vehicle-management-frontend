import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { logout } from '../store/authSlice';
import { MenuIcon, ChevronDownIcon, LogoutIcon } from './icons';

export default function Header({ title, onMenuClick }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const admin = useSelector((state) => state.auth.admin);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleLogout() {
    await dispatch(logout());
    toast.success('Logged out');
    navigate('/login', { replace: true });
  }

  return (
    <header className="relative z-30 flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5 sm:px-5">
      <button onClick={onMenuClick} aria-label="Open menu" className="cursor-pointer text-gray-700 md:hidden">
        <MenuIcon className="h-5 w-5" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-sm font-bold text-gray-900 sm:text-base">{title}</h1>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {admin?.username?.[0]?.toUpperCase() || 'A'}
          </span>
          <span className="hidden text-xs font-semibold capitalize text-gray-700 sm:inline">{admin?.username}</span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-gray-400" />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <div className="border-b border-gray-100 px-3.5 py-2">
              <p className="text-xs font-semibold capitalize text-gray-900">{admin?.username}</p>
              <p className="text-[0.7rem] text-gray-500">Administrator</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-2 text-left text-xs text-gray-600 hover:bg-gray-50"
            >
              <LogoutIcon className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
