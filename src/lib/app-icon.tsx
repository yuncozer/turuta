import { ImageResponse } from "next/og";

/**
 * Ícono PROVISIONAL de la app con los colores de Tú Ruta (terracota + crema y la flecha oficial).
 * Reemplazar por el isotipo «R» oficial en cuanto el cliente entregue su archivo vectorial
 * (el manual pide no deformar ni redibujar el isotipo).
 */
export function appIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#C65D3B",
          color: "#F3EADC",
          fontWeight: 800,
          position: "relative",
        }}
      >
        <div style={{ fontSize: size * 0.62, lineHeight: 1, marginRight: size * 0.12 }}>R</div>
        <svg
          viewBox="54 73 50 47"
          width={size * 0.26}
          height={size * 0.24}
          style={{ position: "absolute", right: size * 0.16, bottom: size * 0.2 }}
        >
          <path
            fill="#F3EADC"
            d="M102.47 75.01C95.47 89.46 88.43 103.9 81.17 118.22 79.24 110.96 77.37 103.69 75.35 96.46 69 92.57 62.67 88.66 56.35 84.72 71.61 80.99 86.99 77.72 102.47 75.01Z"
          />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
