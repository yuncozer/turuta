# Plan de desarrollo — Versión Beta · App FISS 2027 (Propuesta B "Feria Conectada")

> Documento de trabajo del desarrollador. Base: *Propuesta técnica-comercial App web FISS 2027* (23/09/2026), Propuesta B elegida por el cliente.
> Fecha del plan: lunes 16 de noviembre de 2026.

---

## 1. Objetivo de la Beta

Tener una versión **funcionalmente completa de la Propuesta B**, desplegada en un dominio de pruebas, con datos reales de un grupo piloto de comercios, para:

1. Que el cliente **valide** flujos, contenidos y panel antes del lanzamiento.
2. Que el cliente **use la Beta como demo de venta** de espacios publicitarios (Básico / Destacado / Premium).
3. Ejecutar **rondas de QA y pruebas de carga** sobre la misma infraestructura de producción.
4. Disparar el **hito de pago del 30 %** ("entrega beta").

### Ajuste de calendario (importante)

La propuesta suponía firma en octubre y lanzamiento el **1 de diciembre**. Hoy es **16 de noviembre**; con 4 semanas de desarrollo para B el calendario realista es:

| Hito | Fecha | Pago |
|---|---|---|
| Arranque (firma + anticipo + cuentas creadas) | lun 16 – mar 17 nov | 40 % |
| Sesión de identidad visual / UI | mar 17 – mié 18 nov | — |
| **Entrega Beta** | **vie 4 dic** | 30 % |
| QA, carga de comercios, pruebas de carga | 7 – 11 dic | — |
| **Lanzamiento público** | **lun 14 dic** | 30 % |
| Soporte de temporada | 15 dic – 15 feb | (USD 250) |

**Acción:** confirmar por escrito con el cliente la nueva fecha (14 dic). Para mitigar los 13 días de retraso en la venta de publicidad, la Beta (4 dic) ya sirve como demo para anunciantes y la carga de comercios arranca desde la semana 2 vía formulario.

---

## 2. Alcance de la Beta

### Incluido (todo lo de B)

**Visitante (PWA)**
- Inicio: buscador, *Populares* (Premium), categorías, *Cerca de ti*, banner "Hoy en la feria".
- Cronograma por día con filtros por categoría, búsqueda y "Próximos eventos".
- Directorio + ficha del local (banner, logo, horario, promoción, "Ver ubicación" → Google Maps, WhatsApp).
- Búsqueda avanzada: abierto ahora, con cupón, cercanía.
- Registro en 2 pasos (nombre, correo, WhatsApp / Google) + consentimiento; perfil completo (municipio, edad, intereses) → participación en rifa.
- *Soft-gate*: tras N consultas (configurable, p. ej. 5) se invita a registrarse.
- Cupones QR: con cupo y vigencia, 1 por usuario, descargable como imagen. Promociones abiertas (sin cupo, solo registrados).
- "Para ti" (recomendaciones por intereses), Favoritos, "Mi agenda" con archivo `.ics` para el calendario del teléfono.
- Instalable (manifest + service worker), caché offline del cupón y del cronograma.

**Comercio (sin cuenta)**
- Enlace único `/validar/<token>` + PIN. Escaneo de QR con la cámara o ingreso manual del código. Muestra canjes del día y cupos restantes.

**Cliente (panel `/admin`)**
- Resumen (KPIs: usuarios, comercios activos, cupones canjeados, municipios).
- CRUD de Comercios (plan, imágenes, ubicación, horario, publicación on/off), Cupones (cupo, vigencia, pausar), Cronograma, Populares (orden).
- Usuarios: resumen por municipio/edad/intereses + exportación a Excel.
- Reportes por comercio (vistas, clics en ubicación/WhatsApp, cupones obtenidos/canjeados) + "Enviar reporte" por correo.
- Regeneración de token/PIN de validación de un comercio.

