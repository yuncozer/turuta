export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** Sin Supabase la app corre en "modo demo": parte pública con datos de ejemplo, sin cuentas. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Versión de la Política de Privacidad aceptada al registrarse. Cambiarla si cambia el texto. */
export const PRIVACY_VERSION = "2026-11";

/** Consultas que un visitante anónimo hace antes de que se le invite a registrarse. */
export const SOFT_GATE_VIEWS = Number(process.env.NEXT_PUBLIC_SOFT_GATE_VIEWS ?? 5);

export const FAIR_NAME = "FISS 2027";
export const FAIR_TIMEZONE = "America/Caracas";
