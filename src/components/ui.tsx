import Link from "next/link";
import type { Merchant } from "@/lib/types";
import { BackIcon } from "./icons";

export function PageHeader({ title, subtitle, back, children }: { title: string; subtitle?: string; back?: string; children?: React.ReactNode }) {
  return (
    <header className="bg-brand-700 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
      <div className="flex items-center gap-2">
        {back && (
          <Link href={back} aria-label="Volver" className="-ml-1 rounded-full p-1 hover:bg-white/10">
            <BackIcon />
          </Link>
        )}
        <h1 className="text-xl font-bold">{title}</h1>
      </div>
      {subtitle && <p className="mt-0.5 text-sm text-white/75">{subtitle}</p>}
      {children}
    </header>
  );
}

export function MerchantImage({ merchant, kind, className = "" }: { merchant: Pick<Merchant, "name" | "logo_url" | "banner_url">; kind: "logo" | "banner"; className?: string }) {
  const src = kind === "logo" ? merchant.logo_url : merchant.banner_url;
  if (src) {
    // Imágenes servidas desde Supabase Storage/CDN; tamaño controlado por la guía de imágenes.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={kind === "logo" ? `Logo de ${merchant.name}` : ""} className={`object-cover ${className}`} loading="lazy" decoding="async" />;
  }
  return (
    <div className={`img-placeholder flex items-center justify-center text-xs font-medium text-brand-800/60 ${className}`} aria-hidden>
      {kind === "logo" ? merchant.name.slice(0, 1) : ""}
    </div>
  );
}

export const planLabel = { basico: "Básico", destacado: "Destacado", premium: "Premium" } as const;

export function PlanBadge({ plan }: { plan: Merchant["plan"] }) {
  const styles = {
    premium: "bg-amber-400 text-amber-950",
    destacado: "bg-accent-500 text-white",
    basico: "bg-merchant-700 text-white",
  }[plan];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles}`}>{planLabel[plan]}</span>;
}

export function Notice({ tone = "info", children }: { tone?: "info" | "ok" | "error"; children: React.ReactNode }) {
  const styles = {
    info: "bg-brand-100 text-brand-800",
    ok: "bg-ok-100 text-ok",
    error: "bg-danger-100 text-danger",
  }[tone];
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${styles}`}>{children}</div>;
}

export const buttonStyles = {
  primary: "inline-flex items-center justify-center gap-2 rounded-xl bg-accent-500 px-4 py-3 font-semibold text-white hover:bg-accent-600 disabled:opacity-60",
  secondary: "inline-flex items-center justify-center gap-2 rounded-xl border border-brand-700 bg-white px-4 py-3 font-semibold text-brand-700 hover:bg-brand-100 disabled:opacity-60",
  ghost: "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium text-brand-700 hover:bg-brand-100",
} as const;

export const inputStyles =
  "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
