import type { Metadata } from "next";
import { Suspense } from "react";
import { RecoverForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function Page() {
  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviamos un enlace a tu correo.">
      <Suspense>
        <RecoverForm />
      </Suspense>
    </AuthShell>
  );
}
