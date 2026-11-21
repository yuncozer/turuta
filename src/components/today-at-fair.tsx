"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dayKey, dayLabel, formatTime } from "@/lib/format";
import type { FairEvent } from "@/lib/types";

/** Próximo evento de hoy; si hoy no hay, el próximo de la feria. Se calcula en el teléfono (hora actual). */
export function TodayAtFair({ events }: { events: FairEvent[] }) {
  const [next, setNext] = useState<{ event: FairEvent; today: boolean } | null>(null);

  useEffect(() => {
    const now = Date.now();
    const today = dayKey(new Date());
    const upcoming = events.filter((e) => new Date(e.ends_at ?? e.starts_at).getTime() + 2 * 3600_000 > now);
    const todays = upcoming.find((e) => dayKey(e.starts_at) === today);
    const pick = todays ?? upcoming[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende de la hora del dispositivo
    setNext(pick ? { event: pick, today: Boolean(todays) } : null);
  }, [events]);

  if (!next) return null;
  const { event, today } = next;
  return (
    <section className="px-4">
      <Link href="/cronograma" className="block rounded-2xl bg-panel p-4 text-on-panel">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-panel-muted">{today ? "Hoy en la feria" : `Próximo · ${dayLabel(dayKey(event.starts_at))}`}</p>
        <p className="mt-1 font-bold">{event.title} · {formatTime(event.starts_at)}</p>
        <p className="text-sm text-panel-muted">{event.venue}</p>
      </Link>
    </section>
  );
}
