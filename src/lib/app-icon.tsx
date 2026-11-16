import { ImageResponse } from "next/og";

/** Ícono provisional de la app (se reemplaza por el logo oficial de la FISS 2027). */
export function appIcon(size: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#3d1d6e",
          color: "white",
          fontWeight: 800,
        }}
      >
        <div style={{ fontSize: size * 0.3, letterSpacing: -size * 0.01 }}>FISS</div>
        <div style={{ fontSize: size * 0.16, color: "#e8622c" }}>2027</div>
      </div>
    ),
    { width: size, height: size },
  );
}
