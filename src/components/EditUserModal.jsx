import { useState } from 'react';

const ROLES = ['viewer', 'moderator', 'admin'];

const baseInputClass =
  'rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2';
const validInputClass = 'border-gray-300 focus:border-blue-600 focus:ring-blue-100';
const errorInputClass = 'border-red-400 focus:border-red-500 focus:ring-red-100';
const labelTextClass = 'text-xs font-semibold text-gray-600';
const errorClass = 'text-xs text-red-600';

// Edit an existing account: username, role and an optional password reset. Only the fields that
// actually changed are sent. Your own role can't be changed (the backend refuses it too).
export default function EditUserModal({ user, isSelf, onClose, onSubmit, submitting }) {
  const [username, setUsername] = useState(user.username);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  function fieldClass(field) {
    return `${baseInputClass} ${errors[field] ? errorInputClass : validInputClass}`;
  }

  function validate() {
    const next = {};
    if (!username.trim()) next.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username.trim())) next.username = 'Use 3-30 letters, numbers, dots or underscores';
    if (password && password.length < 6) next.password = 'Password must be at least 6 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    const payload = {};
    if (username.trim().toLowerCase() !== user.username) payload.username = username.trim();
    if (role !== user.role) payload.role = role;
    if (password) payload.password = password;
    onSubmit(payload);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Username</span>
            <input
              className={fieldClass('username')}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors((prev) => ({ ...prev, username: undefined }));
              }}
              autoFocus
              aria-invalid={Boolean(errors.username)}
            />
            {errors.username && <span className={errorClass}>{errors.username}</span>}
          </label>

          <div className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Role</span>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  disabled={isSelf}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    role === r ? 'border-blue-400 bg-blue-100 text-blue-800' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  } ${isSelf ? '' : 'cursor-pointer'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            {isSelf && <span className="text-xs text-gray-400">You can't change your own role.</span>}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>
              New Password <span className="font-normal text-gray-400">(optional)</span>
            </span>
            <input
              type="password"
              autoComplete="new-password"
              className={fieldClass('password')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Leave blank to keep the current password"
              aria-invalid={Boolean(errors.password)}
            />
            {errors.password ? (
              <span className={errorClass}>{errors.password}</span>
            ) : (
              !isSelf && password && <span className="text-xs text-gray-400">They'll be signed out on all devices.</span>
            )}
          </label>

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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
