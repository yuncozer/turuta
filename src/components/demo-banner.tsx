import { isSupabaseConfigured } from "@/lib/env";

export function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <p className="bg-surface-2 px-4 py-1.5 text-center text-xs text-ink">
      Modo demo: datos de ejemplo. Configura Supabase para activar cuentas y cupones.
    </p>
  );
}
