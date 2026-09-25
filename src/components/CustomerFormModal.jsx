import { useState } from 'react';
import StarRating from './StarRating';

const MAX_NOTES_WORDS = 300;
const MAX_NAME_LENGTH = 50;

const emptyForm = {
  name: '',
  mobile1: '',
  mobile2: '',
  rating: 0,
  notes: '',
  customerType: 'Good',
  profileVerified: 'Pending',
};

const CUSTOMER_TYPES = [
  { value: 'VIP', label: 'VIP', activeClass: 'bg-amber-100 border-amber-400 text-amber-800' },
  { value: 'Good', label: 'Good', activeClass: 'bg-emerald-100 border-emerald-400 text-emerald-800' },
  { value: 'Bad', label: 'Bad', activeClass: 'bg-red-100 border-red-400 text-red-800' },
];

const PROFILE_VERIFIED_STATUSES = [
  { value: 'Accepted', label: 'Accepted', activeClass: 'bg-emerald-100 border-emerald-400 text-emerald-800' },
  { value: 'Rejected', label: 'Rejected', activeClass: 'bg-red-100 border-red-400 text-red-800' },
  { value: 'Pending', label: 'Pending', activeClass: 'bg-amber-100 border-amber-400 text-amber-800' },
];

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

function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function CustomerFormModal({ mode, initialData, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState(() =>
    initialData
      ? {
          name: initialData.name || '',
          mobile1: initialData.mobile1 || '',
          mobile2: initialData.mobile2 || '',
          rating: initialData.rating || 0,
          notes: initialData.notes || '',
          customerType: initialData.customerType || 'Good',
          profileVerified: initialData.profileVerified || 'Pending',
        }
      : emptyForm
  );
  const [errors, setErrors] = useState({});

  const isEdit = mode === 'edit';
  const notesWords = wordCount(form.notes);
  // Profile status can only move to Accepted once selfie, driving licence and Aadhaar are all
  // on file — see backend's matching check in customerController.updateCustomer.
  // documentTypes is the summary the customer API returns (the files live in customer-documents).
  const docTypes = initialData?.documentTypes || [];
  const hasRequiredDocs = ['selfie', 'drivingLicence', 'aadhaar'].every((type) => docTypes.includes(type));

  function fieldClass(field) {
    return `${baseInputClass} ${errors[field] ? errorInputClass : validInputClass}`;
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function updateMobile(field, value) {
    // Digits only, capped at 10 — no letters, symbols, or overly long numbers.
    update(field, value.replace(/[^0-9]/g, '').slice(0, 10));
  }

  function updateNotes(value) {
    const words = value.trim() ? value.trim().split(/\s+/) : [];
    if (words.length > MAX_NOTES_WORDS) return; // stop accepting further input past the cap
    update('notes', value);
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';

    if (!form.mobile1.trim()) next.mobile1 = 'Mobile 1 is required';
    else if (!/^[0-9]{10}$/.test(form.mobile1.trim())) next.mobile1 = 'Enter a valid 10-digit mobile number';

    if (form.mobile2.trim() && !/^[0-9]{10}$/.test(form.mobile2.trim()))
      next.mobile2 = 'Enter a valid 10-digit mobile number';

    if (wordCount(form.notes) > MAX_NOTES_WORDS) next.notes = `Notes cannot exceed ${MAX_NOTES_WORDS} words`;

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: form.name.trim(),
      mobile1: form.mobile1.trim(),
      mobile2: form.mobile2.trim(),
      rating: form.rating || undefined,
      notes: form.notes.trim(),
      customerType: form.customerType,
      profileVerified: form.profileVerified,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Update Customer' : 'Create Customer'}</h2>
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
              <div className="flex items-center justify-between">
                <span className={labelTextClass}>
                  Name <RequiredMark />
                </span>
                <span className={`text-[0.7rem] ${form.name.length >= MAX_NAME_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                  {form.name.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                className={fieldClass('name')}
                value={form.name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => update('name', e.target.value.slice(0, MAX_NAME_LENGTH))}
                placeholder="Enter customer name"
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <span className={errorClass}>{errors.name}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Mobile 1 <RequiredMark />
              </span>
              <input
                type="tel"
                inputMode="tel"
                maxLength={10}
                className={fieldClass('mobile1')}
                value={form.mobile1}
                onChange={(e) => updateMobile('mobile1', e.target.value)}
                placeholder="Enter 10-digit mobile number"
                aria-invalid={Boolean(errors.mobile1)}
              />
              {errors.mobile1 && <span className={errorClass}>{errors.mobile1}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Mobile 2</span>
              <input
                type="tel"
                inputMode="tel"
                maxLength={10}
                className={fieldClass('mobile2')}
                value={form.mobile2}
                onChange={(e) => updateMobile('mobile2', e.target.value)}
                placeholder="Enter 10-digit alternate mobile number"
                aria-invalid={Boolean(errors.mobile2)}
              />
              {errors.mobile2 && <span className={errorClass}>{errors.mobile2}</span>}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>
                Rating {!isEdit && <span className="font-normal text-gray-400">(available after creation)</span>}
              </span>
              <StarRating value={form.rating} onChange={(v) => update('rating', v)} readOnly={!isEdit} />
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Customer Type</span>
            <div className="flex gap-2">
              {CUSTOMER_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => update('customerType', t.value)}
                  className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    form.customerType === t.value ? t.activeClass : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Profile Verified</span>
            <div className="flex gap-2">
              {PROFILE_VERIFIED_STATUSES.map((s) => {
                // A new customer always starts Pending — Accepted/Rejected only become
                // choosable once editing an existing customer. Accepted additionally stays
                // locked until the selfie, driving licence and Aadhaar are all on file.
                const lockedForDocs = s.value === 'Accepted' && isEdit && !hasRequiredDocs;
                const disabled = (!isEdit && s.value !== 'Pending') || lockedForDocs;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => !disabled && update('profileVerified', s.value)}
                    disabled={disabled}
                    title={lockedForDocs ? 'Upload the selfie, driving licence and Aadhaar before accepting this profile' : undefined}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                      disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    } ${form.profileVerified === s.value ? s.activeClass : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            {!isEdit && <p className="text-xs text-gray-400">New customers always start as "Pending".</p>}
            {isEdit && !hasRequiredDocs && (
              <p className="text-xs text-gray-400">
                Upload the selfie, driving licence and Aadhaar (from the Documents screen) before this profile can be
                Accepted.
              </p>
            )}
          </div>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className={labelTextClass}>Notes</span>
              <span className={`text-[0.7rem] ${notesWords >= MAX_NOTES_WORDS ? 'text-red-500' : 'text-gray-400'}`}>
                {notesWords}/{MAX_NOTES_WORDS} words
              </span>
            </div>
            <textarea
              rows={3}
              className={`${fieldClass('notes')} resize-none`}
              value={form.notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Add any additional notes about this customer..."
            />
            {errors.notes && <span className={errorClass}>{errors.notes}</span>}
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
              {submitting ? 'Saving...' : isEdit ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
