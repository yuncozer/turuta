import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tú Ruta · Feria Internacional de San Sebastián",
    short_name: "Tú Ruta",
    description: "Cronograma, comercios, ubicaciones y cupones de la feria.",
    start_url: "/",
    display: "standalone",
    background_color: "#F3EADC",
    theme_color: "#C65D3B",
    lang: "es",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
