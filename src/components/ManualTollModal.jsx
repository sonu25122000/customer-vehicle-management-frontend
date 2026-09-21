import { useState } from 'react';

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

// For a FASTag charge that isn't in the toll plaza list (e.g. a parking lot): just a name and an
// amount. The entry is shaped like a list toll so the total, the selection modal and the PDF treat
// it the same way — flagged `manual` only so the UI can label it.
export default function ManualTollModal({ initialName = '', onClose, onAdd }) {
  const [name, setName] = useState(initialName);
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState({});

  function fieldClass(field) {
    return `${baseInputClass} ${errors[field] ? errorInputClass : validInputClass}`;
  }

  function validate() {
    const next = {};
    if (!name.trim()) next.name = 'Name is required';
    if (amount === '') next.amount = 'Amount is required';
    else if (!(Number(amount) > 0)) next.amount = 'Enter an amount greater than 0';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onAdd({
      tollName: name.trim(),
      state: '',
      highway: '',
      manual: true,
      pricing: { car: { singleJourney: Number(amount) } },
    });
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Manual Entry</h2>
            <p className="text-xs text-gray-400">For a charge that isn't in the toll list</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>
              Name <RequiredMark />
            </span>
            <input
              className={fieldClass('name')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="e.g. Adiyogi Parking"
              maxLength={80}
              autoFocus
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && <span className={errorClass}>{errors.name}</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>
              Amount (₹) <RequiredMark />
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={fieldClass('amount')}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              placeholder="0.00"
              aria-invalid={Boolean(errors.amount)}
            />
            {errors.amount && <span className={errorClass}>{errors.amount}</span>}
          </label>

          <p className="-mt-1 text-xs text-gray-400">It's added to the selection and included in the exported PDF.</p>

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
