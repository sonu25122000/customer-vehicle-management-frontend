import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileTextIcon, UploadIcon, XIcon, EyeIcon, CameraIcon, CheckCircleIcon, ClockIcon } from './icons';
import { isPdfUrl, fileSizeError } from '../utils/files';
import ImageLightbox from './ImageLightbox';
import CameraCapture from './CameraCapture';
import { compressImage } from '../utils/compressImage';
import ProfileVerifiedBadge from './ProfileVerifiedBadge';
import { fetchCustomerDocuments, uploadCustomerDocuments, reviewCustomerDocuments, documentsByType } from '../api/customerDocuments';

const DOC_SLOTS = [
  { key: 'selfie', label: 'Selfie', imageOnly: true, allowCamera: true },
  { key: 'drivingLicence', label: 'Driving Licence (DL)' },
  { key: 'aadhaar', label: 'Aadhaar' },
  { key: 'other', label: 'Other Document' },
];

function DocSlot({ label, imageOnly, allowCamera, existingUrl, pendingFile, pendingPreviewUrl, onPick, onClear, onView, onCamera, disabled }) {
  const inputRef = useRef(null);
  const pendingIsPdf = pendingFile?.type === 'application/pdf';
  const existingIsPdf = isPdfUrl(existingUrl);
  const previewImageUrl = pendingFile ? (!pendingIsPdf ? pendingPreviewUrl : null) : !existingIsPdf ? existingUrl : null;
  const isPdf = pendingFile ? pendingIsPdf : existingIsPdf;
  const hasFile = Boolean(pendingFile || existingUrl);
  const fileUrl = pendingPreviewUrl || existingUrl;
  const accept = imageOnly ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf';

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <div
        onClick={() => !disabled && !hasFile && !allowCamera && inputRef.current?.click()}
        className={`group relative flex h-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          hasFile ? 'border-transparent bg-gray-50' : allowCamera ? 'border-gray-300' : 'cursor-pointer border-gray-300 hover:border-blue-400'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        {hasFile ? (
          <>
            {isPdf ? (
              <div className="flex flex-col items-center gap-1.5 text-gray-500">
                <FileTextIcon className="h-10 w-10" />
                <span className="text-[0.65rem] font-medium">PDF document</span>
              </div>
            ) : (
              <img src={previewImageUrl} alt={label} className="h-full w-full object-cover" />
            )}

            {pendingFile && (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-blue-600 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
                Pending
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              disabled={disabled}
              aria-label={`Remove ${label}`}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:bg-black/80"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2.5 bg-black/50 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(fileUrl, isPdf);
                }}
                className="flex cursor-pointer items-center gap-1"
              >
                <EyeIcon className="h-3.5 w-3.5" /> View
              </button>
              <span className="text-white/40">|</span>
              {allowCamera ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCamera();
                    }}
                    aria-label="Retake photo"
                    className="flex cursor-pointer items-center gap-1"
                  >
                    <CameraIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    aria-label="Choose from gallery"
                    className="flex cursor-pointer items-center gap-1"
                  >
                    <UploadIcon className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                  className="flex cursor-pointer items-center gap-1"
                >
                  <UploadIcon className="h-3.5 w-3.5" /> Replace
                </button>
              )}
            </div>
          </>
        ) : allowCamera ? (
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCamera();
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-[0.7rem] font-semibold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              <CameraIcon className="h-3.5 w-3.5" /> Take Photo
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-[0.7rem] font-semibold text-gray-600 transition-colors hover:border-blue-400 hover:text-blue-600"
            >
              <UploadIcon className="h-3.5 w-3.5" /> Gallery
            </button>
          </div>
        ) : (
          <div className="flex cursor-pointer flex-col items-center gap-1 text-gray-400">
            <UploadIcon className="h-6 w-6" />
            <span className="text-xs">Click to upload</span>
            <span className="text-[0.65rem] text-gray-300">{imageOnly ? 'Image only' : 'Image or PDF'}</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
    </div>
  );
}

const STATUS_STYLES = {
  Approved: { className: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: CheckCircleIcon },
  Rejected: { className: 'bg-red-50 text-red-700 ring-red-200', Icon: XIcon },
  Pending: { className: 'bg-amber-50 text-amber-700 ring-amber-200', Icon: ClockIcon },
};

function DocStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.Pending;
  const Icon = style.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ring-1 ${style.className}`}>
      <Icon className="h-3 w-3" />
      {status === 'Pending' ? 'Pending review' : status}
    </span>
  );
}

