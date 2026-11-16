"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { fromVeInput, parseLatLng, requireAdmin, slugify } from "@/lib/admin";
import { TAGS } from "@/lib/data";

/*
 * Acciones del panel. Cada una vuelve a verificar que quien llama es admin (la RLS
 * de la base de datos lo exige de nuevo) e invalida la caché pública que corresponda,
 * para que el cambio se vea en la app al instante.
 */

const text = (max = 500) => z.string().trim().max(max);
const optional = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));
const optionalTime = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v));

const merchantSchema = z.object({
  id: optional(64),
  name: text(120).min(2, "El nombre es obligatorio"),
  slug: text(80),
  category: text(40).min(1, "Elige una categoría"),
  description: text(600),
  location_label: text(160),
  maps_url: optional(1000),
  whatsapp: optional(30),
  instagram: optional(60),
  opening_hours: text(80),
  opens_at: optionalTime,
  closes_at: optionalTime,
  plan: z.enum(["basico", "destacado", "premium"]),
  popular_rank: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v))),
  report_email: optional(160),
  logo_url: optional(1000),
  banner_url: optional(1000),
  is_published: z.literal("on").optional(),
});

function flash(path: string, params: Record<string, string>): never {
  redirect(`${path}?${new URLSearchParams(params)}`);
}

export async function saveMerchant(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = merchantSchema.safeParse(Object.fromEntries(formData));
  const back = `/admin/comercios/${formData.get("id") || "nuevo"}`;
  if (!parsed.success) flash(back, { error: parsed.error.issues[0].message });
  const { id, is_published, ...data } = parsed.data;
  const coords = data.maps_url ? parseLatLng(data.maps_url) : null;
  const row = {
    ...data,
    slug: slugify(data.slug || data.name),
    whatsapp: data.whatsapp?.replace(/\D/g, "") || null,
    instagram: data.instagram?.replace(/^@/, "") || null,
    is_published: Boolean(is_published),
    ...(coords ?? {}),
  };

  const query = id ? supabase.from("merchants").update(row).eq("id", id).select("id").single() : supabase.from("merchants").insert(row).select("id").single();
  const { data: saved, error } = await query;
  if (error) {
    flash(back, { error: error.code === "23505" ? "Ya existe un comercio con esa dirección (slug)." : error.message });
  }
  updateTag(TAGS.merchants);
  flash(`/admin/comercios/${saved.id}`, { ok: "Comercio guardado" });
}

export async function setMerchantPin(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("merchant_id"));
  const pin = String(formData.get("pin") ?? "").trim();
  const { error } = await supabase.rpc("admin_set_merchant_pin", { p_merchant_id: id, p_pin: pin });
  flash(`/admin/comercios/${id}`, error ? { error: "El PIN debe tener entre 4 y 8 dígitos." } : { ok: "PIN actualizado" });
}

export async function regenerateMerchantLink(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get("merchant_id"));
  const { error } = await supabase.rpc("admin_regenerate_merchant_link", { p_merchant_id: id });
  flash(`/admin/comercios/${id}`, error ? { error: error.message } : { ok: "Enlace renovado: el anterior ya no funciona" });
}

const couponSchema = z.object({
  id: optional(64),
  merchant_id: z.string().uuid(),
  title: text(120).min(2, "El título del cupón es obligatorio"),
  terms: text(400),
  kind: z.enum(["cupo", "abierta"]),
  total_quota: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v))),
  valid_until: z.string().min(1, "Indica la vigencia"),
});

export async function saveCoupon(formData: FormData) {
  const { supabase } = await requireAdmin();
  const merchantId = String(formData.get("merchant_id"));
  const parsed = couponSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) flash(`/admin/comercios/${merchantId}`, { error: parsed.error.issues[0].message });
  const { id, ...c } = parsed.data;
  if (c.kind === "cupo" && (c.total_quota === null || c.total_quota < 1)) {
    flash(`/admin/comercios/${merchantId}`, { error: "Indica cuántos cupos tiene el cupón." });
  }
  const row = { ...c, total_quota: c.kind === "cupo" ? c.total_quota : null, valid_until: fromVeInput(c.valid_until) };
  const { error } = id ? await supabase.from("coupons").update(row).eq("id", id) : await supabase.from("coupons").insert(row);
  if (error) flash(`/admin/comercios/${merchantId}`, { error: error.message });
  updateTag(TAGS.coupons);
  flash(`/admin/comercios/${merchantId}`, { ok: "Cupón guardado" });
}

export async function toggleCoupon(formData: FormData) {
  const { supabase } = await requireAdmin();
  const merchantId = String(formData.get("merchant_id"));
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: formData.get("is_active") === "true" })
    .eq("id", String(formData.get("id")));
  if (error) flash(`/admin/comercios/${merchantId}`, { error: error.message });
  updateTag(TAGS.coupons);
  flash(`/admin/comercios/${merchantId}`, { ok: formData.get("is_active") === "true" ? "Cupón activado" : "Cupón pausado" });
}

const eventSchema = z.object({
  id: optional(64),
  title: text(160).min(2, "El título es obligatorio"),
  category: text(40).min(1, "Elige un tipo de evento"),
  venue: text(160),
  description: text(600),
  starts_at: z.string().min(1, "Indica fecha y hora"),
  ends_at: z.string().trim(),
  is_published: z.literal("on").optional(),
});

export async function saveEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) flash("/admin/cronograma", { error: parsed.error.issues[0].message });
  const { id, is_published, ...e } = parsed.data;
  const row = {
    ...e,
    starts_at: fromVeInput(e.starts_at),
    ends_at: e.ends_at ? fromVeInput(e.ends_at) : null,
    is_published: Boolean(is_published),
  };
  const { error } = id ? await supabase.from("events").update(row).eq("id", id) : await supabase.from("events").insert(row);
  if (error) flash("/admin/cronograma", { error: error.message });
  updateTag(TAGS.events);
  flash("/admin/cronograma", { ok: "Evento guardado" });
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").delete().eq("id", String(formData.get("id")));
  if (error) flash("/admin/cronograma", { error: error.message });
  updateTag(TAGS.events);
  flash("/admin/cronograma", { ok: "Evento eliminado" });
}
