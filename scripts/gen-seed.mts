/**
 * Genera supabase/seed.sql a partir de src/lib/demo-data.ts.
 * Uso: npm run db:seed   (Node 22.18+ ejecuta TypeScript directamente)
 */
import { writeFileSync } from "node:fs";
import { demoCategories, demoCoupons, demoEvents, demoMerchants } from "../src/lib/demo-data.ts";

const lit = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

const insert = (table: string, rows: Record<string, unknown>[], cols: string[]) =>
  `insert into public.${table} (${cols.join(", ")}) values\n` +
  rows.map((r) => `  (${cols.map((c) => lit(r[c])).join(", ")})`).join(",\n") +
  `\non conflict do nothing;\n`;

const sql = [
  "-- Generado por scripts/gen-seed.ts — no editar a mano.",
  "-- Datos de ejemplo para desarrollo y la Beta. PIN de validación de todos los comercios: 1234.",
  "",
  insert("categories", demoCategories, ["slug", "name", "kind", "sort_order"]),
  insert("merchants", demoMerchants, [
    "id", "slug", "name", "category", "description", "maps_url", "lat", "lng", "location_label",
    "whatsapp", "instagram", "opening_hours", "opens_at", "closes_at", "plan", "popular_rank", "is_published",
  ]),
  insert("events", demoEvents, ["id", "title", "category", "venue", "description", "starts_at", "ends_at", "is_published"]),
  insert("coupons", demoCoupons, ["id", "merchant_id", "title", "terms", "kind", "total_quota", "valid_until", "is_active"]),
  "update public.merchant_secrets set pin_hash = extensions.crypt('1234', extensions.gen_salt('bf')) where pin_hash is null;",
  "",
  "insert into public.settings (key, value) values",
  "  ('privacy_version', '\"2026-11\"'),",
  "  ('soft_gate_views', '5')",
  "on conflict do nothing;",
  "",
].join("\n");

writeFileSync(new URL("../supabase/seed.sql", import.meta.url), sql);
console.log("supabase/seed.sql generado");
