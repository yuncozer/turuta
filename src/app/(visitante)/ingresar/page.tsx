import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Ingresar" };

export default function Page() {
  return (
    <AuthShell title="Ingresar" subtitle="Accede a tus cupones y tu perfil.">
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthShell>
  );
}
