import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SearchableSelect from '../components/SearchableSelect';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { fetchVehicleCatalog, addCatalogItem, removeCatalogItem } from '../api/vehicleCatalog';
import { CarIcon, TagIcon, FactoryIcon, LayersIcon, PlusCircleIcon, XIcon } from '../components/icons';

const TABS = [
  {
    kind: 'vehicleType',
    label: 'Vehicle Types',
    icon: CarIcon,
    accent: 'blue',
    hint: 'The root of the tree — e.g. Car, Bike. Categories and makes are each tied to one of these.',
  },
  {
    kind: 'category',
    label: 'Categories',
    icon: TagIcon,
    accent: 'violet',
    hint: 'e.g. Sedan, SUV, Cruiser — tied to a vehicle type.',
  },
  {
    kind: 'make',
    label: 'Makes',
    icon: FactoryIcon,
    accent: 'amber',
    hint: 'e.g. Maruti Suzuki, Royal Enfield — tied to a vehicle type.',
  },
  {
    kind: 'model',
    label: 'Models',
    icon: LayersIcon,
    accent: 'teal',
    hint: 'e.g. Swift, Classic 350 — tied to a make, under a vehicle type.',
  },
];

const ACCENT = {
  blue: { chip: 'bg-blue-50 text-blue-700', ring: 'ring-blue-100', tabActive: 'bg-blue-600 text-white shadow-sm shadow-blue-200', badge: 'bg-blue-100 text-blue-700' },
  violet: { chip: 'bg-violet-50 text-violet-700', ring: 'ring-violet-100', tabActive: 'bg-violet-600 text-white shadow-sm shadow-violet-200', badge: 'bg-violet-100 text-violet-700' },
  amber: { chip: 'bg-amber-50 text-amber-700', ring: 'ring-amber-100', tabActive: 'bg-amber-500 text-white shadow-sm shadow-amber-200', badge: 'bg-amber-100 text-amber-700' },
  teal: { chip: 'bg-teal-50 text-teal-700', ring: 'ring-teal-100', tabActive: 'bg-teal-600 text-white shadow-sm shadow-teal-200', badge: 'bg-teal-100 text-teal-700' },
};

function countFor(kind, vehicleTypes) {
  if (kind === 'vehicleType') return vehicleTypes.length;
  if (kind === 'category') return vehicleTypes.reduce((sum, vt) => sum + vt.categories.length, 0);
  if (kind === 'make') return vehicleTypes.reduce((sum, vt) => sum + vt.makes.length, 0);
  return vehicleTypes.reduce((sum, vt) => sum + vt.makes.reduce((s, m) => s + m.models.length, 0), 0);
}

