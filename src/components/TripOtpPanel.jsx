import toast from 'react-hot-toast';
import { LockIcon } from './icons';

function OtpCode({ label, otp, done, doneText, shareText, customerMobile }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(otp.code);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy — please copy it manually');
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-lg bg-white px-4 py-3 ring-1 ring-indigo-100">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      {otp ? (
        <>
          <span className="font-mono text-2xl font-extrabold tracking-[0.3em] text-gray-900">{otp.code}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="cursor-pointer rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
            >
              Copy
            </button>
            {customerMobile && (
              <a
                href={`https://wa.me/91${customerMobile}?text=${encodeURIComponent(shareText(otp.code))}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                WhatsApp
              </a>
            )}
          </div>
        </>
      ) : (
        <span className="text-sm font-semibold text-gray-400">{done ? doneText : '—'}</span>
      )}
    </div>
  );
}

// The two OTPs the customer needs on the website: one to start the trip, one to end it. Both are created
// with the trip and never change or expire; only admins/moderators ever see them, and share them when
// handing the car over / taking it back. Admins don't need them — changing the status from Edit Trip
// starts/ends the trip directly. Once the trip is completed or cancelled, no OTP is needed any more.
export default function TripOtpPanel({ trip }) {
  if (trip.status !== 'Yet to Start' && trip.status !== 'On Trip') return null;

  const otps = trip.otps || { start: null, end: null };
  const customerMobile = trip.customer?.mobile1;
  const shareText = (purpose) => (code) =>
    `Hi ${trip.customer?.name || ''}, your Roam Wheels OTP to ${purpose} trip ${trip.tripId} is ${code}. Please don't share it with anyone else.`;

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-indigo-50/60 p-4 ring-1 ring-indigo-100">
      <div>
        <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-indigo-700">
          <LockIcon className="h-3.5 w-3.5" /> Trip OTPs
        </span>
        <p className="mt-0.5 text-xs text-gray-500">
          Share these with the customer so they can start and end the trip on the website. They don&apos;t change or
          expire, and are only visible here.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <OtpCode
          label="Start OTP"
          otp={otps.start}
          done={trip.status !== 'Yet to Start'}
          doneText="Used — the trip has started"
          shareText={shareText('start')}
          customerMobile={customerMobile}
        />
        <OtpCode label="End OTP" otp={otps.end} done={false} doneText="" shareText={shareText('end')} customerMobile={customerMobile} />
      </div>
      {trip.status === 'Yet to Start' && trip.customer?.profileVerified && trip.customer.profileVerified !== 'Accepted' && (
        <p className="text-xs text-amber-700">
          The customer&apos;s profile isn&apos;t verified yet, so the website will ask them to finish verification before they can use the start OTP.
        </p>
      )}
    </div>
  );
}
