import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/catalogs";
import { getServerClient } from "@/lib/supabase/server";

/** Retorno desde Google, del enlace de confirmación de correo o de recuperación de contraseña. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "/perfil");

  if (code) {
    const supabase = await getServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/ingresar?error=enlace", origin));
}
