/**
 * Logotipo de Tú Ruta. En modo claro, a color (negro + terracota); en modo oscuro,
 * la versión negativa del manual (blanco + acento terracota). Formas sin alterar.
 */
export function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/tu-ruta-color.svg" alt="Tú Ruta" width={1060} height={640} className={`${className} dark:hidden`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/tu-ruta-negativo.svg" alt="Tú Ruta" width={1060} height={640} className={`${className} hidden dark:block`} />
    </>
  );
}
