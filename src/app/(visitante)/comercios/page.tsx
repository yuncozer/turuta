import type { Metadata } from "next";
import { Suspense } from "react";
import { Directory } from "@/components/directory";
import { getCategories, getCoupons, getMerchants } from "@/lib/data";

export const metadata: Metadata = { title: "Comercios" };

export default async function DirectoryPage() {
  const [merchants, categories, coupons] = await Promise.all([getMerchants(), getCategories(), getCoupons()]);
  const props = {
    merchants,
    categories: categories.filter((c) => c.kind === "comercio"),
    couponMerchantIds: [...new Set(coupons.map((c) => c.merchant_id))],
  };
  return (
    <Suspense fallback={<Directory {...props} />}>
      <Directory {...props} useUrl />
    </Suspense>
  );
}
