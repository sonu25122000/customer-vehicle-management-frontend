import { useState } from 'react';

const baseInputClass =
  'rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2';
const validInputClass = 'border-gray-300 focus:border-blue-600 focus:ring-blue-100';
const errorInputClass = 'border-red-400 focus:border-red-500 focus:ring-red-100';
const labelTextClass = 'text-xs font-semibold text-gray-600';
const errorClass = 'text-xs text-red-600';

const TYPES = ['Toll', 'Parking'];

function RequiredMark() {
  return (
    <span className="text-red-500" aria-hidden="true">
      *
    </span>
  );
}

// For charges FASTag deducted at a place that isn't in the toll plaza list (e.g. a parking lot).
// Produces an entry shaped like a list toll so totals, the selection modal and the PDF treat it
// the same way — just flagged `manual` so it's labelled as such.
export default function ManualTollModal({ initialName = '', onClose, onAdd }) {
  const [form, setForm] = useState({ name: initialName, type: 'Toll', state: '', location: '', amount: '' });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function fieldClass(field) {
    return `${baseInputClass} ${errors[field] ? errorInputClass : validInputClass}`;
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = 'Name is required';
    if (form.amount === '') next.amount = 'Amount is required';
    else if (!(Number(form.amount) > 0)) next.amount = 'Enter an amount greater than 0';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onAdd({
      tollName: form.name.trim(),
      state: form.state.trim(),
      highway: form.location.trim(),
      entryType: form.type,
      manual: true,
      pricing: { car: { singleJourney: Number(form.amount) } },
    });
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Manual Entry</h2>
            <p className="text-xs text-gray-400">For a FASTag charge that isn't in the toll list</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            <span className={labelTextClass}>Type</span>
            <div className="flex gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => update('type', t)}
                  className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    form.type === t ? 'border-blue-400 bg-blue-100 text-blue-800' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>
              {form.type === 'Parking' ? 'Parking Name' : 'Toll Name'} <RequiredMark />
            </span>
            <input
              className={fieldClass('name')}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder={form.type === 'Parking' ? 'e.g. Adiyogi Parking' : 'e.g. Hoskote'}
              maxLength={80}
              autoFocus
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className={errorClass}>{errors.name}</span>}
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>State</span>
              <input
                className={fieldClass('state')}
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                placeholder="e.g. Karnataka"
                maxLength={40}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelTextClass}>Highway / Location</span>
              <input
                className={fieldClass('location')}
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="e.g. NH 75"
                maxLength={60}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>
              Amount (₹) <RequiredMark />
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldClass('amount')}
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              placeholder="0.00"
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount && <span className={errorClass}>{errors.amount}</span>}
          </label>

          <p className="-mt-1 text-xs text-gray-400">
            <RequiredMark /> Required fields. The entry is added to the selection and included in the exported PDF.
          </p>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
            >
              Add to Selection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
