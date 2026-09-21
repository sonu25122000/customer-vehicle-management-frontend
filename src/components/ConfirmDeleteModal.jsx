export default function ConfirmDeleteModal({
  target,
  title = 'Delete Customer',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  busyLabel = 'Deleting...',
  verb = 'delete',
  onCancel,
  onConfirm,
  deleting,
}) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/55 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onCancel}
            aria-label="Close"
            className="text-2xl leading-none text-gray-400 transition-colors hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col gap-1 p-6">
          <div className="mb-1 flex items-start gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M12 9v4" strokeLinecap="round" />
                <path d="M12 16.5h.01" strokeLinecap="round" />
                <path
                  d="M10.3 4.2 2.9 17a1.8 1.8 0 0 0 1.6 2.7h15a1.8 1.8 0 0 0 1.6-2.7L13.7 4.2a1.8 1.8 0 0 0-3.4 0Z"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <p className="pt-1 text-sm text-gray-800">
              Are you sure you want to {verb} <strong>{target.name}</strong>
              {target.detail ? ` (${target.detail})` : ''}?
            </p>
          </div>
          <p className="mb-4 pl-12 text-xs text-gray-500">{message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="rounded-lg bg-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? busyLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
