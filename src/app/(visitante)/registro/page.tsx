import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUpForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata: Metadata = { title: "Crea tu cuenta" };

export default function Page() {
  return (
    <AuthShell title="Crea tu cuenta" subtitle="Solo 3 datos y listo.">
      <Suspense>
        <SignUpForm />
      </Suspense>
    </AuthShell>
  );
}