**Transversal**
- Correos (Resend): verificación, recuperación de contraseña, reporte a comercios. (Aviso a ganadores de rifa: plantilla lista, se usa al cierre.)
- Turnstile en registro y en obtención de cupón; rate limiting; Sentry.

### Fuera de la Beta (se completa en la semana de QA o después)
- Rifa: el sorteo en sí se ejecuta al cierre de la feria (script/acción de admin), no se requiere en Beta.
- Envío automático programado de reportes (en Beta el envío es manual desde el panel).
- Fase 2 de la propuesta (app nativa, pagos, push, entradas): **no incluido**.

---

## 3. Arquitectura

```
Visitante (PWA) ──► Vercel (Next.js, CDN, firewall)
                     ├─ Páginas públicas: estáticas + ISR/revalidación on-demand
                     ├─ Route Handlers / Server Actions (cupones, métricas, admin)
                     └─► Supabase
                           ├─ Postgres + RLS + funciones SQL (cupones atómicos)
                           ├─ Auth (email + Google OAuth)
                           └─ Storage (logos, banners) → next/image
                     ├─► Resend (correos)
                     ├─► Cloudflare Turnstile (anti-bots)
                     └─► Sentry (errores)
```

**Decisiones clave**

| Tema | Decisión | Motivo |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript + Tailwind | Lo comprometido en la propuesta. |
| Contenido público | Generado estático, revalidado on-demand cuando el admin guarda (`revalidateTag`) | La mayoría de visitas no toca la BD (requisito de alto tráfico). |
| Datos personales | Client-side con Supabase JS + RLS (favoritos, agenda, mis cupones) | Escala sin carga de servidor Next. |
| Operaciones críticas | Funciones Postgres `SECURITY DEFINER` llamadas por RPC desde el servidor | Atomicidad de cupos y canjes. |
| Métricas | Contadores diarios agregados (`merchant_stats_daily`) con `upsert … +1`, enviados por lote (`navigator.sendBeacon`) | Evita una tabla de eventos gigante en picos. |
| QR | Generación: `qrcode` (cliente). Lectura: `@zxing/browser` o `html5-qrcode` | Sin costo por uso. |
| PWA | `@serwist/next` | Service worker mantenido para App Router. |
| Excel | `exceljs` en un Route Handler solo-admin | Exportación de usuarios y reportes. |
| Validación de formularios | `zod` + `react-hook-form` | Mismo esquema en cliente y servidor. |
| Comercio | Sin cuenta Auth: token largo aleatorio en URL + PIN (hash bcrypt/argon2) | Requisito: el comercio no se registra. |

---

## 4. Modelo de datos (Postgres)

```
profiles            id (=auth.users.id), full_name, whatsapp, municipality, birth_year,
                    interests text[], role ('visitor'|'admin'), consent_at, consent_version,
                    marketing_opt_out bool, profile_completed_at, raffle_eligible bool, created_at
merchants           id, slug, name, category, description, logo_url, banner_url,
                    maps_url, lat, lng, stand_label, whatsapp, socials jsonb,
                    opening_hours jsonb, plan ('basic'|'featured'|'premium'),
                    popular_rank int, is_published bool, report_email,
                    validation_token (único), pin_hash, pin_failed_attempts, pin_locked_until
coupons             id, merchant_id, title, terms, type ('limited'|'open'),
                    total_quota int null, remaining int null, valid_from, valid_until,
                    per_user_limit int default 1, is_active bool
coupon_claims       id, coupon_id, user_id, code (FISS-XXXX-XX, único), claimed_at,
                    redeemed_at null, redeemed_by_merchant_id
                    UNIQUE(coupon_id, user_id)
events              id, title, category, venue, starts_at, ends_at, day, description, image_url
favorites           user_id, merchant_id  (PK compuesta)
agenda_items        user_id, event_id     (PK compuesta)
merchant_stats_daily merchant_id, day, views, map_clicks, whatsapp_clicks,
                    claims, redemptions   (PK merchant_id+day)
categories          id, slug, name, kind ('merchant'|'event'), icon
settings            key, value jsonb  (soft-gate N, textos, fechas de la feria, versión de política)
audit_log           id, actor, action, entity, entity_id, at  (acciones del panel)
```

