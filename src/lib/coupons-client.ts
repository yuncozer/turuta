"use client";

import { getBrowserClient } from "@/lib/supabase/client";

export type MyClaim = {
  id: string;
  code: string;
  claimed_at: string;
  redeemed_at: string | null;
  coupon: {
    id: string;
    title: string;
    terms: string;
    valid_until: string;
    merchant: { name: string; slug: string; lat: number | null; lng: number | null; maps_url: string | null; location_label: string } | null;
  } | null;
};

const CACHE_KEY = "fiss:my-claims";

const errorMessages: Record<string, string> = {
  auth_required: "Inicia sesión para obtener el cupón.",
  consent_required: "Acepta la Política de Privacidad en tu perfil para obtener cupones.",
  sold_out: "Este cupón se agotó.",
  coupon_unavailable: "Este cupón ya no está disponible.",
};

export function claimErrorMessage(error: { message?: string } | null) {
  const key = Object.keys(errorMessages).find((k) => error?.message?.includes(k));
  return key ? errorMessages[key] : "No pudimos obtener el cupón. Revisa tu conexión e inténtalo de nuevo.";
}

export async function claimCoupon(couponId: string) {
  const supabase = getBrowserClient();
  if (!supabase) return { code: null, error: "La app está en modo demo." };
  const { data, error } = await supabase.rpc("claim_coupon", { p_coupon_id: couponId });
  if (error) return { code: null, error: claimErrorMessage(error), reason: error.message };
  return { code: (data as { code: string }).code, error: null };
}

/** Mis cupones. Se guardan en el teléfono para poder mostrarlos en caja aunque falle la señal. */
export async function fetchMyClaims(): Promise<{ claims: MyClaim[]; offline: boolean }> {
  const supabase = getBrowserClient();
  if (!supabase) return { claims: [], offline: false };
  const { data, error } = await supabase
    .from("coupon_claims")
    .select(
      "id, code, claimed_at, redeemed_at, coupon:coupons(id, title, terms, valid_until, merchant:merchants(name, slug, lat, lng, maps_url, location_label))",
    )
    .order("claimed_at", { ascending: false });
  if (error) return { claims: readCachedClaims(), offline: true };
  const claims = data as unknown as MyClaim[];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(claims));
  } catch {}
  return { claims, offline: false };
}

export function readCachedClaims(): MyClaim[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function clearCachedClaims() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}
