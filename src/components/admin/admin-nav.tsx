"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const links = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/comercios", label: "Comercios y cupones" },
  { href: "/admin/cronograma", label: "Cronograma" },
  { href: "/admin/usuarios", label: "Usuarios" },
];

export function AdminNav() {
  return (
    <Suspense fallback={<AdminNavView pathname="" />}>
      <ActiveAdminNav />
    </Suspense>
  );
}

function ActiveAdminNav() {
  return <AdminNavView pathname={usePathname()} />;
}

function AdminNavView({ pathname }: { pathname: string }) {
  return (
    <aside className="bg-panel text-on-panel md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0">
      <div className="flex items-center justify-between px-4 py-4 md:block md:px-5 md:py-6">
        <p className="font-bold">Tú Ruta · Admin</p>
        <Link href="/" className="text-xs text-panel-muted hover:text-on-panel md:mt-1 md:block">Ver la app →</Link>
      </div>
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1 md:px-3">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`block shrink-0 rounded-lg px-3 py-2 text-sm ${active ? "bg-on-panel/15 font-semibold" : "text-on-panel/80 hover:bg-on-panel/10"}`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
