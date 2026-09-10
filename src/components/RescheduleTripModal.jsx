import { useState } from 'react';
import SearchableSelect from './SearchableSelect';
import { TIME_OPTIONS } from '../utils/timeOptions';

const baseInputClass =
  'rounded-lg border px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:ring-2';
const validInputClass = 'border-gray-300 focus:border-blue-600 focus:ring-blue-100';
const errorInputClass = 'border-red-400 focus:border-red-500 focus:ring-red-100';
const labelTextClass = 'text-xs font-semibold text-gray-600';
const errorClass = 'text-xs text-red-600';

// Start date/time can only be changed through this dedicated action once a trip is past "Yet
// to Start" — it hits POST /trips/:id/reschedule, which keeps the old value in the trip's
// rescheduleHistory instead of silently overwriting it (see backend/src/models/Trip.js).
export default function RescheduleTripModal({ trip, onClose, onSubmit, submitting }) {
  const [startDate, setStartDate] = useState(trip.startDate ? new Date(trip.startDate).toISOString().slice(0, 10) : '');
  const [startTime, setStartTime] = useState(trip.startTime || '');
  const [errors, setErrors] = useState({});

  function handleSubmit(e) {
    e.preventDefault();
    const next = {};
    if (!startDate) next.startDate = 'Start date is required';
    if (!startTime) next.startTime = 'Start time is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({ startDate, startTime });
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Reschedule Trip</h2>
            <p className="text-xs text-gray-500">
              Currently {new Date(trip.startDate).toLocaleDateString()} at {trip.startTime}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>New Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${baseInputClass} ${errors.startDate ? errorInputClass : validInputClass}`}
            />
            {errors.startDate && <span className={errorClass}>{errors.startDate}</span>}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelTextClass}>New Start Time</span>
            <SearchableSelect
              value={startTime}
              onChange={setStartTime}
              options={TIME_OPTIONS}
              error={Boolean(errors.startTime)}
              placeholder="Select start time"
              searchPlaceholder="Search time..."
              getOptionValue={(t) => t.value}
              getOptionLabel={(t) => t.label}
            />
            {errors.startTime && <span className={errorClass}>{errors.startTime}</span>}
          </label>

          <p className="text-xs text-gray-400">The previous start date/time is kept in this trip's reschedule history.</p>

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
              {submitting ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
