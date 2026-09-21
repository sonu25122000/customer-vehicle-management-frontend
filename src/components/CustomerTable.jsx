import { useSelector } from 'react-redux';
import StarRating from './StarRating';
import CustomerTypeBadge from './CustomerTypeBadge';
import ProfileVerifiedBadge from './ProfileVerifiedBadge';
import { EyeIcon, PencilIcon, TrashIcon, FileTextIcon } from './icons';
import { canEdit } from '../utils/permissions';

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const thClass =
  'px-3 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-wide text-gray-500 bg-gray-50';
const tdClass = 'px-3 py-2 align-middle text-xs text-gray-700 border-t border-gray-100';

const actionBtn =
  'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors';

export default function CustomerTable({ customers, loading, page, limit, onView, onEdit, onDelete, onDocuments }) {
  const mayEdit = canEdit(useSelector((state) => state.auth.admin?.role));

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="animate-pulse divide-y divide-gray-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 px-4 py-4">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-4 w-20 rounded bg-gray-200" />
              <div className="h-4 w-16 rounded bg-gray-200" />
              <div className="ml-auto h-4 w-28 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="rounded-xl bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
        No customers found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="w-full min-w-[980px] border-collapse text-xs">
        <thead>
          <tr>
            <th className={`${thClass} w-10`}>#</th>
            <th className={thClass}>Name</th>
            <th className={thClass}>Mobile 1</th>
            <th className={thClass}>Mobile 2</th>
            <th className={thClass}>Customer Type</th>
            <th className={thClass}>Profile Verified</th>
            <th className={thClass}>Last Booked Date</th>
            <th className={thClass}>Rating</th>
            <th className={`${thClass} whitespace-nowrap`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, i) => (
            <tr key={c._id} className="transition-colors hover:bg-gray-50">
              <td className={`${tdClass} text-gray-400`}>{(page - 1) * limit + i + 1}</td>
              <td className={`${tdClass} font-semibold text-gray-900`}>{c.name}</td>
              <td className={tdClass}>{c.mobile1}</td>
              <td className={tdClass}>{c.mobile2 || '-'}</td>
              <td className={tdClass}>
                <CustomerTypeBadge type={c.customerType} />
              </td>
              <td className={tdClass}>
                <ProfileVerifiedBadge status={c.profileVerified} />
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>{formatDate(c.lastBookedDate)}</td>
              <td className={tdClass}>
                <StarRating value={c.rating || 0} readOnly size="sm" />
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onView(c)}
                    title="View"
                    aria-label="View"
                    className={`${actionBtn} bg-blue-50 text-blue-600 hover:bg-blue-100`}
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                  </button>
                  {mayEdit && (
                    <>
                      <button
                        onClick={() => onEdit(c)}
                        title="Edit"
                        aria-label="Edit"
                        className={`${actionBtn} bg-gray-100 text-gray-600 hover:bg-gray-200`}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDocuments(c)}
                        title="Documents"
                        aria-label="Documents"
                        className={`${actionBtn} bg-violet-50 text-violet-600 hover:bg-violet-100`}
                      >
                        <FileTextIcon className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(c)}
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
