"use client";

import Link from "next/link";
import { useMemo } from "react";
import { distanceMeters } from "@/lib/format";
import type { Merchant } from "@/lib/types";
import { PinIcon } from "./icons";
import { MerchantRow } from "./merchant-row";
import { useLocation } from "./use-location";

/** "Cerca de ti": con permiso, ordena los locales por distancia. */
export function NearbyMerchants({ merchants, couponMerchantIds }: { merchants: Merchant[]; couponMerchantIds: string[] }) {
  const { status, coords, request } = useLocation();
  const withCoupon = new Set(couponMerchantIds);

  const sorted = useMemo(() => {
    const list = merchants.map((m) => ({
      merchant: m,
      distance: coords && m.lat !== null && m.lng !== null ? distanceMeters(coords, { lat: m.lat, lng: m.lng }) : null,
    }));
    if (coords) list.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return list.slice(0, 6);
  }, [merchants, coords]);

  return (
    <section aria-labelledby="cerca" className="px-4">
      <div className="flex items-baseline justify-between">
        <h2 id="cerca" className="text-lg font-bold">Cerca de ti</h2>
        {status === "granted" ? (
          <span className="flex items-center gap-1 text-xs text-muted"><PinIcon width={12} height={12} /> Ubicación activa</span>
        ) : (
          <button type="button" onClick={request} className="text-xs font-semibold text-brand-700" disabled={status === "asking"}>
            {status === "asking" ? "Buscando…" : status === "denied" ? "Ubicación bloqueada" : "Activar ubicación"}
          </button>
        )}
      </div>
      {status === "denied" && <p className="mt-1 text-xs text-muted">Permite la ubicación en tu navegador para ordenar por distancia.</p>}
      <ul className="mt-2 space-y-2">
        {sorted.map(({ merchant, distance }) => (
          <li key={merchant.id}>
            <MerchantRow merchant={merchant} distance={distance} hasCoupon={withCoupon.has(merchant.id)} />
          </li>
        ))}
      </ul>
      <Link href="/comercios" className="mt-3 block text-center text-sm font-semibold text-brand-700">Ver todos los comercios</Link>
    </section>
  );
}
