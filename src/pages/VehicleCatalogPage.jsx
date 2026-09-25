import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import SearchableSelect from '../components/SearchableSelect';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { fetchVehicleCatalog, addCatalogItem, removeCatalogItem, restoreCatalogItem } from '../api/vehicleCatalog';
import { CarIcon, TagIcon, FactoryIcon, LayersIcon, PlusCircleIcon, XIcon, EyeIcon, CheckCircleIcon } from '../components/icons';
import { canEdit, canDelete } from '../utils/permissions';

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

const KIND_LABELS = { vehicleType: 'Vehicle Type', category: 'Category', make: 'Make', model: 'Model' };

// Style for a disabled (soft-deleted) entry's chip — greyed out (its name is struck through separately).
const INACTIVE_CHIP = 'bg-gray-100 text-gray-400 ring-gray-200';

function activeCount(items) {
  return items.filter((i) => i.isActive).length;
}

// "3" or "3 active · 1 disabled"
function countLabel(items) {
  const active = activeCount(items);
  const disabled = items.length - active;
  return disabled ? `${active} active · ${disabled} disabled` : String(active);
}

// Identifies one enable request, so its button can show a busy state while it runs.
function enableKey(payload) {
  return [payload.kind, payload.vehicleType || '', payload.make || '', payload.name, payload.includeChildren ? 'all' : 'one'].join('|');
}

function hasDisabledChildren(entry) {
  return [...(entry?.categories || []), ...(entry?.makes || []), ...(entry?.models || [])].some(
    (c) => !c.isActive || hasDisabledChildren(c)
  );
}

function EnableButton({ onClick, busy, label = 'Enable', small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
      className={`flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-50 ${
        small ? 'h-5 w-5 justify-center' : 'bg-emerald-50 px-2.5 py-1 text-[0.7rem] ring-1 ring-emerald-100'
      }`}
    >
      <CheckCircleIcon className={small ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5'} />
      {!small && (busy ? 'Enabling...' : label)}
    </button>
  );
}

// items: [{ name, isActive }]. payloadFor(name) builds the enable request for a disabled chip; pass
// null when those entries can't be enabled right now (e.g. their parent is disabled).
function ChipList({ items, accent, empty, payloadFor, onEnable, busyKey }) {
  if (!items.length) return <p className="text-xs text-gray-400">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const payload = !item.isActive && payloadFor && onEnable ? payloadFor(item.name) : null;
        return (
          <span
            key={item.name}
            title={item.isActive ? undefined : 'Disabled'}
            className={`flex items-center gap-1 rounded-full py-1 text-xs font-medium ring-1 ${payload ? 'pl-2.5 pr-1' : 'px-2.5'} ${
              item.isActive ? `${ACCENT[accent].chip} ${ACCENT[accent].ring}` : INACTIVE_CHIP
            }`}
          >
            <span className={item.isActive ? '' : 'line-through decoration-gray-300'}>{item.name}</span>
            {payload && <EnableButton small busy={busyKey === enableKey(payload)} onClick={() => onEnable(payload)} />}
          </span>
        );
      })}
    </div>
  );
}

function ViewSection({ title, action, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        {action}
      </div>
      {children}
    </div>
  );
}

