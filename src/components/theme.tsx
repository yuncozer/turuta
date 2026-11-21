"use client";

import { useEffect, useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "./icons";

/*
 * Tema claro (Opción A «Crema Ruta») y oscuro (Opción B «Noche de Feria»).
 * Preferencia guardada en el teléfono: "light" | "dark" | "system" (sigue al sistema).
 * El atributo data-theme de <html> se fija antes de pintar (THEME_SCRIPT) para evitar parpadeos.
 */

export type ThemePreference = "light" | "dark" | "system";

const KEY = "turuta:theme";
const EVENT = "turuta:theme-change";
const COLORS = { light: "#F3EADC", dark: "#111111" } as const;

/** Se ejecuta en <head> antes de que el navegador pinte la página. */
export const THEME_SCRIPT = `(function(){try{var p=localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){}})();`;

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function resolve(pref: ThemePreference): "light" | "dark" {
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function apply(pref: ThemePreference) {
  const theme = resolve(pref);
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", COLORS[theme]));
}

function setPreference(pref: ThemePreference) {
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {}
  apply(pref);
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (readPreference() === "system") apply("system");
    cb();
  };
  media.addEventListener("change", onSystem);
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onSystem);
  return () => {
    media.removeEventListener("change", onSystem);
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onSystem);
  };
}

const snapshot = () => `${readPreference()}|${document.documentElement.dataset.theme ?? "light"}`;

export function useTheme() {
  const value = useSyncExternalStore(subscribe, snapshot, () => "system|light");
  const [preference, theme] = value.split("|") as [ThemePreference, "light" | "dark"];
  return { preference, theme, setPreference };
}

/** Mantiene el tema sincronizado con el sistema cuando la preferencia es "Automático". */
export function ThemeWatcher() {
  useEffect(() => apply(readPreference()), []);
  useTheme();
  return null;
}

/** Botón rápido sol/luna para alternar entre claro y oscuro. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setPreference } = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={next === "dark" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink ${className}`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** Selector completo para el Perfil: Claro / Oscuro / Automático. */
export function ThemeSelector() {
  const { preference, setPreference } = useTheme();
  const options: { value: ThemePreference; label: string }[] = [
    { value: "light", label: "Claro" },
    { value: "dark", label: "Oscuro" },
    { value: "system", label: "Automático" },
  ];
  return (
    <fieldset className="rounded-2xl bg-surface p-4">
      <legend className="sr-only">Apariencia</legend>
      <p className="font-display font-bold">Apariencia</p>
      <p className="mt-1 text-sm text-muted">Automático sigue la configuración de tu teléfono.</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-2 py-2.5 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary ${
              preference === o.value ? "border-primary bg-primary-soft text-ink" : "border-line text-muted"
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={o.value}
              checked={preference === o.value}
              onChange={() => setPreference(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
