import Link from "next/link";
import { Suspense } from "react";
import { AdminLoading, AdminTitle, Card, Distribution, Stat, tableStyles as t } from "@/components/admin/ui";
import { PlanBadge, buttonStyles } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import type { MerchantPlan } from "@/lib/types";

type Summary = {
  users: number;
  users_today: number;
  profiles_completed: number;
  merchants_active: number;
  coupons_claimed: number;
  coupons_redeemed: number;
  municipalities: number;
  by_municipality: { label: string; total: number }[];
  by_interest: { label: string; total: number }[];
  by_age: { label: string; total: number }[];
};

type ReportRow = { merchant_id: string; name: string; plan: MerchantPlan; views: number; map_clicks: number; whatsapp_clicks: number; claims: number; redemptions: number };

export default function AdminHome() {
  return (
    <>
      <AdminTitle title="Resumen de la feria">
        <a href="/admin/exportar" className={`${buttonStyles.secondary} !py-2 text-sm`}>Exportar usuarios (Excel)</a>
        <Link href="/admin/comercios/nuevo" className={`${buttonStyles.primary} !py-2 text-sm`}>+ Nuevo comercio</Link>
      </AdminTitle>
      <Suspense fallback={<AdminLoading />}>
        <Dashboard />
      </Suspense>
    </>
  );
}

async function Dashboard() {
  const { supabase } = await requireAdmin();
  const [{ data: summary }, { data: report }] = await Promise.all([
    supabase.rpc("admin_summary"),
    supabase.from("merchant_report").select("*").order("views", { ascending: false }),
  ]);
  const s = summary as Summary;
  const rows = (report ?? []) as ReportRow[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat value={s.users} label={`Usuarios registrados (${s.users_today} hoy)`} />
        <Stat value={s.merchants_active} label="Comercios activos" />
        <Stat value={s.coupons_redeemed} label={`Cupones canjeados (de ${s.coupons_claimed} obtenidos)`} />
        <Stat value={s.municipalities} label={`Municipios alcanzados · ${s.profiles_completed} perfiles completos`} />
      </div>

      <Card title="Resultados por comercio">
        <div className="overflow-x-auto">
          <table className={t.table}>
            <thead>
              <tr>
                <th className={t.th}>Comercio</th>
                <th className={t.th}>Plan</th>
                <th className={`${t.th} text-right`}>Vistas</th>
                <th className={`${t.th} text-right`}>Clics ubicación</th>
                <th className={`${t.th} text-right`}>Clics WhatsApp</th>
                <th className={`${t.th} text-right`}>Cupones obtenidos</th>
                <th className={`${t.th} text-right`}>Canjeados</th>
                <th className={t.th}></th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.map((r) => (
                <tr key={r.merchant_id}>
                  <td className={`${t.td} font-semibold`}>{r.name}</td>
                  <td className={t.td}><PlanBadge plan={r.plan} /></td>
                  <td className={`${t.td} text-right`}>{r.views}</td>
                  <td className={`${t.td} text-right`}>{r.map_clicks}</td>
                  <td className={`${t.td} text-right`}>{r.whatsapp_clicks}</td>
                  <td className={`${t.td} text-right`}>{r.claims}</td>
                  <td className={`${t.td} text-right`}>{r.redemptions}</td>
                  <td className={`${t.td} text-right`}>
                    <Link href={`/admin/comercios/${r.merchant_id}`} className="font-semibold text-brand-700">Editar</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Por municipio"><Distribution rows={s.by_municipality} /></Card>
        <Card title="Por edad"><Distribution rows={s.by_age} /></Card>
        <Card title="Por intereses"><Distribution rows={s.by_interest} /></Card>
      </div>
    </div>
  );
}
