import { useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { changePassword } from '../store/authSlice';
import { EyeIcon } from './icons';

function EyeOffIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path
        d="M3 3l18 18M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5M6.6 6.7C4.3 8.2 2.7 10.3 2 12c1.6 3.7 5.4 7 10 7 1.7 0 3.2-.4 4.6-1.1M9.9 4.2A10.9 10.9 0 0 1 12 4c4.6 0 8.4 3.3 10 7-.5 1.1-1.2 2.2-2.1 3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100';
const labelTextClass = 'text-xs font-semibold text-gray-600';

export default function ChangePasswordModal({ onClose }) {
  const dispatch = useDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSubmitting(true);
    const result = await dispatch(changePassword({ currentPassword, newPassword }));
    setSubmitting(false);
    if (changePassword.fulfilled.match(result)) {
      toast.success(result.payload || 'Password changed successfully');
      onClose();
    } else {
      setError(result.payload || 'Failed to change password');
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Current Password</span>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>New Password</span>
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide passwords' : 'Show passwords'}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-gray-600"
              >
                {show ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
              </button>
            </div>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Confirm New Password</span>
            <input
              type={show ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className={inputClass.replace('pr-10', 'pr-3')}
            />
          </label>

          {error && <p className="text-xs font-medium text-red-600">{error}</p>}

          <p className="text-[0.7rem] text-gray-400">
            Changing your password signs out every other device currently logged into this
            account.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
