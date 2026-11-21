import type { Metadata } from "next";
import { Suspense } from "react";
import { MerchantValidator } from "@/components/merchant-validator";

export const metadata: Metadata = { title: "Validar cupón", robots: { index: false, follow: false } };

/** Modo comercio: enlace propio + PIN, sin crear cuenta. */
export default function ValidatePage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-dvh max-w-md bg-panel" />}>
      <MerchantValidator />
    </Suspense>
  );
}
