import type { Metadata, Viewport } from "next";
import { Figtree } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { ServiceWorker } from "@/components/service-worker";
import "./globals.css";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "FISS 2027 · Feria Internacional de San Sebastián", template: "%s · FISS 2027" },
  description: "Toda la feria en un mismo lugar: cronograma, comercios, ubicaciones y cupones de la FISS 2027.",
  applicationName: "FISS 2027",
  appleWebApp: { capable: true, title: "FISS 2027", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#3d1d6e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${figtree.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthProvider>{children}</AuthProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