**RLS (resumen)**
- Lectura pública: `merchants` (solo `is_published`), `coupons` activos, `events`, `categories`.
- `profiles`, `favorites`, `agenda_items`, `coupon_claims`: el usuario solo ve/edita lo suyo.
- Escritura de contenido y lectura de agregados: solo `role = 'admin'`.
- `coupon_claims.insert/update` **solo vía funciones** (sin políticas de escritura directa).
- `pin_hash` y `validation_token` nunca expuestos al cliente (vista pública sin esas columnas).

**Funciones críticas**
- `claim_coupon(coupon_id)` → en una transacción: verifica vigencia, perfil mínimo y consentimiento; `UPDATE coupons SET remaining = remaining - 1 WHERE id = $1 AND remaining > 0 RETURNING …`; inserta claim (la restricción UNIQUE impide duplicados); genera código. Si no hay filas → "agotado".
- `redeem_coupon(token, pin, code)` → valida token+PIN (con bloqueo tras 5 intentos fallidos / 15 min), verifica que el claim pertenece a un cupón de **ese** comercio, `UPDATE … SET redeemed_at = now() WHERE code = $1 AND redeemed_at IS NULL` → canje único garantizado.
- `track(merchant_id, metric)` → `INSERT … ON CONFLICT DO UPDATE SET metric = metric + 1`.

---

## 5. Estructura del repositorio

```
/app
  (public)/              inicio, cronograma, comercios/[slug], buscar, cupones, perfil
  (auth)/                registro, login, callback, recuperar
  validar/[token]/       modo comercio (sin layout de visitante)
  admin/                 resumen, comercios, cupones, cronograma, populares, usuarios, reportes
  api/                   track, export, send-report, revalidate
/components  /lib (supabase, auth, qr, ics, geo, excel, email)  /emails (react-email)
/supabase  migrations/  seed.sql  tests/ (pgTAP para RLS y funciones)
/tests  e2e/ (Playwright)  load/ (k6)
/docs   PLAN_BETA.md, DECISIONES.md, MANUAL_ADMIN.md
```

Entornos: **local** (Supabase CLI) → **preview** (cada PR en Vercel + rama de Supabase) → **beta** (`beta.<dominio>`, proyecto Supabase de producción) → **producción** (mismo proyecto, dominio principal en el lanzamiento).

---

## 6. Plan por semanas

### Semana 0 — Arranque (lun 16 – mié 18 nov)
- [ ] Firma y anticipo 40 %.
- [ ] Cliente crea cuentas a su nombre (Vercel, Supabase, Resend, Google Cloud OAuth, Cloudflare, Sentry, dominio) y nos invita como miembro.
- [ ] Sesión de identidad visual y UI (paleta, tipografía, logo FISS 2027, ajuste de mockups) → **1 ronda de ajustes**.
- [ ] Enviar a comercios el **formulario de Google** y la **guía de imágenes** (sección 07 de la propuesta). Meta: 10 comercios piloto antes del 4 dic.
- [ ] Repo, CI (lint, typecheck, tests), Vercel conectado, Supabase local, Sentry.

### Semana 1 — Base y contenido público (19 – 27 nov)
- [ ] Sistema de diseño (tokens Tailwind, componentes: tarjeta de local, chip de filtro, barra inferior, botones).
- [ ] Migraciones + RLS + seed con datos de ejemplo.
- [ ] Inicio, directorio, ficha del local, cronograma con filtros y búsqueda.
- [ ] "Ver ubicación" (deep link Maps) y "Cerca de ti" (geolocalización + distancia Haversine en cliente).
- [ ] Estrategia estática/ISR + `next/image` desde Storage.
- [ ] PWA: manifest, íconos, service worker, instalación.
- **Demo interna viernes 27:** navegación pública completa con datos de ejemplo.

