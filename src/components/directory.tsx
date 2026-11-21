"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Category, Merchant } from "@/lib/types";
import { SearchIcon } from "./icons";
import { MerchantRow } from "./merchant-row";
import { PageHeader } from "./ui";

const normalize = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

function UrlState({ children }: { children: (init: { q: string; categoria: string }) => React.ReactNode }) {
  const params = useSearchParams();
  return children({ q: params.get("q") ?? "", categoria: params.get("categoria") ?? "todo" });
}

type Props = { merchants: Merchant[]; categories: Category[]; couponMerchantIds: string[]; useUrl?: boolean };

/** Directorio con búsqueda por nombre/descripción y filtro por categoría. */
export function Directory(props: Props) {
  if (!props.useUrl) return <DirectoryView {...props} initial={{ q: "", categoria: "todo" }} />;
  return <UrlState>{(initial) => <DirectoryView key={`${initial.q}|${initial.categoria}`} {...props} initial={initial} />}</UrlState>;
}

function DirectoryView({ merchants, categories, couponMerchantIds, initial }: Props & { initial: { q: string; categoria: string } }) {
  const router = useRouter();
  const [q, setQ] = useState(initial.q);
  const [categoria, setCategoria] = useState(initial.categoria);
  const withCoupon = new Set(couponMerchantIds);
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

  const update = (next: { q?: string; categoria?: string }) => {
    const nq = next.q ?? q;
    const nc = next.categoria ?? categoria;
    const sp = new URLSearchParams();
    if (nq) sp.set("q", nq);
    if (nc !== "todo") sp.set("categoria", nc);
    router.replace(`/comercios${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  const term = normalize(q.trim());
  const visible = merchants.filter(
    (m) =>
      (categoria === "todo" || m.category === categoria) &&
      (!term || normalize(`${m.name} ${m.description} ${catName[m.category] ?? ""}`).includes(term)),
  );

  return (
    <>
      <PageHeader title="Comercios" back="/">
        <label className="mt-3 flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-ink">
          <SearchIcon className="text-muted" />
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => update({})}
            placeholder="Nombre o tipo de local"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
        </label>
      </PageHeader>
      <main className="px-4 py-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {[{ slug: "todo", name: "Todo" }, ...categories].map((c) => (
            <button
              key={c.slug}
              aria-pressed={categoria === c.slug}
              onClick={() => {
                setCategoria(c.slug);
                update({ categoria: c.slug });
              }}
              className={`shrink-0 rounded-full px-3.5 py-1 text-sm ${categoria === c.slug ? "bg-primary font-semibold text-on-primary" : "border border-line bg-surface"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">{visible.length} {visible.length === 1 ? "comercio" : "comercios"}</p>
        <ul className="mt-2 space-y-2">
          {visible.map((m) => (
            <li key={m.id}>
              <MerchantRow merchant={m} hasCoupon={withCoupon.has(m.id)} categoryName={catName[m.category]} />
            </li>
          ))}
        </ul>
        {visible.length === 0 && <p className="py-10 text-center text-sm text-muted">No encontramos comercios con esa búsqueda.</p>}
      </main>
    </>
  );
}
