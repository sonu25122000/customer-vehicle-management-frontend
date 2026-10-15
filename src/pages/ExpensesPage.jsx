import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import Pagination from '../components/Pagination';
import SearchableSelect from '../components/SearchableSelect';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { PencilIcon, TrashIcon } from '../components/icons';
import { canDelete } from '../utils/permissions';
import { fetchVehicleOptions } from '../api/vehicles';
import { fetchExpenses, createExpense, updateExpense, deleteExpense } from '../api/expenses';

const CATEGORIES = ['Fuel', 'Service', 'Repair', 'Cleaning', 'Insurance', 'Parking', 'Other'];
const LIMIT = 20;

const thClass = 'whitespace-nowrap bg-gray-50 px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500';
const tdClass = 'border-t border-gray-100 px-3 py-2 align-middle';
const inputClass =
  'rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100';

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function money(v) {
  return `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function vehicleLabel(v) {
  return v ? `${v.vehicleNo}${v.make ? ` — ${v.make} ${v.model || ''}` : ''}` : 'Unknown';
}

function ExpenseFormModal({ initial, vehicles, onClose, onSaved }) {
  const [form, setForm] = useState(
    initial
      ? {
          vehicle: initial.vehicle?._id || '',
          date: initial.date?.slice(0, 10) || today(),
          amount: String(initial.amount ?? ''),
          category: initial.category || 'Other',
          note: initial.note || '',
        }
      : { vehicle: '', date: today(), amount: '', category: 'Fuel', note: '' }
  );
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!form.vehicle) return toast.error('Select a vehicle');
    if (!(Number(form.amount) > 0)) return toast.error('Enter an amount greater than 0');
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      const res = initial ? await updateExpense(initial._id, payload) : await createExpense(payload);
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSaving(false);
    }
    return undefined;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()} noValidate>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{initial ? 'Edit Expense' : 'Add Expense'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 hover:text-gray-700">
            ×
          </button>
        </div>
        <div className="flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Vehicle</span>
            <SearchableSelect
              value={form.vehicle}
              onChange={(id) => setForm((f) => ({ ...f, vehicle: id }))}
              options={vehicles}
              loading={vehicles === null}
              placeholder="Select a vehicle"
              searchPlaceholder="Search by number, make or model..."
              getOptionValue={(v) => v._id}
              getOptionLabel={vehicleLabel}
              getOptionSearchText={(v) => `${v.vehicleNo} ${v.make || ''} ${v.model || ''}`}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Date</span>
              <input type="date" value={form.date} max={today()} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className={inputClass}
              />
            </label>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Category</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, category: c }))}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    form.category === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">Note (optional)</span>
            <input value={form.note} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="e.g. Oil change at 42,000 km" className={inputClass} />
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-300">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Money spent on vehicles — the "Vehicle Expense" figure in Reports.
export default function ExpensesPage() {
  const mayDelete = canDelete(useSelector((state) => state.auth.admin?.role));
  const [vehicles, setVehicles] = useState(null);
  const [filters, setFilters] = useState({ vehicle: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [modal, setModal] = useState(null); // { expense } | { expense: null }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchVehicleOptions()
      .then(setVehicles)
      .catch(() => setVehicles([]));
  }, []);

  const load = useCallback(() => {
    fetchExpenses({ ...filters, page, limit: LIMIT })
      .then(setResult)
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load expenses'));
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExpense(deleteTarget._id);
      toast.success('Expense deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  }

  const expenses = result?.data || [];
  return (
    <>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-full sm:w-72">
          <SearchableSelect
            value={filters.vehicle}
            onChange={(id) => setFilter('vehicle', id)}
            options={vehicles ? [{ _id: '', vehicleNo: 'All vehicles' }, ...vehicles] : null}
            loading={vehicles === null}
            placeholder="All vehicles"
            searchPlaceholder="Search vehicle..."
            getOptionValue={(v) => v._id}
            getOptionLabel={(v) => (v._id ? vehicleLabel(v) : 'All vehicles')}
            getOptionSearchText={(v) => `${v.vehicleNo} ${v.make || ''} ${v.model || ''}`}
          />
        </div>
        <input type="date" value={filters.from} onChange={(e) => setFilter('from', e.target.value)} className={`${inputClass} py-2 text-xs`} aria-label="From" />
        <input type="date" value={filters.to} min={filters.from} onChange={(e) => setFilter('to', e.target.value)} className={`${inputClass} py-2 text-xs`} aria-label="To" />
        <p className="ml-auto text-xs text-gray-500">
          Total <span className="font-bold text-gray-900">{money(result?.totalAmount)}</span>
        </p>
        <button
          type="button"
          onClick={() => setModal({ expense: null })}
          className="cursor-pointer whitespace-nowrap rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          + Add Expense
        </button>
      </div>

      {!result ? (
        <div className="h-48 animate-pulse rounded-xl bg-white shadow-sm" />
      ) : !expenses.length ? (
        <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">No expenses recorded.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr>
                <th className={thClass}>Date</th>
                <th className={thClass}>Vehicle</th>
                <th className={thClass}>Category</th>
                <th className={`${thClass} text-right`}>Amount</th>
                <th className={thClass}>Note</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((x) => (
                <tr key={x._id} className="hover:bg-gray-50">
                  <td className={`${tdClass} whitespace-nowrap`}>
                    {new Date(x.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                  </td>
                  <td className={tdClass}>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-indigo-700">{x.vehicle?.vehicleNo || 'Unknown'}</span>
                    <span className="ml-2 text-gray-400">
                      {x.vehicle?.make} {x.vehicle?.model}
                    </span>
                  </td>
                  <td className={tdClass}>{x.category}</td>
                  <td className={`${tdClass} text-right font-semibold tabular-nums text-gray-900`}>{money(x.amount)}</td>
                  <td className={`${tdClass} max-w-xs truncate text-gray-500`}>{x.note || '-'}</td>
                  <td className={tdClass}>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setModal({ expense: x })}
                        aria-label="Edit"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      {mayDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(x)}
                          aria-label="Delete"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {result && (
        <div className="mt-3">
          <Pagination page={page} totalPages={result.pagination.totalPages} total={result.pagination.total} limit={LIMIT} onPageChange={setPage} />
        </div>
      )}

      {modal && (
        <ExpenseFormModal
          initial={modal.expense}
          vehicles={vehicles}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            load();
          }}
        />
      )}
      <ConfirmDeleteModal
        target={deleteTarget ? { name: `this ${money(deleteTarget.amount)} expense`, detail: deleteTarget.vehicle?.vehicleNo } : null}
        title="Delete Expense"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </>
  );
}