### Semana 2 — Cuentas, cupones y validación (30 nov – 2 dic, solapado)
> Nota: semanas 2 y 3 se comprimen en 6 días hábiles hasta el 4 dic; se trabaja en paralelo cupones (back) y panel (front).
- [ ] Auth: correo + verificación, Google OAuth, recuperación; Turnstile.
- [ ] Registro en 2 pasos, consentimiento (registro de versión y fecha), darse de baja, completar perfil → elegible a rifa.
- [ ] Soft-gate tras N consultas.
- [ ] `claim_coupon`, pantalla "Tu cupón" con QR, descarga como imagen, caché offline.
- [ ] Modo comercio `/validar/[token]`: PIN, escáner, ingreso manual, resultado, canjes del día.
- [ ] Tests pgTAP de concurrencia y doble canje.

### Semana 3 — Funciones B y panel (hasta jue 3 dic)
- [ ] Favoritos, Mi agenda (+ `.ics`), "Para ti", "Hoy en la feria", búsqueda avanzada (abierto ahora / con cupón / cercanía).
- [ ] Panel admin: resumen, CRUD comercios/cupones/cronograma/populares, subida de imágenes, revalidación on-demand.
- [ ] Métricas (`track`) + reportes por comercio + envío por correo (Resend).
- [ ] Exportación Excel de usuarios y resumen por municipio/edad/intereses.
- [ ] Política de privacidad (texto base) y términos de cupones/rifa.
- **Viernes 4 dic — ENTREGA BETA** en `beta.<dominio>` con comercios piloto cargados + capacitación del panel (1 h, grabada).

### Semana 4 — Estabilización y lanzamiento (7 – 11 dic)
- [ ] Ronda de feedback del cliente (formulario/tablero de incidencias) y correcciones.
- [ ] Carga del resto de comercios (el cliente desde el panel, con apoyo).
- [ ] QA en dispositivos (ver §7) y pruebas de carga (ver §8).
- [ ] Endurecimiento: firewall/rate limits en Vercel, revisión de RLS con el Security Advisor de Supabase, rotación de secretos, respaldos.
- [ ] Subir planes a Pro (Vercel, Supabase, Resend) — previsto en el presupuesto de infraestructura.
- **Lun 14 dic — LANZAMIENTO.** Inicio de garantía de 30 días y soporte de temporada (15 dic).

---

## 7. QA de la Beta

**Matriz de dispositivos:** Android gama baja (Chrome), Android gama media (Chrome / Samsung Internet), iPhone (Safari, iOS 16+), escritorio (Chrome) para el panel. Probar en 3G/4G simulado.

**Casos críticos (Playwright e2e + manual)**
1. Registro correo y Google; verificación; recuperación.
2. Obtener cupón → QR → descargar imagen → validar en comercio → intentar segundo canje (debe fallar).
3. Validar QR de otro comercio (debe fallar). PIN erróneo ×5 → bloqueo.
4. Cupón agotado / vencido / pausado desde panel.
5. Soft-gate, consentimiento obligatorio, darse de baja.
6. Admin publica comercio → aparece en la app en < 1 min.
7. Exportación Excel coincide con conteos del panel.
8. Agenda `.ics` se abre en Google Calendar y Calendario de iOS.
9. Instalación PWA y apertura offline del cupón.

**Testers Beta:** cliente + 5–10 comercios piloto + 20–30 personas cercanas. Canal de reporte: formulario corto (pantalla, qué pasó, captura) → issues en GitHub.

---

## 8. Pruebas de carga (k6, contra `beta.`)

Escenario de diseño de la propuesta: 60.000–120.000 usuarios en temporada, picos de miles simultáneos.

