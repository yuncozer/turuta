"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import type { MyClaim } from "@/lib/coupons-client";
import { distanceMeters, formatDate, formatDateTime, formatDistance, mapsLink } from "@/lib/format";
import { BackIcon, DownloadIcon, NavigationIcon } from "./icons";
import { useLocation } from "./use-location";
import { buttonStyles } from "./ui";

/** Cupón con QR único. Se puede descargar como imagen para mostrarlo en caja sin señal. */
export function CouponTicket({ claim, onClose }: { claim: MyClaim; onClose: () => void }) {
  const [qr, setQr] = useState<string | null>(null);
  const { coords } = useLocation();
  const merchant = claim.coupon?.merchant;
  const expired = claim.coupon ? new Date(claim.coupon.valid_until) < new Date() : false;

  useEffect(() => {
    QRCode.toDataURL(claim.code, { width: 480, margin: 1, errorCorrectionLevel: "M" }).then(setQr);
  }, [claim.code]);

  const distance =
    coords && merchant?.lat != null && merchant?.lng != null ? distanceMeters(coords, { lat: merchant.lat, lng: merchant.lng }) : null;

  async function download() {
    if (!qr) return;
    const img = new Image();
    img.src = qr;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#3d1d6e";
    ctx.fillRect(0, 0, 720, 1000);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(40, 40, 640, 920, 32);
    ctx.fill();
    ctx.textAlign = "center";
    ctx.fillStyle = "#0f6b6b";
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText((merchant?.name ?? "").toUpperCase(), 360, 110);
    ctx.fillStyle = "#1d1530";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.fillText(claim.coupon?.title ?? "Cupón FISS 2027", 360, 170, 600);
    ctx.drawImage(img, 160, 210, 400, 400);
    ctx.font = "700 44px ui-monospace, monospace";
    ctx.fillText(claim.code, 360, 680);
    ctx.fillStyle = "#6b6478";
    ctx.font = "26px system-ui, sans-serif";
    ctx.fillText("Muestra este código en caja. Es único y de un solo uso.", 360, 740, 600);
    if (claim.coupon) ctx.fillText(`Válido hasta el ${formatDate(claim.coupon.valid_until)}`, 360, 785);
    ctx.fillStyle = "#e8622c";
    ctx.font = "700 30px system-ui, sans-serif";
    ctx.fillText("FISS 2027", 360, 900);
    const link = document.createElement("a");
    link.download = `cupon-${claim.code}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <>
      <header className="flex items-center gap-2 bg-brand-700 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
        <button type="button" onClick={onClose} aria-label="Volver" className="-ml-1 rounded-full p-1 hover:bg-white/10">
          <BackIcon />
        </button>
        <h1 className="text-xl font-bold">Tu cupón</h1>
      </header>
      <main className="px-4 py-4">
        <div className="rounded-3xl bg-white p-5 text-center shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-merchant-700">{merchant?.name}</p>
          <h2 className="mt-1 text-xl font-bold">{claim.coupon?.title}</h2>
          <div className={`relative mx-auto mt-4 aspect-square w-56 ${claim.redeemed_at || expired ? "opacity-25" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt={`Código QR del cupón ${claim.code}`} className="h-full w-full" /> : <div className="h-full w-full animate-pulse rounded-xl bg-line" />}
          </div>
          <p className="mt-3 font-mono text-xl font-bold tracking-[0.2em]">{claim.code}</p>
          {claim.redeemed_at ? (
            <p className="mt-2 rounded-xl bg-line px-3 py-2 text-sm font-semibold text-muted">Canjeado el {formatDateTime(claim.redeemed_at)}</p>
          ) : expired ? (
            <p className="mt-2 rounded-xl bg-danger-100 px-3 py-2 text-sm font-semibold text-danger">Este cupón venció</p>
          ) : (
            <p className="mt-2 text-xs text-muted">Muestra este código en caja. Es único y de un solo uso.</p>
          )}
          <button type="button" onClick={download} disabled={!qr} className={`${buttonStyles.secondary} mt-4 w-full`}>
            <DownloadIcon width={18} height={18} /> Descargar como imagen
          </button>
          <div className="mt-3 flex justify-center gap-2 text-xs">
            {claim.coupon && <span className="rounded-full border border-line px-3 py-1">Válido hasta {formatDate(claim.coupon.valid_until)}</span>}
            <span className="rounded-full border border-line px-3 py-1">{claim.redeemed_at ? "Usado" : "Sin usar"}</span>
          </div>
        </div>
        {merchant && (
          <a href={mapsLink(merchant)} target="_blank" rel="noopener" className={`${buttonStyles.secondary} mt-3 w-full`}>
            <NavigationIcon width={18} height={18} /> Cómo llegar{distance != null ? ` · ${formatDistance(distance).replace("a ", "")}` : ""}
          </a>
        )}
      </main>
    </>
  );
}
