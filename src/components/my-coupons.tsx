"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMyClaims, readCachedClaims, type MyClaim } from "@/lib/coupons-client";
import { formatDate } from "@/lib/format";
import type { Coupon } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { CouponTicket } from "./coupon-ticket";
import { PageHeader, buttonStyles } from "./ui";

type Offer = Coupon & { merchant: { name: string; slug: string } };

export function MyCoupons({ offers }: { offers: Offer[] }) {
  const { configured, loading, user } = useAuth();
  const params = useSearchParams();
  const router = useRouter();
  const [claims, setClaims] = useState<MyClaim[] | null>(null);
  const [offline, setOffline] = useState(false);
  const selected = params.get("ver");

  useEffect(() => {
    if (!user) return;
    // Primero lo guardado en el teléfono (funciona sin señal), luego lo actualizado.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura del almacenamiento local
    setClaims(readCachedClaims());
    fetchMyClaims().then((r) => {
      setClaims(r.claims);
      setOffline(r.offline);
    });
  }, [user]);

  const open = selected ? claims?.find((c) => c.code === selected) : null;
  if (open) return <CouponTicket claim={open} onClose={() => router.push("/cupones")} />;

  const claimedIds = new Set(claims?.map((c) => c.coupon?.id));
  const available = offers.filter((o) => !claimedIds.has(o.id));

  return (
    <>
      <PageHeader title="Cupones" subtitle="Beneficios reales en los locales de la feria" />
      <main className="space-y-6 px-4 py-4">
        {configured && !loading && !user && (
          <div className="rounded-2xl bg-white p-4">
            <p className="font-semibold">Tus cupones aparecen aquí</p>
            <p className="mt-1 text-sm text-muted">Crea tu cuenta gratis con solo tres datos para obtener cupones con QR.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/registro?next=/cupones" className={buttonStyles.primary}>Crear cuenta</Link>
              <Link href="/ingresar?next=/cupones" className={buttonStyles.secondary}>Ingresar</Link>
            </div>
          </div>
        )}

        {user && (
          <section aria-labelledby="mis-cupones">
            <h2 id="mis-cupones" className="text-lg font-bold">Mis cupones</h2>
            {offline && <p className="mt-1 text-xs text-muted">Sin conexión: mostrando los cupones guardados en tu teléfono.</p>}
            {selected && claims && !open && <p className="mt-1 text-sm text-danger">No encontramos ese cupón en tu cuenta.</p>}
            <ul className="mt-2 space-y-2">
              {claims?.map((c) => (
                <li key={c.id}>
                  <Link href={`/cupones?ver=${c.code}`} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white p-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.coupon?.title ?? "Cupón"}</p>
                      <p className="truncate text-xs text-muted">{c.coupon?.merchant?.name} · {c.code}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${c.redeemed_at ? "bg-line text-muted" : "bg-ok-100 text-ok"}`}>
                      {c.redeemed_at ? "Usado" : "Sin usar"}
                    </span>
                  </Link>
                </li>
              ))}
              {claims?.length === 0 && <li className="text-sm text-muted">Aún no tienes cupones. Elige uno abajo.</li>}
            </ul>
          </section>
        )}

        <section aria-labelledby="disponibles">
          <h2 id="disponibles" className="text-lg font-bold">Promociones disponibles</h2>
          <ul className="mt-2 space-y-2">
            {available.map((o) => (
              <li key={o.id}>
                <Link href={`/comercios/${o.merchant.slug}`} className="block rounded-2xl border border-dashed border-accent-500 bg-white p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-accent-600">{o.merchant.name}</p>
                  <p className="font-semibold">{o.title}</p>
                  <p className="text-xs text-muted">
                    {o.kind === "abierta" ? "Sin límite para registrados" : "Cupos limitados"} · hasta el {formatDate(o.valid_until)}
                  </p>
                </Link>
              </li>
            ))}
            {available.length === 0 && <li className="text-sm text-muted">Ya tienes todas las promociones activas.</li>}
          </ul>
        </section>
      </main>
    </>
  );
}
