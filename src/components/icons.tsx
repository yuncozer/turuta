// Iconos de trazo (24×24). Sin dependencias externas para mantener el paquete liviano.
type P = React.SVGProps<SVGSVGElement>;
const base = (d: React.ReactNode) =>
  function Icon(props: P) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" width={20} height={20} aria-hidden {...props}>
        {d}
      </svg>
    );
  };

export const HomeIcon = base(<><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></>);
export const CalendarIcon = base(<><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></>);
export const TagIcon = base(<><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" /><circle cx="7.5" cy="7.5" r="1.5" /></>);
export const UserIcon = base(<><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></>);
export const SearchIcon = base(<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>);
export const PinIcon = base(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const ClockIcon = base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const ChatIcon = base(<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z" />);
export const BackIcon = base(<path d="m15 18-6-6 6-6" />);
export const ScanIcon = base(<><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></>);
export const CheckIcon = base(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const XIcon = base(<path d="M6 6l12 12M18 6 6 18" />);
export const DownloadIcon = base(<><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5" /><path d="M4 17v3h16v-3" /></>);
export const StarIcon = base(<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9Z" />);
export const NavigationIcon = base(<path d="M3 11 21 3l-8 18-2-8-8-2Z" />);
