import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SearchableSelect from './SearchableSelect';
import { fetchVehicleCatalog } from '../api/vehicleCatalog';

const TRANSMISSIONS = ['Manual', 'Automatic'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const VEHICLE_STATUSES = ['Active', 'On Hold', 'Inactive'];
const VEHICLE_NO_RE = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;

const CURRENT_YEAR = new Date().getFullYear();

const emptyForm = {
  vehicleNo: '',
  vehicleType: '',
  vehicleCategory: '',
  transmission: '',
  fuel: '',
  status: 'On Hold',
  make: '',
  model: '',
  year: '',
  ownerName: '',
  ownerMobile: '',
};

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

export default function VehicleFormModal({ mode, initialData, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          vehicleNo: initialData.vehicleNo || '',
          vehicleType: initialData.vehicleType || '',
          vehicleCategory: initialData.vehicleCategory || '',
          transmission: initialData.transmission || '',
          fuel: initialData.fuel || '',
          status: initialData.status || 'On Hold',
          make: initialData.make || '',
          model: initialData.model || '',
          year: initialData.year ?? '',
          ownerName: initialData.ownerName || '',
          ownerMobile: initialData.ownerMobile || '',
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});
  // Single nested tree from the DB: { vehicleTypes: [{ name, categories, makes: [{ name, models }] }] }
  const [catalog, setCatalog] = useState(null);

  useEffect(() => {
    fetchVehicleCatalog()
      .then(setCatalog)
      .catch(() => {
        toast.error('Failed to load vehicle types/categories/makes/models');
        setCatalog({ vehicleTypes: [] });
      });
  }, []);

  const vehicleTypeOptions = catalog ? catalog.vehicleTypes.map((t) => t.name) : [];
  const selectedVehicleType = catalog?.vehicleTypes.find((t) => t.name === form.vehicleType);
  const categoryOptions = selectedVehicleType?.categories || [];
  const makeOptions = selectedVehicleType?.makes.map((m) => m.name) || [];
  const modelOptions = selectedVehicleType?.makes.find((m) => m.name === form.make)?.models || [];

  const isEdit = mode === 'edit';
  // Active can't be selected until all 4 photo sides are on file — initialData only carries
  // photoSlots when the caller fetched the vehicle record (see VehiclesPage's openEdit).
  const photoSlots = initialData?.photoSlots || [];
  const hasAllPhotoSides = ['front', 'back', 'passengerSide', 'driverSide'].every((slot) => photoSlots.includes(slot));

  function fieldClass(field) {
    return `${baseInputClass} ${errors[field] ? errorInputClass : validInputClass}`;
  }

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Category and Make options both depend on Type — a category/make chosen for the
      // previous type is no longer valid, so both are cleared whenever Type changes.
      ...(field === 'vehicleType' ? { vehicleCategory: '', make: '' } : {}),
      // Model options depend on Make — clear it whenever Make changes.
      ...(field === 'vehicleType' || field === 'make' ? { model: '' } : {}),
    }));
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
      ...(field === 'vehicleType' ? { vehicleCategory: undefined, make: undefined } : {}),
      ...(field === 'vehicleType' || field === 'make' ? { model: undefined } : {}),
    }));
  }

  function updateMobile(value) {
    update('ownerMobile', value.replace(/[^0-9]/g, '').slice(0, 10));
  }

  function validate() {
    const next = {};
    if (!form.vehicleNo.trim()) next.vehicleNo = 'Vehicle number is required';
    else if (!VEHICLE_NO_RE.test(form.vehicleNo.trim())) next.vehicleNo = 'Enter a valid vehicle number (e.g. KA01AB1234)';
    if (!form.vehicleType.trim()) next.vehicleType = 'Vehicle type is required';
    if (!form.vehicleCategory.trim()) next.vehicleCategory = 'Vehicle category is required';
    if (!form.transmission.trim()) next.transmission = 'Transmission is required';
    if (!form.fuel.trim()) next.fuel = 'Fuel type is required';
    if (!form.make.trim()) next.make = 'Make is required';
    if (!form.model.trim()) next.model = 'Model is required';
    if (!String(form.year).trim()) next.year = 'Year is required';
    else if (!/^\d{4}$/.test(String(form.year)) || Number(form.year) < 1990 || Number(form.year) > CURRENT_YEAR + 1)
      next.year = `Enter a year between 1990 and ${CURRENT_YEAR + 1}`;
    if (!form.ownerName.trim()) next.ownerName = 'Owner/Host name is required';
    if (!form.ownerMobile.trim()) next.ownerMobile = 'Owner mobile is required';
    else if (!/^[0-9]{10}$/.test(form.ownerMobile.trim())) next.ownerMobile = 'Enter a valid 10-digit mobile number';

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      vehicleNo: form.vehicleNo.trim(),
      vehicleType: form.vehicleType.trim(),
      vehicleCategory: form.vehicleCategory.trim(),
      transmission: form.transmission,
      fuel: form.fuel,
      status: form.status,
      make: form.make.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      ownerName: form.ownerName.trim(),
      ownerMobile: form.ownerMobile.trim(),
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Update Vehicle' : 'Create Vehicle'}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Vehicle Number <RequiredMark />
              </span>
              <input
                className={fieldClass('vehicleNo')}
                value={form.vehicleNo}
                onChange={(e) => update('vehicleNo', e.target.value.toUpperCase())}
                placeholder="e.g. KA01AB1234"
                aria-invalid={Boolean(errors.vehicleNo)}
              />
              {errors.vehicleNo && <span className={errorClass}>{errors.vehicleNo}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Vehicle Type <RequiredMark />
              </span>
              <SearchableSelect
                value={form.vehicleType}
                onChange={(v) => update('vehicleType', v)}
                options={vehicleTypeOptions}
                loading={catalog === null}
                error={Boolean(errors.vehicleType)}
                placeholder="Select type"
                searchPlaceholder="Search types..."
                emptyMessage="No vehicle types yet — add one in Vehicle Catalog."
                getOptionValue={(t) => t}
                getOptionLabel={(t) => t}
              />
              {errors.vehicleType && <span className={errorClass}>{errors.vehicleType}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Vehicle Category <RequiredMark />
              </span>
              <SearchableSelect
                value={form.vehicleCategory}
                onChange={(v) => update('vehicleCategory', v)}
                options={form.vehicleType ? categoryOptions : []}
                loading={catalog === null}
                disabled={!form.vehicleType}
                error={Boolean(errors.vehicleCategory)}
                placeholder={form.vehicleType ? 'Select category' : 'Select a vehicle type first'}
                searchPlaceholder="Search categories..."
                emptyMessage={form.vehicleType ? 'No categories yet — add one in Vehicle Catalog.' : 'Select a vehicle type first'}
                getOptionValue={(c) => c}
                getOptionLabel={(c) => c}
              />
              {errors.vehicleCategory && <span className={errorClass}>{errors.vehicleCategory}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Make <RequiredMark />
              </span>
              <SearchableSelect
                value={form.make}
                onChange={(v) => update('make', v)}
                options={form.vehicleType ? makeOptions : []}
                loading={catalog === null}
                disabled={!form.vehicleType}
                error={Boolean(errors.make)}
                placeholder={form.vehicleType ? 'Select make' : 'Select a vehicle type first'}
                searchPlaceholder="Search makes..."
                emptyMessage={form.vehicleType ? 'No makes yet — add one in Vehicle Catalog.' : 'Select a vehicle type first'}
                getOptionValue={(m) => m}
                getOptionLabel={(m) => m}
              />
              {errors.make && <span className={errorClass}>{errors.make}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Model <RequiredMark />
              </span>
              <SearchableSelect
                value={form.model}
                onChange={(v) => update('model', v)}
                options={form.make ? modelOptions : []}
                loading={catalog === null}
                disabled={!form.make}
                error={Boolean(errors.model)}
                placeholder={form.make ? 'Select model' : 'Select a make first'}
                searchPlaceholder="Search models..."
                emptyMessage={form.make ? 'No models yet — add one in Vehicle Catalog.' : 'Select a make first'}
                getOptionValue={(m) => m}
                getOptionLabel={(m) => m}
              />
              {errors.model && <span className={errorClass}>{errors.model}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Year <RequiredMark />
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="1990"
                max={CURRENT_YEAR + 1}
                className={fieldClass('year')}
                value={form.year}
                onChange={(e) => update('year', e.target.value)}
                placeholder={`e.g. ${CURRENT_YEAR}`}
                aria-invalid={Boolean(errors.year)}
              />
              {errors.year && <span className={errorClass}>{errors.year}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Owner/Host <RequiredMark />
              </span>
              <input
                className={fieldClass('ownerName')}
                value={form.ownerName}
                onChange={(e) => update('ownerName', e.target.value)}
                placeholder="Enter owner or host name"
                aria-invalid={Boolean(errors.ownerName)}
              />
              {errors.ownerName && <span className={errorClass}>{errors.ownerName}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Owner Mobile <RequiredMark />
              </span>
              <input
                type="tel"
                inputMode="tel"
                maxLength={10}
                className={fieldClass('ownerMobile')}
                value={form.ownerMobile}
                onChange={(e) => updateMobile(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                aria-invalid={Boolean(errors.ownerMobile)}
              />
              {errors.ownerMobile && <span className={errorClass}>{errors.ownerMobile}</span>}
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Transmission <RequiredMark />
              </span>
              <div className="flex gap-2">
                {TRANSMISSIONS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update('transmission', t)}
                    className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      form.transmission === t
                        ? 'border-blue-400 bg-blue-100 text-blue-800'
                        : errors.transmission
                          ? 'border-red-300 bg-white text-gray-500 hover:bg-gray-50'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {errors.transmission && <span className={errorClass}>{errors.transmission}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Fuel <RequiredMark />
              </span>
              <div className="flex flex-wrap gap-2">
                {FUEL_TYPES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => update('fuel', f)}
                    className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      form.fuel === f
                        ? 'border-blue-400 bg-blue-100 text-blue-800'
                        : errors.fuel
                          ? 'border-red-300 bg-white text-gray-500 hover:bg-gray-50'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {errors.fuel && <span className={errorClass}>{errors.fuel}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Vehicle Status</span>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_STATUSES.map((s) => {
                // Creation only ever allows "On Hold" — a brand new vehicle has no photos yet,
                // so it can't be Active either. On edit, Active additionally stays locked until
                // all 4 photo sides are uploaded (see hasAllPhotoSides above).
                const activeLockedForPhotos = s === 'Active' && isEdit && !hasAllPhotoSides;
                const disabled = form.status !== s && ((!isEdit && s !== 'On Hold') || activeLockedForPhotos);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => !disabled && update('status', s)}
                    disabled={disabled}
                    title={activeLockedForPhotos ? 'Upload all 4 vehicle photos (front, back, passenger side, driver side) before activating' : undefined}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } ${
                      form.status === s
                        ? s === 'Active'
                          ? 'border-emerald-400 bg-emerald-100 text-emerald-800'
                          : s === 'On Hold'
                            ? 'border-amber-400 bg-amber-100 text-amber-800'
                            : 'border-red-400 bg-red-100 text-red-800'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            {!isEdit && <p className="text-xs text-gray-400">New vehicles always start as "On Hold".</p>}
          </div>

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
              {submitting ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
