"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { safeNext } from "@/lib/catalogs";
import { PRIVACY_VERSION } from "@/lib/env";
import { getBrowserClient } from "@/lib/supabase/client";
import { Notice, buttonStyles, inputStyles } from "./ui";

const callbackUrl = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

function authErrorMessage(message: string) {
  if (/already registered|already been registered/i.test(message)) return "Ese correo ya tiene una cuenta. Ingresa con tu contraseña.";
  if (/invalid login credentials/i.test(message)) return "Correo o contraseña incorrectos.";
  if (/email not confirmed/i.test(message)) return "Confirma tu correo con el enlace que te enviamos.";
  if (/password/i.test(message)) return "La contraseña debe tener al menos 8 caracteres.";
  if (/rate limit/i.test(message)) return "Demasiados intentos. Espera unos minutos.";
  return "Algo salió mal. Revisa tu conexión e inténtalo de nuevo.";
}

export function GoogleButton({ next }: { next: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await getBrowserClient()?.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl(next) } });
      }}
      className={`${buttonStyles.secondary} w-full`}
    >
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      Continuar con Google
    </button>
  );
}

export function SignUpForm() {
  const next = safeNext(useSearchParams().get("next"), "/perfil");
  const [state, setState] = useState<{ busy: boolean; error: string | null; sent: boolean }>({ busy: false, error: null, sent: false });
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState({ busy: true, error: null, sent: false });
    const supabase = getBrowserClient()!;
    const { data, error } = await supabase.auth.signUp({
      email: String(f.get("email")).trim(),
      password: String(f.get("password")),
      options: {
        emailRedirectTo: callbackUrl(next),
        data: {
          full_name: String(f.get("full_name")).trim(),
          whatsapp: String(f.get("whatsapp")).trim(),
          consent_version: PRIVACY_VERSION,
        },
      },
    });
    if (error) return setState({ busy: false, error: authErrorMessage(error.message), sent: false });
    if (data.session) {
      router.replace(next);
      router.refresh();
      return;
    }
    setState({ busy: false, error: null, sent: true });
  }

  if (state.sent) {
    return (
      <Notice tone="ok">
        <strong>¡Listo! Revisa tu correo.</strong> Te enviamos un enlace para confirmar tu cuenta. Al abrirlo vuelves a la app con tu sesión iniciada.
      </Notice>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <GoogleButton next={next} />
      <p className="text-center text-xs text-muted">o con tu correo</p>
      <Field label="Nombre completo" name="full_name" autoComplete="name" required placeholder="María Pérez" />
      <Field label="WhatsApp" name="whatsapp" type="tel" autoComplete="tel" required placeholder="+58 414 000 0000" pattern="[+0-9 ()-]{10,20}" />
      <Field label="Correo" name="email" type="email" autoComplete="email" required placeholder="maria@correo.com" />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo 8 caracteres" />
      <div className="rounded-xl bg-surface-2 px-3 py-2 text-xs text-ink">
        <strong className="block uppercase tracking-wider">Después</strong>
        Completa tu perfil (municipio, edad e intereses) y participa en la rifa de cierre de la feria.
      </div>
      <ConsentCheckbox />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <button disabled={state.busy} className={`${buttonStyles.primary} w-full`}>{state.busy ? "Creando…" : "Crear cuenta"}</button>
      <p className="text-center text-sm text-muted">
        ¿Ya tienes cuenta? <Link href={`/ingresar?next=${encodeURIComponent(next)}`} className="font-semibold text-link">Ingresa</Link>
      </p>
    </form>
  );
}

export function SignInForm() {
  const next = safeNext(useSearchParams().get("next"), "/");
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState({ busy: true, error: null });
    const { error } = await getBrowserClient()!.auth.signInWithPassword({
      email: String(f.get("email")).trim(),
      password: String(f.get("password")),
    });
    if (error) return setState({ busy: false, error: authErrorMessage(error.message) });
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <GoogleButton next={next} />
      <p className="text-center text-xs text-muted">o con tu correo</p>
      <Field label="Correo" name="email" type="email" autoComplete="email" required />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" required />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <button disabled={state.busy} className={`${buttonStyles.primary} w-full`}>{state.busy ? "Ingresando…" : "Ingresar"}</button>
      <div className="flex justify-between text-sm">
        <Link href="/recuperar" className="font-semibold text-link">Olvidé mi contraseña</Link>
        <Link href={`/registro?next=${encodeURIComponent(next)}`} className="font-semibold text-link">Crear cuenta</Link>
      </div>
    </form>
  );
}

export function RecoverForm() {
  const [state, setState] = useState<{ busy: boolean; error: string | null; sent: boolean }>({ busy: false, error: null, sent: false });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email")).trim();
    setState({ busy: true, error: null, sent: false });
    const { error } = await getBrowserClient()!.auth.resetPasswordForEmail(email, { redirectTo: callbackUrl("/nueva-clave") });
    setState(error ? { busy: false, error: authErrorMessage(error.message), sent: false } : { busy: false, error: null, sent: true });
  }
  if (state.sent) return <Notice tone="ok">Si el correo tiene una cuenta, te enviamos un enlace para crear una nueva contraseña.</Notice>;
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Correo de tu cuenta" name="email" type="email" autoComplete="email" required />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <button disabled={state.busy} className={`${buttonStyles.primary} w-full`}>{state.busy ? "Enviando…" : "Enviar enlace"}</button>
    </form>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password"));
    setState({ busy: true, error: null });
    const { error } = await getBrowserClient()!.auth.updateUser({ password });
    if (error) return setState({ busy: false, error: authErrorMessage(error.message) });
    router.replace("/perfil");
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" required minLength={8} />
      {state.error && <Notice tone="error">{state.error}</Notice>}
      <button disabled={state.busy} className={`${buttonStyles.primary} w-full`}>Guardar contraseña</button>
    </form>
  );
}

export function ConsentCheckbox() {
  return (
    <label className="flex items-start gap-2 text-xs text-muted">
      <input type="checkbox" name="consent" required className="mt-0.5 h-4 w-4 accent-primary" />
      <span>
        Acepto la{" "}
        <Link href="/privacidad" target="_blank" className="font-semibold text-link underline">
          Política de Privacidad
        </Link>{" "}
        y el uso de mis datos con fines comerciales, incluida su cesión a terceros. Puedo darme de baja cuando quiera.
      </span>
    </label>
  );
}

export function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input {...props} className={inputStyles} />
    </label>
  );
}
