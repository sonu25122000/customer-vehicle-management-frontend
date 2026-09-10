import { CrownIcon, CheckCircleIcon, AlertCircleIcon } from './icons';

const STYLES = {
  VIP: { className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', Icon: CrownIcon },
  Good: { className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', Icon: CheckCircleIcon },
  Bad: { className: 'bg-red-50 text-red-700 ring-1 ring-red-200', Icon: AlertCircleIcon },
};

export default function CustomerTypeBadge({ type }) {
  const style = STYLES[type] || STYLES.Good;
  const Icon = style.Icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${style.className}`}>
      <Icon className="h-3 w-3" />
      {type || 'Good'}
    </span>
  );
}
