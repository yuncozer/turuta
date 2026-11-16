"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SOFT_GATE_VIEWS } from "@/lib/env";
import { useAuth } from "./auth-provider";
import { buttonStyles } from "./ui";

/*
 * "Primero prueba, luego se registra": el visitante navega libremente y, tras
 * algunas consultas (fichas, ubicaciones, contactos), se le invita a crear su cuenta.
 */
const KEY = "fiss:consults";
const Ctx = createContext<{ countConsult: () => void }>({ countConsult: () => {} });

export function SoftGateProvider({ children }: { children: React.ReactNode }) {
  const { configured, loading, user } = useAuth();
  const [open, setOpen] = useState(false);

  const countConsult = useCallback(() => {
    if (!configured || loading || user) return;
    let n = 0;
    try {
      n = Number(localStorage.getItem(KEY) ?? 0) + 1;
      localStorage.setItem(KEY, String(n));
    } catch {}
    if (n > 0 && n % SOFT_GATE_VIEWS === 0) setOpen(true);
  }, [configured, loading, user]);

  const value = useMemo(() => ({ countConsult }), [countConsult]);

  return (
    <Ctx value={value}>
      {children}
      {open && (
        <div role="dialog" aria-modal="true" aria-labelledby="gate-title" className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl">
            <h2 id="gate-title" className="text-xl font-bold">¿Te está gustando la feria?</h2>
            <p className="mt-2 text-sm text-muted">
              Crea tu cuenta gratis en segundos para obtener cupones, ver lo que está cerca de ti y participar en la rifa de cierre.
            </p>
            <div className="mt-5 grid gap-2">
              <Link href={`/registro?next=${encodeURIComponent(typeof window === "undefined" ? "/" : window.location.pathname)}`} className={buttonStyles.primary} onClick={() => setOpen(false)}>
                Crear cuenta gratis
              </Link>
              <button type="button" className={buttonStyles.ghost} onClick={() => setOpen(false)}>
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </Ctx>
  );
}

export const useSoftGate = () => useContext(Ctx);
