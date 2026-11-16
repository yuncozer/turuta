import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { regenerateMerchantLink, saveCoupon, saveMerchant, setMerchantPin, toggleCoupon } from "@/app/admin/actions";
import { CopyLink } from "@/components/admin/copy-link";
import { ImageUpload } from "@/components/admin/image-upload";
import { AdminLoading, AdminTitle, Card, Flash, labelStyles } from "@/components/admin/ui";
import { buttonStyles, inputStyles } from "@/components/ui";
import { requireAdmin, toVeInput } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";
import type { Category, Coupon, Merchant } from "@/lib/types";

export const metadata: Metadata = { title: "Editar comercio" };

export default function MerchantEditPage(props: PageProps<"/admin/comercios/[id]">) {
  return (
    <>
      <Link href="/admin/comercios" className="mb-2 inline-block text-sm font-semibold text-brand-700">← Comercios</Link>
      <Suspense fallback={<AdminLoading />}>
        <MerchantEditor {...props} />
      </Suspense>
    </>
  );
}

async function MerchantEditor({ params, searchParams }: PageProps<"/admin/comercios/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  const isNew = id === "nuevo";

  const [{ data: categories }, merchantRes, couponsRes, linkRes] = await Promise.all([
    supabase.from("categories").select("*").eq("kind", "comercio").order("sort_order"),
    isNew ? Promise.resolve({ data: null }) : supabase.from("merchants").select("*").eq("id", id).maybeSingle(),
    isNew ? Promise.resolve({ data: [] }) : supabase.from("coupons").select("*").eq("merchant_id", id).order("created_at"),
    isNew ? Promise.resolve({ data: null }) : supabase.rpc("admin_merchant_link", { p_merchant_id: id }),
  ]);
  const m = merchantRes.data as Merchant | null;
  if (!isNew && !m) notFound();
  const coupons = (couponsRes.data ?? []) as Coupon[];
  const link = linkRes.data as { token: string; has_pin: boolean; locked_until: string | null } | null;
  const cats = (categories ?? []) as Category[];

  return (
    <>
      <AdminTitle title={isNew ? "Nuevo comercio" : m!.name}>
        {m?.is_published && <Link href={`/comercios/${m.slug}`} target="_blank" className={`${buttonStyles.ghost} text-sm`}>Ver en la app ↗</Link>}
      </AdminTitle>
      <Flash params={sp} />

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <Card title="Datos del comercio">
          <form action={saveMerchant} className="grid gap-4 sm:grid-cols-2">
            {m && <input type="hidden" name="id" value={m.id} />}
            <Input label="Nombre comercial" name="name" defaultValue={m?.name} required />
            <label>
              <span className={labelStyles}>Categoría</span>
              <select name="category" defaultValue={m?.category ?? ""} required className={inputStyles}>
                <option value="" disabled>Elige una</option>
                {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="sm:col-span-2">
              <span className={labelStyles}>Descripción breve</span>
              <textarea name="description" defaultValue={m?.description} rows={3} maxLength={600} className={inputStyles} />
            </label>
            <Input label="Ubicación (texto)" name="location_label" defaultValue={m?.location_label} placeholder="Asogata, stand 12" />
            <Input label="Enlace de Google Maps" name="maps_url" defaultValue={m?.maps_url ?? ""} placeholder="https://maps.app.goo.gl/…" hint="Si el enlace trae coordenadas, se usan para «Cerca de ti»." />
            <Input label="WhatsApp" name="whatsapp" defaultValue={m?.whatsapp ?? ""} placeholder="58414…" />
            <Input label="Instagram" name="instagram" defaultValue={m?.instagram ?? ""} placeholder="@usuario" />
            <Input label="Horario (texto)" name="opening_hours" defaultValue={m?.opening_hours} placeholder="11:00 am – 11:00 pm" />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Abre" name="opens_at" type="time" defaultValue={m?.opens_at?.slice(0, 5) ?? ""} />
              <Input label="Cierra" name="closes_at" type="time" defaultValue={m?.closes_at?.slice(0, 5) ?? ""} />
            </div>
            <label>
              <span className={labelStyles}>Plan publicitario</span>
              <select name="plan" defaultValue={m?.plan ?? "basico"} className={inputStyles}>
                <option value="basico">Básico</option>
                <option value="destacado">Destacado</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <Input label="Posición en Populares" name="popular_rank" type="number" min={1} defaultValue={m?.popular_rank ?? ""} hint="Vacío = no aparece en Populares." />
            <Input label="Correo para reportes" name="report_email" type="email" defaultValue={m?.report_email ?? ""} />
            <Input label="Dirección en la app (slug)" name="slug" defaultValue={m?.slug ?? ""} hint="Vacío = se genera desde el nombre." />
            <ImageUpload name="logo_url" label="Logo (cuadrado, mín. 500×500)" folder="logos" defaultValue={m?.logo_url ?? ""} />
            <ImageUpload name="banner_url" label="Banner (1600×900)" folder="banners" defaultValue={m?.banner_url ?? ""} />
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" name="is_published" defaultChecked={m?.is_published ?? false} className="h-4 w-4 accent-brand-700" />
              Publicado en la app
            </label>
            <div className="sm:col-span-2">
              <button className={buttonStyles.primary}>Guardar comercio</button>
            </div>
          </form>
        </Card>

        {m && link && (
          <div className="space-y-6">
            <Card title="Validación de cupones">
              <p className="text-sm text-muted">Envía este enlace y el PIN al comercio. Con ellos valida cupones desde su celular, sin crear cuenta.</p>
              <CopyLink path={`/validar/${link.token}`} />
              <p className="mt-2 text-xs text-muted">
                {link.has_pin ? "PIN configurado." : "Aún no tiene PIN: configúralo para activar la validación."}
                {link.locked_until && new Date(link.locked_until) > new Date() && ` Bloqueado por intentos fallidos hasta ${formatDateTime(link.locked_until)}.`}
              </p>
              <form action={setMerchantPin} className="mt-3 flex gap-2">
                <input type="hidden" name="merchant_id" value={m.id} />
                <input name="pin" inputMode="numeric" pattern="[0-9]{4,8}" required placeholder="Nuevo PIN (4–8 dígitos)" className={inputStyles} />
                <button className={`${buttonStyles.secondary} shrink-0 !py-2`}>Guardar PIN</button>
              </form>
              <form action={regenerateMerchantLink} className="mt-3">
                <input type="hidden" name="merchant_id" value={m.id} />
                <button className="text-sm font-semibold text-danger underline">Renovar enlace (si se compartió por error)</button>
              </form>
            </Card>

            <Card title="Cupones y promociones">
              <ul className="space-y-4">
                {coupons.map((c) => (
                  <li key={c.id} className="rounded-xl border border-line p-3">
                    <CouponForm merchantId={m.id} coupon={c} />
                    <form action={toggleCoupon} className="mt-2">
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="merchant_id" value={m.id} />
                      <input type="hidden" name="is_active" value={String(!c.is_active)} />
                      <button className={`text-sm font-semibold ${c.is_active ? "text-danger" : "text-ok"}`}>
                        {c.is_active ? "Pausar cupón" : "Activar cupón"}
                      </button>
                      <span className="ml-2 text-xs text-muted">
                        {c.kind === "cupo" ? `Quedan ${c.remaining} de ${c.total_quota}` : "Promoción abierta"}
                        {!c.is_active && " · pausado"}
                      </span>
                    </form>
                  </li>
                ))}
              </ul>
              <details className="mt-4" open={coupons.length === 0}>
                <summary className="cursor-pointer text-sm font-semibold text-brand-700">+ Nuevo cupón</summary>
                <div className="mt-3"><CouponForm merchantId={m.id} /></div>
              </details>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}

function CouponForm({ merchantId, coupon }: { merchantId: string; coupon?: Coupon }) {
  return (
    <form action={saveCoupon} className="grid gap-2">
      {coupon && <input type="hidden" name="id" value={coupon.id} />}
      <input type="hidden" name="merchant_id" value={merchantId} />
      <Input label="Beneficio" name="title" defaultValue={coupon?.title} required placeholder="2x1 en hamburguesa clásica" />
      <Input label="Condiciones" name="terms" defaultValue={coupon?.terms} placeholder="1 por persona." />
      <div className="grid grid-cols-2 gap-2">
        <label>
          <span className={labelStyles}>Tipo</span>
          <select name="kind" defaultValue={coupon?.kind ?? "cupo"} className={inputStyles}>
            <option value="cupo">Con cupos (QR único)</option>
            <option value="abierta">Abierta (sin límite)</option>
          </select>
        </label>
        <Input label="Cupos" name="total_quota" type="number" min={1} defaultValue={coupon?.total_quota ?? ""} hint="Solo para «Con cupos»." />
      </div>
      <Input label="Válido hasta" name="valid_until" type="datetime-local" required defaultValue={toVeInput(coupon?.valid_until) || "2027-01-31T23:59"} />
      <div>
        <button className={`${buttonStyles.secondary} !py-2 text-sm`}>{coupon ? "Guardar cambios" : "Crear cupón"}</button>
      </div>
    </form>
  );
}

function Input({ label, hint, ...props }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className={labelStyles}>{label}</span>
      <input {...props} className={inputStyles} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
