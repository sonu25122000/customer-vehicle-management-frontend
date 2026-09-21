import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { fetchCustomerOptions } from '../api/customers';
import SearchableSelect from './SearchableSelect';
import { SearchIcon } from './icons';
import { TIME_OPTIONS } from '../utils/timeOptions';

const baseInputClass =
  'rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2';
const validInputClass = 'border-gray-300 focus:border-blue-600 focus:ring-blue-100';
const errorInputClass = 'border-red-400 focus:border-red-500 focus:ring-red-100';
const labelTextClass = 'text-xs font-semibold text-gray-600';
const errorClass = 'text-xs text-red-600';

function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden="true">
      *
    </span>
  );
}

// The date and time are picked separately (a date input + a 30-minute-interval time dropdown, the
// same picker the trip form uses) — the native datetime-local input can't be limited to 30-minute
// steps. This splits an ISO string from the API into the local 'YYYY-MM-DD' / 'HH:mm' pair.
function splitLocal(isoString) {
  if (!isoString) return { date: '', time: '' };
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return { date: '', time: '' };
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function joinLocal(date, time) {
  return date && time ? new Date(`${date}T${time}`) : null;
}

function todayLocal() {
  return splitLocal(new Date().toISOString()).date;
}

const emptyForm = {
  code: '',
  discountType: 'percentage',
  value: '',
  maxDiscount: '',
  applicability: 'all',
  customers: [],
  startDate: '',
  startTime: '',
  expiryDate: '',
  expiryTime: '',
  maxUsage: '',
  isActive: true,
};

export default function CouponFormModal({ mode, initialData, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(() => {
    if (!initialData) return emptyForm;
    const start = splitLocal(initialData.startAt);
    const expiry = splitLocal(initialData.expiresAt);
    return {
      code: initialData.code || '',
      discountType: initialData.discountType || 'percentage',
      value: initialData.value ?? '',
      maxDiscount: initialData.maxDiscount ?? '',
      applicability: initialData.applicability || 'all',
      customers: (initialData.customers || []).map((c) => (typeof c === 'string' ? c : c._id)),
      startDate: start.date,
      startTime: start.time,
      expiryDate: expiry.date,
      expiryTime: expiry.time,
      maxUsage: initialData.maxUsage ?? '',
      isActive: initialData.isActive ?? true,
    };
  });
  const [errors, setErrors] = useState({});
  const [customerOptions, setCustomerOptions] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const isEdit = mode === 'edit';
  const usageCount = isEdit ? initialData?.usageCount || 0 : 0;

  // A coupon saved before the 30-minute rule existed may sit on an odd minute (e.g. 10:17) — keep
  // that value selectable so opening the form doesn't blank it, while every *new* pick is on-grid.
  function timeOptionsWith(current, filterFn) {
    const base = filterFn ? TIME_OPTIONS.filter(filterFn) : TIME_OPTIONS;
    if (!current || TIME_OPTIONS.some((t) => t.value === current)) return base;
    return [{ value: current, label: current }, ...base];
  }
  const startTimeOptions = timeOptionsWith(form.startTime);
  const sameDay = form.startDate && form.expiryDate && form.startDate === form.expiryDate;
  // Same-day expiry has to be strictly after the start time.
  const expiryTimeOptions = timeOptionsWith(form.expiryTime, sameDay && form.startTime ? (t) => t.value > form.startTime : undefined);

  useEffect(() => {
    if (form.applicability !== 'selected' || customerOptions !== null) return;
    fetchCustomerOptions()
      .then(setCustomerOptions)
      .catch(() => {
        toast.error('Failed to load customers');
        setCustomerOptions([]);
      });
  }, [form.applicability, customerOptions]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function toggleCustomer(id) {
    setForm((prev) => ({
      ...prev,
      customers: prev.customers.includes(id) ? prev.customers.filter((c) => c !== id) : [...prev.customers, id],
    }));
    setErrors((prev) => ({ ...prev, customers: undefined }));
  }

  function fieldClass(field) {
    return `${baseInputClass} ${errors[field] ? errorInputClass : validInputClass}`;
  }

  function validate() {
    const next = {};
    if (!form.code.trim()) next.code = 'Coupon code is required';
    if (form.value === '' || Number(form.value) <= 0) next.value = 'Enter a value greater than 0';
    else if (form.discountType === 'percentage' && Number(form.value) > 100) next.value = 'Percentage cannot exceed 100';
    if (form.discountType === 'percentage' && form.maxDiscount !== '' && !(Number(form.maxDiscount) >= 1)) {
      next.maxDiscount = 'Enter an amount of at least ₹1, or leave it blank for no cap';
    }
    if (form.applicability === 'selected' && form.customers.length === 0) next.customers = 'Select at least one customer';
    if (!form.startDate) next.startDate = 'Start date is required';
    if (!form.startTime) next.startTime = 'Start time is required';
    if (!form.expiryDate) next.expiryDate = 'Expiry date is required';
    if (!form.expiryTime) next.expiryTime = 'Expiry time is required';

    const startAt = joinLocal(form.startDate, form.startTime);
    const expiresAt = joinLocal(form.expiryDate, form.expiryTime);
    if (startAt && expiresAt) {
      if (expiresAt <= startAt) {
        next[form.expiryDate === form.startDate ? 'expiryTime' : 'expiryDate'] = 'Expiry must be after the start date/time';
      } else {
        // A new or changed expiry has to be in the future (an already-expired coupon can still be
        // re-saved untouched) — same rule the backend applies.
        const original = isEdit ? new Date(initialData.expiresAt).getTime() : null;
        if (expiresAt.getTime() !== original && expiresAt <= new Date()) next.expiryDate = 'Expiry must be in the future';
      }
    }

    if (form.maxUsage === '') next.maxUsage = 'Maximum usage is required';
    else if (!Number.isInteger(Number(form.maxUsage)) || Number(form.maxUsage) < 1) next.maxUsage = 'Enter a whole number of at least 1';
    else if (isEdit && Number(form.maxUsage) < usageCount) next.maxUsage = `Cannot be less than the times already used (${usageCount})`;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      value: Number(form.value),
      // Cap on the rupee discount — percentage coupons only (e.g. 20% up to ₹100); blank = no cap.
      maxDiscount: form.discountType === 'percentage' && form.maxDiscount !== '' ? Number(form.maxDiscount) : null,
      applicability: form.applicability,
      customers: form.applicability === 'selected' ? form.customers : [],
      startAt: joinLocal(form.startDate, form.startTime).toISOString(),
      expiresAt: joinLocal(form.expiryDate, form.expiryTime).toISOString(),
      maxUsage: Number(form.maxUsage),
      isActive: form.isActive,
    });
  }

  const filteredCustomers = (customerOptions || []).filter((c) => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.mobile1?.includes(q);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Update Coupon' : 'Create Coupon'}</h2>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Coupon Code <RequiredMark />
              </span>
              <input
                className={fieldClass('code')}
                value={form.code}
                onChange={(e) => update('code', e.target.value.toUpperCase())}
                placeholder="e.g. FESTIVE20"
                aria-invalid={Boolean(errors.code)}
              />
              {errors.code && <span className={errorClass}>{errors.code}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Value <RequiredMark />
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={form.discountType === 'percentage' ? 100 : undefined}
                  className={`${fieldClass('value')} w-full pr-8`}
                  value={form.value}
                  onChange={(e) => update('value', e.target.value)}
                  placeholder={form.discountType === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                  aria-invalid={Boolean(errors.value)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                  {form.discountType === 'percentage' ? '%' : '₹'}
                </span>
              </div>
              {errors.value && <span className={errorClass}>{errors.value}</span>}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Discount Type <RequiredMark />
              </span>
              <div className="flex gap-2">
                {[
                  { value: 'percentage', label: 'Percentage' },
                  { value: 'flat', label: 'Flat Amount' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('discountType', t.value)}
                    className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      form.discountType === t.value ? 'border-blue-400 bg-blue-100 text-blue-800' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Applicable To <RequiredMark />
              </span>
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All Customers' },
                  { value: 'selected', label: 'Selected Customers' },
                ].map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('applicability', t.value)}
                    className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      form.applicability === t.value ? 'border-blue-400 bg-blue-100 text-blue-800' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {form.discountType === 'percentage' && (
            <label className="flex flex-col gap-1.5 sm:max-w-[calc(50%-0.5rem)]">
              <span className={labelTextClass}>
                Maximum Discount (₹) <span className="font-normal text-gray-400">(optional)</span>
              </span>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  className={`${fieldClass('maxDiscount')} w-full pr-8`}
                  value={form.maxDiscount}
                  onChange={(e) => update('maxDiscount', e.target.value)}
                  placeholder="e.g. 100"
                  aria-invalid={Boolean(errors.maxDiscount)}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">₹</span>
              </div>
              {errors.maxDiscount ? (
                <span className={errorClass}>{errors.maxDiscount}</span>
              ) : (
                <span className="text-xs text-gray-400">
                  {form.value && form.maxDiscount
                    ? `${form.value}% off, up to ₹${Number(form.maxDiscount).toLocaleString()} per trip`
                    : 'Caps the discount, e.g. 20% off up to ₹100. Leave blank for no cap.'}
                </span>
              )}
            </label>
          )}

          {form.applicability === 'selected' && (
            <div className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Select Customers <RequiredMark /> {form.customers.length > 0 && `(${form.customers.length} selected)`}
              </span>
              <div className={`rounded-lg border ${errors.customers ? 'border-red-400' : 'border-gray-300'}`}>
                <div className="relative border-b border-gray-100 p-2">
                  <SearchIcon className="pointer-events-none absolute left-4.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customers..."
                    className="w-full rounded-md border-none bg-gray-50 py-1.5 pl-7 pr-2 text-xs text-gray-900 outline-none focus:bg-gray-100"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {customerOptions === null ? (
                    <p className="px-4 py-6 text-center text-xs text-gray-400">Loading customers...</p>
                  ) : filteredCustomers.length === 0 ? (
                    <p className="px-4 py-6 text-center text-xs text-gray-400">No customers found.</p>
                  ) : (
                    filteredCustomers.map((c) => (
                      <label key={c._id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={form.customers.includes(c._id)}
                          onChange={() => toggleCustomer(c._id)}
                          className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                          {c.name} <span className="text-xs text-gray-400">({c.mobile1})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
              {errors.customers && <span className={errorClass}>{errors.customers}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Start Date <RequiredMark />
              </span>
              <input
                type="date"
                className={fieldClass('startDate')}
                value={form.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                aria-invalid={Boolean(errors.startDate)}
              />
              {errors.startDate && <span className={errorClass}>{errors.startDate}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Start Time <RequiredMark />
              </span>
              <SearchableSelect
                value={form.startTime}
                onChange={(v) => update('startTime', v)}
                options={startTimeOptions}
                error={Boolean(errors.startTime)}
                placeholder="Select start time"
                searchPlaceholder="Search time..."
                getOptionValue={(t) => t.value}
                getOptionLabel={(t) => t.label}
              />
              {errors.startTime ? (
                <span className={errorClass}>{errors.startTime}</span>
              ) : (
                <span className="text-xs text-gray-400">30-minute intervals</span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Expiry Date <RequiredMark />
              </span>
              <input
                type="date"
                min={form.startDate || todayLocal()}
                className={fieldClass('expiryDate')}
                value={form.expiryDate}
                onChange={(e) => update('expiryDate', e.target.value)}
                aria-invalid={Boolean(errors.expiryDate)}
              />
              {errors.expiryDate && <span className={errorClass}>{errors.expiryDate}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Expiry Time <RequiredMark />
              </span>
              <SearchableSelect
                value={form.expiryTime}
                onChange={(v) => update('expiryTime', v)}
                options={expiryTimeOptions}
                error={Boolean(errors.expiryTime)}
                placeholder="Select expiry time"
                searchPlaceholder="Search time..."
                getOptionValue={(t) => t.value}
                getOptionLabel={(t) => t.label}
              />
              {errors.expiryTime ? (
                <span className={errorClass}>{errors.expiryTime}</span>
              ) : (
                <span className="text-xs text-gray-400">30-minute intervals, after the start</span>
              )}
            </label>
          </div>

          <label className="flex flex-col gap-1.5 sm:max-w-[calc(50%-0.5rem)]">
            <span className={labelTextClass}>
              Maximum Usage <RequiredMark />
            </span>
            <input
              type="number"
              min={Math.max(usageCount, 1)}
              step="1"
              className={fieldClass('maxUsage')}
              value={form.maxUsage}
              onChange={(e) => update('maxUsage', e.target.value)}
              placeholder="e.g. 50"
              aria-invalid={Boolean(errors.maxUsage)}
            />
            {errors.maxUsage ? (
              <span className={errorClass}>{errors.maxUsage}</span>
            ) : (
              <span className="text-xs text-gray-400">
                {isEdit ? `Used ${usageCount} time${usageCount === 1 ? '' : 's'} so far. ` : ''}
                Total number of times this coupon can be applied to trips.
              </span>
            )}
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Active
          </label>

          <p className="-mt-1 text-xs text-gray-400">
            <RequiredMark /> Required fields
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : isEdit ? 'Update Coupon' : 'Save Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
