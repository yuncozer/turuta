import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { demoCategories, demoCoupons, demoEvents, demoMerchants } from "@/lib/demo-data";
import { isSupabaseConfigured } from "@/lib/env";
import { getPublicClient } from "@/lib/supabase/server";
import type { Category, Coupon, FairEvent, Merchant } from "@/lib/types";

/*
 * Contenido público cacheado. La gran mayoría de visitas se sirve desde la caché/CDN
 * sin tocar la base de datos. Cuando el administrador guarda cambios, el panel
 * invalida la etiqueta correspondiente (updateTag) y el contenido se regenera.
 */

export const TAGS = {
  merchants: "merchants",
  events: "events",
  coupons: "coupons",
  categories: "categories",
} as const;

const MERCHANT_COLUMNS =
  "id, slug, name, category, description, logo_url, banner_url, maps_url, lat, lng, location_label, whatsapp, instagram, opening_hours, opens_at, closes_at, plan, popular_rank, is_published";

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.categories);
  if (!isSupabaseConfigured) return demoCategories;
  const { data, error } = await getPublicClient().from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
}

export async function getMerchants(): Promise<Merchant[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.merchants);
  if (!isSupabaseConfigured) return demoMerchants;
  const { data, error } = await getPublicClient()
    .from("merchants")
    .select(MERCHANT_COLUMNS)
    .eq("is_published", true)
    .order("name");
  if (error) throw error;
  return data as Merchant[];
}

export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  const merchants = await getMerchants();
  return merchants.find((m) => m.slug === slug) ?? null;
}

export async function getEvents(): Promise<FairEvent[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.events);
  if (!isSupabaseConfigured) return demoEvents;
  const { data, error } = await getPublicClient()
    .from("events")
    .select("*")
    .eq("is_published", true)
    .order("starts_at");
  if (error) throw error;
  return data;
}

export async function getCoupons(): Promise<Coupon[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(TAGS.coupons);
  if (!isSupabaseConfigured) return demoCoupons;
  const { data, error } = await getPublicClient()
    .from("coupons")
    .select("id, merchant_id, title, terms, kind, total_quota, remaining, valid_until, is_active")
    .eq("is_active", true)
    .order("created_at");
  if (error) throw error;
  return data;
}

/** Populares: anunciantes Premium y Destacados, en el orden que define el administrador. */
export function popularMerchants(merchants: Merchant[]) {
  return merchants
    .filter((m) => m.popular_rank !== null)
    .sort((a, b) => (a.popular_rank ?? 0) - (b.popular_rank ?? 0));
}
