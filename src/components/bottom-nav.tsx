"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CalendarIcon, HomeIcon, TagIcon, UserIcon } from "./icons";

const items = [
  { href: "/", label: "Inicio", Icon: HomeIcon },
  { href: "/cronograma", label: "Cronograma", Icon: CalendarIcon },
  { href: "/cupones", label: "Cupones", Icon: TagIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
] as const;

export function BottomNav() {
  return (
    <Suspense fallback={<BottomNavView pathname="" />}>
      <ActiveBottomNav />
    </Suspense>
  );
}

function ActiveBottomNav() {
  return <BottomNavView pathname={usePathname()} />;
}

function BottomNavView({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" || pathname.startsWith("/comercios") : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "font-semibold text-brand-700" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                <Icon />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
