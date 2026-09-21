import { useSelector } from 'react-redux';
import { EyeIcon, PencilIcon, TrashIcon, CameraIcon, FileTextIcon } from './icons';
import StarRating from './StarRating';
import VehicleStatusBadge from './VehicleStatusBadge';
import { canEdit, canDelete } from '../utils/permissions';

const thClass =
  'px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50';
const tdClass = 'px-3 py-2 align-middle text-xs text-gray-700 border-t border-gray-100';
const actionBtn = 'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors';

export default function VehicleTable({
  vehicles,
  loading,
  page,
  limit,
  onView,
  onEdit,
  onDelete,
  onManagePhotos,
  onManageDocuments,
}) {
  const role = useSelector((state) => state.auth.admin?.role);
  const mayEdit = canEdit(role);
  const mayDelete = canDelete(role);

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="animate-pulse divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-28 rounded bg-gray-200" />
              <div className="ml-auto h-4 w-24 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!vehicles.length) {
    return (
      <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">No vehicles found.</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full min-w-[1250px] border-collapse text-xs">
        <thead>
          <tr>
            <th className={`${thClass} w-10`}>#</th>
            <th className={thClass}>Vehicle No.</th>
            <th className={thClass}>Type</th>
            <th className={thClass}>Category</th>
            <th className={thClass}>Status</th>
            <th className={thClass}>Make</th>
            <th className={thClass}>Model</th>
            <th className={thClass}>Year</th>
            <th className={thClass}>Owner/Host</th>
            <th className={thClass}>Owner Mobile</th>
            <th className={thClass}>Rating</th>
            <th className={`${thClass} whitespace-nowrap`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v, i) => (
            <tr key={v._id} className="transition-colors hover:bg-gray-50">
              <td className={`${tdClass} text-gray-400`}>{(page - 1) * limit + i + 1}</td>
              <td className={tdClass}>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold tracking-wide text-indigo-700">
                  {v.vehicleNo}
                </span>
              </td>
              <td className={tdClass}>{v.vehicleType}</td>
              <td className={tdClass}>{v.vehicleCategory || '-'}</td>
              <td className={tdClass}>
                <VehicleStatusBadge status={v.status} />
              </td>
              <td className={tdClass}>{v.make || '-'}</td>
              <td className={tdClass}>{v.model || '-'}</td>
              <td className={tdClass}>{v.year || '-'}</td>
              <td className={`${tdClass} font-semibold text-gray-900`}>{v.ownerName}</td>
              <td className={tdClass}>{v.ownerMobile || '-'}</td>
              <td className={tdClass}>
                {v.ratingsGiven ? (
                  <span className="flex items-center gap-1">
                    <StarRating value={v.avgRating} readOnly size="sm" />
                    <span className="text-[0.65rem] text-gray-400">({v.ratingsGiven})</span>
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onView(v)}
                    title="View"
                    aria-label="View"
                    className={`${actionBtn} bg-blue-50 text-blue-600 hover:bg-blue-100`}
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                  </button>
                  {mayEdit && (
                    <>
                      <button
                        onClick={() => onEdit(v)}
                        title="Edit"
                        aria-label="Edit"
                        className={`${actionBtn} bg-gray-100 text-gray-600 hover:bg-gray-200`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onManagePhotos(v)}
                        title="Manage Photos"
                        aria-label="Manage Photos"
                        className={`${actionBtn} bg-violet-50 text-violet-600 hover:bg-violet-100`}
                      >
                        <CameraIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onManageDocuments(v)}
                        title="Manage Documents"
                        aria-label="Manage Documents"
                        className={`${actionBtn} bg-teal-50 text-teal-600 hover:bg-teal-100`}
                      >
                        <FileTextIcon className="h-3.5 w-3.5" />
                      </button>
                      {mayDelete && (
                        <button
                          onClick={() => onDelete(v)}
                          title="Delete"
                          aria-label="Delete"
                          className={`${actionBtn} bg-red-50 text-red-600 hover:bg-red-100`}
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
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
