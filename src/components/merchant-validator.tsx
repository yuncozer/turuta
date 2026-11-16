"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { formatDate } from "@/lib/format";
import { getBrowserClient } from "@/lib/supabase/client";
import { CheckIcon, ScanIcon, XIcon } from "./icons";
import { Notice, buttonStyles, inputStyles } from "./ui";

type Portal = {
  merchant: { name: string; logo_url: string | null };
  today_redemptions: number;
  coupons: { title: string; kind: string; remaining: number | null; valid_until: string; is_active: boolean }[];
};

type Result =
  | { ok: true; title: string; customer: string; redeemed_at: string; today_redemptions: number }
  | { ok: false; error: string; title?: string; redeemed_at?: string };

const errors: Record<string, string> = {
  invalid_link: "Este enlace no es válido o fue renovado. Pide el enlace nuevo al organizador.",
  bad_pin: "PIN incorrecto.",
  locked: "Demasiados intentos. Espera 15 minutos o pide un PIN nuevo al organizador.",
  not_found: "Código no encontrado. Verifica que esté bien escrito.",
  other_merchant: "Este cupón es de otro comercio.",
  already_redeemed: "Este cupón ya fue canjeado.",
  expired: "Este cupón está vencido.",
};

const pinKey = (token: string) => `fiss:pin:${token}`;

export function MerchantValidator() {
  const { token } = useParams<{ token: string }>();
  const [pin, setPin] = useState<string | null>(null);
  const [portal, setPortal] = useState<Portal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const login = useCallback(
    async (candidate: string) => {
      const supabase = getBrowserClient();
      if (!supabase) return;
      setBusy(true);
      const { data, error } = await supabase.rpc("merchant_portal", { p_token: token, p_pin: candidate });
      setBusy(false);
      if (error) return setError("Sin conexión. Inténtalo de nuevo.");
      if (!data.ok) {
        try {
          localStorage.removeItem(pinKey(token));
        } catch {}
        setPin(null);
        return setError(errors[data.error] ?? "No se pudo validar el acceso.");
      }
      try {
        localStorage.setItem(pinKey(token), candidate);
      } catch {}
      setError(null);
      setPin(candidate);
      setPortal(data);
    },
    [token],
  );

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(pinKey(token));
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reingreso automático con el PIN guardado
    if (saved) void login(saved);
  }, [token, login]);

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-cream">
      <header className="bg-merchant-700 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Modo comercio</p>
        <h1 className="text-xl font-bold">{portal ? portal.merchant.name : "Validar cupón"}</h1>
      </header>
      <main className="px-4 py-4">
        {!isSupabaseConfigured ? (
          <Notice>El modo comercio se activa al configurar Supabase.</Notice>
        ) : !pin || !portal ? (
          <form
            className="space-y-3 rounded-2xl bg-white p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void login(String(new FormData(e.currentTarget).get("pin")));
            }}
          >
            <p className="text-sm text-muted">Ingresa el PIN de tu comercio para validar cupones.</p>
            <input name="pin" type="password" inputMode="numeric" autoComplete="off" pattern="[0-9]{4,8}" required placeholder="PIN" className={`${inputStyles} text-center text-2xl tracking-[0.5em]`} />
            {error && <Notice tone="error">{error}</Notice>}
            <button disabled={busy} className={`${buttonStyles.primary} w-full !bg-merchant-700`}>{busy ? "Verificando…" : "Entrar"}</button>
          </form>
        ) : (
          <Redeemer
            token={token}
            pin={pin}
            portal={portal}
            onLogout={() => {
              try {
                localStorage.removeItem(pinKey(token));
              } catch {}
              setPin(null);
              setPortal(null);
            }}
            onRefresh={() => login(pin)}
          />
        )}
      </main>
    </div>
  );
}

