import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import CustomerTable from '../components/CustomerTable';
import Pagination from '../components/Pagination';
import CustomerFormModal from '../components/CustomerFormModal';
import CustomerViewModal from '../components/CustomerViewModal';
import CustomerDocumentsModal from '../components/CustomerDocumentsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import FiltersPopover from '../components/FiltersPopover';
import StatTile from '../components/StatTile';
import { SearchIcon, UsersIcon, CrownIcon, CheckCircleIcon, AlertCircleIcon } from '../components/icons';
import { setSearch } from '../store/filtersSlice';
import { fetchCustomers, fetchCustomerStats, createCustomer, updateCustomer, deleteCustomer } from '../api/customers';
import { canEdit } from '../utils/permissions';

const LIMIT = 10;

export default function CustomersPage() {
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Page lives in the URL (?page=) so a reload or shared link keeps the same page.
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

  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  const [formModal, setFormModal] = useState(null); // { mode: 'create'|'edit', data }
  const [viewCustomer, setViewCustomer] = useState(null);
  const [documentsCustomer, setDocumentsCustomer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Guards against a slower, stale request resolving after a newer one and clobbering its result.
  const requestIdRef = useRef(0);

  const loadCustomers = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await fetchCustomers({
        search: filters.search,
        page,
        limit: LIMIT,
        sort: filters.sort,
        minRating: filters.minRating,
        startDate: filters.startDate,
        endDate: filters.endDate,
        customerIds: filters.customerIds,
      });
      if (requestId !== requestIdRef.current) return; // a newer request has since started
      setCustomers(res.data);
      setPagination(res.pagination);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      toast.error(err.response?.data?.message || 'Failed to load customers');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [filters.search, filters.sort, filters.minRating, filters.startDate, filters.endDate, filters.customerIds, page]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      setStats(await fetchCustomerStats());
    } catch {
      // Non-critical — the stat tiles just stay in their loading state.
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Reset to page 1 whenever a filter's *value* actually changes (debounced for the free-text
  // search) — compared by content, not a one-shot "first render" flag. A boolean flag breaks
  // under React StrictMode, which deliberately re-invokes this effect a second time on mount
  // with identical deps; a content comparison correctly treats that replay as "unchanged".
  const prevFiltersSnapshot = useRef(null);
  useEffect(() => {
    const snapshot = JSON.stringify([
      filters.search,
      filters.sort,
      filters.minRating,
      filters.startDate,
      filters.endDate,
      filters.customerIds,
    ]);
    if (prevFiltersSnapshot.current === snapshot) return; // unchanged (mount, or StrictMode replay)
    const isFirstRun = prevFiltersSnapshot.current === null;
    prevFiltersSnapshot.current = snapshot;
    if (isFirstRun) return;

    const timer = setTimeout(() => setPage(1), filters.search ? 350 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.sort, filters.minRating, filters.startDate, filters.endDate, filters.customerIds]);

  async function handleSave(payload) {
    setSubmitting(true);
    try {
      if (formModal.mode === 'edit') {
        const res = await updateCustomer(formModal.data._id, payload);
        toast.success('Customer updated successfully');
        setFormModal(null);
        loadCustomers();
        loadStats();
        // If documents were skipped when this customer was first created, offer the upload
        // screen again now instead of only ever surfacing it once, at creation time.
        const d = res.data.documents;
        const hasNoDocuments = !d?.drivingLicence && !d?.aadhaar && !d?.other;
        if (hasNoDocuments) setDocumentsCustomer(res.data);
      } else {
        await createCustomer(payload);
        toast.success('Customer created successfully');
        setFormModal(null);
        loadCustomers();
        loadStats();
        // Documents are optional and not forced right after creation — reachable anytime via
        // the table's document icon, and offered automatically next time this customer is edited.
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget._id);
      toast.success('Customer deleted successfully');
      setDeleteTarget(null);
      if (customers.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        loadCustomers();
      }
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={UsersIcon}
          label="Total Customers"
          value={statsLoading ? '—' : stats?.totalCustomers ?? 0}
          accent="blue"
        />
        <StatTile
          icon={CrownIcon}
          label="VIP"
          value={statsLoading ? '—' : stats?.typeCounts?.VIP ?? 0}
          accent="amber"
        />
        <StatTile
          icon={CheckCircleIcon}
          label="Good"
          value={statsLoading ? '—' : stats?.typeCounts?.Good ?? 0}
          accent="green"
        />
        <StatTile
          icon={AlertCircleIcon}
          label="Bad"
          value={statsLoading ? '—' : stats?.typeCounts?.Bad ?? 0}
          accent="red"
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="text-xs text-gray-500">
          {pagination.total || 0} customer{pagination.total === 1 ? '' : 's'}
        </p>

        <div className="relative ml-auto min-w-0 flex-1 sm:max-w-xs">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            placeholder="Search by name or mobile"
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-xs text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <FiltersPopover fields={['rating', 'sort']} />

        {mayEdit && (
          <button
            onClick={() => setFormModal({ mode: 'create', data: null })}
            className="cursor-pointer whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            + Create Customer
          </button>
        )}
      </div>

      <CustomerTable
        customers={customers}
        loading={loading}
        page={pagination.page || page}
        limit={LIMIT}
        onView={setViewCustomer}
        onEdit={(c) => setFormModal({ mode: 'edit', data: c })}
        onDelete={setDeleteTarget}
        onDocuments={setDocumentsCustomer}
      />

      <Pagination
        page={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        total={pagination.total || 0}
        limit={LIMIT}
        onPageChange={setPage}
      />

      {formModal && (
        <CustomerFormModal
          mode={formModal.mode}
          initialData={formModal.data}
          onClose={() => setFormModal(null)}
          onSubmit={handleSave}
          submitting={submitting}
        />
      )}

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

      {documentsCustomer && (
        <CustomerDocumentsModal
          customer={documentsCustomer}
          onClose={() => {
            setDocumentsCustomer(null);
            loadCustomers();
          }}
          onDone={() => {
            setDocumentsCustomer(null);
            loadCustomers();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          target={{ name: deleteTarget.name, detail: deleteTarget.mobile1 }}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </>
  );
}
