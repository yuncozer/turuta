import { Notice } from "@/components/ui";

export function AdminTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function Flash({ params }: { params: Record<string, string | string[] | undefined> }) {
  const ok = typeof params.ok === "string" ? params.ok : null;
  const error = typeof params.error === "string" ? params.error : null;
  if (!ok && !error) return null;
  return <div className="mb-4">{error ? <Notice tone="error">{error}</Notice> : <Notice tone="ok">{ok}</Notice>}</div>;
}

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-line bg-white p-5 ${className}`}>
      {title && <h2 className="mb-3 font-bold">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-2xl font-bold text-brand-700">{typeof value === "number" ? value.toLocaleString("es-VE") : value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

export function AdminLoading() {
  return <div className="h-40 animate-pulse rounded-2xl bg-white/60" aria-label="Cargando" />;
}

export const tableStyles = {
  table: "w-full text-left text-sm",
  th: "border-b border-line px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted",
  td: "border-b border-line px-3 py-2.5",
};

export const labelStyles = "mb-1 block text-sm font-medium";

/** Barra horizontal simple para distribuciones (municipios, edades, intereses). */
export function Distribution({ rows }: { rows: { label: string; total: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Aún no hay datos.</p>;
  const max = Math.max(...rows.map((r) => r.total));
  return (
    <ul className="space-y-1.5">
      {rows.slice(0, 12).map((r) => (
        <li key={r.label} className="grid grid-cols-[8rem_1fr_3rem] items-center gap-2 text-sm">
          <span className="truncate capitalize">{r.label}</span>
          <span className="h-2.5 rounded-full bg-brand-100">
            <span className="block h-full rounded-full bg-brand-600" style={{ width: `${(r.total / max) * 100}%` }} />
          </span>
          <span className="text-right tabular-nums text-muted">{r.total}</span>
        </li>
      ))}
    </ul>
  );
}