// Details of one catalog entry: where it sits in the tree and everything nested under it, active and
// disabled. When onEnable is given (admins), disabled entries can be enabled right here — one at a
// time, or a type/make together with everything under it. Reads the live catalog, so it updates as
// soon as something is enabled.
function CatalogItemViewModal({ item, vehicleTypes, onClose, onEnable, busyKey }) {
  const tab = TABS.find((t) => t.kind === item.kind);
  const accent = ACCENT[tab.accent];
  const vtName = item.kind === 'vehicleType' ? item.name : item.vehicleType;
  const vt = vehicleTypes.find((v) => v.name === vtName);
  const parentMake = item.kind === 'model' ? vt?.makes.find((m) => m.name === item.make) : null;
  const entry =
    item.kind === 'vehicleType'
      ? vt
      : item.kind === 'category'
        ? vt?.categories.find((c) => c.name === item.name)
        : item.kind === 'make'
          ? vt?.makes.find((m) => m.name === item.name)
          : parentMake?.models.find((m) => m.name === item.name);
  const isActive = entry ? entry.isActive : item.isActive;
  // The entry's own parent chain must be active before it can be enabled.
  const parentActive = item.kind === 'vehicleType' || (vt?.isActive && (item.kind !== 'model' || parentMake?.isActive));
  const vtActive = Boolean(vt?.isActive);
  const path = [
    item.kind !== 'vehicleType' && { label: 'Vehicle Type', value: item.vehicleType, isActive: vt?.isActive },
    item.kind === 'model' && { label: 'Make', value: item.make, isActive: parentMake?.isActive },
  ].filter(Boolean);

  const selfPayload = { kind: item.kind, vehicleType: item.vehicleType, make: item.make, name: item.name };
  const canHaveChildren = item.kind === 'vehicleType' || item.kind === 'make';
  const enable = (payload) => onEnable?.(payload);
  const busy = (payload) => busyKey === enableKey(payload);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${accent.chip} ${accent.ring}`}>
              <tab.icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
                {item.name}
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                    isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {isActive ? 'Active' : 'Disabled'}
                </span>
              </h2>
              <p className="text-xs text-gray-500">{KIND_LABELS[item.kind]}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700">
            ×
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {onEnable && (!isActive || (canHaveChildren && hasDisabledChildren(entry))) && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-emerald-50/60 px-3 py-2.5 ring-1 ring-emerald-100">
              {parentActive ? (
                <>
                  <span className="text-xs text-emerald-900">
                    {!isActive ? `This ${KIND_LABELS[item.kind].toLowerCase()} is disabled.` : 'Some entries under this are disabled.'}
                  </span>
                  <div className="flex gap-1.5">
                    {!isActive && <EnableButton busy={busy(selfPayload)} onClick={() => enable(selfPayload)} />}
                    {canHaveChildren && hasDisabledChildren(entry) && (
                      <EnableButton
                        label={isActive ? 'Enable everything under it' : 'Enable with everything under it'}
                        busy={busy({ ...selfPayload, includeChildren: true })}
                        onClick={() => enable({ ...selfPayload, includeChildren: true })}
                      />
                    )}
                  </div>
                </>
              ) : (
                <span className="text-xs text-gray-600">
                  Enable its {vt?.isActive ? 'make' : 'vehicle type'} first to enable this.
                </span>
              )}
            </div>
          )}

          {path.length > 0 && (
            <ViewSection title="Belongs To">
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-800">
                {path.map((p, i) => (
                  <span key={p.label} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-gray-300">›</span>}
                    <span className="text-xs text-gray-400">{p.label}:</span>
                    <span className={`font-semibold ${p.isActive === false ? 'text-gray-400 line-through' : ''}`}>{p.value}</span>
                    {p.isActive === false && <span className="text-[0.65rem] text-gray-400">(disabled)</span>}
                  </span>
                ))}
              </div>
            </ViewSection>
          )}

          {item.kind === 'vehicleType' && vt && (
            <>
              <ViewSection title={`Categories (${countLabel(vt.categories)})`}>
                <ChipList
                  items={vt.categories}
                  accent="violet"
                  empty="No categories yet."
                  payloadFor={vtActive ? (name) => ({ kind: 'category', vehicleType: vt.name, name }) : null}
                  onEnable={onEnable}
                  busyKey={busyKey}
                />
              </ViewSection>
              <ViewSection title={`Makes & Models (${countLabel(vt.makes)} make${vt.makes.length === 1 ? '' : 's'})`}>
                {vt.makes.length ? (
                  <div className="flex flex-col divide-y divide-gray-100 rounded-lg ring-1 ring-gray-100">
                    {vt.makes.map((m) => {
                      const makePayload = { kind: 'make', vehicleType: vt.name, name: m.name };
                      const allPayload = { ...makePayload, includeChildren: true };
                      return (
                        <div key={m.name} className="flex flex-col gap-1.5 px-3 py-2.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-sm font-semibold ${m.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{m.name}</span>
                            {!m.isActive && <span className="text-[0.65rem] text-gray-400">(disabled)</span>}
                            {onEnable && vtActive && (
                              <span className="ml-auto flex gap-1.5">
                                {!m.isActive && <EnableButton busy={busy(makePayload)} onClick={() => enable(makePayload)} />}
                                {hasDisabledChildren(m) && (
                                  <EnableButton
                                    label={m.isActive ? 'Enable all models' : 'Enable with models'}
                                    busy={busy(allPayload)}
                                    onClick={() => enable(allPayload)}
                                  />
                                )}
                              </span>
                            )}
                          </div>
                          <ChipList
                            items={m.models}
                            accent="teal"
                            empty="No models yet."
                            payloadFor={vtActive && m.isActive ? (name) => ({ kind: 'model', vehicleType: vt.name, make: m.name, name }) : null}
                            onEnable={onEnable}
                            busyKey={busyKey}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">No makes yet.</p>
                )}
              </ViewSection>
              {onEnable && !vtActive && hasDisabledChildren(vt) && (
                <p className="text-xs text-gray-400">Enable the vehicle type first to enable entries under it.</p>
              )}
            </>
          )}

          {item.kind === 'make' && (
            <ViewSection title={`Models (${countLabel(entry?.models || [])})`}>
              <ChipList
                items={entry?.models || []}
                accent="teal"
                empty="No models yet."
                payloadFor={vtActive && entry?.isActive ? (name) => ({ kind: 'model', vehicleType: vt.name, make: entry.name, name }) : null}
                onEnable={onEnable}
                busyKey={busyKey}
              />
            </ViewSection>
          )}

          {(item.kind === 'category' || item.kind === 'model') && (
            <p className="text-xs text-gray-400">
              {item.kind === 'category' ? 'Categories' : 'Models'} have nothing nested under them.
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Active entries only — what the Vehicle form actually offers.
function countFor(kind, vehicleTypes) {
  if (kind === 'vehicleType') return activeCount(vehicleTypes);
  if (kind === 'category') return vehicleTypes.reduce((sum, vt) => sum + activeCount(vt.categories), 0);
  if (kind === 'make') return vehicleTypes.reduce((sum, vt) => sum + activeCount(vt.makes), 0);
  return vehicleTypes.reduce((sum, vt) => sum + vt.makes.reduce((s, m) => s + activeCount(m.models), 0), 0);
}

export default function VehicleCatalogPage() {
  const role = useSelector((state) => state.auth.admin?.role);
  const mayEdit = canEdit(role);
  const mayDelete = canDelete(role);
  // Single nested tree from the DB, including disabled entries (this page only — the Vehicle form's
  // dropdowns still get active entries only). Every level is { name, isActive }:
  // { vehicleTypes: [{ name, isActive, categories: [...], makes: [{ name, isActive, models: [...] }] }] }
  const [catalog, setCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicleType');
  const [vehicleType, setVehicleType] = useState('');
  const [make, setMake] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [enablingKey, setEnablingKey] = useState(null);

  function load() {
    fetchVehicleCatalog({ includeInactive: true })
      .then(setCatalog)
      .catch(() => {
        toast.error('Failed to load vehicle catalog');
        setCatalog({ vehicleTypes: [] });
      });
  }

  useEffect(load, []);

  const allVehicleTypes = catalog?.vehicleTypes || [];
  const selectedVt = allVehicleTypes.find((vt) => vt.name === vehicleType);
  const selectedMake = selectedVt?.makes.find((m) => m.name === make);
  const tab = TABS.find((t) => t.kind === activeTab);
  const accent = ACCENT[tab.accent];

  const needsVehicleType = activeTab === 'category' || activeTab === 'make' || activeTab === 'model';
  const needsMake = activeTab === 'model';

  // { name, isActive } entries for the current tab — active and disabled alike.
  const visibleItems =
    activeTab === 'vehicleType'
      ? allVehicleTypes
      : activeTab === 'category'
        ? selectedVt?.categories || []
        : activeTab === 'make'
          ? selectedVt?.makes || []
          : selectedMake?.models || [];
  const disabledVisible = visibleItems.length - activeCount(visibleItems);

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
    if (needsVehicleType && selectedVt && !selectedVt.isActive) {
      toast.error(`Enable the vehicle type "${selectedVt.name}" first`);
      return;
    }
    if (needsMake && selectedMake && !selectedMake.isActive) {
      toast.error(`Enable the make "${selectedMake.name}" first`);
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
      const res = await addCatalogItem(payload, { includeInactive: true });
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
      const res = await removeCatalogItem(deleteTarget.payload, { includeInactive: true });
      toast.success('Disabled successfully');
      setDeleteTarget(null);
      setCatalog(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  function payloadFor(itemName) {
    return activeTab === 'vehicleType'
      ? { kind: 'vehicleType', name: itemName }
      : activeTab === 'model'
        ? { kind: 'model', vehicleType, make, name: itemName }
        : { kind: activeTab, vehicleType, name: itemName };
  }

  function confirmDelete(itemName) {
    setDeleteTarget({ name: itemName, payload: payloadFor(itemName) });
  }

  // payload: { kind, vehicleType?, make?, name, includeChildren? }
  async function enableEntry(payload) {
    setEnablingKey(enableKey(payload));
    try {
      const res = await restoreCatalogItem(payload, { includeInactive: true });
      toast.success(payload.includeChildren ? `"${payload.name}" and everything under it enabled` : `"${payload.name}" enabled`);
      setCatalog(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enable');
    } finally {
      setEnablingKey(null);
    }
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
            {disabledVisible > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                {disabledVisible} disabled {disabledVisible === 1 ? 'entry is' : 'entries are'} shown greyed out — they
                aren't offered on the Vehicle form.{mayDelete ? ' Use ✓ to enable one again.' : ''}
              </p>
            )}
          </div>
        </div>

        {mayEdit && (
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
                getOptionLabel={(t) => (t.isActive ? t.name : `${t.name} (disabled)`)}
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
                getOptionLabel={(m) => (m.isActive ? m.name : `${m.name} (disabled)`)}
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
        )}

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
            {visibleItems.map(({ name: itemName, isActive }) => (
              <div
                key={itemName}
                className={`group flex items-center gap-1.5 rounded-full py-1.5 pl-3.5 pr-1.5 text-sm font-medium ring-1 transition-colors ${
                  isActive ? `${accent.chip} ${accent.ring} hover:ring-red-200` : 'bg-gray-50 text-gray-400 ring-gray-200 ring-dashed'
                }`}
              >
                <span className={isActive ? '' : 'line-through decoration-gray-300'}>{itemName}</span>
                {!isActive && (
                  <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-gray-500">
                    Disabled
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setViewItem({ kind: activeTab, name: itemName, isActive, vehicleType, make })}
                  aria-label={`View ${itemName}`}
                  title="View"
                  className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-current opacity-60 transition-colors hover:bg-white/70 hover:opacity-100"
                >
                  <EyeIcon className="h-3 w-3" />
                </button>
                {mayDelete && isActive && (
                  <button
                    type="button"
                    onClick={() => confirmDelete(itemName)}
                    aria-label={`Disable ${itemName}`}
                    title="Disable"
                    className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-current opacity-60 transition-colors hover:bg-red-100 hover:text-red-600 hover:opacity-100"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                )}
                {mayDelete && !isActive && (
                  <button
                    type="button"
                    onClick={() => enableEntry(payloadFor(itemName))}
                    disabled={enablingKey === enableKey(payloadFor(itemName))}
                    aria-label={`Enable ${itemName}`}
                    title="Enable"
                    className="flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-emerald-600 transition-colors hover:bg-emerald-100 disabled:cursor-wait disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {viewItem && (
        <CatalogItemViewModal
          item={viewItem}
          vehicleTypes={allVehicleTypes}
          onClose={() => setViewItem(null)}
          onEnable={mayDelete ? enableEntry : null}
          busyKey={enablingKey}
        />
      )}

      <ConfirmDeleteModal
        target={deleteTarget}
        title="Disable Item"
        message="It stops being offered on the Vehicle form, along with everything under it. It stays listed here, greyed out, and can be enabled again."
        confirmLabel="Disable"
        busyLabel="Disabling..."
        verb="disable"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />
    </div>
  );
}
