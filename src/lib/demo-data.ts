/**
 * Datos de ejemplo de la FISS 2027.
 * - Se usan en "modo demo" (sin Supabase configurado) para navegar la parte pública.
 * - `npm run db:seed` genera supabase/seed.sql a partir de este archivo.
 * Comercios, horarios y promociones son ficticios.
 */
import type { Category, Coupon, FairEvent, Merchant } from "./types";

export const demoCategories: Category[] = [
  { slug: "comida", name: "Comida", kind: "comercio", sort_order: 1 },
  { slug: "bebidas", name: "Bebidas", kind: "comercio", sort_order: 2 },
  { slug: "infantil", name: "Infantil", kind: "comercio", sort_order: 3 },
  { slug: "servicios", name: "Servicios", kind: "comercio", sort_order: 4 },
  { slug: "ventas", name: "Ventas", kind: "comercio", sort_order: 5 },
  { slug: "toros", name: "Toros", kind: "evento", sort_order: 1 },
  { slug: "conciertos", name: "Conciertos", kind: "evento", sort_order: 2 },
  { slug: "deportes", name: "Deportes", kind: "evento", sort_order: 3 },
  { slug: "cultura", name: "Cultura", kind: "evento", sort_order: 4 },
  { slug: "exposiciones", name: "Exposiciones", kind: "evento", sort_order: 5 },
];

const m = (
  n: number,
  data: Omit<Merchant, "id" | "is_published" | "logo_url" | "banner_url" | "instagram" | "maps_url"> &
    Partial<Pick<Merchant, "instagram" | "maps_url">>,
): Merchant => ({
  id: `00000000-0000-4000-8000-0000000000${String(n).padStart(2, "0")}`,
  is_published: true,
  logo_url: null,
  banner_url: null,
  instagram: data.instagram ?? null,
  maps_url: data.maps_url ?? null,
  ...data,
});

export const demoMerchants: Merchant[] = [
  m(1, {
    slug: "pizzeria-antonio",
    name: "Pizzería Antonio",
    category: "comida",
    description: "Pizzas al horno de leña y pastas caseras. Zona gastronómica de Pueblo Nuevo.",
    lat: 7.7853,
    lng: -72.2148,
    location_label: "Pueblo Nuevo, stand 4",
    whatsapp: "584140000001",
    opening_hours: "12:00 m – 11:00 pm",
    opens_at: "12:00",
    closes_at: "23:00",
    plan: "premium",
    popular_rank: 1,
  }),
  m(2, {
    slug: "parque-mundo-feria",
    name: "Parque Mundo Feria",
    category: "infantil",
    description: "Atracciones mecánicas, inflables y juegos para toda la familia.",
    lat: 7.7841,
    lng: -72.2131,
    location_label: "Recinto ferial, área infantil",
    whatsapp: "584140000002",
    opening_hours: "3:00 pm – 11:00 pm",
    opens_at: "15:00",
    closes_at: "23:00",
    plan: "premium",
    popular_rank: 2,
  }),
  m(3, {
    slug: "hamburguesas-daniel",
    name: "Hamburguesas Daniel",
    category: "comida",
    description: "Hamburguesas artesanales a la parrilla, papas rústicas y malteadas. Stand 12, zona gastronómica de Asogata.",
    lat: 7.7759,
    lng: -72.2217,
    location_label: "Asogata, stand 12",
    whatsapp: "584140000003",
    instagram: "hamburguesasdaniel",
    opening_hours: "11:00 am – 11:00 pm",
    opens_at: "11:00",
    closes_at: "23:00",
    plan: "destacado",
    popular_rank: 3,
  }),
  m(4, {
    slug: "cerveceria-andina",
    name: "Cervecería Andina",
    category: "bebidas",
    description: "Cerveza artesanal tachirense y picadas para compartir antes del concierto.",
    lat: 7.7869,
    lng: -72.2109,
    location_label: "Polideportivo de Pueblo Nuevo, entrada principal",
    whatsapp: "584140000004",
    opening_hours: "4:00 pm – 2:00 am",
    opens_at: "16:00",
    closes_at: "02:00",
    plan: "basico",
    popular_rank: null,
  }),
  m(5, {
    slug: "dulces-tipicos-la-abuela",
    name: "Dulces Típicos La Abuela",
    category: "ventas",
    description: "Dulces andinos, pastelitos y café de altura para llevar.",
    lat: 7.7672,
    lng: -72.2251,
    location_label: "Plaza Bolívar, toldo 3",
    whatsapp: "584140000005",
    opening_hours: "8:00 am – 9:00 pm",
    opens_at: "08:00",
    closes_at: "21:00",
    plan: "basico",
    popular_rank: null,
  }),
  m(6, {
    slug: "farmacia-feria-24h",
    name: "Farmacia Feria 24h",
    category: "servicios",
    description: "Medicinas, protector solar e hidratación. Abierta toda la noche durante la feria.",
    lat: 7.7801,
    lng: -72.2176,
    location_label: "Av. España, frente al recinto",
    whatsapp: "584140000006",
    opening_hours: "Abierto 24 horas",
    opens_at: "00:00",
    closes_at: "23:59",
    plan: "basico",
    popular_rank: null,
  }),
];

