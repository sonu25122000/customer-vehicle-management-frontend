import { useEffect, useRef, useState } from 'react';
import { SearchIcon, ChevronDownIcon } from './icons';

/**
 * A styled dropdown that behaves like a <select> but looks consistent with the rest of the
 * app and supports in-place search — the plain browser <select> can't be restyled and has no
 * search, which becomes unusable once the option list gets long (e.g. 60+ vehicles).
 */
export default function SearchableSelect({
  value,
  onChange,
  options,
  getOptionValue,
  getOptionLabel,
  getOptionSearchText,
  renderOption,
  placeholder = 'Select...',
  loading = false,
  disabled = false,
  error = false,
  emptyMessage = 'No options available.',
  searchPlaceholder = 'Search...',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const selected = (options || []).find((opt) => getOptionValue(opt) === value);

  const filtered = (options || []).filter((opt) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const text = getOptionSearchText ? getOptionSearchText(opt) : getOptionLabel(opt);
    return text.toLowerCase().includes(q);
  });

  function selectOption(opt) {
    onChange(getOptionValue(opt));
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !loading && !disabled && setOpen((o) => !o)}
        disabled={loading || disabled}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2.5 text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70 ${
          error ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
        } ${open ? 'border-blue-600 ring-2 ring-blue-100' : ''}`}
      >
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
          {loading ? 'Loading...' : selected ? getOptionLabel(selected) : placeholder}
        </span>
        <ChevronDownIcon className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="relative border-b border-gray-100 p-2">
            <SearchIcon className="pointer-events-none absolute left-4.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setOpen(false);
                  setQuery('');
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-md border-none bg-gray-50 py-1.5 pl-7 pr-2 text-xs text-gray-900 outline-none focus:bg-gray-100"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-gray-400">
                {options?.length ? 'No matches found.' : emptyMessage}
              </p>
            ) : (
              filtered.map((opt) => {
                const optValue = getOptionValue(opt);
                const isSelected = optValue === value;
                return (
                  <button
                    key={optValue}
                    type="button"
                    onClick={() => selectOption(opt)}
                    className={`flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm transition-colors ${
                      isSelected ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {renderOption ? renderOption(opt) : getOptionLabel(opt)}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
