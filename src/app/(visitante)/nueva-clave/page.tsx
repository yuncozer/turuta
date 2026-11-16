import type { Metadata } from "next";
import { Suspense } from "react";
import { NewPasswordForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function Page() {
  return (
    <AuthShell title="Nueva contraseña" subtitle="Elige una contraseña de al menos 8 caracteres.">
      <Suspense>
        <NewPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
