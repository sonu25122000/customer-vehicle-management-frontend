import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { generateTripOtp } from '../api/trips';
import { LockIcon } from './icons';

function minutesLeft(expiresAt, now) {
  return Math.max(Math.ceil((new Date(expiresAt) - now) / 60000), 0);
}

// The OTP the customer needs to start (while Yet to Start) or end (while On Trip) this trip on the
// customer site. Only admins/moderators ever see it; they share it when handing the car over / taking
// it back. Admins don't need it themselves — changing the status from Edit Trip starts/ends the trip.
export default function TripOtpPanel({ trip }) {
  const purpose = trip.status === 'Yet to Start' ? 'start' : trip.status === 'On Trip' ? 'end' : null;
  const [otps, setOtps] = useState(trip.otps || { start: null, end: null });
  const [generating, setGenerating] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  if (!purpose) return null;

  const otp = otps[purpose];
  const live = otp && new Date(otp.expiresAt) > now;
  const label = purpose === 'start' ? 'Start' : 'End';
  const customerMobile = trip.customer?.mobile1;
  const shareText = otp
    ? `Hi ${trip.customer?.name || ''}, your Roam Wheels OTP to ${purpose} trip ${trip.tripId} is ${otp.code}. Please don't share it with anyone else.`
    : '';

  async function handleGenerate() {
    setGenerating(true);
    try {
      setOtps(await generateTripOtp(trip._id, purpose));
      setNow(Date.now());
      toast.success(`New ${purpose} OTP generated`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(otp.code);
      toast.success('OTP copied');
    } catch {
      toast.error('Could not copy — please copy it manually');
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-indigo-50/60 p-4 ring-1 ring-indigo-100">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-indigo-700">
            <LockIcon className="h-3.5 w-3.5" /> {label} Trip OTP
          </span>
          <p className="mt-0.5 text-xs text-gray-500">
            Share this with the customer so they can {purpose} the trip on the customer site. Only visible here.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex-shrink-0 cursor-pointer rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
        >
          {generating ? 'Generating...' : live ? 'Regenerate' : 'Generate OTP'}
        </button>
      </div>

      {live ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-indigo-100">
          <div>
            <span className="font-mono text-2xl font-extrabold tracking-[0.3em] text-gray-900">{otp.code}</span>
            <p className="text-[0.7rem] text-gray-500">
              Expires in {minutesLeft(otp.expiresAt, now)} min · {otp.attemptsLeft} attempt{otp.attemptsLeft === 1 ? '' : 's'} left
              {otp.generatedBy && ` · by ${otp.generatedBy}`}
            </p>
          </div>
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
                href={`https://wa.me/91${customerMobile}?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">
          {otp ? 'The last OTP has expired.' : 'No OTP generated yet.'} Generating one gives a new code each time — any
          earlier code stops working.
        </p>
      )}
      {purpose === 'start' && trip.customer?.profileVerified && trip.customer.profileVerified !== 'Accepted' && (
        <p className="text-xs text-amber-700">
          The customer&apos;s profile isn&apos;t verified yet, so the site will ask them to finish verification before they can use this OTP.
        </p>
      )}
    </div>
  );
}
