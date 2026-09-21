import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import CouponFormModal from '../components/CouponFormModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import StatTile from '../components/StatTile';
import { SearchIcon, PercentIcon, CheckCircleIcon, AlertCircleIcon, PencilIcon, TrashIcon } from '../components/icons';
import { canDelete } from '../utils/permissions';
import { fetchCoupons, fetchCouponStats, createCoupon, updateCoupon, deleteCoupon } from '../api/coupons';

const LIMIT = 10;

function couponStatus(coupon) {
  const now = new Date();
  if (!coupon.isActive) return { label: 'Inactive', className: 'bg-gray-100 text-gray-600' };
  if (new Date(coupon.expiresAt) < now) return { label: 'Expired', className: 'bg-red-50 text-red-700' };
  if (new Date(coupon.startAt) > now) return { label: 'Scheduled', className: 'bg-amber-50 text-amber-700' };
  return { label: 'Active', className: 'bg-emerald-50 text-emerald-700' };
}

export default function CouponsPage() {
  // Moderators can view/create/edit coupons but not delete them (the backend enforces this too).
  const mayDelete = canDelete(useSelector((state) => state.auth.admin?.role));
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  function setPage(value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(Math.max(1, value)));
        return next;
      },
      { replace: true }
    );
  }

  const [coupons, setCoupons] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [formModal, setFormModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await fetchCoupons({ search, page, limit: LIMIT });
      if (requestId !== requestIdRef.current) return;
      setCoupons(res.data);
      setPagination(res.pagination);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      toast.error(err.response?.data?.message || 'Failed to load coupons');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await fetchCouponStats());
    } catch {
      // Non-critical — stat tiles just stay in their loading state.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const searchDebounce = useRef(null);
  function handleSearchChange(value) {
    setSearch(value);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => setPage(1), 350);
  }

  async function handleSave(payload) {
    setSubmitting(true);
    try {
      if (formModal.mode === 'edit') {
        await updateCoupon(formModal.data._id, payload);
        toast.success('Coupon updated successfully');
      } else {
        await createCoupon(payload);
        toast.success('Coupon created successfully');
      }
      setFormModal(null);
      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCoupon(deleteTarget._id);
      toast.success('Coupon deleted successfully');
      setDeleteTarget(null);
      if (coupons.length === 1 && page > 1) setPage(page - 1);
      else load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete coupon');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile icon={PercentIcon} label="Total Coupons" value={statsLoading ? '—' : stats?.total ?? 0} accent="blue" />
        <StatTile icon={CheckCircleIcon} label="Active" value={statsLoading ? '—' : stats?.active ?? 0} accent="green" />
        <StatTile icon={AlertCircleIcon} label="Expired" value={statsLoading ? '—' : stats?.expired ?? 0} accent="red" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500">
          {pagination.total || 0} coupon{pagination.total === 1 ? '' : 's'}
        </p>

        <div className="relative ml-auto min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by coupon code"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          onClick={() => setFormModal({ mode: 'create', data: null })}
          className="cursor-pointer whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
        >
          + Create Coupon
        </button>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-4">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="ml-auto h-4 w-24 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      ) : !coupons.length ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">No coupons found.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[1000px] border-collapse text-xs">
            <thead>
              <tr>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Code</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Discount</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Applicable To</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Usage</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Starts</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Expires</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Status</th>
                <th className="bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = couponStatus(c);
                return (
                  <tr key={c._id} className="transition-colors hover:bg-gray-50">
                    <td className="border-t border-gray-100 px-3 py-2 align-middle">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-indigo-700">{c.code}</span>
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle font-semibold text-gray-900">
                      {c.discountType === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                      {c.discountType === 'percentage' && c.maxDiscount ? (
                        <span className="ml-1 text-[0.7rem] font-normal text-gray-500">up to ₹{Number(c.maxDiscount).toLocaleString()}</span>
                      ) : null}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle text-gray-700">
                      {c.applicability === 'all' ? 'All Customers' : `${c.customers?.length || 0} selected`}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle whitespace-nowrap text-gray-700">
                      {c.maxUsage ? (
                        <span className={c.usageCount >= c.maxUsage ? 'font-semibold text-red-600' : ''}>
                          {c.usageCount || 0} / {c.maxUsage}
                        </span>
                      ) : (
                        <span>
                          {c.usageCount || 0} <span className="text-gray-400">/ unlimited</span>
                        </span>
                      )}
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle text-gray-500">{new Date(c.startAt).toLocaleString()}</td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle text-gray-500">{new Date(c.expiresAt).toLocaleString()}</td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle">
                      <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${status.className}`}>{status.label}</span>
                    </td>
                    <td className="border-t border-gray-100 px-3 py-2 align-middle whitespace-nowrap">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setFormModal({ mode: 'edit', data: c })}
                          title="Edit"
                          aria-label="Edit"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        {mayDelete && (
                          <button
                            onClick={() => setDeleteTarget(c)}
                            title="Delete"
                            aria-label="Delete"
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
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

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        total={pagination.total || 0}
        limit={LIMIT}
        onPageChange={setPage}
      />

      {formModal && (
        <CouponFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Coupon"
          target={{ name: deleteTarget.code }}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}
