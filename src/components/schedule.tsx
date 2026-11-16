"use client";

import { useEffect, useMemo, useState } from "react";
import { dayKey, dayLabel, formatTime } from "@/lib/format";
import type { Category, FairEvent } from "@/lib/types";

export function Schedule({ events, categories }: { events: FairEvent[]; categories: Category[] }) {
  const days = useMemo(() => [...new Set(events.map((e) => dayKey(e.starts_at)))].sort(), [events]);
  const [day, setDay] = useState(days[0] ?? "");
  const [category, setCategory] = useState("todos");

  // Durante la feria, abrir directamente en el día de hoy.
  useEffect(() => {
    const today = dayKey(new Date());
    // eslint-disable-next-line react-hooks/set-state-in-effect -- depende de la fecha del dispositivo
    if (days.includes(today)) setDay(today);
  }, [days]);

  const visible = events.filter((e) => dayKey(e.starts_at) === day && (category === "todos" || e.category === category));
  const usedCategories = categories.filter((c) => events.some((e) => e.category === c.slug));

  return (
    <>
      <header className="sticky top-0 z-20 bg-brand-700 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+16px)] text-white">
        <h1 className="text-xl font-bold">Cronograma</h1>
        <div role="tablist" aria-label="Días" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {days.map((d) => (
            <button
              key={d}
              role="tab"
              aria-selected={d === day}
              onClick={() => setDay(d)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold ${d === day ? "bg-accent-500 text-white" : "bg-white text-ink"}`}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 py-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1" aria-label="Tipo de evento">
          {[{ slug: "todos", name: "Todos" }, ...usedCategories].map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              aria-pressed={category === c.slug}
              className={`shrink-0 rounded-full px-3.5 py-1 text-sm ${category === c.slug ? "bg-accent-500 font-semibold text-white" : "border border-line bg-white"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <ul className="mt-3 space-y-2">
          {visible.map((e) => (
            <li key={e.id} className="flex gap-3 rounded-2xl border border-line bg-white p-3">
              <p className="w-16 shrink-0 text-sm font-bold text-accent-600">{formatTime(e.starts_at)}</p>
              <div className="min-w-0">
                <p className="font-semibold">{e.title}</p>
                <p className="text-xs text-muted">{e.venue}</p>
                {e.description && <p className="mt-1 text-sm text-muted">{e.description}</p>}
              </div>
            </li>
          ))}
          {visible.length === 0 && <li className="py-10 text-center text-sm text-muted">No hay eventos de este tipo este día.</li>}
        </ul>
      </main>
    </>
  );
}
