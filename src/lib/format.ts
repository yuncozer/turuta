import { FAIR_TIMEZONE } from "@/lib/env";

const tz = { timeZone: FAIR_TIMEZONE } as const;

export const formatTime = (iso: string) =>
  new Intl.DateTimeFormat("es-VE", { ...tz, hour: "numeric", minute: "2-digit", hour12: true })
    .format(new Date(iso))
    .replace(/\s/g, " ")
    .replace("a. m.", "am")
    .replace("p. m.", "pm");

/** Clave de día (YYYY-MM-DD) en hora de Venezuela. */
export const dayKey = (iso: string | Date) =>
  new Intl.DateTimeFormat("en-CA", { ...tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );

/** "Sáb 30" a partir de una clave YYYY-MM-DD. */
export const dayLabel = (key: string) => {
  const d = new Date(`${key}T12:00:00-04:00`);
  const wd = new Intl.DateTimeFormat("es-VE", { ...tz, weekday: "short" }).format(d).replace(".", "");
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${Number(key.slice(8))}`;
};

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("es-VE", { ...tz, day: "numeric", month: "short" }).format(new Date(iso)).replace(".", "");

export const formatDateTime = (iso: string) =>
  new Intl.DateTimeFormat("es-VE", { ...tz, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    .format(new Date(iso))
    .replace(".", "");

/** Distancia en metros entre dos coordenadas (fórmula de Haversine). */
export function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const formatDistance = (m: number) => (m < 1000 ? `a ${Math.round(m / 10) * 10} m` : `a ${(m / 1000).toFixed(1)} km`);

/** Enlace oficial de Google Maps (sin costo por uso). */
export function mapsLink(m: { maps_url: string | null; lat: number | null; lng: number | null; name: string }) {
  if (m.maps_url) return m.maps_url;
  if (m.lat !== null && m.lng !== null)
    return `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${m.name} San Cristóbal Táchira`)}`;
}

export const whatsappLink = (phone: string, text?: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** ¿El local está abierto ahora? (hora de Venezuela; soporta cierre después de medianoche). */
export function isOpenNow(opens: string | null, closes: string | null, now = new Date()) {
  if (!opens || !closes) return null;
  const hm = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  const cur = hm.replace("24:", "00:");
  const o = opens.slice(0, 5);
  const c = closes.slice(0, 5);
  return o <= c ? cur >= o && cur <= c : cur >= o || cur <= c;
}

export const closesLabel = (closes: string | null) => {
  if (!closes) return "";
  const [h, mm] = closes.split(":").map(Number);
  if (h === 23 && mm === 59) return "Abierto 24 h";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `Abierto hasta ${hour12}${mm ? `:${String(mm).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
};
