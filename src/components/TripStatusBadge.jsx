import { RouteIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon } from './icons';

const STYLES = {
  'On Trip': { className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', Icon: RouteIcon },
  'Yet to Start': { className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', Icon: ClockIcon },
  Completed: { className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', Icon: CheckCircleIcon },
  Cancelled: { className: 'bg-red-50 text-red-700 ring-1 ring-red-200', Icon: AlertCircleIcon },
};

export default function TripStatusBadge({ status }) {
  const style = STYLES[status] || STYLES['Yet to Start'];
  const Icon = style.Icon;

  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${style.className}`}>
      <Icon className="h-3 w-3" />
      {status || 'Yet to Start'}
    </span>
  );
}
