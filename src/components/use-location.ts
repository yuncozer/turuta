"use client";

import { useCallback, useEffect, useState } from "react";

type Coords = { lat: number; lng: number };
type State = { status: "idle" | "asking" | "granted" | "denied" | "unsupported"; coords: Coords | null };

const KEY = "fiss:location-ok";

/** Ubicación del visitante, solo con su permiso. Recuerda si ya la activó para no volver a preguntar. */
export function useLocation() {
  const [state, setState] = useState<State>({ status: "idle", coords: null });

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported", coords: null });
      return;
    }
    setState((s) => ({ ...s, status: "asking" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          localStorage.setItem(KEY, "1");
        } catch {}
        setState({ status: "granted", coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
      },
      () => setState({ status: "denied", coords: null }),
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 },
    );
  }, []);

  useEffect(() => {
    let remembered = false;
    try {
      remembered = localStorage.getItem(KEY) === "1";
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reactivar ubicación concedida antes
    if (remembered) request();
  }, [request]);

  return { ...state, request };
}
