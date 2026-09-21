import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import StarRating from './StarRating';
import SearchableSelect from './SearchableSelect';
import CustomerFormModal from './CustomerFormModal';
import { PlusCircleIcon } from './icons';
import { fetchCustomerOptions, fetchCustomer, createCustomer } from '../api/customers';
import { fetchVehicleOptions } from '../api/vehicles';
import { fetchApplicableCoupons } from '../api/coupons';
import { TIME_OPTIONS } from '../utils/timeOptions';

const STATUS_OPTIONS = [
  { value: 'Yet to Start', activeClass: 'bg-blue-100 border-blue-400 text-blue-800' },
  { value: 'On Trip', activeClass: 'bg-amber-100 border-amber-400 text-amber-800' },
  { value: 'Completed', activeClass: 'bg-emerald-100 border-emerald-400 text-emerald-800' },
  { value: 'Cancelled', activeClass: 'bg-red-100 border-red-400 text-red-800' },
];

// Mirrors backend/src/controllers/tripController.js ALLOWED_STATUS_TRANSITIONS — a trip's
// status only ever moves forward along one of these paths; Completed/Cancelled are terminal.
// Once a trip is On Trip it can no longer be cancelled — only Completed.
const ALLOWED_NEXT_STATUSES = {
  'Yet to Start': ['Yet to Start', 'On Trip', 'Cancelled'],
  'On Trip': ['On Trip', 'Completed'],
  Completed: ['Completed'],
  Cancelled: ['Cancelled'],
};

const emptyForm = {
  customer: '',
  vehicle: '',
  coupon: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  amount: '',
  tollCharges: '',
  advance: '',
  securityDeposit: '',
  startOdometer: '',
  endOdometer: '',
  status: 'Yet to Start',
  rating: 0,
  refundAmount: '',
};

const baseInputClass =
  'rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:opacity-70';
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

function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

// Mirrors backend/src/utils/couponRules.js calculateDiscount — a percentage of the amount or a flat
// amount, never more than the amount itself. The backend recomputes it; this is only the preview.
function couponDiscount(coupon, amount) {
  const gross = Number(amount) || 0;
  if (!coupon || gross <= 0) return 0;
  let raw = coupon.discountType === 'percentage' ? (gross * coupon.value) / 100 : coupon.value;
  if (coupon.discountType === 'percentage' && coupon.maxDiscount) raw = Math.min(raw, coupon.maxDiscount);
  return Math.round(Math.min(Math.max(raw, 0), gross) * 100) / 100;
}

