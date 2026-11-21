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
export const ClockIcon = base(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>);
export const ChatIcon = base(<path d="M21 12a8.5 8.5 0 0 1-12.6 7.4L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z" />);
export const BackIcon = base(<path d="m15 18-6-6 6-6" />);
export const ScanIcon = base(<><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" /><path d="M7 12h10" /></>);
export const CheckIcon = base(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const XIcon = base(<path d="M6 6l12 12M18 6 6 18" />);
export const DownloadIcon = base(<><path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5" /><path d="M4 17v3h16v-3" /></>);

/*
 * Elementos gráficos oficiales del manual de Tú Ruta (flecha, ubicación, destello),
 * con sus formas originales. Rellenos con el color del texto (currentColor).
 */
const brand = (viewBox: string, d: string, evenOdd = false) =>
  function BrandIcon(props: P) {
    return (
      <svg viewBox={viewBox} width={20} height={20} aria-hidden {...props}>
        <path fill="currentColor" fillRule={evenOdd ? "evenodd" : undefined} d={d} />
      </svg>
    );
  };

/** Flecha del sistema gráfico: "ir", cómo llegar. */
export const NavigationIcon = brand(
  "54 73 50 47",
  "M102.47 75.01C95.47 89.46 88.43 103.9 81.17 118.22 79.24 110.96 77.37 103.69 75.35 96.46 69 92.57 62.67 88.66 56.35 84.72 71.61 80.99 86.99 77.72 102.47 75.01Z",
);
/** Pin de ubicación del sistema gráfico. */
export const PinIcon = brand(
  "286 72 34 48",
  "M304 73.71C310.36 74.09 316.13 78.77 317.64 85 318.94 89.97 317.51 94.7 314.99 99 311.11 105.53 306.91 111.86 303.02 118.38 298.7 111.63 294.14 104.97 290.31 97.93 288 93.75 286.97 89.08 288.43 84.42 290.3 77.75 297.16 73.21 304 73.71ZM301.47 81.5C305.33 80.71 309.34 83.13 310.25 87 311.13 90.83 308.69 94.76 305.02 95.98 300.54 97.52 295.36 93.69 295.34 89 295.25 85.49 298.09 82.22 301.47 81.5Z",
  true,
);
/** Destello del sistema gráfico: destacados y premium. */
export const StarIcon = brand(
  "349 73 36 46",
  "M367.31 74.69C368.2 79.64 368.81 85.88 371.88 90.03 374.55 93.76 379.39 95.07 383.63 96.04 378.92 97.12 374.61 98.77 371.78 102.91 368.9 107.43 368.12 112.62 367.35 117.78 366.53 112.73 365.4 106.83 362.48 102.52 359.71 98.63 355.55 97.26 351.15 96.08 355.52 95.1 360.08 93.62 362.68 89.7 365.47 85.37 366.61 79.73 367.31 74.69Z",
);
export const SunIcon = base(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
export const MoonIcon = base(<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />);
