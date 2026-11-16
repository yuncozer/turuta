import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading, AdminTitle, Card, tableStyles as t } from "@/components/admin/ui";
import { buttonStyles } from "@/components/ui";
import { requireAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Usuarios" };

export default function UsersAdmin() {
  return (
    <>
      <AdminTitle title="Usuarios">
        <a href="/admin/exportar" className={`${buttonStyles.primary} !py-2 text-sm`}>Descargar Excel</a>
      </AdminTitle>
      <Suspense fallback={<AdminLoading />}>
        <UsersTable />
      </Suspense>
    </>
  );
}

async function UsersTable() {
  const { supabase } = await requireAdmin();
  const [{ data, count }, { count: optedOut }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, whatsapp, municipality, birth_year, interests, created_at, profile_completed_at, opted_out_at", { count: "exact" })
      .eq("role", "visitor")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("profiles").select("id", { count: "exact", head: true }).not("opted_out_at", "is", null),
  ]);
  const rows = (data ?? []) as Profile[];

  return (
    <Card title={`Últimos registros (${count ?? 0} en total)`}>
      <p className="mb-3 text-sm text-muted">
        El Excel incluye a todos los usuarios que aceptaron el uso comercial de sus datos. {optedOut ?? 0} se dieron de baja y se excluyen.
      </p>
      <div className="overflow-x-auto">
        <table className={t.table}>
          <thead>
            <tr>
              <th className={t.th}>Nombre</th>
              <th className={t.th}>Correo</th>
              <th className={t.th}>WhatsApp</th>
              <th className={t.th}>Municipio</th>
              <th className={t.th}>Intereses</th>
              <th className={t.th}>Registro</th>
              <th className={t.th}>Rifa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className={u.opted_out_at ? "text-muted line-through" : ""}>
                <td className={t.td}>{u.full_name}</td>
                <td className={t.td}>{u.email}</td>
                <td className={t.td}>{u.whatsapp}</td>
                <td className={t.td}>{u.municipality ?? "—"}</td>
                <td className={`${t.td} capitalize`}>{u.interests.join(", ") || "—"}</td>
                <td className={`${t.td} whitespace-nowrap`}>{formatDateTime(u.created_at)}</td>
                <td className={t.td}>{u.profile_completed_at ? "Sí" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
