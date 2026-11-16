import { isSupabaseConfigured } from "@/lib/env";

export function DemoBanner() {
  if (isSupabaseConfigured) return null;
  return (
    <p className="bg-amber-100 px-4 py-1.5 text-center text-xs text-amber-900">
      Modo demo: datos de ejemplo. Configura Supabase para activar cuentas y cupones.
    </p>
  );
}
