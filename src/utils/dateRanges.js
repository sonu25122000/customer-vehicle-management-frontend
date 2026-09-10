export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Parses a 'YYYY-MM-DD' string as a local date (avoids the UTC-shift new Date('YYYY-MM-DD') causes)
export function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(iso) {
  const date = parseISODate(iso);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'custom', label: 'Custom date range' },
];

export function getPresetRange(preset) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { startDate: toISODate(today), endDate: toISODate(today) };
    case 'this_week': {
      const day = today.getDay(); // 0 = Sunday
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);
      return { startDate: toISODate(monday), endDate: toISODate(today) };
    }
    case 'last_7': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    case 'last_30': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { startDate: toISODate(start), endDate: toISODate(today) };
    }
    default:
      return { startDate: '', endDate: '' };
  }
}

export function formatDateRangeLabel(preset, startDate, endDate) {
  const presetDef = DATE_PRESETS.find((p) => p.value === preset);
  if (preset && preset !== 'custom' && presetDef) return presetDef.label;
  if (startDate && endDate) return `${startDate} → ${endDate}`;
  if (startDate) return `From ${startDate}`;
  if (endDate) return `Until ${endDate}`;
  return '';
}
