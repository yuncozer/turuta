/**
 * Prueba de punta a punta del flujo core de la Beta:
 * visitante → registro → perfil → cupón QR → validación del comercio → panel admin.
 *
 * Requiere la app corriendo (BASE_URL, por defecto http://localhost:3000) contra un
 * Supabase con migraciones y seed aplicados, y el token de validación de
 * "Hamburguesas Daniel" (MERCHANT_TOKEN). El usuario ADMIN_EMAIL debe tener role = 'admin'.
 *
 *   BASE_URL=… MERCHANT_TOKEN=… ADMIN_EMAIL=… ADMIN_PASSWORD=… node tests/e2e/flujo-completo.mjs
 */
import { chromium, devices } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? "test-results/e2e";
const token = process.env.MERCHANT_TOKEN;
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const step = (name) => console.log(`• ${name}`);
// La caché pública se regenera al guardar en el panel; la primera visita puede servir la copia anterior.
async function eventually(page, url, check) {
  for (let i = 0; i < 4; i++) {
    await page.goto(url);
    try {
      await check();
      return;
    } catch (e) {
      if (i === 3) throw e;
      await page.waitForTimeout(1000);
    }
  }
}
const shot = (page, name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });

try {
  // 1. Visitante anónimo
  const phone = await browser.newContext({ ...devices["Pixel 7"], locale: "es-VE" });
  const page = await phone.newPage();
  step("Inicio");
  await page.goto(BASE);
  await page.getByRole("heading", { name: "Populares" }).waitFor();
  await page.getByText("Pizzería Antonio").first().waitFor();
  await shot(page, "01-inicio");

  step("Cronograma con filtro");
  await page.goto(`${BASE}/cronograma`);
  await page.getByRole("button", { name: "Toros" }).click();
  await page.getByText("Corrida de toros").first().waitFor();
  await shot(page, "02-cronograma");

  step("Directorio y búsqueda");
  await page.goto(`${BASE}/comercios?q=hambur`);
  await page.getByText("Hamburguesas Daniel").waitFor();
  assert.equal(await page.getByText("Pizzería Antonio").count(), 0);

  step("Ficha del local → obtener cupón sin cuenta lleva a registro");
  await page.goto(`${BASE}/comercios/hamburguesas-daniel`);
  await page.getByRole("heading", { name: "Hamburguesas Daniel" }).waitFor();
  await page.getByText(/quedan \d+/i).waitFor();
  await shot(page, "03-ficha");
  await page.getByRole("button", { name: "Obtener cupón" }).click();
  await page.waitForURL(/\/registro\?next=/);

  // 2. Registro en dos pasos
  step("Registro");
  const email = `visitante${Date.now()}@test.ve`;
  await page.getByLabel("Nombre completo").fill("María Pérez");
  await page.getByLabel("WhatsApp").fill("+58 414 000 0000");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("clave-segura-123");
  await shot(page, "04-registro");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL(/\/comercios\/hamburguesas-daniel/);

  step("Obtener cupón");
  await page.getByRole("button", { name: "Obtener cupón" }).click();
  await page.waitForURL(/\/cupones\?ver=TR-/);
  const code = new URL(page.url()).searchParams.get("ver");
  await page.getByAltText(/Código QR/).waitFor();
  await shot(page, "05-cupon-qr");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar como imagen" }).click();
  assert.match((await download).suggestedFilename(), /^cupon-TR-/);

  step("Completar perfil (rifa)");
  await page.goto(`${BASE}/perfil`);
  await page.getByLabel("Municipio").selectOption("San Cristóbal");
  await page.getByLabel("Año de nacimiento").fill("1994");
  await page.getByRole("button", { name: "Comida" }).click();
  await page.getByRole("button", { name: "Conciertos" }).click();
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await page.getByText("¡Participas en la rifa de cierre!").waitFor();
  await shot(page, "06-perfil");

  // 3. Modo comercio
  if (token) {
    step("Modo comercio: PIN incorrecto, luego correcto");
    const shop = await browser.newContext({ ...devices["Pixel 7"], locale: "es-VE" });
    const sp = await shop.newPage();
    await sp.goto(`${BASE}/validar/${token}`);
    await sp.getByPlaceholder("PIN").fill("0000");
    await sp.getByRole("button", { name: "Entrar" }).click();
    await sp.getByText("PIN incorrecto.").waitFor();
    await sp.getByPlaceholder("PIN").fill("1234");
    await sp.getByRole("button", { name: "Entrar" }).click();
    await sp.getByRole("heading", { name: "Hamburguesas Daniel" }).waitFor();

    step("Canje por código y segundo intento rechazado");
    await sp.getByLabel("Código del cupón").fill(code.toLowerCase());
    await sp.getByRole("button", { name: "Validar" }).click();
    await sp.getByText("Cupón válido · canjeado").waitFor();
    await sp.getByText("María P.").waitFor();
    await shot(sp, "07-comercio-canje");
    await sp.getByLabel("Código del cupón").fill(code);
    await sp.getByRole("button", { name: "Validar" }).click();
    await sp.getByText("Este cupón ya fue canjeado.").waitFor();

    step("El visitante ve su cupón como usado");
    await page.goto(`${BASE}/cupones`);
    await page.getByText("Usado").waitFor();
  }

  // 4. Panel de administración
  if (adminEmail) {
    step("Panel: resumen");
    const desk = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: "es-VE" });
    const ap = await desk.newPage();
    await ap.goto(`${BASE}/admin`);
    await ap.waitForURL(/\/ingresar/);
    await ap.getByLabel("Correo").fill(adminEmail);
    await ap.getByLabel("Contraseña").fill(adminPassword);
    await ap.getByRole("button", { name: "Ingresar" }).click();
    await ap.waitForURL(`${BASE}/admin`);
    await ap.getByText("Resultados por comercio").waitFor();
    await shot(ap, "08-admin-resumen");

    step("Panel: nuevo evento aparece en el cronograma público");
    await ap.goto(`${BASE}/admin/cronograma`);
    const form = ap.locator("section", { has: ap.getByRole("heading", { name: "Nuevo evento" }) });
    const eventTitle = `Desfile E2E ${Date.now()}`;
    await form.getByLabel("Título").fill(eventTitle);
    await form.getByLabel("Tipo").selectOption("cultura");
    await form.getByLabel("Lugar").fill("Av. 19 de Abril");
    await form.getByLabel("Inicio").fill("2027-01-29T18:00");
    await form.getByRole("button", { name: "Agregar evento" }).click();
    await ap.getByText("Evento guardado").waitFor();
    await eventually(page, `${BASE}/cronograma`, async () => {
      await page.getByRole("tab", { name: /Vie 29/ }).click();
      await page.getByText(eventTitle).waitFor({ timeout: 3000 });
    });

    step("Panel: nuevo comercio publicado aparece en el directorio");
    await ap.goto(`${BASE}/admin/comercios/nuevo`);
    const shopName = `Arepera E2E ${Date.now()}`;
    await ap.getByLabel("Nombre comercial").fill(shopName);
    await ap.getByLabel("Categoría").selectOption("comida");
    await ap.getByLabel("Enlace de Google Maps").fill("https://www.google.com/maps/@7.7801,-72.2176,17z");
    await ap.getByLabel("Publicado en la app").check();
    await ap.getByRole("button", { name: "Guardar comercio" }).click();
    await ap.getByText("Comercio guardado").waitFor();
    await shot(ap, "09-admin-comercio");
    await eventually(page, `${BASE}/comercios?q=arepera`, () => page.getByText(shopName).waitFor({ timeout: 3000 }));

    step("Panel: exportar usuarios a Excel");
    const res = await ap.request.get(`${BASE}/admin/exportar`);
    assert.equal(res.status(), 200);
    assert.match(res.headers()["content-type"], /spreadsheetml/);
    const anon = await browser.newContext();
    assert.equal((await anon.request.get(`${BASE}/admin/exportar`, { maxRedirects: 0 })).status(), 307);
  }

  console.log("OK: flujo completo");
} finally {
  await browser.close();
}