export default function VehicleCatalogPage() {
  // Single nested tree from the DB: { vehicleTypes: [{ name, categories, makes: [{ name, models }] }] }
  const [catalog, setCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicleType');
  const [vehicleType, setVehicleType] = useState('');
  const [make, setMake] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function load() {
    fetchVehicleCatalog()
      .then(setCatalog)
      .catch(() => {
        toast.error('Failed to load vehicle catalog');
        setCatalog({ vehicleTypes: [] });
      });
  }

  useEffect(load, []);

  const allVehicleTypes = catalog?.vehicleTypes || [];
  const selectedVt = allVehicleTypes.find((vt) => vt.name === vehicleType);
  const tab = TABS.find((t) => t.kind === activeTab);
  const accent = ACCENT[tab.accent];

  const needsVehicleType = activeTab === 'category' || activeTab === 'make' || activeTab === 'model';
  const needsMake = activeTab === 'model';

  const visibleItems =
    activeTab === 'vehicleType'
      ? allVehicleTypes.map((vt) => vt.name)
      : activeTab === 'category'
        ? selectedVt?.categories || []
        : activeTab === 'make'
          ? (selectedVt?.makes || []).map((m) => m.name)
          : selectedVt?.makes.find((m) => m.name === make)?.models || [];

  function switchTab(kind) {
    setActiveTab(kind);
    setName('');
  }

  async function handleAdd(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Enter a name');
      return;
    }
    if (needsVehicleType && !vehicleType) {
      toast.error('Select a vehicle type first');
      return;
    }
    if (needsMake && !make) {
      toast.error('Select a make first');
      return;
    }

    setSubmitting(true);
    try {
      const payload =
        activeTab === 'vehicleType'
          ? { kind: 'vehicleType', name: trimmed }
          : activeTab === 'model'
            ? { kind: 'model', vehicleType, make, name: trimmed }
            : { kind: activeTab, vehicleType, name: trimmed };
      const res = await addCatalogItem(payload);
      toast.success('Added successfully');
      setName('');
      setCatalog(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await removeCatalogItem(deleteTarget.payload);
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      setCatalog(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete(itemName) {
    const payload =
      activeTab === 'vehicleType'
        ? { kind: 'vehicleType', name: itemName }
        : activeTab === 'model'
          ? { kind: 'model', vehicleType, make, name: itemName }
          : { kind: activeTab, vehicleType, name: itemName };
    setDeleteTarget({ name: itemName, payload });
  }

  const loading = catalog === null;

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-200">
          <CarIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Vehicle Catalog</h2>
          <p className="text-xs text-gray-400">
            Manage the vehicle types, categories, makes and models offered on the Vehicle form.
          </p>
        </div>
      </div>

      {/* Segmented tab control, with a live count badge per kind */}
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-gray-100 p-1.5">
        {TABS.map((t) => {
          const isActive = activeTab === t.kind;
          const tabAccent = ACCENT[t.accent];
          const count = loading ? null : countFor(t.kind, allVehicleTypes);
          return (
            <button
              key={t.kind}
              type="button"
              onClick={() => switchTab(t.kind)}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all sm:flex-none sm:px-4 ${
                isActive ? tabAccent.tabActive : 'text-gray-500 hover:bg-white hover:text-gray-800'
              }`}
            >
              <t.icon className="h-4 w-4 flex-shrink-0" />
              {t.label}
              {count !== null && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold leading-none ${
                    isActive ? 'bg-white/20 text-white' : tabAccent.badge
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${accent.chip} ring-1 ${accent.ring}`}>
            <tab.icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-bold text-gray-900">{tab.label}</p>
            <p className="text-xs text-gray-400">{tab.hint}</p>
          </div>
        </div>

        <form
          onSubmit={handleAdd}
          className="mb-6 flex flex-col gap-3 rounded-xl bg-gray-50/80 p-3.5 ring-1 ring-gray-100 sm:flex-row sm:items-end"
        >
          {needsVehicleType && (
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Vehicle Type</span>
              <SearchableSelect
                value={vehicleType}
                onChange={(v) => {
                  setVehicleType(v);
                  setMake('');
                }}
                options={allVehicleTypes}
                loading={loading}
                placeholder="Select a vehicle type"
                searchPlaceholder="Search vehicle types..."
                emptyMessage="No vehicle types yet — add one in the Vehicle Types tab first."
                getOptionValue={(t) => t.name}
                getOptionLabel={(t) => t.name}
              />
            </label>
          )}

          {needsMake && (
            <label className="flex flex-1 flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-600">Make</span>
              <SearchableSelect
                value={make}
                onChange={setMake}
                options={selectedVt?.makes || []}
                loading={loading}
                disabled={!vehicleType}
                placeholder={vehicleType ? 'Select a make' : 'Select a vehicle type first'}
                searchPlaceholder="Search makes..."
                emptyMessage="No makes yet — add one in the Makes tab first."
                getOptionValue={(m) => m.name}
                getOptionLabel={(m) => m.name}
              />
            </label>
          )}

          <label className="flex flex-1 flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-600">
              {activeTab === 'vehicleType'
                ? 'Vehicle Type Name'
                : activeTab === 'category'
                  ? 'Category Name'
                  : activeTab === 'make'
                    ? 'Make Name'
                    : 'Model Name'}
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                activeTab === 'vehicleType'
                  ? 'e.g. Car'
                  : activeTab === 'category'
                    ? 'e.g. Sedan'
                    : activeTab === 'make'
                      ? 'e.g. Maruti Suzuki'
                      : 'e.g. Swift'
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PlusCircleIcon className="h-4 w-4" />
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </form>

        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="h-8 w-24 animate-pulse rounded-full bg-gray-100" />
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-10 text-center">
            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${accent.chip}`}>
              <tab.icon className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm text-gray-500">
              {needsMake && !make
                ? 'Select a make above to see its models.'
                : needsVehicleType && !vehicleType
                  ? 'Select a vehicle type above to see its list.'
                  : 'Nothing here yet — add one above.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visibleItems.map((itemName) => (
              <div
                key={itemName}
                className={`group flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 pr-1.5 text-sm font-medium ring-1 transition-colors ${accent.chip} ${accent.ring} hover:ring-red-200`}
              >
                <span>{itemName}</span>
                <button
                  type="button"
                  onClick={() => confirmDelete(itemName)}
                  aria-label={`Delete ${itemName}`}
                  className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-current opacity-60 transition-colors hover:bg-red-100 hover:text-red-600 hover:opacity-100"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        target={deleteTarget}
        title="Delete Item"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
