import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FISS 2027 · Feria Internacional de San Sebastián",
    short_name: "FISS 2027",
    description: "Cronograma, comercios, ubicaciones y cupones de la feria.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f0ea",
    theme_color: "#3d1d6e",
    lang: "es",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
