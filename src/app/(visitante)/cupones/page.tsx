import type { Metadata } from "next";
import { Suspense } from "react";
import { MyCoupons } from "@/components/my-coupons";
import { getCoupons, getMerchants } from "@/lib/data";

export const metadata: Metadata = { title: "Cupones" };

export default async function CouponsPage() {
  const [coupons, merchants] = await Promise.all([getCoupons(), getMerchants()]);
  const bySlug = Object.fromEntries(merchants.map((m) => [m.id, { name: m.name, slug: m.slug }]));
  const offers = coupons.filter((c) => bySlug[c.merchant_id]).map((c) => ({ ...c, merchant: bySlug[c.merchant_id] }));
  return (
    <Suspense>
      <MyCoupons offers={offers} />
    </Suspense>
  );
}
