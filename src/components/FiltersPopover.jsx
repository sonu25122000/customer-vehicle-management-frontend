import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setMinRating,
  setSort,
  setDateRange,
  clearDateRange,
  toggleCustomerId,
  clearCustomerIds,
  clearAllFilters,
} from '../store/filtersSlice';
import { fetchCustomerOptions } from '../api/customers';
import { DATE_PRESETS, getPresetRange, formatDateRangeLabel } from '../utils/dateRanges';
import DateRangeCalendar from './DateRangeCalendar';
import {
  FilterIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  UsersIcon,
  StarSolidIcon,
  SortIcon,
  CalendarIcon,
} from './icons';

const RATING_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '4', label: '4 stars & up' },
  { value: '3', label: '3 stars & up' },
  { value: '2', label: '2 stars & up' },
  { value: '1', label: '1 star & up' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Name A-Z' },
  { value: 'name_desc', label: 'Name Z-A' },
  { value: 'amount_desc', label: 'Amount High-Low' },
  { value: 'amount_asc', label: 'Amount Low-High' },
];

function Radio({ selected }) {
  return (
    <span
      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? 'border-blue-600' : 'border-gray-300'
      }`}
    >
      {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
    </span>
  );
}

function RootRow({ icon: Icon, label, preview, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <Icon className="h-4.5 w-4.5 flex-shrink-0 text-gray-400" />
      <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
      {preview && (
        <span className="max-w-[7.5rem] truncate rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          {preview}
        </span>
      )}
      <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
    </button>
  );
}

function PanelHeader({ label, onBack, onReset }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
      <button
        onClick={onBack}
        className="flex cursor-pointer items-center gap-1 text-xs font-bold uppercase tracking-wide text-gray-500 hover:text-gray-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        {label}
      </button>
      {onReset && (
        <button onClick={onReset} className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700">
          Reset
        </button>
      )}
    </div>
  );
}

const ALL_FIELDS = ['rating', 'sort', 'date', 'customer'];

export default function FiltersPopover({ fields = ALL_FIELDS }) {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState('root');
  const [customerOptions, setCustomerOptions] = useState(null);
  const [customerOptionsLoading, setCustomerOptionsLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const ref = useRef(null);
  const dispatch = useDispatch();
  const filters = useSelector((state) => state.filters);

  const showRating = fields.includes('rating');
  const showSort = fields.includes('sort');
  const showDate = fields.includes('date');
  const showCustomer = fields.includes('customer');

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setPanel('root');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (panel !== 'customer' || customerOptions !== null) return;
    setCustomerOptionsLoading(true);
    fetchCustomerOptions()
      .then(setCustomerOptions)
      .catch(() => setCustomerOptions([]))
      .finally(() => setCustomerOptionsLoading(false));
  }, [panel, customerOptions]);

  const activeCount = [
    showRating && filters.minRating,
    showSort && filters.sort !== 'newest' ? filters.sort : '',
    showDate && (filters.startDate || filters.endDate),
    showCustomer && filters.customerIds.length > 0,
  ].filter(Boolean).length;

  const ratingLabel = RATING_OPTIONS.find((r) => r.value === filters.minRating)?.label;
  const sortLabel = filters.sort !== 'newest' ? SORT_OPTIONS.find((s) => s.value === filters.sort)?.label : '';
  const dateLabel = formatDateRangeLabel(filters.datePreset, filters.startDate, filters.endDate);

  function selectPreset(preset) {
    if (preset === 'custom') {
      dispatch(setDateRange({ preset: 'custom', startDate: filters.startDate, endDate: filters.endDate }));
      return;
    }
    const range = getPresetRange(preset);
    dispatch(setDateRange({ preset, ...range }));
    setPanel('root');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
      >
        <FilterIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Filters</span>
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 sm:hidden"
          onClick={() => {
            setOpen(false);
            setPanel('root');
          }}
        />
      )}

      {open && (
        <div className="fixed inset-x-4 top-20 z-50 max-h-[70dvh] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[32rem] sm:w-[min(20rem,calc(100vw-2rem))]">
          {panel === 'root' && (
            <>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Filter By</span>
                {activeCount > 0 && (
                  <button
                    onClick={() => dispatch(clearAllFilters())}
                    className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="border-t border-gray-100 py-1">
                {showRating && (
                  <RootRow icon={StarSolidIcon} label="Rating" preview={ratingLabel !== 'All Ratings' ? ratingLabel : ''} onClick={() => setPanel('rating')} />
                )}
                {showSort && <RootRow icon={SortIcon} label="Sort By" preview={sortLabel} onClick={() => setPanel('sort')} />}
                {showDate && <RootRow icon={CalendarIcon} label="Date" preview={dateLabel} onClick={() => setPanel('date')} />}
                {showCustomer && (
                  <RootRow
                    icon={UsersIcon}
                    label="Select Customer"
                    preview={filters.customerIds.length ? `${filters.customerIds.length} selected` : ''}
                    onClick={() => setPanel('customer')}
                  />
                )}
              </div>
            </>
          )}

          {panel === 'rating' && (
            <>
              <PanelHeader
                label="Rating"
                onBack={() => setPanel('root')}
                onReset={filters.minRating ? () => dispatch(setMinRating('')) : null}
              />
              <div className="py-1">
                {RATING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      dispatch(setMinRating(opt.value));
                      setPanel('root');
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Radio selected={filters.minRating === opt.value} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {panel === 'sort' && (
            <>
              <PanelHeader label="Sort By" onBack={() => setPanel('root')} />
              <div className="py-1">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      dispatch(setSort(opt.value));
                      setPanel('root');
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Radio selected={filters.sort === opt.value} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {panel === 'date' && (
            <>
              <PanelHeader
                label="Date"
                onBack={() => setPanel('root')}
                onReset={filters.datePreset || filters.startDate || filters.endDate ? () => dispatch(clearDateRange()) : null}
              />
              <div className="py-1">
                {DATE_PRESETS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => selectPreset(opt.value)}
                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Radio selected={filters.datePreset === opt.value} />
                    {opt.label}
                  </button>
                ))}
              </div>

              {filters.datePreset === 'custom' && (
                <DateRangeCalendar
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  onChange={({ startDate, endDate }) => dispatch(setDateRange({ preset: 'custom', startDate, endDate }))}
                />
              )}
            </>
          )}

          {panel === 'customer' && (
            <>
              <PanelHeader
                label="Select Customer"
                onBack={() => setPanel('root')}
                onReset={filters.customerIds.length ? () => dispatch(clearCustomerIds()) : null}
              />
              <div className="border-b border-gray-100 p-3">
                <input
                  type="text"
                  autoFocus
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="max-h-64 overflow-y-auto py-1">
                {customerOptionsLoading ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">Loading customers...</p>
                ) : !customerOptions?.length ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400">No customers found.</p>
                ) : (
                  customerOptions
                    .filter((c) => {
                      const q = customerSearch.trim().toLowerCase();
                      if (!q) return true;
                      return c.name.toLowerCase().includes(q) || c.mobile1.includes(q);
                    })
                    .map((c) => (
                      <label
                        key={c._id}
                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={filters.customerIds.includes(c._id)}
                          onChange={() => dispatch(toggleCustomerId(c._id))}
                          className="h-4 w-4 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-gray-800">{c.name}</span>
                          <span className="block truncate text-xs text-gray-400">{c.mobile1}</span>
                        </span>
                      </label>
                    ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
