# Tú Ruta · App de la Feria de San Sebastián (Beta)

App web (PWA) de la Feria Internacional de San Sebastián 2027: cronograma, comercios, "Cerca de ti", cupones con QR, validación en el comercio y panel de administración.

**Identidad:** manual de marca de Tú Ruta, aprobado por el cliente el 21/11/2026: modo claro = propuesta A «Crema Ruta», modo oscuro = propuesta B «Noche de Feria». Cada visitante elige Claro, Oscuro o Automático (botón sol/luna en el Inicio y «Apariencia» en el Perfil). Colores por función en `src/app/globals.css`, logos en `public/brand/`. El ícono de la app es provisional hasta recibir el isotipo «R» en vector.

**Stack:** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · Supabase (PostgreSQL + Auth + Storage) · Vercel.
Plan de trabajo y alcance: [`docs/PLAN_BETA.md`](docs/PLAN_BETA.md).

## Qué incluye esta Beta (core)

| Área | Funciones |
|---|---|
| Visitante | Inicio con Populares, categorías, "Cerca de ti" (geolocalización) y "Hoy en la feria"; cronograma por día y tipo; directorio con búsqueda; ficha del local con "Ver ubicación" (Google Maps) y WhatsApp |
| Cuentas | Registro con 3 datos + consentimiento, o con Google (pide WhatsApp y consentimiento después); verificación de correo; recuperación de contraseña; perfil completo (municipio, edad, intereses) → participa en la rifa; darse de baja |
| Registro gradual | El visitante navega libremente; tras N consultas se le invita a registrarse (`NEXT_PUBLIC_SOFT_GATE_VIEWS`) |
| Cupones | Con cupos (QR único, 1 por persona, nunca se entregan más de los disponibles) o abiertos; descarga como imagen; disponibles sin señal |
| Comercio | Enlace propio + PIN (`/validar/<token>`), escáner QR con la cámara o código manual, canje único, bloqueo tras 5 PIN erróneos, canjes del día |
| Panel admin | Resumen (usuarios, comercios, canjes, municipios), resultados por comercio, distribución por municipio/edad/intereses; CRUD de comercios, imágenes, cupones y cronograma; PIN y renovación de enlace; exportación de usuarios a Excel |
| Plataforma | Contenido público cacheado e invalidado al guardar en el panel; métricas agregadas por día; RLS en todas las tablas; PWA instalable con service worker |

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # completar con los datos de Supabase
npm run dev
```

Sin variables de Supabase la app arranca en **modo demo**: la parte pública funciona con datos de ejemplo (`src/lib/demo-data.ts`) y las cuentas/cupones quedan desactivados.

### Supabase

1. Crear el proyecto (cuenta a nombre del cliente) y copiar `URL` y `anon key` a `.env.local` y a Vercel.
2. Aplicar las migraciones en orden (`supabase/migrations/*.sql`) desde el SQL Editor o con `supabase db push`.
3. (Opcional, para la Beta) cargar los datos de ejemplo: `supabase/seed.sql` — PIN de todos los comercios: `1234`.
4. Auth → URL Configuration: *Site URL* = dominio de la app; *Redirect URLs* = `https://<dominio>/auth/callback`.
5. Auth → Providers → Google: activar con el Client ID/Secret de Google Cloud.
6. Auth → SMTP: configurar Resend para los correos de verificación y recuperación.
7. Crear el primer administrador: registrarse en la app y ejecutar
   `update public.profiles set role = 'admin' where email = 'correo@organizador.com';`

### Vercel

Importar el repositorio, definir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y desplegar.

## Pruebas

```bash
npm run lint && npm run typecheck && npm run build
npm run db:test     # migraciones + reglas de negocio + ráfaga de 300 solicitudes sobre un cupón de 50 cupos (Postgres local)
npm run test:e2e    # flujo completo en navegador (ver encabezado de tests/e2e/flujo-completo.mjs)
```

`db:test` usa un Postgres local con un stub mínimo de Supabase (`supabase/tests/supabase_stub.sql`), sin Docker.

## Estructura

```
src/app/(visitante)/   inicio, cronograma, comercios, cupones, perfil, registro…
src/app/validar/       modo comercio
src/app/admin/         panel (Server Components + Server Actions)
src/lib/data.ts        lecturas públicas cacheadas ("use cache" + cacheTag)
supabase/migrations/   esquema, RLS, funciones (claim_coupon, redeem_coupon, …), storage
supabase/tests/        pruebas SQL
```

## Próximos incrementos (según el plan)

1. Turnstile en registro y obtención de cupón; límites de uso.
2. Funciones B del visitante: Favoritos, "Mi agenda" con `.ics`, "Para ti", búsqueda avanzada (abierto ahora / con cupón / cercanía).
3. Envío del reporte por correo a cada comercio (Resend) desde el panel.
4. Sentry y pruebas de carga con k6.
5. Sorteo de la rifa de cierre desde el panel.
