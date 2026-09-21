import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import StatTile from '../components/StatTile';
import CreateUserModal from '../components/CreateUserModal';
import EditUserModal from '../components/EditUserModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { ShieldIcon, UsersIcon, PencilIcon, EyeIcon, TrashIcon, CheckCircleIcon } from '../components/icons';
import { fetchUsers, createUser, updateUser, deleteUser, setUserActive } from '../api/users';

const ROLES = ['viewer', 'moderator', 'admin'];

const roleBadgeClass = {
  admin: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  moderator: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  viewer: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
};

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'inactive', label: 'Inactive' },
];

const thClass = 'bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500';
const tdClass = 'border-t border-gray-100 px-3 py-2 align-middle';
const actionBtn = 'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50';

export default function UsersPage() {
  const currentAdminId = useSelector((state) => state.auth.admin?.id);
  const [tab, setTab] = useState('active');
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ active: 0, inactive: 0 });
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [reactivatingId, setReactivatingId] = useState(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await fetchUsers(tab);
      if (requestId !== requestIdRef.current) return;
      setUsers(res.data);
      setCounts(res.counts);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      toast.error(err.response?.data?.message || 'Failed to load users');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(payload) {
    setCreating(true);
    try {
      await createUser(payload);
      toast.success('Account created successfully');
      setCreateOpen(false);
      setTab('active');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  }

  async function handleEdit(payload) {
    if (Object.keys(payload).length === 0) {
      setEditTarget(null);
      return;
    }
    setSaving(true);
    try {
      await updateUser(editTarget._id, payload);
      toast.success('Account updated successfully');
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success('Account deactivated — find it under the Inactive tab');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate account');
    } finally {
      setDeleting(false);
    }
  }

  async function handleReactivate(user) {
    setReactivatingId(user._id);
    try {
      await setUserActive(user._id, true);
      toast.success('Account reactivated successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reactivate account');
    } finally {
      setReactivatingId(null);
    }
  }

  const roleCounts = ROLES.reduce((acc, role) => {
    acc[role] = users.filter((u) => u.role === role).length;
    return acc;
  }, {});
  const isActiveTab = tab === 'active';

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={UsersIcon} label={isActiveTab ? 'Active Accounts' : 'Inactive Accounts'} value={loading ? '—' : users.length} accent="blue" />
        <StatTile icon={ShieldIcon} label="Admins" value={loading ? '—' : roleCounts.admin || 0} accent="red" />
        <StatTile icon={PencilIcon} label="Moderators" value={loading ? '—' : roleCounts.moderator || 0} accent="violet" />
        <StatTile icon={EyeIcon} label="Viewers" value={loading ? '—' : roleCounts.viewer || 0} accent="teal" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-lg bg-gray-100 p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`cursor-pointer rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[0.65rem] ${tab === t.key ? 'bg-blue-50 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <p className="hidden text-xs text-gray-500 md:block">
          {isActiveTab
            ? "There's no public signup — create every account here. Deleting an account only deactivates it."
            : 'Deactivated accounts can’t sign in. Reactivate one to restore its access.'}
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
        <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
          {isActiveTab ? 'No active accounts found.' : 'No inactive accounts — deleted users show up here.'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[560px] border-collapse text-xs">
            <thead>
              <tr>
                <th className={thClass}>Username</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>{isActiveTab ? 'Created' : 'Deactivated'}</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u._id === currentAdminId;
                return (
                  <tr key={u._id} className="transition-colors hover:bg-gray-50">
                    <td className={`${tdClass} font-semibold capitalize text-gray-900`}>
                      {u.username}
                      {isSelf && <span className="ml-1.5 text-[0.65rem] font-normal text-gray-400">(you)</span>}
                    </td>
                    <td className={tdClass}>
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize ${roleBadgeClass[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className={`${tdClass} text-gray-500`}>
                      {(isActiveTab ? u.createdAt : u.deactivatedAt) ? new Date(isActiveTab ? u.createdAt : u.deactivatedAt).toLocaleDateString() : '-'}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      <div className="flex gap-1.5">
                        {isActiveTab ? (
                          <>
                            <button
                              onClick={() => setEditTarget(u)}
                              title="Edit"
                              aria-label="Edit"
                              className={`${actionBtn} bg-gray-100 text-gray-600 hover:bg-gray-200`}
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(u)}
                              disabled={isSelf}
                              title={isSelf ? "You can't delete your own account" : 'Delete (deactivate)'}
                              aria-label="Delete"
                              className={`${actionBtn} bg-red-50 text-red-600 hover:bg-red-100`}
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReactivate(u)}
                            disabled={reactivatingId === u._id}
                            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <CheckCircleIcon className="h-3.5 w-3.5" />
                            {reactivatingId === u._id ? 'Reactivating...' : 'Reactivate'}
                          </button>
                        )}
                      </div>
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

      {editTarget && (
        <EditUserModal
          user={editTarget}
          isSelf={editTarget._id === currentAdminId}
          onClose={() => setEditTarget(null)}
          onSubmit={handleEdit}
          submitting={saving}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete User"
          target={{ name: deleteTarget.username, detail: deleteTarget.role }}
          message="The account will be signed out everywhere and moved to the Inactive tab. You can reactivate it at any time."
          confirmLabel="Delete"
          busyLabel="Deleting..."
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}
