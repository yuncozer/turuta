"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { INTERESTS, MUNICIPALITIES, safeNext } from "@/lib/catalogs";
import { clearCachedClaims } from "@/lib/coupons-client";
import { PRIVACY_VERSION } from "@/lib/env";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { ConsentCheckbox, Field } from "./auth-forms";
import { useAuth } from "./auth-provider";
import { Notice, PageHeader, buttonStyles, inputStyles } from "./ui";

export function ProfileView() {
  const { configured, loading, user, profile, signOut } = useAuth();
  const router = useRouter();

  if (!configured) {
    return (
      <>
        <PageHeader title="Perfil" />
        <main className="px-4 py-5"><Notice>Las cuentas se activan al configurar Supabase (ver README).</Notice></main>
      </>
    );
  }
  if (loading) return <PageHeader title="Perfil" />;
  if (!user) {
    return (
      <>
        <PageHeader title="Perfil" subtitle="Tu cuenta de la FISS 2027" />
        <main className="space-y-3 px-4 py-5">
          <p className="text-sm text-muted">Crea tu cuenta gratis para obtener cupones, guardar tus datos y participar en la rifa de cierre.</p>
          <Link href="/registro" className={`${buttonStyles.primary} w-full`}>Crear cuenta</Link>
          <Link href="/ingresar" className={`${buttonStyles.secondary} w-full`}>Ya tengo cuenta</Link>
        </main>
      </>
    );
  }
  if (!profile) return <PageHeader title="Perfil" />;

  return (
    <>
      <PageHeader title={profile.full_name ? `Hola, ${profile.full_name.split(" ")[0]}` : "Perfil"} subtitle={profile.email ?? undefined} />
      <main className="space-y-5 px-4 py-5">
        {!profile.consent_at ? <ConsentForm profile={profile} /> : <CompleteProfileForm profile={profile} />}
        {profile.consent_at && <OptOut profile={profile} />}
        {profile.role === "admin" && (
          <Link href="/admin" className={`${buttonStyles.secondary} w-full`}>Ir al panel de administración</Link>
        )}
        <button
          type="button"
          className={`${buttonStyles.ghost} w-full`}
          onClick={async () => {
            clearCachedClaims();
            await signOut();
            router.replace("/");
          }}
        >
          Cerrar sesión
        </button>
        <p className="text-center text-xs text-muted">
          <Link href="/privacidad" className="underline">Política de Privacidad</Link>
        </p>
      </main>
    </>
  );
}

/** Paso obligatorio para quien entra con Google: WhatsApp + consentimiento. */
function ConsentForm({ profile }: { profile: Profile }) {
  const { refreshProfile } = useAuth();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await getBrowserClient()!.rpc("accept_terms", {
      p_version: PRIVACY_VERSION,
      p_full_name: String(f.get("full_name")),
      p_whatsapp: String(f.get("whatsapp")),
    });
    setBusy(false);
    if (error) return setError("No pudimos guardar tus datos. Inténtalo de nuevo.");
    await refreshProfile();
    if (next) router.replace(safeNext(next));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl bg-white p-4">
      <h2 className="text-lg font-bold">Un último paso</h2>
      <p className="text-sm text-muted">Confirma tus datos para obtener cupones.</p>
      <Field label="Nombre completo" name="full_name" defaultValue={profile.full_name} required autoComplete="name" />
      <Field label="WhatsApp" name="whatsapp" type="tel" defaultValue={profile.whatsapp ?? ""} required placeholder="+58 414 000 0000" pattern="[+0-9 ()-]{10,20}" autoComplete="tel" />
      <ConsentCheckbox />
      {error && <Notice tone="error">{error}</Notice>}
      <button disabled={busy} className={`${buttonStyles.primary} w-full`}>Continuar</button>
    </form>
  );
}

function CompleteProfileForm({ profile }: { profile: Profile }) {
  const { refreshProfile } = useAuth();
  const [interests, setInterests] = useState<string[]>(profile.interests);
  const [status, setStatus] = useState<"idle" | "busy" | "saved" | "error">("idle");
  const thisYear = new Date().getFullYear();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setStatus("busy");
    const { error } = await getBrowserClient()!.rpc("complete_profile", {
      p_municipality: String(f.get("municipality") ?? ""),
      p_birth_year: f.get("birth_year") ? Number(f.get("birth_year")) : null,
      p_interests: interests,
    });
    if (error) return setStatus("error");
    await refreshProfile();
    setStatus("saved");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-4">
      {profile.profile_completed_at ? (
        <Notice tone="ok"><strong>¡Participas en la rifa de cierre!</strong> Puedes actualizar tus datos cuando quieras.</Notice>
      ) : (
        <div>
          <h2 className="text-lg font-bold">Completa tu perfil y participa en la rifa</h2>
          <p className="text-sm text-muted">Con tu municipio, año de nacimiento e intereses entras en la rifa de cierre de la feria.</p>
        </div>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Municipio</span>
        <select name="municipality" defaultValue={profile.municipality ?? ""} required className={inputStyles}>
          <option value="" disabled>Elige tu municipio</option>
          {MUNICIPALITIES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <Field label="Año de nacimiento" name="birth_year" type="number" inputMode="numeric" min={thisYear - 100} max={thisYear - 10} required defaultValue={profile.birth_year ?? ""} />
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Intereses</legend>
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((i) => {
            const on = interests.includes(i.value);
            return (
              <button
                key={i.value}
                type="button"
                aria-pressed={on}
                onClick={() => setInterests(on ? interests.filter((x) => x !== i.value) : [...interests, i.value])}
                className={`rounded-full px-3 py-1 text-sm ${on ? "bg-brand-700 font-semibold text-white" : "border border-line"}`}
              >
                {i.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      {status === "error" && <Notice tone="error">No pudimos guardar tu perfil. Inténtalo de nuevo.</Notice>}
      {status === "saved" && <Notice tone="ok">Perfil guardado.</Notice>}
      <button disabled={status === "busy" || interests.length === 0} className={`${buttonStyles.primary} w-full`}>
        {status === "busy" ? "Guardando…" : "Guardar perfil"}
      </button>
    </form>
  );
}

function OptOut({ profile }: { profile: Profile }) {
  const { refreshProfile } = useAuth();
  const optedOut = Boolean(profile.opted_out_at);
  return (
    <div className="rounded-2xl bg-white p-4 text-sm">
      <p className="font-semibold">Uso comercial de tus datos</p>
      <p className="mt-1 text-muted">
        {optedOut
          ? "Te diste de baja: tus datos no se usan con fines comerciales."
          : "Aceptaste el uso comercial de tus datos. Puedes darte de baja cuando quieras."}
      </p>
      <button
        type="button"
        className="mt-2 font-semibold text-brand-700 underline"
        onClick={async () => {
          await getBrowserClient()!.rpc("set_marketing_opt_out", { p_opt_out: !optedOut });
          await refreshProfile();
        }}
      >
        {optedOut ? "Volver a aceptar" : "Darme de baja"}
      </button>
    </div>
  );
}