| Escenario | Carga | Criterio de aceptación |
|---|---|---|
| Navegación pública (inicio, cronograma, ficha) | 3.000 usuarios virtuales, 10 min | p95 < 800 ms en servidor, 0 % errores, BD < 30 % CPU |
| Ráfaga de cupón | 1.000 solicitudes simultáneas sobre un cupón de 50 cupos | **Exactamente 50 claims**, 0 errores 5xx |
| Canje | 200 canjes/min | p95 < 500 ms, 0 dobles canjes |
| Métricas | 500 eventos/s | Sin pérdida apreciable, sin bloqueo de la BD |
| Registro | 100 registros/min | Turnstile y correos sin cuello de botella (límite Resend) |

Lighthouse móvil en páginas públicas: Performance ≥ 85, peso inicial < 300 KB JS.

---

## 9. Datos personales y seguridad

- Consentimiento explícito con **versión de la política y fecha** guardadas por usuario; opción de baja que excluye de exportaciones.
- La exportación Excel solo para `admin`, registrada en `audit_log`.
- Secretos solo en variables de entorno de Vercel; `service_role` nunca en el cliente.
- Turnstile + rate limit en registro, claim y validación de PIN.
- Respaldos diarios (Supabase Pro) durante la feria.
- La redacción legal de la política **no está incluida** (se entrega texto base); la rifa puede requerir permisos — gestión del organizador.

---

## 10. Lo que necesitamos del cliente (bloqueantes)

| # | Entregable | Para cuándo |
|---|---|---|
| 1 | Cuentas creadas con tarjeta internacional a su nombre + invitación | 18 nov |
| 2 | Dominio elegido y comprado | 18 nov |
| 3 | Identidad visual (logo, colores) y feedback de UI | 18 nov |
| 4 | Cronograma oficial (aunque sea preliminar) | 27 nov |
| 5 | 10 comercios piloto con formulario + imágenes completos | 2 dic |
| 6 | Lista de categorías e intereses definitivos | 25 nov |
| 7 | Texto revisado de política de privacidad y bases de la rifa | 9 dic |

Si un bloqueante se retrasa, la fecha dependiente se mueve lo mismo; se informa por escrito.

---

## 11. Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| Calendario comprimido (arranque 16 nov) | Alta | Alto | Fecha de lanzamiento 14 dic acordada por escrito; panel y cupones en paralelo; recortar "Para ti" a reglas simples (intereses ↔ categoría). |
| Comercios entregan datos/imágenes incompletos | Alta | Medio | Formulario con campos obligatorios; solo se publica lo completo (condición de la propuesta). |
| Señal débil en recintos | Alta | Medio | Cupón offline (imagen + caché SW), páginas ligeras, ingreso manual del código en modo comercio. |
| Pago de proveedores en USD | Media | Alto | Cuentas y tarjeta resueltas en semana 0; planes gratuitos durante desarrollo. |
| Abuso: cuentas falsas para cupones | Media | Medio | Turnstile, verificación de correo antes de reclamar, 1 por usuario, límites por IP. |
| Fuga del enlace de validación | Baja | Medio | PIN + regeneración instantánea desde el panel. |
| Cambios de alcance durante la Beta | Media | Medio | Todo pedido nuevo se registra y se cotiza aparte (condición de la propuesta). |

---

## 12. Definición de "Beta lista" (criterios de entrega del 4 dic)

- [ ] Todas las funciones de §2 "Incluido" operativas en `beta.<dominio>`.
- [ ] ≥ 10 comercios reales y el cronograma cargados.
- [ ] Casos críticos 1–9 de §7 pasando en Android y iPhone.
- [ ] Prueba de ráfaga de cupón superada (cupos exactos).
- [ ] Sin errores abiertos de severidad alta en Sentry.
- [ ] Panel entregado con capacitación y manual breve (`docs/MANUAL_ADMIN.md`).
- [ ] Acta de entrega Beta enviada al cliente → factura del 30 %.
