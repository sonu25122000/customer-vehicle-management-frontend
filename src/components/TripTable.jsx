import { useSelector } from 'react-redux';
import StarRating from './StarRating';
import TripStatusBadge from './TripStatusBadge';
import { EyeIcon, PencilIcon, TrashIcon, ClockIcon } from './icons';
import { canEdit } from '../utils/permissions';

const RESCHEDULABLE_STATUSES = ['Yet to Start', 'On Trip'];

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatMoney(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const thClass =
  'px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50';
const tdClass = 'px-3 py-2 align-middle text-xs text-gray-700 border-t border-gray-100';
const actionBtn = 'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors';

export default function TripTable({ trips, loading, page, limit, onView, onEdit, onDelete, onReschedule }) {
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="animate-pulse divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="ml-auto h-4 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!trips.length) {
    return <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">No trips found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full min-w-[1180px] border-collapse text-xs">
        <thead>
          <tr>
            <th className={`${thClass} w-10`}>#</th>
            <th className={thClass}>Trip ID</th>
            <th className={thClass}>Customer</th>
            <th className={thClass}>Vehicle</th>
            <th className={thClass}>Start</th>
            <th className={thClass}>End</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Amount</th>
            <th className={thClass}>Due</th>
            <th className={thClass}>Rating</th>
            <th className={`${thClass} whitespace-nowrap`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((t, i) => (
            <tr key={t._id} className="transition-colors hover:bg-gray-50">
              <td className={`${tdClass} text-gray-400`}>{(page - 1) * limit + i + 1}</td>
              <td className={tdClass}>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-slate-700">
                  {t.tripId || '-'}
                </span>
              </td>
              <td className={tdClass}>
                <p className="font-semibold text-gray-900">{t.customer?.name || 'Unknown'}</p>
                <p className="text-[0.7rem] text-gray-400">{t.customer?.mobile1}</p>
              </td>
              <td className={tdClass}>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-indigo-700">
                  {t.vehicle?.vehicleNo || 'Unknown'}
                </span>
                {(t.vehicle?.model || t.vehicle?.year) && (
                  <p className="mt-0.5 text-[0.7rem] text-gray-400">
                    {t.vehicle?.model} {t.vehicle?.year}
                  </p>
                )}
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                {formatDate(t.startDate)}
                <span className="ml-1 text-gray-400">{t.startTime}</span>
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                {t.endDate ? (
                  <>
                    {formatDate(t.endDate)}
                    <span className="ml-1 text-gray-400">{t.endTime}</span>
                  </>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className={tdClass}>
                <TripStatusBadge status={t.status} />
              </td>
              <td className={`${tdClass} whitespace-nowrap font-semibold text-gray-900`}>₹{formatMoney(t.amount)}</td>
              <td className={`${tdClass} whitespace-nowrap`}>
                {(() => {
                  const due = Math.max(Number(t.amount || 0) - Number(t.advance || 0), 0);
                  return due > 0 ? (
                    <span className="font-semibold text-amber-600">₹{formatMoney(due)}</span>
                  ) : (
                    <span className="text-emerald-600">Paid</span>
                  );
                })()}
              </td>
              <td className={tdClass}>
                {t.rating ? <StarRating value={t.rating} readOnly size="sm" /> : <span className="text-gray-400">-</span>}
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onView(t)}
                    title="View"
                    aria-label="View"
                    className={`${actionBtn} bg-blue-50 text-blue-600 hover:bg-blue-100`}
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                  </button>
                  {mayEdit && (
                    <>
                      <button
                        onClick={() => onEdit(t)}
                        title="Edit"
                        aria-label="Edit"
                        className={`${actionBtn} bg-gray-100 text-gray-600 hover:bg-gray-200`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      {RESCHEDULABLE_STATUSES.includes(t.status) && (
                        <button
                          onClick={() => onReschedule(t)}
                          title="Reschedule"
                          aria-label="Reschedule"
                          className={`${actionBtn} bg-amber-50 text-amber-600 hover:bg-amber-100`}
                        >
                          <ClockIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(t)}
                        title="Delete"
                        aria-label="Delete"
                        className={`${actionBtn} bg-red-50 text-red-600 hover:bg-red-100`}
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
