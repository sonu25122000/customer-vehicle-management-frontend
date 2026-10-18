import { ShieldIcon, UserIcon } from './icons';

// Who created a customer / trip: from the admin portal, or the customer themselves on the customer site.
const STYLES = {
  admin: { className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200', Icon: ShieldIcon, label: 'Admin' },
  customer: { className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', Icon: UserIcon, label: 'Guest' },
};

export default function CreatedByBadge({ value }) {
  const style = STYLES[value] || STYLES.admin;
  const Icon = style.Icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${style.className}`}>
      <Icon className="h-3 w-3" />
      {style.label}
    </span>
  );
}
