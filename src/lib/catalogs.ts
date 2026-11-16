/** Municipios del estado Táchira, para el perfil del visitante. */
export const MUNICIPALITIES = [
  "San Cristóbal", "Cárdenas", "Guásimos", "Torbes", "Independencia", "Libertad", "Andrés Bello",
  "Antonio Rómulo Costa", "Ayacucho", "Bolívar", "Córdoba", "Fernández Feo", "Francisco de Miranda",
  "García de Hevia", "Jáuregui", "José María Vargas", "Junín", "Libertador", "Lobatera", "Michelena",
  "Panamericano", "Pedro María Ureña", "Rafael Urdaneta", "Samuel Darío Maldonado", "San Judas Tadeo",
  "Seboruco", "Simón Rodríguez", "Sucre", "Uribante", "Otro estado de Venezuela", "Fuera de Venezuela",
] as const;

export const INTERESTS = [
  { value: "comida", label: "Comida" },
  { value: "bebidas", label: "Bebidas" },
  { value: "conciertos", label: "Conciertos" },
  { value: "toros", label: "Toros" },
  { value: "deportes", label: "Deportes" },
  { value: "infantil", label: "Plan familiar" },
  { value: "cultura", label: "Cultura" },
  { value: "compras", label: "Compras" },
  { value: "exposiciones", label: "Exposiciones" },
] as const;

/** Solo permite redirecciones internas (evita redirecciones abiertas). */
export function safeNext(next: string | null | undefined, fallback = "/") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}
