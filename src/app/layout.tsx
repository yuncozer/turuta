import type { Metadata, Viewport } from "next";
import { DM_Sans, Montserrat } from "next/font/google";
import { AuthProvider } from "@/components/auth-provider";
import { ServiceWorker } from "@/components/service-worker";
import { THEME_SCRIPT, ThemeWatcher } from "@/components/theme";
import "./globals.css";

// Tipografías del manual de marca: Montserrat (títulos) y DM Sans (cuerpo).
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["600", "700", "800"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Tú Ruta · Feria Internacional de San Sebastián", template: "%s · Tú Ruta" },
  description: "Toda la feria en un mismo lugar: cronograma, comercios, ubicaciones y cupones de la Feria Internacional de San Sebastián.",
  applicationName: "Tú Ruta",
  appleWebApp: { capable: true, title: "Tú Ruta", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3EADC" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // data-theme lo fija THEME_SCRIPT antes de pintar; puede diferir del HTML del servidor.
    <html lang="es" className={`${montserrat.variable} ${dmSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full font-sans">
        <AuthProvider>{children}</AuthProvider>
        <ThemeWatcher />
        <ServiceWorker />
      </body>
    </html>
  );
}