export default function TripFormModal({ mode, initialData, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          customer: initialData.customer?._id || initialData.customer || '',
          vehicle: initialData.vehicle?._id || initialData.vehicle || '',
          coupon: '',
          startDate: toDateInputValue(initialData.startDate),
          startTime: initialData.startTime || '',
          endDate: toDateInputValue(initialData.endDate),
          endTime: initialData.endTime || '',
          amount: initialData.amount ?? '',
          tollCharges: initialData.tollCharges ?? '',
          advance: initialData.advance ?? '',
          securityDeposit: initialData.securityDeposit ?? '',
          startOdometer: initialData.startOdometer ?? '',
          endOdometer: initialData.endOdometer ?? '',
          status: initialData.status || 'Yet to Start',
          rating: initialData.rating || 0,
          refundAmount: '',
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  const [customerOptions, setCustomerOptions] = useState(null);
  const [vehicleOptions, setVehicleOptions] = useState(null);
  const [couponOptions, setCouponOptions] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const isEdit = mode === 'edit';
  // The trip's status as it stood when this modal opened — never changes during editing, unlike
  // form.status which tracks what the user is currently choosing.
  const existingStatus = isEdit ? initialData?.status || 'Yet to Start' : 'Yet to Start';
  const isCancelledTrip = isEdit && existingStatus === 'Cancelled';
  // Customer is never editable once a trip exists — only settable when creating it.
  const customerLocked = isEdit;
  // Vehicle/start date+time are locked once a trip is past "Yet to Start" — reschedule
  // (from the trip table) is the only way to change start date/time from then on.
  const coreLocked = isEdit && existingStatus !== 'Yet to Start';
  // Once Completed, end date/time are frozen — amount fields, odometer readings and rating
  // remain editable (e.g. correcting the final odometer reading once the vehicle is back).
  const endFieldsLocked = isEdit && existingStatus === 'Completed';
  // The user is choosing to cancel this trip right now — only refund amount matters; every
  // other field's value is disabled here for clarity (the backend ignores them either way).
  const isCancelling = form.status === 'Cancelled' && existingStatus !== 'Cancelled';
  const ratingEnabled = form.status === 'Completed';
  // Refund can never exceed the advance actually paid — see backend/src/controllers/tripController.js.
  const maxRefund = Math.min(Number(form.advance || 0), Number(form.amount || 0));
  // A coupon can be picked when the trip is created, or later while editing as long as the trip
  // doesn't have one yet (see backend createTrip/updateTrip); once applied it's shown read-only. The amount typed in is the gross — the backend stores it net of the discount.
  const couponSelectable = !(isEdit && (initialData?.couponCode || existingStatus === 'Cancelled'));
  const showCoupon = couponSelectable && !isCancelling;
  const selectedCoupon = showCoupon ? couponOptions.find((c) => c._id === form.coupon) : null;
  const discount = couponDiscount(selectedCoupon, form.amount);
  const payableAmount = Math.max(Number(form.amount || 0) - discount, 0);

  const availableStatuses = isEdit
    ? STATUS_OPTIONS.filter((s) => (ALLOWED_NEXT_STATUSES[existingStatus] || []).includes(s.value))
    : STATUS_OPTIONS.filter((s) => s.value === 'Yet to Start');

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  // A trip can't move to "On Trip" until the customer's profile is Accepted — which itself only
  // happens once selfie, driving licence and Aadhaar are on file. See backend's matching check
  // in tripController.updateTrip.
  const customerProfileAccepted = selectedCustomer?.profileVerified === 'Accepted';

  useEffect(() => {
    fetchCustomerOptions()
      .then(setCustomerOptions)
      .catch(() => {
        toast.error('Failed to load customers');
        setCustomerOptions([]);
      });
    fetchVehicleOptions({ activeOnly: true })
      .then(setVehicleOptions)
      .catch(() => {
        toast.error('Failed to load vehicles');
        setVehicleOptions([]);
      });
  }, []);

  useEffect(() => {
    if (!form.customer) {
      setSelectedCustomer(null);
      return undefined;
    }
    let cancelled = false;
    fetchCustomer(form.customer)
      .then((c) => {
        if (!cancelled) setSelectedCustomer(c);
      })
      .catch(() => {
        if (!cancelled) setSelectedCustomer({});
      });
    return () => {
      cancelled = true;
    };
  }, [form.customer]);

  // Coupons offered for the chosen customer — only ones usable right now (active, in their window,
  // not used up) that are open to all customers or list this customer. Re-fetched whenever the
  // customer changes, and any previously picked coupon is dropped since it may not apply anymore.
  useEffect(() => {
    if (!couponSelectable) return undefined;
    setForm((prev) => (prev.coupon ? { ...prev, coupon: '' } : prev));
    if (!form.customer) {
      setCouponOptions([]);
      return undefined;
    }
    let cancelled = false;
    setCouponsLoading(true);
    fetchApplicableCoupons(form.customer)
      .then((list) => {
        if (!cancelled) setCouponOptions(list);
      })
      .catch(() => {
        if (!cancelled) {
          setCouponOptions([]);
          toast.error('Failed to load coupons');
        }
      })
      .finally(() => {
        if (!cancelled) setCouponsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.customer, couponSelectable]);

  // If this trip already references a customer/vehicle that isn't in the (active-only)
  // options list — e.g. a soft-deleted customer, or a vehicle that's non-Active/currently on
  // this very trip and so excluded by the activeOnly filter — it still needs to show up as
  // selected. Derived on every render instead of patched in via an effect, so there's no
  // race between the fetch resolving and the "is it already there" check running.
  const customerSelectOptions = (() => {
    if (!customerOptions) return null;
    const id = initialData?.customer?._id || initialData?.customer;
    if (id && initialData?.customer?.name && !customerOptions.some((c) => c._id === id)) {
      return [initialData.customer, ...customerOptions];
    }
    return customerOptions;
  })();

  const vehicleSelectOptions = (() => {
    if (!vehicleOptions) return null;
    const id = initialData?.vehicle?._id || initialData?.vehicle;
    if (id && initialData?.vehicle?.vehicleNo && !vehicleOptions.some((v) => v._id === id)) {
      return [initialData.vehicle, ...vehicleOptions];
    }
    return vehicleOptions;
  })();

  function fieldClass(field) {
    return `${baseInputClass} ${errors[field] ? errorInputClass : validInputClass}`;
  }

  function updateStatus(value) {
    // Rating only ever applies once Completed — clear a tentatively-picked rating if the
    // status is changed away from Completed, so it doesn't linger looking "set" while disabled.
    setForm((prev) => ({ ...prev, status: value, rating: value === 'Completed' ? prev.rating : 0 }));
    setErrors((prev) => ({ ...prev, status: undefined }));
  }

  function update(field, value) {
    const next = { ...form, [field]: value };
    // Moving the start (or end date) so that a previously chosen end time now falls before the
    // start time on the same day would leave an invalid value hidden by the filtered dropdown —
    // clear it and say why, so it has to be picked again.
    const endTimeInvalidated =
      ['startDate', 'startTime', 'endDate'].includes(field) &&
      next.endTime &&
      next.startTime &&
      next.startDate &&
      next.endDate === next.startDate &&
      next.endTime < next.startTime;
    if (endTimeInvalidated) next.endTime = '';
    setForm(next);
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      ...(endTimeInvalidated ? { endTime: "End time can't be before the start time — pick it again" } : {}),
    }));
  }

  function updateNumber(field, value) {
    update(field, value.replace(/[^0-9.]/g, ''));
  }

  function validate() {
    const next = {};
    if (!form.customer) next.customer = 'Customer is required';
    if (!form.vehicle) next.vehicle = 'Vehicle is required';
    if (!form.startDate) next.startDate = 'Start date is required';
    if (!form.startTime) next.startTime = 'Start time is required';

    if (!form.endDate) next.endDate = 'End date is required';
    if (form.status === 'Completed' && !form.endTime) next.endTime = 'End time is required to mark a trip Completed';

    if (!next.endDate && form.startDate && form.endDate) {
      if (form.endDate < form.startDate) {
        next.endDate = 'End date cannot be before start date';
      } else if (form.endDate === form.startDate && form.startTime && form.endTime && form.endTime < form.startTime) {
        next.endTime = 'End time cannot be before start time on the same day';
      }
    }

    if (form.amount === '') next.amount = 'Amount is required';
    else if (Number(form.amount) < 0) next.amount = 'Amount cannot be negative';
    if (form.tollCharges !== '' && Number(form.tollCharges) < 0) next.tollCharges = 'Toll charges cannot be negative';
    if (form.advance !== '' && Number(form.advance) < 0) next.advance = 'Advance cannot be negative';
    if (form.securityDeposit !== '' && Number(form.securityDeposit) < 0)
      next.securityDeposit = 'Security deposit cannot be negative';
    if (!next.advance && form.advance !== '' && form.amount !== '' && Number(form.advance) > payableAmount) {
      next.advance = discount > 0 ? 'Advance cannot be greater than the amount payable after the coupon' : 'Advance cannot be greater than the trip amount';
    }
    if (
      form.startOdometer !== '' &&
      form.endOdometer !== '' &&
      Number(form.endOdometer) < Number(form.startOdometer)
    ) {
      next.endOdometer = 'Ending reading cannot be less than starting reading';
    }

    if (isCancelling) {
      const refund = form.refundAmount === '' ? 0 : Number(form.refundAmount);
      if (refund < 0) next.refundAmount = 'Refund amount cannot be negative';
      else if (refund > maxRefund) next.refundAmount = 'Refund cannot exceed the advance paid';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      customer: form.customer,
      vehicle: form.vehicle,
      coupon: showCoupon && form.coupon ? form.coupon : undefined,
      startDate: form.startDate,
      startTime: form.startTime,
      endDate: form.endDate || undefined,
      endTime: form.endTime || '',
      amount: form.amount === '' ? 0 : Number(form.amount),
      tollCharges: form.tollCharges === '' ? 0 : Number(form.tollCharges),
      advance: form.advance === '' ? 0 : Number(form.advance),
      securityDeposit: form.securityDeposit === '' ? 0 : Number(form.securityDeposit),
      startOdometer: form.startOdometer === '' ? undefined : Number(form.startOdometer),
      endOdometer: form.endOdometer === '' ? undefined : Number(form.endOdometer),
      status: form.status,
      rating: form.rating || undefined,
      refundAmount: form.refundAmount === '' ? 0 : Number(form.refundAmount),
    });
  }

  async function handleCreateCustomer(payload) {
    setCreatingCustomer(true);
    try {
      const res = await createCustomer(payload);
      toast.success('Customer created successfully');
      setCustomerOptions((prev) => [res.data, ...(prev || [])]);
      update('customer', res.data._id);
      setShowCreateCustomer(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  }

  if (isCancelledTrip) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-bold text-gray-900">Trip Cancelled</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col gap-2 p-6">
            <p className="text-sm text-gray-700">
              This trip was cancelled{initialData?.refundAmount ? ` with a refund of ₹${Number(initialData.refundAmount).toLocaleString()}` : ''}.
              Cancelled trips cannot be edited any further.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 cursor-pointer self-end rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Update Trip' : 'Create Trip'}</h2>
            {isEdit && initialData?.tripId && (
              <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-slate-700">
                {initialData.tripId}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-6">
          {isEdit && !isCancelling && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-100">
              {coreLocked ? (
                <>
                  This trip is <strong>{existingStatus}</strong> — customer, vehicle and start date/time can no
                  longer be changed here. Use <strong>Reschedule</strong> from the trip list to change the start
                  date/time.
                  {endFieldsLocked && ' Only amount-related fields, odometer readings and rating remain editable.'}
                </>
              ) : (
                'The customer on a trip can only be set at creation and cannot be changed here.'
              )}
            </p>
          )}
          {isCancelling && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 ring-1 ring-red-100">
              Cancelling this trip will zero out the amount due and leave every other field unchanged. Enter a refund
              amount below if applicable.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={labelTextClass}>
                Customer <RequiredMark />
              </span>
              <div className="flex gap-2">
                <div className="min-w-0 flex-1">
                  <SearchableSelect
                    value={form.customer}
                    onChange={(id) => update('customer', id)}
                    options={customerSelectOptions}
                    loading={customerSelectOptions === null}
                    disabled={customerLocked}
                    error={Boolean(errors.customer)}
                    placeholder="Search by name or mobile"
                    searchPlaceholder="Search by name or mobile..."
                    emptyMessage="No customers yet — create one below."
                    getOptionValue={(c) => c._id}
                    getOptionLabel={(c) => `${c.name} — ${c.mobile1}`}
                    getOptionSearchText={(c) => `${c.name} ${c.mobile1} ${c.mobile2 || ''}`}
                    renderOption={(c) => (
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm text-gray-800">{c.name}</span>
                        <span className="truncate text-[0.7rem] text-gray-400">{c.mobile1}</span>
                      </span>
                    )}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateCustomer(true)}
                  disabled={customerLocked}
                  title="Create new customer"
                  className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 text-xs font-semibold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlusCircleIcon className="h-4 w-4" /> New
                </button>
              </div>
              {errors.customer && <span className={errorClass}>{errors.customer}</span>}
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={labelTextClass}>
                Vehicle <RequiredMark />
              </span>
              <SearchableSelect
                value={form.vehicle}
                onChange={(id) => update('vehicle', id)}
                options={vehicleSelectOptions}
                loading={vehicleSelectOptions === null}
                disabled={coreLocked}
                error={Boolean(errors.vehicle)}
                placeholder="Select a vehicle"
                searchPlaceholder="Search by number, make, model or owner..."
                emptyMessage="No vehicles yet — create one in Vehicle Management first."
                getOptionValue={(v) => v._id}
                getOptionLabel={(v) => `${v.vehicleNo}${v.make ? ` — ${v.make}${v.model ? ' ' + v.model : ''}` : ''}`}
                getOptionSearchText={(v) => `${v.vehicleNo} ${v.make || ''} ${v.model || ''} ${v.ownerName || ''}`}
                renderOption={(v) => (
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold tracking-wide text-indigo-700">
                        {v.vehicleNo}
                      </span>
                      {(v.make || v.model) && (
                        <span className="truncate text-xs text-gray-500">
                          {v.make} {v.model}
                        </span>
                      )}
                    </span>
                    {v.ownerName && <span className="truncate text-[0.7rem] text-gray-400">{v.ownerName}</span>}
                  </span>
                )}
              />
              {errors.vehicle && <span className={errorClass}>{errors.vehicle}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Start Date <RequiredMark />
              </span>
              <input
                type="date"
                disabled={coreLocked}
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
                options={TIME_OPTIONS}
                disabled={coreLocked}
                error={Boolean(errors.startTime)}
                placeholder="Select start time"
                searchPlaceholder="Search time..."
                getOptionValue={(t) => t.value}
                getOptionLabel={(t) => t.label}
              />
              {errors.startTime && <span className={errorClass}>{errors.startTime}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                End Date <RequiredMark />
              </span>
              <input
                type="date"
                min={form.startDate || undefined}
                disabled={endFieldsLocked || isCancelling}
                className={fieldClass('endDate')}
                value={form.endDate}
                onChange={(e) => update('endDate', e.target.value)}
                aria-invalid={Boolean(errors.endDate)}
              />
              {errors.endDate && <span className={errorClass}>{errors.endDate}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                End Time {form.status === 'Completed' && <RequiredMark />}
              </span>
              <SearchableSelect
                value={form.endTime}
                onChange={(v) => update('endTime', v)}
                options={
                  form.endDate && form.endDate === form.startDate && form.startTime
                    ? TIME_OPTIONS.filter((t) => t.value >= form.startTime)
                    : TIME_OPTIONS
                }
                disabled={endFieldsLocked || isCancelling}
                error={Boolean(errors.endTime)}
                placeholder="Select end time"
                searchPlaceholder="Search time..."
                getOptionValue={(t) => t.value}
                getOptionLabel={(t) => t.label}
              />
              {errors.endTime && <span className={errorClass}>{errors.endTime}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Amount (₹) <RequiredMark />
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={isCancelling}
                className={fieldClass('amount')}
                value={form.amount}
                onChange={(e) => update('amount', e.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errors.amount)}
              />
              {errors.amount && <span className={errorClass}>{errors.amount}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Toll Charges (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={isCancelling}
                className={fieldClass('tollCharges')}
                value={form.tollCharges}
                onChange={(e) => update('tollCharges', e.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errors.tollCharges)}
              />
              {errors.tollCharges && <span className={errorClass}>{errors.tollCharges}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Advance (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={isCancelling}
                className={fieldClass('advance')}
                value={form.advance}
                onChange={(e) => update('advance', e.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errors.advance)}
              />
              {errors.advance && <span className={errorClass}>{errors.advance}</span>}
              {!errors.advance && form.amount !== '' && form.advance !== '' && (
                <span className="text-xs text-gray-400">
                  Balance due: ₹{Math.max(payableAmount - Number(form.advance), 0).toLocaleString()}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Security Deposit (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                disabled={isCancelling}
                className={fieldClass('securityDeposit')}
                value={form.securityDeposit}
                onChange={(e) => update('securityDeposit', e.target.value)}
                placeholder="0.00"
                aria-invalid={Boolean(errors.securityDeposit)}
              />
              {errors.securityDeposit && <span className={errorClass}>{errors.securityDeposit}</span>}
            </label>

            {showCoupon && (
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className={labelTextClass}>Coupon</span>
                <SearchableSelect
                  value={form.coupon}
                  onChange={(id) => update('coupon', id)}
                  options={[{ _id: '', code: 'No coupon' }, ...couponOptions]}
                  loading={couponsLoading}
                  disabled={!form.customer}
                  placeholder={form.customer ? 'No coupon' : 'Select a customer first'}
                  searchPlaceholder="Search coupon code..."
                  emptyMessage="No coupons available for this customer."
                  getOptionValue={(c) => c._id}
                  getOptionLabel={(c) => c.code}
                  renderOption={(c) =>
                    c._id === '' ? (
                      <span className="text-sm text-gray-500">No coupon</span>
                    ) : (
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold tracking-wide text-indigo-700">{c.code}</span>
                          <span className="truncate text-[0.7rem] text-gray-400">
                            {c.discountType === 'percentage'
                              ? `${c.value}% off${c.maxDiscount ? ` (max ₹${Number(c.maxDiscount).toLocaleString()})` : ''}`
                              : `₹${c.value} off`}
                            {c.maxUsage ? ` · ${c.maxUsage - (c.usageCount || 0)} use${c.maxUsage - (c.usageCount || 0) === 1 ? '' : 's'} left` : ''}
                          </span>
                        </span>
                        <span
                          className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${
                            c.applicability === 'all' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                          }`}
                        >
                          {c.applicability === 'all' ? 'All customers' : 'This customer'}
                        </span>
                      </span>
                    )
                  }
                />
                {form.customer && !couponsLoading && couponOptions.length === 0 && (
                  <span className="text-xs text-gray-400">No coupons are currently applicable to this customer.</span>
                )}
                {selectedCoupon && (
                  <span className="text-xs text-emerald-700">
                    {selectedCoupon.code} takes off ₹{discount.toLocaleString()} — payable amount ₹{payableAmount.toLocaleString()}
                    {form.amount === '' && ' (enter the amount to see the discount)'}
                    {isEdit && form.amount !== '' && ' — the amount above is reduced by the coupon when you save'}
                  </span>
                )}
              </div>
            )}

            {isEdit && initialData?.couponCode && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 ring-1 ring-emerald-100 sm:col-span-2">
                Coupon <strong>{initialData.couponCode}</strong> was applied when this trip was created (−₹
                {Number(initialData.couponDiscount || 0).toLocaleString()}). The amount shown is already after the
                discount, and the coupon can't be changed.
              </p>
            )}

            {isCancelling && (
              <label className="flex flex-col gap-1.5">
                <span className={labelTextClass}>Refund Amount (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max={maxRefund || undefined}
                  className={fieldClass('refundAmount')}
                  value={form.refundAmount}
                  onChange={(e) => update('refundAmount', e.target.value)}
                  placeholder="0.00"
                  aria-invalid={Boolean(errors.refundAmount)}
                />
                {errors.refundAmount ? (
                  <span className={errorClass}>{errors.refundAmount}</span>
                ) : (
                  <span className="text-xs text-gray-400">Cannot exceed the advance paid (₹{maxRefund.toLocaleString()})</span>
                )}
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Starting Odometer Reading</span>
              <input
                inputMode="decimal"
                disabled={isCancelling}
                className={fieldClass('startOdometer')}
                value={form.startOdometer}
                onChange={(e) => updateNumber('startOdometer', e.target.value)}
                placeholder="e.g. 42500"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Ending Odometer Reading</span>
              <input
                inputMode="decimal"
                disabled={isCancelling}
                className={fieldClass('endOdometer')}
                value={form.endOdometer}
                onChange={(e) => updateNumber('endOdometer', e.target.value)}
                placeholder="e.g. 42850"
                aria-invalid={Boolean(errors.endOdometer)}
              />
              {errors.endOdometer && <span className={errorClass}>{errors.endOdometer}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Trip Rating {!ratingEnabled && <span className="font-normal text-gray-400">(only once Completed)</span>}
              </span>
              <StarRating value={form.rating} onChange={(v) => update('rating', v)} readOnly={!ratingEnabled} />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Trip Status</span>
            <div className="flex flex-wrap gap-2">
              {availableStatuses.map((s) => {
                // Starting a trip (moving into "On Trip") needs the customer's profile to be
                // Accepted first — see backend's matching check in tripController.updateTrip.
                const lockedForProfile = s.value === 'On Trip' && existingStatus !== 'On Trip' && !customerProfileAccepted;
                const disabled = availableStatuses.length === 1 || (form.status !== s.value && lockedForProfile);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => !disabled && updateStatus(s.value)}
                    disabled={disabled}
                    title={lockedForProfile ? "This customer's profile must be Accepted before starting this trip" : undefined}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } ${form.status === s.value ? s.activeClass : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    {s.value}
                  </button>
                );
              })}
            </div>
            {!isEdit && <p className="text-xs text-gray-400">New trips always start as "Yet to Start".</p>}
            {availableStatuses.some((s) => s.value === 'On Trip') && !customerProfileAccepted && (
              <p className="text-xs text-gray-400">
                Select a customer whose profile is Accepted (selfie, driving licence and Aadhaar uploaded) to start
                this trip.
              </p>
            )}
          </div>

          <p className="-mt-1 text-xs text-gray-400">
            <RequiredMark /> Required fields. Booked Date is set automatically to today.
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
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                isCancelling ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Saving...' : isCancelling ? 'Cancel Trip' : isEdit ? 'Update Trip' : 'Save Trip'}
            </button>
          </div>
        </form>
      </div>

      {showCreateCustomer && (
        <CustomerFormModal
          mode="create"
          initialData={null}
          onClose={() => setShowCreateCustomer(false)}
          onSubmit={handleCreateCustomer}
          submitting={creatingCustomer}
        />
      )}
    </div>
  );
}
