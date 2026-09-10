function base(props) {
  return { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', ...props };
}

export function CarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 16.5V12l1.8-4.5A2 2 0 0 1 7.7 6h8.6a2 2 0 0 1 1.9 1.5L20 12v4.5" />
      <path d="M4 16.5h16v2a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1V17h-9v1.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" />
      <circle cx="7.5" cy="13.5" r="0.1" />
      <circle cx="16.5" cy="13.5" r="0.1" />
      <path d="M4 12h16" />
    </svg>
  );
}

export function CrownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4 8.5 8 11l4-5.5L16 11l4-2.5-1.4 8.3a1 1 0 0 1-1 .8H6.4a1 1 0 0 1-1-.8Z" />
      <rect x="6" y="18" width="12" height="1.8" rx="0.9" />
    </svg>
  );
}

export function CheckCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.5 2.3 2.3L15.5 9.5" />
    </svg>
  );
}

export function AlertCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

export function CameraIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.8A1 1 0 0 1 9.4 4.7h5.2a1 1 0 0 1 .9.5L16.5 7h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

export function UploadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M12 15V4M12 4 8 8M12 4l4 4" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />
    </svg>
  );
}

export function UsersIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c1.1-3.2 3.3-5 5.5-5s4.4 1.8 5.5 5" />
      <path d="M15.5 5.3a3.2 3.2 0 0 1 0 6" />
      <path d="M15 15c2 .2 3.8 1.9 4.7 5" />
    </svg>
  );
}

export function PlusCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export function ChartIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function LogoutIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M9 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4" />
      <path d="M16 16l4-4-4-4" />
      <path d="M20 12H9" />
    </svg>
  );
}

export function MenuIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M3.5 6.5h17M3.5 12h17M3.5 17.5h17" />
    </svg>
  );
}

export function SearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function EyeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M2 12c1.6-3.7 5.4-7 10-7s8.4 3.3 10 7c-1.6 3.7-5.4 7-10 7s-8.4-3.3-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PencilIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M14.5 5.5l4 4" />
    </svg>
  );
}

export function TrashIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
      <path d="M7 7l.8 12a2 2 0 0 0 2 1.9h4.4a2 2 0 0 0 2-1.9L17 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </svg>
  );
}

export function ChevronDownIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function RupeeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M6 4.5h12M6 9h12M6 4.5c4 0 7 1.3 7 4.5s-3 4.5-7 4.5h-.5L15 20" />
    </svg>
  );
}

export function StarSolidIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.5l2.9 6.2 6.7.7-5 4.6 1.4 6.7-6-3.5-6 3.5 1.4-6.7-5-4.6 6.7-.7Z" />
    </svg>
  );
}

export function FileTextIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9 12.5h6M9 15.5h6M9 9.5h2" />
    </svg>
  );
}

export function FilterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M3.5 5h17L14 13.5V19l-4 2v-7.5Z" />
    </svg>
  );
}

export function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

export function SortIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M7 5v14M7 5l-3 3M7 5l3 3" />
      <path d="M17 19V5M17 19l-3-3M17 19l3-3" />
    </svg>
  );
}

export function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.5-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}

export function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M12 3.5v11.5M12 15l-4-4M12 15l4-4" />
      <path d="M4.5 17v2A1.5 1.5 0 0 0 6 20.5h12a1.5 1.5 0 0 0 1.5-1.5v-2" />
    </svg>
  );
}

export function RouteIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="5.5" cy="6" r="2" />
      <circle cx="18.5" cy="18" r="2" />
      <path d="M5.5 8v3a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4v-1" />
    </svg>
  );
}

export function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function GaugeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M4 15a8 8 0 1 1 16 0" />
      <path d="M12 15l3.5-4.5" />
      <path d="M12 15h.01" />
    </svg>
  );
}

export function MapPinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...base(props)}>
      <path d="M12 21s7-6.5 7-11.5a7 7 0 0 0-14 0C5 14.5 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </svg>
  );
}
