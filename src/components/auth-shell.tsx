import { isSupabaseConfigured } from "@/lib/env";
import { Notice, PageHeader } from "./ui";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} back="/" />
      <main className="px-4 py-5">
        {isSupabaseConfigured ? children : <Notice>Las cuentas se activan al configurar Supabase (ver README).</Notice>}
      </main>
    </>
  );
}
