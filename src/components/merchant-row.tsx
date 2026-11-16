import Link from "next/link";
import { closesLabel, formatDistance } from "@/lib/format";
import type { Merchant } from "@/lib/types";
import { PinIcon } from "./icons";
import { MerchantImage } from "./ui";

export function MerchantRow({ merchant, distance, hasCoupon, categoryName }: { merchant: Merchant; distance?: number | null; hasCoupon?: boolean; categoryName?: string }) {
  return (
    <Link href={`/comercios/${merchant.slug}`} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
      <MerchantImage merchant={merchant} kind="logo" className="h-14 w-14 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{merchant.name}</p>
        <p className="truncate text-xs text-muted">
          <span className="capitalize">{categoryName ?? merchant.category}</span>
          {merchant.closes_at && ` · ${closesLabel(merchant.closes_at)}`}
        </p>
        {distance != null ? (
          <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-merchant-700">
            <PinIcon width={12} height={12} /> {formatDistance(distance)}
          </p>
        ) : (
          merchant.location_label && <p className="mt-0.5 truncate text-xs text-muted">{merchant.location_label}</p>
        )}
      </div>
      {hasCoupon && <span className="shrink-0 rounded-full bg-accent-500 px-2.5 py-1 text-[11px] font-semibold text-white">Cupón</span>}
    </Link>
  );
}
