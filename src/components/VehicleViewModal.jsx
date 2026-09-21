import { useState } from 'react';
import { useSelector } from 'react-redux';
import ImageLightbox from './ImageLightbox';
import StarRating from './StarRating';
import VehicleStatusBadge from './VehicleStatusBadge';
import { FileTextIcon } from './icons';
import { canEdit } from '../utils/permissions';

function DetailItem({ label, children, full }) {
  return (
    <div className={`flex flex-col gap-1 ${full ? 'col-span-full' : ''}`}>
      <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{children}</span>
    </div>
  );
}

export default function VehicleViewModal({ vehicle, onClose, onEdit, onManagePhotos, onManageDocuments }) {
  const [lightbox, setLightbox] = useState(null);
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));
  if (!vehicle) return null;

  const mainPhotos = [
    { key: 'front', label: 'Front' },
    { key: 'back', label: 'Back' },
    { key: 'passengerSide', label: 'Passenger Side' },
    { key: 'driverSide', label: 'Driver Side' },
  ].filter((p) => vehicle.photos?.[p.key]);

  const additional = vehicle.photos?.additional || [];

  const documents = [
    { key: 'rc', label: 'RC' },
    { key: 'insurance', label: 'Insurance' },
  ].filter((d) => vehicle.documents?.[d.key]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Vehicle Details</h2>
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
            <DetailItem label="Vehicle Number">
              <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-indigo-700">
                {vehicle.vehicleNo}
              </span>
            </DetailItem>
            <DetailItem label="Vehicle Type">{vehicle.vehicleType}</DetailItem>
            <DetailItem label="Vehicle Category">{vehicle.vehicleCategory || '-'}</DetailItem>
            <DetailItem label="Transmission">{vehicle.transmission || '-'}</DetailItem>
            <DetailItem label="Fuel">{vehicle.fuel || '-'}</DetailItem>
            <DetailItem label="Make">{vehicle.make || '-'}</DetailItem>
            <DetailItem label="Model">{vehicle.model || '-'}</DetailItem>
            <DetailItem label="Year">{vehicle.year || '-'}</DetailItem>
            <DetailItem label="Owner/Host">{vehicle.ownerName}</DetailItem>
            <DetailItem label="Owner Mobile">{vehicle.ownerMobile || '-'}</DetailItem>
            <DetailItem label="Status">
              <VehicleStatusBadge status={vehicle.status} />
            </DetailItem>
          </div>

          <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg font-bold text-gray-900">{vehicle.tripsCompleted ?? 0}</span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                Trips Completed
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-lg font-bold text-gray-900">{vehicle.ratingsGiven ?? 0}</span>
              <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                Ratings Given
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              {vehicle.ratingsGiven ? (
                <>
                  <StarRating value={Math.round(vehicle.avgRating)} readOnly size="sm" />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                    Avg {vehicle.avgRating.toFixed(1)}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-lg font-bold text-gray-300">-</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                    Average Rating
                  </span>
                </>
              )}
            </div>
          </div>

          {(mainPhotos.length > 0 || additional.length > 0) && (
            <div>
              <span className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">
                Photos
              </span>
              <div className="grid grid-cols-4 gap-2">
                {mainPhotos.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setLightbox({ src: vehicle.photos[p.key], label: p.label })}
                    className="flex cursor-pointer flex-col gap-1"
                  >
                    <img
                      src={vehicle.photos[p.key]}
                      alt={p.label}
                      className="h-20 w-full rounded-lg object-cover transition-opacity hover:opacity-90"
                    />
                    <span className="text-center text-[0.65rem] text-gray-400">{p.label}</span>
                  </button>
                ))}
                {additional.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox({ src: url, label: `Additional ${i + 1}` })}
                    className="cursor-pointer"
                  >
                    <img
                      src={url}
                      alt={`Additional ${i + 1}`}
                      className="h-20 w-full rounded-lg object-cover transition-opacity hover:opacity-90"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          {mainPhotos.length === 0 && additional.length === 0 && (
            <p className="text-center text-xs text-gray-400">No photos uploaded yet.</p>
          )}

          <div>
            <span className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">
              Documents
            </span>
            {documents.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {documents.map((d) => {
                  const url = vehicle.documents[d.key];
                  const isPdf = url.startsWith('data:application/pdf');
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => setLightbox({ src: url, label: d.label })}
                      className="flex cursor-pointer flex-col gap-1"
                    >
                      {isPdf ? (
                        <span className="flex h-20 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200">
                          <FileTextIcon className="h-7 w-7" />
                        </span>
                      ) : (
                        <img
                          src={url}
                          alt={d.label}
                          className="h-20 w-full rounded-lg object-cover transition-opacity hover:opacity-90"
                        />
                      )}
                      <span className="text-center text-[0.65rem] text-gray-400">{d.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400">No documents uploaded yet.</p>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <button
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300"
            >
              Close
            </button>
            {mayEdit && (
              <>
                <button
                  onClick={() => onManagePhotos(vehicle)}
                  className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Manage Photos
                </button>
                {onManageDocuments && (
                  <button
                    onClick={() => onManageDocuments(vehicle)}
                    className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Manage Documents
                  </button>
                )}
                <button
                  onClick={() => onEdit(vehicle)}
                  className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Edit Vehicle
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ImageLightbox src={lightbox?.src} label={lightbox?.label} onClose={() => setLightbox(null)} />
    </div>
  );
}
