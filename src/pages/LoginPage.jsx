import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { login } from '../store/authSlice';
import { CarIcon, RupeeIcon, ChartIcon } from '../components/icons';
import heroImage from '../assets/login-hero.png';

function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.5-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ off, ...props }) {
  return off ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M6.6 6.7C4.3 8.2 2.7 10.3 2 12c1.6 3.7 5.4 7 10 7 1.7 0 3.2-.4 4.6-1.1M9.9 4.2A10.9 10.9 0 0 1 12 4c4.6 0 8.4 3.3 10 7-.5 1.1-1.2 2.2-2.1 3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M2 12c1.6-3.7 5.4-7 10-7s8.4 3.3 10 7c-1.6 3.7-5.4 7-10 7s-8.4-3.3-10-7Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShieldCheckIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-2.5Z" strokeLinejoin="round" />
      <path d="m9 12 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SignInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M9 4v2m0 12v2" strokeLinecap="round" />
      <path d="M11 12h10m0 0-3.5-3.5M21 12l-3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FEATURES = [
  { icon: ShieldCheckIcon, title: 'Secure', sub: 'Data Protection' },
  { icon: CarIcon, title: 'Easy', sub: 'Vehicle Management' },
  { icon: RupeeIcon, title: 'Track', sub: 'Payments & Tolls' },
  { icon: ChartIcon, title: 'Smart', sub: 'Reports & Insights' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { admin, status, error } = useSelector((state) => state.auth);
  const isLoading = status === 'loading';

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  if (admin) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const result = await dispatch(login({ username, password, remember }));
    if (login.fulfilled.match(result)) {
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    }
  }

  return (
    <div className="relative flex h-dvh items-stretch overflow-y-auto bg-slate-100">
      {/* Single full-bleed photo behind the entire page. */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImage})` }} />
      <div className="absolute inset-0 bg-white/10" />

      <div className="relative z-10 grid min-h-full w-full md:grid-cols-[1fr_1fr]">
        {/* Left: brand / hero copy, floating directly on the photo */}
        <div className="hidden flex-col justify-between p-10 md:flex md:pl-14 lg:pl-20">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600 text-blue-600">
              <CarIcon className="h-5 w-5" />
            </span>
            <span className="leading-none">
              <span className="block text-lg font-extrabold tracking-tight text-slate-900">ROADZ</span>
              <span className="block text-[0.6rem] font-bold tracking-[0.2em] text-blue-600">CAR RENTALS</span>
            </span>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-700">Welcome to</p>
            <h1 className="mt-1 text-4xl font-extrabold leading-tight text-slate-900 xl:text-[2.75rem]">
              Roadz Car Rentals
              <br />
              <span className="text-blue-600">Admin</span> Portal
            </h1>
            <span className="mt-3 block h-1 w-14 rounded-full bg-blue-600" />
            <p className="mt-4 max-w-sm text-sm text-slate-600">
              Manage customers, vehicles, bookings, tolls and payments — all in one secure
              workspace built for speed, accuracy and control.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="rounded-xl bg-white/90 p-3 text-center shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
                <Icon className="mx-auto h-5 w-5 text-blue-600" />
                <p className="mt-1.5 text-xs font-bold text-slate-800">{title}</p>
                <p className="text-[0.65rem] leading-tight text-slate-500">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: a compact navy card near the top, with the background photo visible around
            it on every side — applies at every screen size, not just mobile. */}
        <div className="mx-auto my-6 flex w-[calc(100%-2rem)] max-w-md flex-col justify-between self-start rounded-3xl bg-[#0d1a3f] p-6 shadow-2xl sm:p-10 md:mx-0 md:ml-auto md:mr-8 md:mt-8">
          <div className="flex flex-1 items-center justify-center py-6">
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 pt-12 shadow-2xl sm:p-8 sm:pt-14">
              <span className="absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg ring-4 ring-white">
                <LockIcon className="h-6 w-6" />
              </span>

              <h2 className="text-center text-xl font-bold text-gray-900">Admin Sign In</h2>
              <p className="mb-6 mt-1 text-center text-xs text-gray-500">Access your admin dashboard</p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Username</span>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoFocus
                      required
                      autoComplete="username"
                      placeholder="Enter your username"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Password</span>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
                    >
                      <EyeIcon off={showPassword} className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </label>

                <div className="flex items-center pt-1">
                  <label className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Remember me for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    'Signing in...'
                  ) : (
                    <>
                      <SignInIcon className="h-4 w-4" /> Sign In
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-[0.7rem] text-gray-400">
                Secured by encrypted session authentication
              </p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-100">
              <ShieldCheckIcon className="h-3.5 w-3.5" /> Secure &middot; Reliable &middot; Always with you
            </p>
            <p className="mt-1 text-[0.65rem] text-blue-300/70">Roadz Car Rentals &copy; 2025 All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
