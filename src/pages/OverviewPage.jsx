import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import StatTile from '../components/StatTile';
import StarRating from '../components/StarRating';
import CustomerViewModal from '../components/CustomerViewModal';
import CustomerFormModal from '../components/CustomerFormModal';
import CustomerDocumentsModal from '../components/CustomerDocumentsModal';
import CustomerTypeBadge from '../components/CustomerTypeBadge';
import { UsersIcon, RupeeIcon, StarSolidIcon, EyeIcon } from '../components/icons';
import { fetchCustomerStats, updateCustomer } from '../api/customers';
import { fetchTripStats } from '../api/trips';

function formatMoney(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function OverviewPage() {
  const filters = useSelector((state) => state.filters);
  const [stats, setStats] = useState(null);
  const [tripStats, setTripStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewCustomer, setViewCustomer] = useState(null);
  const [formModal, setFormModal] = useState(null); // { mode: 'edit', data }
  const [documentsCustomer, setDocumentsCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [customerData, tripData] = await Promise.all([
        fetchCustomerStats({
          search: filters.search,
          minRating: filters.minRating,
          startDate: filters.startDate,
          endDate: filters.endDate,
          customerIds: filters.customerIds,
        }),
        // Amount/toll now live on Trip, not Customer — sourced separately here. Trip stats
        // only support a date range, not the full customer/rating filter set.
        fetchTripStats({ startDate: filters.startDate, endDate: filters.endDate }),
      ]);
      setStats(customerData);
      setTripStats(tripData);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.minRating, filters.startDate, filters.endDate, filters.customerIds]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function handleSave(payload) {
    setSubmitting(true);
    try {
      const res = await updateCustomer(formModal.data._id, payload);
      toast.success('Customer updated successfully');
      setFormModal(null);
      loadStats();
      // If documents were skipped when this customer was first created, offer the upload
      // screen again now instead of only ever surfacing it once, at creation time.
      const d = res.data.documents;
      const hasNoDocuments = !d?.drivingLicence && !d?.aadhaar && !d?.other;
      if (hasNoDocuments) setDocumentsCustomer(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          icon={UsersIcon}
          label="Total Customers"
          value={loading ? '—' : stats?.totalCustomers ?? 0}
          sub="All-time records"
          accent="blue"
        />
        <StatTile
          icon={RupeeIcon}
          label="Total Amount Collected"
          value={loading ? '—' : `₹${formatMoney(tripStats?.totalAmount)}`}
          sub="Across all trips"
          accent="green"
        />
        <StatTile
          icon={RupeeIcon}
          label="Total Toll Charges"
          value={loading ? '—' : `₹${formatMoney(tripStats?.totalTollCharges)}`}
          sub="Cumulative toll spend"
          accent="amber"
        />
        <StatTile
          icon={StarSolidIcon}
          label="Average Rating"
          value={loading ? '—' : (stats?.avgRating ?? 0).toFixed(1)}
          sub="Out of 5 stars"
          accent="violet"
        />
      </div>

      <div className="rounded-xl border border-gray-200/70 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-sm font-bold text-gray-900">Recently Added Customers</h2>
          <Link to="/customers" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="ml-auto h-4 w-16 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : !stats?.recentCustomers?.length ? (
          <div className="p-10 text-center text-sm text-gray-500">No customers yet — create your first one.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.recentCustomers.map((c) => (
              <div key={c._id} className="flex flex-wrap items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-600">
                  {c.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.mobile1}</p>
                </div>
                <CustomerTypeBadge type={c.customerType} />
                <StarRating value={c.rating || 0} readOnly size="sm" />
                <span className="hidden text-xs text-gray-400 sm:inline">{formatDate(c.createdAt)}</span>
                <button
                  onClick={() => setViewCustomer(c)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
                  title="View details"
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {viewCustomer && (
        <CustomerViewModal
          customer={viewCustomer}
          onClose={() => setViewCustomer(null)}
          onEdit={(c) => {
            setViewCustomer(null);
            setFormModal({ mode: 'edit', data: c });
          }}
          onDocuments={(c) => {
            setViewCustomer(null);
            setDocumentsCustomer(c);
          }}
        />
      )}

      {formModal && (
        <CustomerFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}

      {documentsCustomer && (
        <CustomerDocumentsModal
          customer={documentsCustomer}
          onClose={() => {
            setDocumentsCustomer(null);
            loadStats();
          }}
          onDone={() => {
            setDocumentsCustomer(null);
            loadStats();
          }}
        />
      )}
    </div>
  );
}
