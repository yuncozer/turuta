import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminTitle, Card, tableStyles as t } from "@/components/admin/ui";
import { PlanBadge, buttonStyles } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import type { Merchant } from "@/lib/types";

export const metadata: Metadata = { title: "Comercios" };

export default function MerchantsAdmin() {
  return (
    <>
      <AdminTitle title="Comercios y cupones">
        <Link href="/admin/comercios/nuevo" className={`${buttonStyles.primary} !py-2 text-sm`}>+ Nuevo comercio</Link>
      </AdminTitle>
      <Suspense fallback={<AdminLoading />}>
        <MerchantsTable />
      </Suspense>
    </>
  );
}

async function MerchantsTable() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("merchants").select("id, name, slug, category, plan, popular_rank, is_published, coupons(count)").order("name");
  const rows = (data ?? []) as (Merchant & { coupons: { count: number }[] })[];
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className={t.table}>
          <thead>
            <tr>
              <th className={t.th}>Comercio</th>
              <th className={t.th}>Categoría</th>
              <th className={t.th}>Plan</th>
              <th className={t.th}>Populares</th>
              <th className={t.th}>Cupones</th>
              <th className={t.th}>Estado</th>
              <th className={t.th}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => (
              <tr key={m.id}>
                <td className={`${t.td} font-semibold`}>{m.name}</td>
                <td className={`${t.td} capitalize`}>{m.category}</td>
                <td className={t.td}><PlanBadge plan={m.plan} /></td>
                <td className={t.td}>{m.popular_rank ?? "—"}</td>
                <td className={t.td}>{m.coupons[0]?.count ?? 0}</td>
                <td className={t.td}>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.is_published ? "bg-ok-100 text-ok" : "bg-line text-muted"}`}>
                    {m.is_published ? "Publicado" : "Borrador"}
                  </span>
                </td>
                <td className={`${t.td} text-right`}>
                  <Link href={`/admin/comercios/${m.id}`} className="font-semibold text-brand-700">Editar</Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-muted">Aún no hay comercios. Crea el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
