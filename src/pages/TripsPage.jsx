import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { canEdit } from '../utils/permissions';
import TripTable from '../components/TripTable';
import Pagination from '../components/Pagination';
import TripFormModal from '../components/TripFormModal';
import TripViewModal from '../components/TripViewModal';
import RescheduleTripModal from '../components/RescheduleTripModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import StatTile from '../components/StatTile';
import { SearchIcon, RouteIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, StarSolidIcon } from '../components/icons';
import { fetchTrips, fetchTrip, fetchTripStats, createTrip, updateTrip, deleteTrip, rescheduleTrip } from '../api/trips';

const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '4', label: '4 stars & up' },
  { value: '3', label: '3 stars & up' },
  { value: '2', label: '2 stars & up' },
  { value: '1', label: '1 star & up' },
];

const LIMIT = 10;
const STATUS_OPTIONS = ['', 'Yet to Start', 'On Trip', 'Completed', 'Cancelled'];

export default function TripsPage() {
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  function setPage(value) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const resolved = typeof value === 'function' ? value(page) : value;
        next.set('page', String(Math.max(1, resolved)));
        return next;
      },
      { replace: true }
    );
  }

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [minRating, setMinRating] = useState('');
  const [trips, setTrips] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [formModal, setFormModal] = useState(null); // { mode: 'create'|'edit', data }
  const [viewTrip, setViewTrip] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchTrips({ search, status, minRating, page, limit: LIMIT });
      setTrips(res.data);
      setPagination(res.pagination);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  }, [search, status, minRating, page]);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await fetchTripStats());
    } catch {
      // Non-critical — the stat tiles just stay in their loading state.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => setPage(1), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, minRating]);

  async function handleReschedule(payload) {
    setRescheduling(true);
    try {
      await rescheduleTrip(rescheduleTarget._id, payload);
      toast.success('Trip rescheduled successfully');
      setRescheduleTarget(null);
      loadTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reschedule trip');
    } finally {
      setRescheduling(false);
    }
  }

  async function handleSave(payload) {
    setSubmitting(true);
    try {
      if (formModal.mode === 'edit') {
        await updateTrip(formModal.data._id, payload);
        toast.success('Trip updated successfully');
      } else {
        await createTrip(payload);
        toast.success('Trip created successfully');
      }
      setFormModal(null);
      loadTrips();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function openView(t) {
    try {
      const full = await fetchTrip(t._id);
      setViewTrip(full);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load trip details');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTrip(deleteTarget._id);
      toast.success('Trip deleted successfully');
      setDeleteTarget(null);
      if (trips.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadTrips();
      }
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete trip');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          icon={RouteIcon}
          label="Total Trips"
          value={statsLoading ? '—' : stats?.totalTrips ?? 0}
          accent="blue"
        />
        <StatTile
          icon={ClockIcon}
          label="Yet to Start"
          value={statsLoading ? '—' : stats?.statusCounts?.['Yet to Start'] ?? 0}
          accent="blue"
        />
        <StatTile
          icon={RouteIcon}
          label="On Trip"
          value={statsLoading ? '—' : stats?.statusCounts?.['On Trip'] ?? 0}
          accent="amber"
        />
        <StatTile
          icon={CheckCircleIcon}
          label="Completed"
          value={statsLoading ? '—' : stats?.statusCounts?.Completed ?? 0}
          accent="green"
        />
        <StatTile
          icon={AlertCircleIcon}
          label="Cancelled"
          value={statsLoading ? '—' : stats?.statusCounts?.Cancelled ?? 0}
          accent="red"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500">
          {pagination.total || 0} trip{pagination.total === 1 ? '' : 's'}
        </p>

        <div className="relative ml-auto min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or vehicle no."
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s || 'all'} value={s}>
              {s || 'All Statuses'}
            </option>
          ))}
        </select>

        <div className="relative">
          <StarSolidIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-amber-400" />
          <select
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white py-2 pl-7 pr-3 text-xs font-semibold text-gray-700 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          >
            {RATING_OPTIONS.map((r) => (
              <option key={r.value || 'all'} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {mayEdit && (
          <button
            onClick={() => setFormModal({ mode: 'create', data: null })}
            className="cursor-pointer whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Create Trip
          </button>
        )}
      </div>

      <TripTable
        trips={trips}
        loading={loading}
        page={pagination.page || page}
        limit={LIMIT}
        onView={openView}
        onEdit={(t) => setFormModal({ mode: 'edit', data: t })}
        onDelete={setDeleteTarget}
        onReschedule={setRescheduleTarget}
      />

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        total={pagination.total || 0}
        limit={LIMIT}
        onPageChange={setPage}
      />

      {formModal && (
        <TripFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}

      {viewTrip && (
        <TripViewModal
          trip={viewTrip}
          onClose={() => setViewTrip(null)}
          onEdit={(t) => {
            setViewTrip(null);
            setFormModal({ mode: 'edit', data: t });
          }}
        />
      )}

      {rescheduleTarget && (
        <RescheduleTripModal
          trip={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSubmit={handleReschedule}
          submitting={rescheduling}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Trip"
          target={{ name: deleteTarget.customer?.name || 'this trip', detail: deleteTarget.vehicle?.vehicleNo }}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}
