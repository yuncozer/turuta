"use client";

import { getBrowserClient } from "@/lib/supabase/client";

type Metric = "views" | "map_clicks" | "whatsapp_clicks";

/** Suma una métrica al comercio (contador diario agregado). Nunca bloquea la interfaz. */
export function track(merchantId: string, metric: Metric) {
  const supabase = getBrowserClient();
  if (!supabase) return;
  void supabase.rpc("track_merchant", { p_merchant_id: merchantId, p_metric: metric }).then(
    () => {},
    () => {},
  );
}