function Redeemer({ token, pin, portal, onLogout, onRefresh }: { token: string; pin: string; portal: Portal; onLogout: () => void; onRefresh: () => void }) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [today, setToday] = useState(portal.today_redemptions);
  const [scanning, setScanning] = useState(false);

  const redeem = useCallback(
    async (raw: string) => {
      const value = raw.trim().toUpperCase();
      if (!value) return;
      setBusy(true);
      setScanning(false);
      const { data, error } = await getBrowserClient()!.rpc("redeem_coupon", { p_token: token, p_pin: pin, p_code: value });
      setBusy(false);
      if (error) return setResult({ ok: false, error: "network" });
      setResult(data);
      if (data.ok) {
        setToday(data.today_redemptions);
        setCode("");
        navigator.vibrate?.(120);
      }
    },
    [token, pin],
  );

  return (
    <div className="space-y-4">
      {scanning ? (
        <Scanner onCode={redeem} onClose={() => setScanning(false)} />
      ) : (
        <button type="button" onClick={() => { setResult(null); setScanning(true); }} className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-3xl bg-brand-900 text-white/80">
          <ScanIcon width={48} height={48} />
          <span className="text-sm">Toca para escanear el QR del cliente</span>
        </button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void redeem(code);
        }}
        className="flex gap-2"
      >
        <label className="sr-only" htmlFor="code">Código del cupón</label>
        <input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="o escribe el código: FISS-____-__" autoCapitalize="characters" autoComplete="off" className={`${inputStyles} font-mono`} />
        <button disabled={busy || !code} className={`${buttonStyles.primary} !bg-merchant-700 shrink-0`}>Validar</button>
      </form>

      {busy && <p className="text-center text-sm text-muted">Validando…</p>}
      {result && <ResultCard result={result} />}

      <section className="rounded-2xl bg-white p-4 text-sm">
        <div className="flex items-center justify-between">
          <p className="font-semibold">Canjes de hoy: {today}</p>
          <button type="button" onClick={onRefresh} className="text-xs font-semibold text-merchant-700">Actualizar</button>
        </div>
        <ul className="mt-2 space-y-1 text-muted">
          {portal.coupons.map((c) => (
            <li key={c.title}>
              {c.title} · {c.kind === "abierta" ? "sin límite" : `quedan ${c.remaining}`} · hasta {formatDate(c.valid_until)}
              {!c.is_active && " · pausado"}
            </li>
          ))}
        </ul>
      </section>
      <button type="button" onClick={onLogout} className={`${buttonStyles.ghost} w-full`}>Salir del modo comercio</button>
    </div>
  );
}

function ResultCard({ result }: { result: Result }) {
  if (result.ok) {
    return (
      <div role="status" className="rounded-2xl border-2 border-ok bg-ok-100 p-4">
        <p className="flex items-center gap-2 font-bold text-ok"><CheckIcon /> Cupón válido · canjeado</p>
        <p className="mt-1 font-semibold">{result.title}</p>
        <p className="text-sm text-muted">{result.customer} · {new Date(result.redeemed_at).toLocaleTimeString("es-VE", { hour: "numeric", minute: "2-digit" })}</p>
      </div>
    );
  }
  return (
    <div role="alert" className="rounded-2xl border-2 border-danger bg-danger-100 p-4">
      <p className="flex items-center gap-2 font-bold text-danger"><XIcon /> {errors[result.error] ?? "Sin conexión. Inténtalo de nuevo."}</p>
      {result.title && <p className="mt-1 text-sm">{result.title}</p>}
      {result.redeemed_at && <p className="text-sm text-muted">Canjeado el {new Date(result.redeemed_at).toLocaleString("es-VE")}</p>}
    </div>
  );
}

function Scanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: { start: () => Promise<void>; stop: () => void; destroy: () => void } | null = null;
    let done = false;
    import("qr-scanner").then(({ default: QrScanner }) => {
      if (!videoRef.current || done) return;
      const s = new QrScanner(
        videoRef.current,
        (r) => {
          if (done) return;
          done = true;
          onCode(r.data);
        },
        { returnDetailedScanResult: true, highlightScanRegion: true, preferredCamera: "environment", maxScansPerSecond: 5 },
      );
      scanner = s;
      s.start().catch(() => setError("No pudimos abrir la cámara. Permite el acceso o escribe el código."));
    });
    return () => {
      done = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, [onCode]);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-black">
      <video ref={videoRef} className="aspect-[4/3] w-full object-cover" muted playsInline />
      <button type="button" onClick={onClose} aria-label="Cerrar cámara" className="absolute right-3 top-3 rounded-full bg-white/90 p-1.5">
        <XIcon />
      </button>
      {error && <p className="absolute inset-x-3 bottom-3 rounded-xl bg-white p-2 text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
