import { useSelector } from 'react-redux';
import StarRating from './StarRating';
import TripStatusBadge from './TripStatusBadge';
import { canEdit } from '../utils/permissions';

function formatMoney(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function combineDateTime(dateValue, timeStr) {
  if (!dateValue || !timeStr) return null;
  const d = new Date(dateValue);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes);
}

function formatDuration(ms) {
  if (ms === null || ms < 0) return null;
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function DetailItem({ label, children, full }) {
  return (
    <div className={`flex flex-col gap-1 ${full ? 'col-span-full' : ''}`}>
      <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{children}</span>
    </div>
  );
}

export default function TripViewModal({ trip, onClose, onEdit }) {
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));
  if (!trip) return null;

  const distance =
    trip.startOdometer !== undefined && trip.endOdometer !== undefined
      ? Math.max(trip.endOdometer - trip.startOdometer, 0)
      : null;

  const startDT = combineDateTime(trip.startDate, trip.startTime);
  const endDT = combineDateTime(trip.endDate, trip.endTime);
  const duration = startDT && endDT ? formatDuration(endDT - startDT) : null;
  const dueAmount = Number(trip.amount || 0) - Number(trip.advance || 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Trip Details</h2>
            {trip.tripId && (
              <span className="mt-0.5 inline-block rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold tracking-wide text-slate-700">
                {trip.tripId}
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

        <div className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DetailItem label="Customer">
              {trip.customer?.name || 'Unknown'}
              {trip.customer?.mobile1 && <span className="ml-2 text-xs text-gray-500">{trip.customer.mobile1}</span>}
            </DetailItem>
            <DetailItem label="Vehicle">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-indigo-700">
                {trip.vehicle?.vehicleNo || 'Unknown'}
              </span>
              {trip.vehicle?.make && (
                <span className="ml-2 text-xs text-gray-500">
                  {trip.vehicle.make} {trip.vehicle.model} {trip.vehicle.year}
                </span>
              )}
            </DetailItem>
            <DetailItem label="Status">
              <TripStatusBadge status={trip.status} />
            </DetailItem>
            <DetailItem label="Booked Date">{formatDateTime(trip.bookedDate)}</DetailItem>
            <DetailItem label="Start">
              {formatDate(trip.startDate)} <span className="text-gray-500">{trip.startTime}</span>
            </DetailItem>
            <DetailItem label="End">
              {trip.endDate ? (
                <>
                  {formatDate(trip.endDate)} <span className="text-gray-500">{trip.endTime}</span>
                </>
              ) : (
                '-'
              )}
            </DetailItem>
            {duration && <DetailItem label="Total Duration">{duration}</DetailItem>}
            <DetailItem label="Amount">₹{formatMoney(trip.amount)}</DetailItem>
            {trip.couponCode && (
              <DetailItem label="Coupon">
                {trip.couponCode} (−₹{formatMoney(trip.couponDiscount)})
              </DetailItem>
            )}
            <DetailItem label="Toll Charges">₹{formatMoney(trip.tollCharges)}</DetailItem>
            <DetailItem label="Advance Paid">₹{formatMoney(trip.advance)}</DetailItem>
            <DetailItem label="Security Deposit">₹{formatMoney(trip.securityDeposit)}</DetailItem>
            <DetailItem label="Starting Odometer">{trip.startOdometer ?? '-'}</DetailItem>
            <DetailItem label="Ending Odometer">{trip.endOdometer ?? '-'}</DetailItem>
            {distance !== null && <DetailItem label="Distance Covered">{distance} km</DetailItem>}
            <DetailItem label="Trip Rating">
              {trip.rating ? <StarRating value={trip.rating} readOnly /> : <span className="text-gray-400">Not rated</span>}
            </DetailItem>
            {trip.status === 'Cancelled' && (
              <DetailItem label="Refund Amount">₹{formatMoney(trip.refundAmount)}</DetailItem>
            )}
          </div>

          {(trip.rescheduleHistory?.length > 0 || trip.endDateHistory?.length > 0) && (
            <div className="flex flex-col gap-2 rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100">
              <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">History</span>
              <ul className="flex flex-col gap-1.5 text-xs text-gray-600">
                {trip.rescheduleHistory?.map((h, i) => (
                  <li key={`resched-${i}`}>
                    Rescheduled from {formatDate(h.fromStartDate)} {h.fromStartTime} to {formatDate(h.toStartDate)}{' '}
                    {h.toStartTime}
                    <span className="ml-1 text-gray-400">({formatDate(h.rescheduledAt)})</span>
                  </li>
                ))}
                {trip.endDateHistory?.map((h, i) => (
                  <li key={`enddate-${i}`}>
                    End date changed from {h.fromEndDate ? `${formatDate(h.fromEndDate)} ${h.fromEndTime || ''}` : 'unset'}{' '}
                    to {h.toEndDate ? `${formatDate(h.toEndDate)} ${h.toEndTime || ''}` : 'unset'}
                    <span className="ml-1 text-gray-400">({formatDate(h.changedAt)})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div
            className={`flex items-center justify-between rounded-xl px-4 py-3 ring-1 ${
              dueAmount > 0
                ? 'bg-amber-50 ring-amber-100'
                : 'bg-emerald-50 ring-emerald-100'
            }`}
          >
            <span
              className={`text-xs font-bold uppercase tracking-wide ${
                dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {dueAmount > 0 ? 'Due Amount' : 'Fully Paid'}
            </span>
            <span
              className={`text-lg font-extrabold tabular-nums ${
                dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              ₹{formatMoney(Math.max(dueAmount, 0))}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              Close
            </button>
            {mayEdit && (
              <button
                onClick={() => onEdit(trip)}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Edit Trip
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
