"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { claimCoupon } from "@/lib/coupons-client";
import { formatDate } from "@/lib/format";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Coupon } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { TagIcon } from "./icons";
import { buttonStyles } from "./ui";

/** Tarjeta de promoción en la ficha del local. Los cupos restantes se consultan en vivo. */
export function CouponOffer({ coupon, merchantSlug }: { coupon: Coupon; merchantName: string; merchantSlug: string }) {
  const router = useRouter();
  const { configured, user, profile, loading } = useAuth();
  const [remaining, setRemaining] = useState(coupon.remaining);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase || coupon.kind !== "cupo") return;
    supabase
      .from("coupons")
      .select("remaining")
      .eq("id", coupon.id)
      .maybeSingle()
      .then(({ data }) => data && setRemaining(data.remaining));
  }, [coupon.id, coupon.kind]);

  const soldOut = coupon.kind === "cupo" && remaining !== null && remaining <= 0;

  async function obtain() {
    setError(null);
    if (!configured) {
      setError("Modo demo: configura Supabase para obtener cupones.");
      return;
    }
    const here = `/comercios/${merchantSlug}`;
    if (!user) {
      router.push(`/registro?next=${encodeURIComponent(here)}`);
      return;
    }
    if (!profile?.consent_at) {
      router.push(`/perfil?next=${encodeURIComponent(here)}`);
      return;
    }
    setBusy(true);
    const res = await claimCoupon(coupon.id);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      if (res.reason?.includes("sold_out")) setRemaining(0);
      return;
    }
    router.push(`/cupones?ver=${res.code}`);
  }

  return (
    <section className="rounded-2xl border-2 border-dashed border-accent-500 bg-accent-100/60 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-600">
        {coupon.kind === "abierta" ? "Promoción para registrados" : soldOut ? "Cupón agotado" : `Cupón · quedan ${remaining}`}
      </p>
      <h2 className="mt-1 font-bold">{coupon.title}</h2>
      <p className="text-xs text-muted">
        {coupon.terms} Válido hasta el {formatDate(coupon.valid_until)}.
      </p>
      <button type="button" onClick={obtain} disabled={busy || soldOut || loading} className={`${buttonStyles.primary} mt-3 w-full`}>
        <TagIcon width={18} height={18} />
        {busy ? "Obteniendo…" : soldOut ? "Agotado" : coupon.kind === "abierta" ? "Obtener código" : "Obtener cupón"}
      </button>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </section>
  );
}
