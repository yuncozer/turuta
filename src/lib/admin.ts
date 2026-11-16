import "server-only";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getServerClient } from "@/lib/supabase/server";

/** Devuelve la sesión de administrador, o null si quien llama no lo es (para rutas API). */
export async function getAdmin() {
  if (!isSupabaseConfigured) return null;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? { supabase, user: data.user } : null;
}

/** Verifica que quien llama sea administrador. Usar en cada página y Server Action del panel. */
export async function requireAdmin() {
  if (!isSupabaseConfigured) redirect("/");
  const admin = await getAdmin();
  if (!admin) redirect("/ingresar?next=/admin");
  return admin;
}

/** "YYYY-MM-DDTHH:mm" en hora de Venezuela, para <input type="datetime-local">. */
export function toVeInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 4 * 3600_000);
  return d.toISOString().slice(0, 16);
}

/** Convierte el valor de <input type="datetime-local"> (hora de Venezuela) a ISO. */
export const fromVeInput = (value: string) => new Date(`${value}:00-04:00`).toISOString();

/** Extrae coordenadas de un enlace de Google Maps (formatos "@lat,lng", "q=lat,lng", "!3dlat!4dlng"). */
export function parseLatLng(url: string): { lat: number; lng: number } | null {
  const patterns = [/@(-?\d+\.\d+),(-?\d+\.\d+)/, /[?&](?:q|query|destination|ll)=(-?\d+\.\d+),\s*(-?\d+\.\d+)/, /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return { lat: Number(m[1]), lng: Number(m[2]) };
  }
  return null;
}

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
