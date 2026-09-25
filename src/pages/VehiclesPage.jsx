import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { canEdit } from '../utils/permissions';
import VehicleTable from '../components/VehicleTable';
import Pagination from '../components/Pagination';
import VehicleFormModal from '../components/VehicleFormModal';
import VehicleViewModal from '../components/VehicleViewModal';
import VehiclePhotosModal from '../components/VehiclePhotosModal';
import VehicleDocumentsModal from '../components/VehicleDocumentsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import FiltersPopover from '../components/FiltersPopover';
import StatTile from '../components/StatTile';
import { SearchIcon, CarIcon, RouteIcon, CheckCircleIcon, ClockIcon, GaugeIcon } from '../components/icons';
import { setSearch } from '../store/filtersSlice';
import { fetchVehicleWithMedia } from '../api/vehicleMedia';
import {
  fetchVehicles,
  fetchVehicle,
  fetchVehicleStats,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../api/vehicles';

const LIMIT = 10;

export default function VehiclesPage() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

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

  const [vehicles, setVehicles] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState(null); // { mode: 'create'|'edit', data }
  const [viewVehicle, setViewVehicle] = useState(null);
  const [photosVehicle, setPhotosVehicle] = useState(null);
  const [documentsVehicle, setDocumentsVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requestIdRef = useRef(0);

  const loadVehicles = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await fetchVehicles({
        search: filters.search,
        page,
        limit: LIMIT,
        minRating: filters.minRating,
      });
      if (requestId !== requestIdRef.current) return;
      setVehicles(res.data);
      setPagination(res.pagination);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      toast.error(err.response?.data?.message || 'Failed to load vehicles');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [filters.search, filters.minRating, page]);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await fetchVehicleStats());
    } catch {
      // Non-critical — the stat tiles just stay in their loading state.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset to page 1 whenever a filter's *value* actually changes — compared by content, not a
  // one-shot flag, since a boolean guard breaks under React StrictMode's deliberate second
  // mount invocation (see the identical pattern in CustomersPage.jsx).
  const prevFiltersSnapshot = useRef(null);
  useEffect(() => {
    const snapshot = JSON.stringify([filters.search, filters.minRating]);
    if (prevFiltersSnapshot.current === snapshot) return;
    const isFirstRun = prevFiltersSnapshot.current === null;
    prevFiltersSnapshot.current = snapshot;
    if (isFirstRun) return;

    const timer = setTimeout(() => setPage(1), filters.search ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.minRating]);

  async function handleSave(payload) {
    setSubmitting(true);
    try {
      if (formModal.mode === 'edit') {
        const res = await updateVehicle(formModal.data._id, payload);
        toast.success('Vehicle updated successfully');
        setFormModal(null);
        loadVehicles();
        loadStats();
        // If photos were skipped when this vehicle was first created, offer the upload
        // screen again now instead of only ever surfacing it once, at creation time.
        if (!res.data.photoCount) openPhotos(res.data);
      } else {
        await createVehicle(payload);
        toast.success('Vehicle created successfully');
        setFormModal(null);
        loadVehicles();
        loadStats();
        // Photos are optional and not forced right after creation — reachable anytime via
        // the table's camera icon, and offered automatically next time this vehicle is edited.
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  // Neither the list nor the vehicle record carries photo/document files (they live in their own
  // collections). View loads just the record, and its View Photos / View Documents buttons fetch the
  // files on demand; Manage Photos / Documents load the record together with its files.
  async function openView(v) {
    try {
      const full = await fetchVehicle(v._id);
      setViewVehicle(full);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load vehicle details');
    }
  }

  async function openPhotos(v) {
    try {
      const full = await fetchVehicleWithMedia(v._id);
      setPhotosVehicle(full);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load vehicle details');
    }
  }

  async function openDocuments(v) {
    try {
      const full = await fetchVehicleWithMedia(v._id);
      setDocumentsVehicle(full);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load vehicle details');
    }
  }

  // The table row doesn't carry photoSlots — the edit form needs it to know whether Active can be
  // selected (see VehicleFormModal's 4-photo gate).
  async function openEdit(v) {
    try {
      const full = await fetchVehicle(v._id);
      setFormModal({ mode: 'edit', data: full });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load vehicle details');
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteVehicle(deleteTarget._id);
      toast.success('Vehicle deleted successfully');
      setDeleteTarget(null);
      if (vehicles.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadVehicles();
      }
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete vehicle');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          icon={CarIcon}
          label="Total Vehicle"
          value={statsLoading ? '—' : stats?.total ?? 0}
          accent="blue"
        />
        <StatTile
          icon={CheckCircleIcon}
          label="Active"
          value={statsLoading ? '—' : stats?.active ?? 0}
          accent="green"
        />
        <StatTile
          icon={ClockIcon}
          label="On Hold"
          value={statsLoading ? '—' : stats?.onHold ?? 0}
          accent="amber"
        />
        <StatTile
          icon={RouteIcon}
          label="On Trip"
          value={statsLoading ? '—' : stats?.onTrip ?? 0}
          accent="violet"
        />
        <StatTile
          icon={GaugeIcon}
          label="Available"
          value={statsLoading ? '—' : stats?.available ?? 0}
          accent="teal"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500">
          {pagination.total || 0} vehicle{pagination.total === 1 ? '' : 's'}
        </p>

        <div className="relative ml-auto min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            placeholder="Search by vehicle no., owner or make"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <FiltersPopover fields={['rating']} />

        {mayEdit && (
          <button
            onClick={() => setFormModal({ mode: 'create', data: null })}
            className="cursor-pointer whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Create Vehicle
          </button>
        )}
      </div>

      <VehicleTable
        vehicles={vehicles}
        loading={loading}
        page={pagination.page || page}
        limit={LIMIT}
        onView={openView}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        onManagePhotos={openPhotos}
        onManageDocuments={openDocuments}
      />

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        total={pagination.total || 0}
        limit={LIMIT}
        onPageChange={setPage}
      />

      {formModal && (
        <VehicleFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}

      {viewVehicle && (
        <VehicleViewModal
          vehicle={viewVehicle}
          onClose={() => setViewVehicle(null)}
          onEdit={(v) => {
            setViewVehicle(null);
            setFormModal({ mode: 'edit', data: v });
          }}
          onManagePhotos={(v) => {
            setViewVehicle(null);
            openPhotos(v);
          }}
          onManageDocuments={(v) => {
            setViewVehicle(null);
            openDocuments(v);
          }}
        />
      )}

      {photosVehicle && (
        <VehiclePhotosModal
          vehicle={photosVehicle}
          onClose={() => {
            setPhotosVehicle(null);
            loadVehicles();
          }}
          onDone={() => {
            setPhotosVehicle(null);
            loadVehicles();
          }}
        />
      )}

      {documentsVehicle && (
        <VehicleDocumentsModal
          vehicle={documentsVehicle}
          onClose={() => {
            setDocumentsVehicle(null);
            loadVehicles();
          }}
          onDone={() => {
            setDocumentsVehicle(null);
            loadVehicles();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Vehicle"
          target={{ name: deleteTarget.ownerName, detail: deleteTarget.vehicleNo }}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}
