import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileTextIcon, UploadIcon, XIcon, EyeIcon, CameraIcon } from './icons';
import ImageLightbox from './ImageLightbox';
import CameraCapture from './CameraCapture';
import { compressImage } from '../utils/compressImage';
import { uploadCustomerDocuments } from '../api/customers';

const DOC_SLOTS = [
  { key: 'selfie', label: 'Selfie', imageOnly: true, allowCamera: true },
  { key: 'drivingLicence', label: 'Driving Licence (DL)' },
  { key: 'aadhaar', label: 'Aadhaar' },
  { key: 'other', label: 'Other Document' },
];

function isPdfDataUri(url) {
  return (url || '').startsWith('data:application/pdf');
}

function DocSlot({ label, imageOnly, allowCamera, existingUrl, pendingFile, pendingPreviewUrl, onPick, onClear, onView, onCamera, disabled }) {
  const inputRef = useRef(null);
  const pendingIsPdf = pendingFile?.type === 'application/pdf';
  const existingIsPdf = isPdfDataUri(existingUrl);
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

export default function CustomerDocumentsModal({ customer: initialCustomer, onClose, onDone }) {
  const [customer, setCustomer] = useState(initialCustomer);
  const [pending, setPending] = useState({ selfie: null, drivingLicence: null, aadhaar: null, other: null });
  const [uploading, setUploading] = useState(false);
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

  function previewUrlFor(slot, file) {
    if (objectUrlsRef.current[slot]) URL.revokeObjectURL(objectUrlsRef.current[slot]);
    const url = file ? URL.createObjectURL(file) : null;
    objectUrlsRef.current[slot] = url;
    return url;
  }

  const hasPending = Object.values(pending).some(Boolean);

  async function pick(slot, file) {
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
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
    setCustomer((prev) => ({ ...prev, documents: { ...prev.documents, [slot]: '' } }));
  }

  async function handleUpload() {
    if (!hasPending) return;
    setUploading(true);
    try {
      const res = await uploadCustomerDocuments(customer._id, pending);
      toast.success('Documents uploaded successfully');
      onDone(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Customer Documents</h2>
            <p className="text-xs text-gray-500">{customer.name}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {DOC_SLOTS.map(({ key, label, imageOnly, allowCamera }) => (
              <DocSlot
                key={key}
                label={label}
                imageOnly={imageOnly}
                allowCamera={allowCamera}
                existingUrl={customer.documents?.[key]}
                pendingFile={pending[key]}
                pendingPreviewUrl={objectUrlsRef.current[key]}
                onPick={(file) => pick(key, file)}
                onClear={() => clear(key)}
                onView={(url, isPdf) => setLightbox({ src: url, label, isPdf })}
                onCamera={() => setCameraSlot(key)}
                disabled={uploading || compressing}
              />
            ))}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
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
              disabled={!hasPending || uploading || compressing}
              className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Upload Documents'}
            </button>
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
