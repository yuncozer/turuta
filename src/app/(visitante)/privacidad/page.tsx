import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { PRIVACY_VERSION } from "@/lib/env";

export const metadata: Metadata = { title: "Política de Privacidad" };

/*
 * TEXTO BASE. La redacción legal definitiva no está incluida en el alcance:
 * el organizador debe revisarla con su asesor antes del lanzamiento.
 */
export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Política de Privacidad" subtitle={`Versión ${PRIVACY_VERSION} · texto base`} back="/perfil" />
      <main className="space-y-4 px-4 py-5 text-sm leading-relaxed">
        <section>
          <h2 className="font-bold">1. Responsable</h2>
          <p>La app de la Feria Internacional de San Sebastián 2027 es operada por el organizador de la aplicación (en adelante, «el Responsable»).</p>
        </section>
        <section>
          <h2 className="font-bold">2. Datos que recopilamos</h2>
          <p>Nombre, correo electrónico, número de WhatsApp y, si completas tu perfil, municipio, año de nacimiento e intereses. También registramos los cupones que obtienes y canjeas. Tu ubicación solo se usa en tu teléfono para ordenar los locales por distancia; no se guarda.</p>
        </section>
        <section>
          <h2 className="font-bold">3. Para qué los usamos</h2>
          <p>Para darte acceso a cupones y promociones, gestionar la rifa de cierre, enviarte información de la feria y de sus anunciantes, y elaborar estadísticas. Con tu consentimiento, tus datos pueden usarse con fines comerciales, incluida su cesión a terceros (anunciantes y patrocinadores).</p>
        </section>
        <section>
          <h2 className="font-bold">4. Tus derechos</h2>
          <p>Puedes darte de baja del uso comercial de tus datos en cualquier momento desde tu Perfil, y solicitar su consulta, corrección o eliminación escribiendo al Responsable.</p>
        </section>
        <section>
          <h2 className="font-bold">5. Seguridad</h2>
          <p>Los datos se almacenan en servidores con cifrado y acceso restringido por roles. Los comercios solo ven el nombre de pila de quien canjea un cupón.</p>
        </section>
        <section>
          <h2 className="font-bold">6. Rifa de cierre</h2>
          <p>Participan quienes completen su perfil. Las bases y permisos de la rifa son responsabilidad del organizador según la normativa vigente.</p>
        </section>
      </main>
    </>
  );
}
