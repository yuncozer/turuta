import Link from "next/link";
import { Greeting } from "@/components/greeting";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme";
import { NearbyMerchants } from "@/components/nearby-merchants";
import { SearchIcon, StarIcon } from "@/components/icons";
import { TodayAtFair } from "@/components/today-at-fair";
import { MerchantImage } from "@/components/ui";
import { getCategories, getCoupons, getEvents, getMerchants, popularMerchants } from "@/lib/data";

export default async function HomePage() {
  const [merchants, categories, coupons, events] = await Promise.all([getMerchants(), getCategories(), getCoupons(), getEvents()]);
  const popular = popularMerchants(merchants);
  const couponByMerchant = Object.fromEntries(coupons.map((c) => [c.merchant_id, c.title]));
  const merchantCategories = categories.filter((c) => c.kind === "comercio");

  return (
    <>
      <header className="bg-header px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] text-on-header">
        <div className="flex items-center justify-between gap-3">
          <h1 className="m-0">
            <Logo className="h-12 w-auto" />
          </h1>
          <div className="flex items-center gap-2">
            <Greeting />
            <ThemeToggle />
          </div>
        </div>
        <p className="mt-3 font-display text-2xl font-extrabold leading-tight">¿Cuál es tu ruta hoy?</p>
        <form action="/comercios" className="mt-3">
          <label className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-ink">
            <SearchIcon className="text-muted" />
            <span className="sr-only">Buscar</span>
            <input name="q" type="search" placeholder="Buscar comida, juegos, servicios…" className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted" />
          </label>
        </form>
      </header>

      <main className="space-y-6 py-4">
        {popular.length > 0 && (
          <section aria-labelledby="populares">
            <div className="flex items-baseline justify-between px-4">
              <h2 id="populares" className="text-lg font-bold">Populares</h2>
              <span className="text-xs text-muted">Patrocinado</span>
            </div>
            <ul className="no-scrollbar mt-2 flex snap-x gap-3 overflow-x-auto px-4 pb-1">
              {popular.map((m) => (
                <li key={m.id} className="w-44 shrink-0 snap-start">
                  <Link href={`/comercios/${m.slug}`} className="block overflow-hidden rounded-2xl border border-line bg-surface">
                    <div className="relative">
                      <MerchantImage merchant={m} kind="banner" className="h-24 w-full" />
                      {m.plan === "premium" && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold text-canvas">
                          <StarIcon width={9} height={11} className="text-primary" /> Premium
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="truncate font-semibold">{m.name}</p>
                      <p className="text-xs capitalize text-muted">{m.category}</p>
                      {couponByMerchant[m.id] && <p className="mt-1 truncate text-xs font-semibold text-link">Cupón: {couponByMerchant[m.id]}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav aria-label="Categorías" className="no-scrollbar flex gap-2 overflow-x-auto px-4">
          <Link href="/comercios" className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-on-primary">Todo</Link>
          {merchantCategories.map((c) => (
            <Link key={c.slug} href={`/comercios?categoria=${c.slug}`} className="shrink-0 rounded-full border border-line bg-surface px-4 py-1.5 text-sm">
              {c.name}
            </Link>
          ))}
        </nav>

        <NearbyMerchants merchants={merchants} couponMerchantIds={Object.keys(couponByMerchant)} />

        <TodayAtFair events={events} />
      </main>
    </>
  );
}
