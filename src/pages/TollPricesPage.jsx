import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import tollData from '../data/tollPlazas.json';
import { fetchVehicleOptions } from '../api/vehicles';
import SearchableSelect from '../components/SearchableSelect';
import {
  SearchIcon,
  XIcon,
  MapPinIcon,
  PlusCircleIcon,
  DownloadIcon,
  RouteIcon,
  CarIcon,
} from '../components/icons';

const ALL_PLAZAS = Object.entries(tollData).flatMap(([state, stateData]) =>
  stateData.tollPlazas.map((plaza) => ({ ...plaza, state }))
);

function tollKey(plaza) {
  return `${plaza.state}::${plaza.tollName}`;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString();
}

function SelectionModal({ selected, runningTotal, onClose, onRemove, onClearAll, onExport }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
              <RouteIcon className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Selected Tolls</h3>
              <p className="text-[0.7rem] text-gray-400">
                {selected.length} toll{selected.length === 1 ? '' : 's'} in this trip
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {selected.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-gray-400">No tolls selected yet.</p>
          ) : (
            selected.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-gray-50">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-[0.7rem] font-bold text-gray-500">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{s.toll.tollName}</p>
                  <p className="truncate text-xs text-gray-400">
                    {s.toll.state} &middot; {s.toll.highway}
                  </p>
                </div>
                <span className="flex-shrink-0 text-sm font-bold tabular-nums text-gray-900">
                  ₹{formatMoney(s.toll.pricing.car.singleJourney)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(s.id)}
                  aria-label={`Remove ${s.toll.tollName}`}
                  className="flex flex-shrink-0 cursor-pointer items-center justify-center rounded-full p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <XIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/80 px-5 py-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onClearAll}
                className="cursor-pointer rounded-lg px-3 py-2.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={onExport}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <DownloadIcon className="h-4 w-4" /> Export PDF
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 ring-1 ring-emerald-100">
              <span className="text-xs font-bold uppercase tracking-wide text-emerald-700">Total</span>
              <span className="text-lg font-extrabold tabular-nums text-emerald-700">₹{formatMoney(runningTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TollPricesPage() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]); // [{ id, toll }] — one row per Add click, duplicates allowed
  const [showModal, setShowModal] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [vehicleOptions, setVehicleOptions] = useState(null);
  const nextIdRef = useRef(0);

  useEffect(() => {
    fetchVehicleOptions({ activeOnly: true })
      .then(setVehicleOptions)
      .catch(() => setVehicleOptions([]));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_PLAZAS.filter((p) => p.tollName.toLowerCase().includes(q));
  }, [query]);

  function addToll(plaza) {
    if (!vehicleId) {
      toast.error('Select a vehicle before adding a toll');
      return;
    }
    nextIdRef.current += 1;
    setSelected((prev) => [...prev, { id: nextIdRef.current, toll: plaza }]);
  }

  function removeToll(id) {
    setSelected((prev) => prev.filter((s) => s.id !== id));
  }

  function clearAll() {
    setSelected([]);
  }

  function clearAllAndClose() {
    clearAll();
    setShowModal(false);
  }

  function changeVehicle(id) {
    setVehicleId(id);
    clearAll(); // switching vehicles invalidates the trip being built for the previous one
  }

  const runningTotal = selected.reduce((acc, s) => acc + s.toll.pricing.car.singleJourney, 0);
  const selectedVehicle = vehicleOptions?.find((v) => v._id === vehicleId);

  function exportPdf() {
    if (selected.length === 0) return;
    if (!selectedVehicle) {
      toast.error('Select a vehicle before exporting');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('Toll Charges', 14, 16);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 23);

    autoTable(doc, {
      startY: 28,
      head: [['#', 'Vehicle', 'Toll Name', 'State', 'Highway', 'Price (Rs)']],
      body: selected.map((s, i) => [
        i + 1,
        selectedVehicle.vehicleNo.toUpperCase(),
        s.toll.tollName,
        s.toll.state,
        s.toll.highway,
        formatMoney(s.toll.pricing.car.singleJourney),
      ]),
      foot: [['', '', '', '', 'Total', formatMoney(runningTotal)]],
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [236, 253, 245], textColor: [4, 120, 87], fontStyle: 'bold' },
    });

    doc.save(`toll-charges-${selectedVehicle.vehicleNo.toUpperCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <div className={`flex flex-col gap-4 sm:gap-6 ${selected.length > 0 ? 'pb-20' : ''}`}>
      {/* Search toolbar — sticky on larger screens only; on mobile it scrolls away so results get
          real screen space instead of being permanently pinned under a tall banner. */}
      <div className="z-20 pb-1 pt-0.5 sm:sticky sm:top-0">
        <div className="relative isolate rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/10">
          {/* Modern gradient-mesh backdrop: deep slate base + soft indigo/cyan glows + dot texture.
              Clipped to its own layer (not the card) so the vehicle dropdown below can overflow the card. */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-slate-900 to-slate-900" />
            <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-indigo-500/40 blur-3xl" />
            <div className="absolute -right-12 -bottom-20 h-64 w-64 rounded-full bg-cyan-400/30 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
          </div>

          <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm sm:h-12 sm:w-12">
                <MapPinIcon className="h-4.5 w-4.5 sm:h-5.5 sm:w-5.5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-white sm:text-lg">Toll Price Lookup</h2>
                <p className="mt-0.5 hidden text-xs text-slate-300 sm:block">
                  Search a toll plaza, add it to your trip &amp; calculate the total cost.
                </p>
              </div>
            </div>

            <div className="relative w-full sm:w-80 lg:w-96">
              <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={!vehicleId}
                placeholder={vehicleId ? 'Search toll plaza name...' : 'Select a vehicle first...'}
                className="w-full rounded-xl border-0 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 shadow-md outline-none ring-1 ring-white/50 transition-shadow focus:ring-2 focus:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-70 sm:py-3"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 transition-colors hover:text-gray-700"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="relative flex items-center gap-3 border-t border-white/10 px-4 py-2.5 sm:px-6">
            <span className="flex-shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-300 sm:text-xs">
              Vehicle
            </span>
            <div className="min-w-0 flex-1 sm:max-w-xs">
              <SearchableSelect
                value={vehicleId}
                onChange={changeVehicle}
                options={vehicleOptions}
                loading={vehicleOptions === null}
                placeholder="Select a vehicle"
                searchPlaceholder="Search by number, make or model..."
                emptyMessage="No vehicles yet — create one in Vehicle Management first."
                getOptionValue={(v) => v._id}
                getOptionLabel={(v) => `${v.vehicleNo}${v.make ? ` — ${v.make}${v.model ? ' ' + v.model : ''}` : ''}`}
                getOptionSearchText={(v) => `${v.vehicleNo} ${v.make || ''} ${v.model || ''}`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search results */}
      {!vehicleId ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <CarIcon className="h-5.5 w-5.5" />
          </span>
          <p className="mt-1 text-sm text-gray-600">
            <strong className="font-semibold text-gray-800">Select a vehicle</strong> above to start adding tolls
          </p>
        </div>
      ) : !query.trim() ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <SearchIcon className="h-5.5 w-5.5" />
          </span>
          <p className="mt-1 text-sm text-gray-600">
            Type a <strong className="font-semibold text-gray-800">toll plaza name</strong> to get started
          </p>
          <p className="text-xs text-gray-400">Example: Aganampudi, Kaza, Pottipadu</p>
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <MapPinIcon className="h-5.5 w-5.5" />
          </span>
          <p className="mt-1 text-sm text-gray-600">
            No toll plaza found for &ldquo;<span className="font-semibold text-gray-800">{query}</span>&rdquo;
          </p>
          <p className="text-xs text-gray-400">Try a different spelling or a shorter search term</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-blue-50 py-1 pl-1 pr-3 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[0.65rem] text-white">
                {results.length}
              </span>
              result{results.length === 1 ? '' : 's'} for &ldquo;{query}&rdquo;
            </span>
            <span className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((p, i) => {
              const key = tollKey(p);
              const selectedCount = selected.filter((s) => tollKey(s.toll) === key).length;
              return (
                <div
                  key={`${key}-${i}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2 p-4 pb-0">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-blue-700">
                        {p.state}
                      </span>
                      <p className="mt-1.5 truncate text-base font-bold text-gray-900">{p.tollName}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <RouteIcon className="h-3 w-3 flex-shrink-0" /> {p.highway}
                      </p>
                    </div>
                    {selectedCount > 0 && (
                      <span className="flex h-5.5 min-w-5.5 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[0.65rem] font-bold text-white shadow-sm">
                        {selectedCount}
                      </span>
                    )}
                  </div>

                  <div className="mt-3.5 flex items-center justify-between bg-emerald-50/80 px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <CarIcon className="h-3.5 w-3.5" /> Single Journey
                    </span>
                    <span className="text-sm font-bold text-emerald-700">₹{formatMoney(p.pricing.car.singleJourney)}</span>
                  </div>

                  <div className="p-4 pt-3">
                    <button
                      type="button"
                      onClick={() => addToll(p)}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-blue-300 py-2 text-xs font-semibold text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
                    >
                      <PlusCircleIcon className="h-4 w-4" />
                      {selectedCount > 0 ? 'Add Again' : 'Add to Selection'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Persistent summary bar — stays put instead of pushing results down as more get added */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:px-6 md:left-64">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <RouteIcon className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {selected.length} toll{selected.length === 1 ? '' : 's'} selected
                </p>
                <p className="text-xs text-gray-400">
                  Total: ₹{formatMoney(runningTotal)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              View Selection &amp; Calculate
            </button>
          </div>
        </div>
      )}

      {showModal && (
        <SelectionModal
          selected={selected}
          runningTotal={runningTotal}
          onClose={() => setShowModal(false)}
          onRemove={removeToll}
          onClearAll={clearAllAndClose}
          onExport={exportPdf}
        />
      )}
    </div>
  );
}
