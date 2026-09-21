import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { canDelete } from '../utils/permissions';
import { CameraIcon, XIcon, UploadIcon, EyeIcon } from './icons';
import ImageLightbox from './ImageLightbox';
import { compressImage } from '../utils/compressImage';
import { uploadVehiclePhotos, deleteVehiclePhoto } from '../api/vehicles';

const MAIN_SLOTS = [
  { key: 'front', label: 'Front Photo' },
  { key: 'back', label: 'Back Photo' },
  { key: 'passengerSide', label: 'Passenger Side' },
  { key: 'driverSide', label: 'Driver Side' },
];

function PhotoSlot({ label, existingUrl, pendingUrl, onPick, onClear, onView, disabled, mayDelete }) {
  const inputRef = useRef(null);
  const previewUrl = pendingUrl || existingUrl;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <div
        onClick={() => !disabled && !previewUrl && inputRef.current?.click()}
        className={`group relative flex h-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition-colors ${
          previewUrl ? 'border-transparent' : 'cursor-pointer border-gray-300 hover:border-blue-400'
        } ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt={label} className="h-full w-full object-cover" />
            {pendingUrl && (
              <span className="absolute left-1.5 top-1.5 rounded-md bg-blue-600 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white">
                Pending
              </span>
            )}
            {/* Discarding a not-yet-uploaded photo is fine for anyone; removing a saved one is a delete (admin only). */}
            {(pendingUrl || mayDelete) && (
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
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-black/50 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(previewUrl);
                }}
                className="flex cursor-pointer items-center gap-1"
              >
                <EyeIcon className="h-3.5 w-3.5" /> View
              </button>
              <span className="text-white/40">|</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
                disabled={disabled}
                className="flex cursor-pointer items-center gap-1"
              >
                <CameraIcon className="h-3.5 w-3.5" /> Replace
              </button>
            </div>
          </>
        ) : (
          <div className="flex cursor-pointer flex-col items-center gap-1 text-gray-400">
            <CameraIcon className="h-6 w-6" />
            <span className="text-xs">Click to upload</span>
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export default function VehiclePhotosModal({ vehicle: initialVehicle, onClose, onDone }) {
  const mayDelete = canDelete(useSelector((state) => state.auth.admin?.role));
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [pending, setPending] = useState({ front: null, back: null, passengerSide: null, driverSide: null });
  const [pendingAdditional, setPendingAdditional] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [removingSlot, setRemovingSlot] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const additionalInputRef = useRef(null);
  const objectUrlsRef = useRef([]);

  useEffect(
    () => () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    },
    []
  );

  function trackUrl(url) {
    objectUrlsRef.current.push(url);
    return url;
  }

  const hasPending = Object.values(pending).some(Boolean) || pendingAdditional.length > 0;
  const totalAdditional = (vehicle.photos?.additional?.length || 0) + pendingAdditional.length;

  async function pickMain(slot, file) {
    setCompressing(true);
    try {
      const compressed = await compressImage(file);
      setPending((prev) => ({ ...prev, [slot]: compressed }));
    } finally {
      setCompressing(false);
    }
  }

  function clearMain(slot) {
    if (pending[slot]) {
      setPending((prev) => ({ ...prev, [slot]: null }));
      return;
    }
    if (vehicle.photos?.[slot]) removeSavedPhoto(slot);
  }

  async function removeSavedPhoto(slot) {
    setRemovingSlot(slot);
    try {
      const res = await deleteVehiclePhoto(vehicle._id, slot);
      setVehicle(res.data);
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setRemovingSlot(null);
    }
  }

  async function pickAdditional(files) {
    const room = 5 - pendingAdditional.length;
    const selected = Array.from(files).slice(0, Math.max(room, 0));
    if (selected.length < files.length) toast('Only 5 additional photos can be uploaded at a time', { icon: 'ℹ️' });
    setCompressing(true);
    try {
      const compressed = await Promise.all(selected.map((file) => compressImage(file)));
      setPendingAdditional((prev) => [...prev, ...compressed]);
    } finally {
      setCompressing(false);
    }
  }

  async function removeSavedAdditional(index) {
    setRemovingSlot(`additional:${index}`);
    try {
      const res = await deleteVehiclePhoto(vehicle._id, `additional:${index}`);
      setVehicle(res.data);
      toast.success('Photo removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove photo');
    } finally {
      setRemovingSlot(null);
    }
  }

  async function handleUpload() {
    if (!hasPending) return;
    setUploading(true);
    try {
      const files = { ...pending, additional: pendingAdditional };
      const res = await uploadVehiclePhotos(vehicle._id, files);
      toast.success('Photos uploaded successfully');
      onDone(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photos');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Vehicle Photos</h2>
            <p className="text-xs text-gray-500">{vehicle.vehicleNo}</p>
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
            {MAIN_SLOTS.map(({ key, label }) => (
              <PhotoSlot
                key={key}
                label={label}
                existingUrl={vehicle.photos?.[key]}
                pendingUrl={pending[key] ? trackUrl(URL.createObjectURL(pending[key])) : null}
                onPick={(file) => pickMain(key, file)}
                onClear={() => clearMain(key)}
                onView={(url) => setLightbox({ src: url, label })}
                disabled={uploading || removingSlot === key || compressing}
                mayDelete={mayDelete}
              />
            ))}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">Additional Photos (optional)</span>
              <span className="text-xs text-gray-400">{totalAdditional}/10</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {(vehicle.photos?.additional || []).map((url, i) => (
                <div
                  key={`saved-${i}`}
                  onClick={() => setLightbox({ src: url, label: `Additional Photo ${i + 1}` })}
                  className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg"
                >
                  <img src={url} alt={`Additional ${i + 1}`} className="h-full w-full object-cover" />
                  {mayDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSavedAdditional(i);
                      }}
                      disabled={removingSlot === `additional:${i}`}
                      aria-label="Remove photo"
                      className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {pendingAdditional.map((file, i) => {
                const previewUrl = trackUrl(URL.createObjectURL(file));
                return (
                  <div
                    key={`pending-${i}`}
                    onClick={() => setLightbox({ src: previewUrl, label: `Pending Photo ${i + 1}` })}
                    className="group relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg ring-2 ring-blue-400"
                  >
                    <img src={previewUrl} alt="Pending" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingAdditional((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      aria-label="Remove"
                      className="absolute right-1 top-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              {totalAdditional < 10 && (
                <button
                  type="button"
                  onClick={() => additionalInputRef.current?.click()}
                  disabled={uploading || compressing}
                  className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-blue-400"
                >
                  <UploadIcon className="h-5 w-5" />
                  <span className="text-[0.65rem]">Add</span>
                </button>
              )}
            </div>
            <input
              ref={additionalInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) pickAdditional(e.target.files);
                e.target.value = '';
              }}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => onDone(vehicle)}
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
              {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Upload Photos'}
            </button>
          </div>
        </div>
      </div>

      <ImageLightbox src={lightbox?.src} label={lightbox?.label} onClose={() => setLightbox(null)} />
    </div>
  );
}
