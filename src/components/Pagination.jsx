function getPageNumbers(page, totalPages) {
  const forwardCount = 3; // current page + next 3
  const backCount = 3; // last 3 pages

  // Small page counts: just show every page, no truncation needed.
  if (totalPages <= forwardCount + backCount + 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set([1]); // always keep page 1 reachable
  for (let i = 0; i <= forwardCount; i++) {
    const p = page + i;
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  for (let i = 0; i < backCount; i++) {
    const p = totalPages - i;
    if (p >= 1) pages.add(p);
  }

  const sorted = [...pages].sort((a, b) => a - b);

  const withGaps = [];
  sorted.forEach((p, idx) => {
    if (idx > 0 && p - sorted[idx - 1] > 1) withGaps.push('gap');
    withGaps.push(p);
  });
  return withGaps;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange }) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = getPageNumbers(page, totalPages);

  return (
    <div className="mt-3 flex flex-col items-center gap-1.5">
      <div className="flex flex-wrap items-center justify-center gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white"
        >
          ← Back
        </button>

        {pages.map((p, idx) =>
          p === 'gap' ? (
            <span key={`gap-${idx}`} className="px-1 text-xs text-gray-400">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                p === page
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="flex h-7 cursor-pointer items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-white"
        >
          Next →
        </button>
      </div>

      <span className="text-[0.7rem] text-gray-400">
        Showing {from}-{to} of {total} entries
      </span>
    </div>
  );
}
