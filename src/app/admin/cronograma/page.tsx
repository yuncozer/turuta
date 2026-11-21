import type { Metadata } from "next";
import { Suspense } from "react";
import { deleteEvent, saveEvent } from "@/app/admin/actions";
import { AdminLoading, AdminTitle, Card, Flash, labelStyles } from "@/components/admin/ui";
import { buttonStyles, inputStyles } from "@/components/ui";
import { requireAdmin, toVeInput } from "@/lib/admin";
import { dayKey, dayLabel, formatTime } from "@/lib/format";
import type { Category, FairEvent } from "@/lib/types";

export const metadata: Metadata = { title: "Cronograma" };

export default function ScheduleAdmin(props: PageProps<"/admin/cronograma">) {
  return (
    <>
      <AdminTitle title="Cronograma" />
      <Suspense fallback={<AdminLoading />}>
        <ScheduleEditor {...props} />
      </Suspense>
    </>
  );
}

async function ScheduleEditor({ searchParams }: PageProps<"/admin/cronograma">) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: events }, { data: categories }] = await Promise.all([
    supabase.from("events").select("*").order("starts_at"),
    supabase.from("categories").select("*").eq("kind", "evento").order("sort_order"),
  ]);
  const list = (events ?? []) as FairEvent[];
  const cats = (categories ?? []) as Category[];
  const byDay = Map.groupBy(list, (e) => dayKey(e.starts_at));

  return (
    <>
      <Flash params={sp} />
      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          {[...byDay.entries()].map(([day, items]) => (
            <Card key={day} title={dayLabel(day)}>
              <ul className="space-y-2">
                {items.map((e) => (
                  <li key={e.id} className="rounded-xl border border-line">
                    <details>
                      <summary className="flex cursor-pointer items-center gap-3 p-3">
                        <span className="w-16 shrink-0 font-bold text-link">{formatTime(e.starts_at)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{e.title}</span>
                          <span className="block text-xs text-muted">{e.venue}{!e.is_published && " · oculto"}</span>
                        </span>
                        <span className="text-xs font-semibold text-link">Editar</span>
                      </summary>
                      <div className="border-t border-line p-3">
                        <EventForm event={e} categories={cats} />
                        <form action={deleteEvent} className="mt-2">
                          <input type="hidden" name="id" value={e.id} />
                          <button className="text-sm font-semibold text-danger">Eliminar evento</button>
                        </form>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          {list.length === 0 && <Card><p className="text-sm text-muted">Aún no hay eventos.</p></Card>}
        </div>
        <Card title="Nuevo evento" className="h-fit xl:sticky xl:top-8">
          <EventForm categories={cats} />
        </Card>
      </div>
    </>
  );
}

function EventForm({ event, categories }: { event?: FairEvent; categories: Category[] }) {
  return (
    <form action={saveEvent} className="grid gap-3">
      {event && <input type="hidden" name="id" value={event.id} />}
      <label>
        <span className={labelStyles}>Título</span>
        <input name="title" defaultValue={event?.title} required className={inputStyles} />
      </label>
      <label>
        <span className={labelStyles}>Tipo</span>
        <select name="category" defaultValue={event?.category ?? ""} required className={inputStyles}>
          <option value="" disabled>Elige uno</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
      </label>
      <label>
        <span className={labelStyles}>Lugar</span>
        <input name="venue" defaultValue={event?.venue} className={inputStyles} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className={labelStyles}>Inicio</span>
          <input name="starts_at" type="datetime-local" required defaultValue={toVeInput(event?.starts_at)} className={inputStyles} />
        </label>
        <label>
          <span className={labelStyles}>Fin (opcional)</span>
          <input name="ends_at" type="datetime-local" defaultValue={toVeInput(event?.ends_at)} className={inputStyles} />
        </label>
      </div>
      <label>
        <span className={labelStyles}>Descripción (opcional)</span>
        <textarea name="description" defaultValue={event?.description} rows={2} className={inputStyles} />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked={event?.is_published ?? true} className="h-4 w-4 accent-primary" />
        Visible en la app
      </label>
      <div>
        <button className={`${buttonStyles.primary} !py-2 text-sm`}>{event ? "Guardar cambios" : "Agregar evento"}</button>
      </div>
    </form>
  );
}
