"use client";

import { useEffect } from "react";
import { mapsLink, whatsappLink } from "@/lib/format";
import { track } from "@/lib/track";
import type { Merchant } from "@/lib/types";
import { useAuth } from "./auth-provider";
import { ChatIcon, PinIcon } from "./icons";
import { useSoftGate } from "./soft-gate";
import { buttonStyles } from "./ui";

/** Registra una vista por sesión y cuenta la consulta para la invitación a registrarse. */
export function MerchantTracker({ merchantId }: { merchantId: string }) {
  const { countConsult } = useSoftGate();
  useEffect(() => {
    const key = `fiss:viewed:${merchantId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    track(merchantId, "views");
    countConsult();
  }, [merchantId, countConsult]);
  return null;
}

export function MerchantActions({ merchant }: { merchant: Merchant }) {
  const { user } = useAuth();
  const { countConsult } = useSoftGate();
  return (
    <div className="mt-4 grid grid-cols-2 gap-3 pb-6">
      <a
        href={mapsLink(merchant)}
        target="_blank"
        rel="noopener"
        onClick={() => {
          track(merchant.id, "map_clicks");
          if (!user) countConsult();
        }}
        className={buttonStyles.secondary}
      >
        <PinIcon width={18} height={18} /> Ver ubicación
      </a>
      {merchant.whatsapp ? (
        <a
          href={whatsappLink(merchant.whatsapp, `Hola, te encontré en la app Tú Ruta.`)}
          target="_blank"
          rel="noopener"
          onClick={() => {
            track(merchant.id, "whatsapp_clicks");
            if (!user) countConsult();
          }}
          className={buttonStyles.secondary}
        >
          <ChatIcon width={18} height={18} /> WhatsApp
        </a>
      ) : (
        <span />
      )}
    </div>
  );
}
