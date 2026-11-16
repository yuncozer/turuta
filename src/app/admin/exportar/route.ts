import ExcelJS from "exceljs";
import { getAdmin } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import type { Profile } from "@/lib/types";

/** Base de datos de usuarios en Excel (solo quienes no se dieron de baja). */
export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("No autorizado", { status: 403 });
  const { supabase } = admin;

  const users: Profile[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "visitor")
      .is("opted_out_at", null)
      .not("consent_at", "is", null)
      .order("created_at")
      .range(from, from + 999);
    if (error) return new Response("Error al leer usuarios", { status: 500 });
    users.push(...(data as Profile[]));
    if (data.length < 1000) break;
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "FISS 2027";
  const sheet = wb.addWorksheet("Usuarios");
  sheet.columns = [
    { header: "Nombre", key: "full_name", width: 28 },
    { header: "Correo", key: "email", width: 30 },
    { header: "WhatsApp", key: "whatsapp", width: 18 },
    { header: "Municipio", key: "municipality", width: 22 },
    { header: "Año de nacimiento", key: "birth_year", width: 16 },
    { header: "Intereses", key: "interests", width: 36 },
    { header: "Perfil completo (rifa)", key: "raffle", width: 20 },
    { header: "Fecha de registro", key: "created_at", width: 20 },
    { header: "Consentimiento", key: "consent", width: 22 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  for (const u of users) {
    sheet.addRow({
      full_name: u.full_name,
      email: u.email,
      whatsapp: u.whatsapp,
      municipality: u.municipality,
      birth_year: u.birth_year,
      interests: u.interests.join(", "),
      raffle: u.profile_completed_at ? "Sí" : "No",
      created_at: formatDateTime(u.created_at),
      consent: u.consent_at ? `v${u.consent_version} · ${formatDateTime(u.consent_at)}` : "",
    });
  }
  sheet.autoFilter = { from: "A1", to: "I1" };

  const buffer = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="usuarios-fiss-2027-${date}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