// Review status and Approve / Reject for one saved document. (The generated file name is only the
// stored file's name in S3 — it isn't shown here.)
function DocReview({ doc, busy, onApprove, onReject }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const status = doc.status || 'Pending';

  return (
    <div className="flex flex-col gap-1.5 rounded-lg bg-gray-50 p-2 ring-1 ring-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <DocStatusBadge status={status} />
        <span className="text-[0.6rem] text-gray-400">by {doc.uploadedBy === 'customer' ? 'customer' : 'admin'}</span>
      </div>
      {status === 'Rejected' && doc.rejectionReason && (
        <p className="text-[0.65rem] leading-snug text-red-600">Reason: {doc.rejectionReason}</p>
      )}

      {rejecting ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            rows={2}
            autoFocus
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (shown to the customer)"
            className="resize-none rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={busy || !reason.trim()}
              onClick={async () => {
                if (await onReject(reason.trim())) {
                  setRejecting(false);
                  setReason('');
                }
              }}
              className="flex-1 cursor-pointer rounded-md bg-red-600 px-2 py-1 text-[0.7rem] font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="cursor-pointer rounded-md bg-gray-200 px-2 py-1 text-[0.7rem] font-semibold text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-1.5">
          {status !== 'Approved' && (
            <button
              type="button"
              disabled={busy}
              onClick={onApprove}
              className="flex-1 cursor-pointer rounded-md bg-emerald-600 px-2 py-1 text-[0.7rem] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {status !== 'Rejected' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejecting(true)}
              className="flex-1 cursor-pointer rounded-md border border-red-200 bg-white px-2 py-1 text-[0.7rem] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function CustomerDocumentsModal({ customer, onClose, onDone }) {
  // Saved documents by type ({ selfie: dataUri, ... }), loaded from the customer-documents API;
  // null while loading. `saved` holds the rest of each saved document (review status, file name...).
  const [existing, setExisting] = useState(null);
  const [saved, setSaved] = useState({});
  const [profileVerified, setProfileVerified] = useState(customer.profileVerified || 'Pending');
  const [pending, setPending] = useState({ selfie: null, drivingLicence: null, aadhaar: null, other: null });
  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [cameraSlot, setCameraSlot] = useState(null);
  const objectUrlsRef = useRef({});

  useEffect(
    () => () => {
      Object.values(objectUrlsRef.current).forEach((url) => url && URL.revokeObjectURL(url));
    },
    []
  );

  function applyDocuments(list, status) {
    setExisting(documentsByType(list));
    setSaved(Object.fromEntries((list || []).map((d) => [d.type, d])));
    if (status) setProfileVerified(status);
  }

  useEffect(() => {
    let cancelled = false;
    fetchCustomerDocuments(customer._id)
      .then((list) => {
        if (!cancelled) applyDocuments(list, list[0]?.customer?.profileVerified);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Failed to load documents');
          setExisting({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [customer._id]);

  function previewUrlFor(slot, file) {
    if (objectUrlsRef.current[slot]) URL.revokeObjectURL(objectUrlsRef.current[slot]);
    const url = file ? URL.createObjectURL(file) : null;
    objectUrlsRef.current[slot] = url;
    return url;
  }

  const hasPending = Object.values(pending).some(Boolean);
  const reviewable = DOC_SLOTS.filter(({ key }) => existing?.[key] && saved[key] && !pending[key]);
  const anyNotApproved = reviewable.some(({ key }) => saved[key].status !== 'Approved');

  async function pick(slot, file) {
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      const sizeError = fileSizeError(compressed);
      if (sizeError) {
        toast.error(sizeError);
        return;
      }
      previewUrlFor(slot, compressed);
      setPending((prev) => ({ ...prev, [slot]: compressed }));
    } finally {
      setCompressing(false);
    }
  }

  function clear(slot) {
    if (pending[slot]) {
      previewUrlFor(slot, null);
      setPending((prev) => ({ ...prev, [slot]: null }));
      return;
    }
    // Clearing an already-uploaded document just clears it locally for re-upload —
    // no dedicated delete-one-document endpoint; re-uploading overwrites it server-side.
    setExisting((prev) => ({ ...prev, [slot]: '' }));
  }

  async function handleUpload() {
    if (!hasPending) return;
    setUploading(true);
    try {
      const res = await uploadCustomerDocuments(customer._id, pending);
      // Stay open so the new uploads can be reviewed straight away.
      Object.keys(pending).forEach((slot) => previewUrlFor(slot, null));
      setPending({ selfie: null, drivingLicence: null, aadhaar: null, other: null });
      applyDocuments(res.data, res.profileVerified);
      toast.success('Documents uploaded — they are now pending review');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  }

  // Returns true on success so the caller can reset its own UI (e.g. the reject reason box).
  async function review(status, documents, reason) {
    setReviewing(true);
    try {
      const res = await reviewCustomerDocuments(customer._id, { status, documents, reason });
      applyDocuments(res.data, res.profileVerified);
      toast.success(res.message || 'Saved');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save the review');
      return false;
    } finally {
      setReviewing(false);
    }
  }

  const busy = existing === null || uploading || compressing || reviewing;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Customer Documents</h2>
            <p className="flex items-center gap-2 text-xs text-gray-500">
              {customer.name} <ProfileVerifiedBadge status={profileVerified} />
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

        <div className="flex flex-col gap-5 p-6">
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            Review each document on its own. The profile is verified only once the selfie, driving licence and Aadhaar are
            all approved. A rejected document&apos;s reason is shown to the customer so they can upload it again.
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {DOC_SLOTS.map(({ key, label, imageOnly, allowCamera }) => (
              <div key={key} className="flex flex-col gap-2">
                <DocSlot
                  label={label}
                  imageOnly={imageOnly}
                  allowCamera={allowCamera}
                  existingUrl={existing?.[key]}
                  pendingFile={pending[key]}
                  pendingPreviewUrl={objectUrlsRef.current[key]}
                  onPick={(file) => pick(key, file)}
                  onClear={() => clear(key)}
                  onView={(url, isPdf) => setLightbox({ src: url, label, isPdf })}
                  onCamera={() => setCameraSlot(key)}
                  disabled={busy}
                />
                {existing?.[key] && saved[key] && !pending[key] && (
                  <DocReview
                    doc={saved[key]}
                    busy={busy}
                    onApprove={() => review('Approved', [saved[key]._id])}
                    onReject={(reason) => review('Rejected', [saved[key]._id], reason)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => review('Approved')}
              disabled={busy || hasPending || !anyNotApproved}
              title={hasPending ? 'Upload or remove the new files first' : undefined}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" /> Approve All
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onDone(customer)}
                className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
              >
                {hasPending ? 'Skip & Close' : 'Done'}
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!hasPending || busy}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Upload Documents'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ImageLightbox src={lightbox?.src} label={lightbox?.label} isPdf={lightbox?.isPdf} onClose={() => setLightbox(null)} />

      {cameraSlot && (
        <CameraCapture
          onClose={() => setCameraSlot(null)}
          onCapture={(file) => {
            pick(cameraSlot, file);
            setCameraSlot(null);
          }}
        />
      )}
    </div>
  );
}
