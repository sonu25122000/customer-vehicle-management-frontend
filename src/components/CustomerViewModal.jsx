import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import StarRating from './StarRating';
import CustomerTypeBadge from './CustomerTypeBadge';
import ProfileVerifiedBadge from './ProfileVerifiedBadge';
import TripStatusBadge from './TripStatusBadge';
import ImageLightbox from './ImageLightbox';
import toast from 'react-hot-toast';
import { FileTextIcon, EyeIcon } from './icons';
import { fetchTrips } from '../api/trips';
import { fetchCustomerDocuments, documentsByType } from '../api/customerDocuments';
import { canEdit } from '../utils/permissions';

function formatMoney(value) {
  const num = Number(value || 0);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function DetailItem({ label, children, full }) {
  return (
    <div className={`flex flex-col gap-1 ${full ? 'col-span-full' : ''}`}>
      <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{children}</span>
    </div>
  );
}

function DocThumb({ label, url, onOpen }) {
  const isPdf = (url || '').startsWith('data:application/pdf');
  return (
    <button type="button" onClick={onOpen} className="flex cursor-pointer flex-col gap-1">
      {isPdf ? (
        <span className="flex h-20 w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200">
          <FileTextIcon className="h-7 w-7" />
        </span>
      ) : (
        <img src={url} alt={label} className="h-20 w-full rounded-lg object-cover transition-opacity hover:opacity-90" />
      )}
      <span className="text-center text-[0.65rem] text-gray-400">{label}</span>
    </button>
  );
}

export default function CustomerViewModal({ customer, onClose, onEdit, onDocuments }) {
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));
  const [lightbox, setLightbox] = useState(null);
  const [trips, setTrips] = useState(null);
  const [tripsError, setTripsError] = useState(false);
  // The customer record only says which document types are on file (documentTypes). The files are
  // fetched from the customer-documents API when "View Documents" is clicked, not when this opens.
  // null = not requested yet, 'loading', or { selfie: dataUri, ... }.
  const [documentFiles, setDocumentFiles] = useState(null);

  useEffect(() => {
    setDocumentFiles(null);
  }, [customer?._id]);

  async function loadDocuments() {
    setDocumentFiles('loading');
    try {
      setDocumentFiles(documentsByType(await fetchCustomerDocuments(customer._id)));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load documents');
      setDocumentFiles(null);
    }
  }

  useEffect(() => {
    if (!customer?._id) return;
    setTrips(null);
    setTripsError(false);
    fetchTrips({ customerId: customer._id, limit: 100 })
      .then((res) => setTrips(res.data))
      .catch(() => {
        setTrips([]);
        setTripsError(true);
      });
  }, [customer?._id]);

  if (!customer) return null;

  const documents = [
    { key: 'selfie', label: 'Selfie' },
    { key: 'drivingLicence', label: 'Driving Licence' },
    { key: 'aadhaar', label: 'Aadhaar' },
    { key: 'other', label: 'Other' },
  ];
  const documentTypes = customer.documentTypes || [];
  const onFile = documents.filter((d) => documentTypes.includes(d.key));
  const loaded = documentFiles && documentFiles !== 'loading' ? documents.filter((d) => documentFiles[d.key]) : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Customer Details</h2>
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
            <DetailItem label="Name">{customer.name}</DetailItem>
            <DetailItem label="Mobile 1">{customer.mobile1}</DetailItem>
            <DetailItem label="Mobile 2">{customer.mobile2 || '-'}</DetailItem>
            <DetailItem label="Customer Type">
              <CustomerTypeBadge type={customer.customerType} />
            </DetailItem>
            <DetailItem label="Profile Verified">
              <ProfileVerifiedBadge status={customer.profileVerified} />
            </DetailItem>
            <DetailItem label="Last Booked Date">{formatDate(customer.lastBookedDate)}</DetailItem>
            <DetailItem label="Rating">
              <StarRating value={customer.rating || 0} readOnly />
            </DetailItem>
            <DetailItem label="Created">{formatDateTime(customer.createdAt)}</DetailItem>
            <DetailItem label="Last Updated" full>
              {formatDateTime(customer.updatedAt)}
            </DetailItem>
          </div>

          <DetailItem label="Notes" full>
            <p className="whitespace-pre-wrap text-gray-700">{customer.notes || 'No notes added.'}</p>
          </DetailItem>

          <div>
            <span className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">
              Booking History {trips?.length ? `(${trips.length})` : ''}
            </span>
            {trips === null ? (
              <p className="text-center text-xs text-gray-400">Loading booking history...</p>
            ) : tripsError ? (
              <p className="text-center text-xs text-red-500">Failed to load booking history.</p>
            ) : trips.length === 0 ? (
              <p className="text-center text-xs text-gray-400">No trips booked yet.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full border-collapse text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                        Vehicle
                      </th>
                      <th className="px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="px-3 py-2 text-right text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500">
                        Rating
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((t) => (
                      <tr key={t._id} className="border-t border-gray-100">
                        <td className="whitespace-nowrap px-3 py-2 text-gray-700">{formatDate(t.startDate)}</td>
                        <td className="px-3 py-2">
                          <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[0.7rem] font-semibold tracking-wide text-indigo-700">
                            {t.vehicle?.vehicleNo || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <TripStatusBadge status={t.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-gray-900">
                          ₹{formatMoney(t.amount)}
                        </td>
                        <td className="px-3 py-2">
                          {t.rating ? (
                            <StarRating value={t.rating} readOnly size="sm" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <span className="mb-2 block text-[0.7rem] font-semibold uppercase tracking-wide text-gray-500">
              Documents
            </span>
            {onFile.length === 0 ? (
              <p className="text-center text-xs text-gray-400">No documents uploaded yet.</p>
            ) : documentFiles === null || documentFiles === 'loading' ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2.5">
                <span className="text-xs text-gray-600">
                  {onFile.map((d) => d.label).join(', ')} on file
                </span>
                <button
                  type="button"
                  onClick={loadDocuments}
                  disabled={documentFiles === 'loading'}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 transition-colors hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60"
                >
                  <EyeIcon className="h-3.5 w-3.5" />
                  {documentFiles === 'loading' ? 'Loading...' : 'View Documents'}
                </button>
              </div>
            ) : loaded.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {loaded.map((d) => (
                  <DocThumb
                    key={d.key}
                    label={d.label}
                    url={documentFiles[d.key]}
                    onOpen={() => setLightbox({ src: documentFiles[d.key], label: d.label })}
                  />
                ))}
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
            {mayEdit && onDocuments && (
              <button
                onClick={() => onDocuments(customer)}
                className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Manage Documents
              </button>
            )}
            {mayEdit && (
              <button
                onClick={() => onEdit(customer)}
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Edit Customer
              </button>
            )}
          </div>
        </div>
      </div>

      <ImageLightbox src={lightbox?.src} label={lightbox?.label} onClose={() => setLightbox(null)} />
    </div>
  );
}
