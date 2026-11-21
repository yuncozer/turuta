import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Tú Ruta" }, robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh bg-canvas md:flex">
      <AdminNav />
      <div className="min-w-0 flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
