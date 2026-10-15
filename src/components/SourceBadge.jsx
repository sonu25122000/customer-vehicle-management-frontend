// Where a trip was booked: Direct (with us, including the website) or Zoomcar.
export default function SourceBadge({ source }) {
  const value = source || 'Direct';
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
        value === 'Zoomcar' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-sky-50 text-sky-700 ring-1 ring-sky-100'
      }`}
    >
      {value}
    </span>
  );
}