// La FISS 2027 se celebra en enero. Fechas en hora de Venezuela (UTC−4).
const at = (day: number, time: string) => `2027-01-${String(day).padStart(2, "0")}T${time}:00-04:00`;

const e = (n: number, data: Omit<FairEvent, "id" | "is_published" | "description" | "ends_at"> & { description?: string }): FairEvent => ({
  id: `00000000-0000-4000-9000-0000000000${String(n).padStart(2, "0")}`,
  is_published: true,
  ends_at: null,
  description: data.description ?? "",
  ...data,
});

export const demoEvents: FairEvent[] = [
  e(1, { title: "Media Maratón San Sebastián", category: "deportes", venue: "Plaza Bolívar", starts_at: at(28, "06:30") }),
  e(2, { title: "Expo Táchira", category: "exposiciones", venue: "Pabellones Venezuela y Colombia", starts_at: at(28, "10:00") }),
  e(3, { title: "Corrida de toros", category: "toros", venue: "Plaza Monumental de Pueblo Nuevo", starts_at: at(28, "16:00") }),
  e(4, { title: "Gran Parada de Campeones", category: "cultura", venue: "Asogata", starts_at: at(28, "19:00") }),
  e(5, { title: "Concierto Gigante de la Feria", category: "conciertos", venue: "Polideportivo de Pueblo Nuevo", starts_at: at(28, "20:00") }),
  e(6, { title: "Expo Táchira", category: "exposiciones", venue: "Pabellones Venezuela y Colombia", starts_at: at(29, "10:00") }),
  e(7, { title: "Corrida de toros", category: "toros", venue: "Plaza Monumental de Pueblo Nuevo", starts_at: at(29, "16:00") }),
  e(8, { title: "Noche de música llanera", category: "conciertos", venue: "Concha acústica del Parque Metropolitano", starts_at: at(29, "20:00") }),
  e(9, { title: "Vuelta al Táchira en bicicleta — etapa urbana", category: "deportes", venue: "Av. Libertador", starts_at: at(30, "08:00") }),
  e(10, { title: "Corrida de toros", category: "toros", venue: "Plaza Monumental de Pueblo Nuevo", starts_at: at(30, "16:00") }),
  e(11, { title: "Coronación de la Reina de la Feria", category: "cultura", venue: "Polideportivo de Pueblo Nuevo", starts_at: at(30, "20:00") }),
  e(12, { title: "Corrida de toros de clausura", category: "toros", venue: "Plaza Monumental de Pueblo Nuevo", starts_at: at(31, "16:00") }),
  e(13, { title: "Concierto de cierre", category: "conciertos", venue: "Polideportivo de Pueblo Nuevo", starts_at: at(31, "20:00") }),
];

const c = (n: number, data: Omit<Coupon, "id" | "is_active" | "remaining">): Coupon => ({
  id: `00000000-0000-4000-a000-0000000000${String(n).padStart(2, "0")}`,
  is_active: true,
  remaining: data.total_quota,
  ...data,
});

export const demoCoupons: Coupon[] = [
  c(1, {
    merchant_id: demoMerchants[0].id,
    title: "Pizza pequeña gratis",
    terms: "Por la compra de una pizza familiar. 1 por persona.",
    kind: "cupo",
    total_quota: 100,
    valid_until: "2027-01-31T23:59:00-04:00",
  }),
  c(2, {
    merchant_id: demoMerchants[1].id,
    title: "2x1 en atracciones",
    terms: "Válido de lunes a jueves en atracciones seleccionadas.",
    kind: "cupo",
    total_quota: 200,
    valid_until: "2027-01-31T23:59:00-04:00",
  }),
  c(3, {
    merchant_id: demoMerchants[2].id,
    title: "2x1 en hamburguesa clásica",
    terms: "Válido hasta el 31 de enero. 1 por persona.",
    kind: "cupo",
    total_quota: 60,
    valid_until: "2027-01-31T23:59:00-04:00",
  }),
  c(4, {
    merchant_id: demoMerchants[3].id,
    title: "10 % mostrando la app",
    terms: "Promoción abierta para usuarios registrados. Muestra tu código en caja.",
    kind: "abierta",
    total_quota: null,
    valid_until: "2027-02-15T23:59:00-04:00",
  }),
];
