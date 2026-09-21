import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import StatTile from '../components/StatTile';
import CreateUserModal from '../components/CreateUserModal';
import { ShieldIcon, UsersIcon, PencilIcon, EyeIcon } from '../components/icons';
import { fetchUsers, createUser, updateUserRole } from '../api/users';

const ROLES = ['viewer', 'moderator', 'admin'];

const roleBadgeClass = {
  admin: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  moderator: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  viewer: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
};

export default function UsersPage() {
  const currentAdminId = useSelector((state) => state.auth.admin?.id);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRoleChange(user, role) {
    if (role === user.role) return;
    setSavingId(user._id);
    try {
      await updateUserRole(user._id, role);
      toast.success('Role updated successfully');
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, role } : u)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    } finally {
      setSavingId(null);
    }
  }

  async function handleCreate(payload) {
    setCreating(true);
    try {
      await createUser(payload);
      toast.success('Account created successfully');
      setCreateOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  }

  const counts = ROLES.reduce((acc, role) => {
    acc[role] = users.filter((u) => u.role === role).length;
    return acc;
  }, {});

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={UsersIcon} label="Total Accounts" value={loading ? '—' : users.length} accent="blue" />
        <StatTile icon={ShieldIcon} label="Admins" value={loading ? '—' : counts.admin || 0} accent="red" />
        <StatTile icon={PencilIcon} label="Moderators" value={loading ? '—' : counts.moderator || 0} accent="violet" />
        <StatTile icon={EyeIcon} label="Viewers" value={loading ? '—' : counts.viewer || 0} accent="teal" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500">
          There's no public signup — create every account here, and change roles anytime.
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="ml-auto cursor-pointer whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          + Create User
        </button>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="ml-auto h-4 w-24 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : !users.length ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">No accounts found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[500px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Username</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Role</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Created</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Change Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentAdminId;
                return (
                  <tr key={u._id} className="transition-colors hover:bg-gray-50">
                    <td className="border-t border-gray-100 px-3 py-2 align-middle font-semibold capitalize text-gray-900">
                      {u.username}
                      {isSelf && <span className="ml-1.5 text-[0.65rem] font-normal text-gray-400">(you)</span>}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle">
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize ${roleBadgeClass[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle text-gray-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle">
                      <select
                        value={u.role}
                        disabled={isSelf || savingId === u._id}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        title={isSelf ? "You can't change your own role" : undefined}
                        className="cursor-pointer rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs capitalize text-gray-800 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} className="capitalize">
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <CreateUserModal onClose={() => setCreateOpen(false)} onSubmit={handleCreate} submitting={creating} />
      )}
    </>
  );
}
