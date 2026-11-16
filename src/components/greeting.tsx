"use client";

import Link from "next/link";
import { useAuth } from "./auth-provider";

export function Greeting() {
  const { configured, loading, user, profile } = useAuth();
  if (!configured || loading) return null;
  if (!user) {
    return (
      <Link href="/registro" className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
        Crear cuenta
      </Link>
    );
  }
  const first = profile?.full_name.split(" ")[0];
  return <span className="text-sm text-white/85">Hola{first ? `, ${first}` : ""}</span>;
}
