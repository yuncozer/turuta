import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CouponOffer } from "@/components/coupon-offer";
import { BackIcon, ClockIcon, PinIcon } from "@/components/icons";
import { MerchantActions, MerchantTracker } from "@/components/merchant-actions";
import { MerchantImage } from "@/components/ui";
import { getCategories, getCoupons, getMerchantBySlug, getMerchants } from "@/lib/data";

export async function generateStaticParams() {
  const merchants = await getMerchants();
  return merchants.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: PageProps<"/comercios/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const merchant = await getMerchantBySlug(slug);
  return merchant ? { title: merchant.name, description: merchant.description } : {};
}

export default function MerchantPage(props: PageProps<"/comercios/[slug]">) {
  return (
    <Suspense fallback={<div className="h-48 animate-pulse bg-surface-2" />}>
      <MerchantDetail params={props.params} />
    </Suspense>
  );
}

async function MerchantDetail({ params }: Pick<PageProps<"/comercios/[slug]">, "params">) {
  const { slug } = await params;
  const [merchant, coupons, categories] = await Promise.all([getMerchantBySlug(slug), getCoupons(), getCategories()]);
  if (!merchant) notFound();
  const offers = coupons.filter((c) => c.merchant_id === merchant.id);
  const category = categories.find((c) => c.slug === merchant.category)?.name ?? merchant.category;
  const planText = merchant.plan === "basico" ? "" : ` · ${merchant.plan === "premium" ? "Premium" : "Destacado"}`;

  return (
    <article>
      <MerchantTracker merchantId={merchant.id} />
      <div className="relative">
        <MerchantImage merchant={merchant} kind="banner" className="h-48 w-full" />
        <Link href="/" aria-label="Volver" className="absolute left-3 top-[calc(env(safe-area-inset-top)+12px)] rounded-full bg-surface/90 p-1.5 text-ink shadow">
          <BackIcon />
        </Link>
      </div>
      <div className="px-4">
        <MerchantImage merchant={merchant} kind="logo" className="relative -mt-8 h-16 w-16 rounded-2xl border-4 border-canvas" />
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-link">{category}{planText}</p>
        <h1 className="text-2xl font-bold">{merchant.name}</h1>
        {merchant.description && <p className="mt-1 text-sm text-muted">{merchant.description}</p>}
        <ul className="mt-3 space-y-1.5 text-sm">
          {merchant.opening_hours && (
            <li className="flex items-center gap-2"><ClockIcon className="text-muted" width={16} height={16} /> {merchant.opening_hours}</li>
          )}
          {merchant.location_label && (
            <li className="flex items-center gap-2"><PinIcon className="text-muted" width={16} height={16} /> {merchant.location_label}</li>
          )}
        </ul>

        <div className="mt-4 space-y-3">
          {offers.map((c) => (
            <CouponOffer key={c.id} coupon={c} merchantName={merchant.name} merchantSlug={merchant.slug} />
          ))}
        </div>

        <MerchantActions merchant={merchant} />
      </div>
    </article>
  );
}
