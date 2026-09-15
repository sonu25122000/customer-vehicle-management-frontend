const accentClasses = {
  blue: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
  violet: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
  red: 'bg-red-50 text-red-600 ring-1 ring-red-100',
  teal: 'bg-teal-50 text-teal-600 ring-1 ring-teal-100',
};

export default function StatTile({ icon: Icon, label, value, sub, accent = 'blue' }) {
  return (
    <div className="group rounded-xl border border-gray-200/70 bg-white p-5 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-bold tabular-nums text-gray-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-400">{sub}</p>}
        </div>
        <span
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${accentClasses[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
