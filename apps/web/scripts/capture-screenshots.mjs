/**
 * Capturas QA de las interfaces públicas y administrativas con el fixture e2e.
 *
 * Uso:
 *   1. Levantar `e2e/catalog-server.ts` (puerto 4101).
 *   2. Levantar `next dev` en 3100 con NEXT_PUBLIC_API_BASE_URL apuntando al fixture.
 *   3. Ejecutar desde apps/web:
 *      CAPTURE_OUT_DIR=/tmp/capturas node scripts/capture-screenshots.mjs
 *
 * Genera una captura JPEG por página × viewport y un JSON de consola por viewport.
 */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.env.CAPTURE_BASE_URL ?? 'http://127.0.0.1:3100';
const outDir = process.env.CAPTURE_OUT_DIR ?? '/tmp/opencode/captures/run';
const tag = process.env.CAPTURE_TAG ?? '';

const viewports = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-430', width: 430, height: 932 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'desktop-1440', width: 1440, height: 900 }
];

const pages = [
  { name: 'home', path: '/' },
  { name: 'menu', path: '/menu?branch=brasa-viva-centro' },
  { name: 'producto', path: '/menu/broaster-clasico?branch=brasa-viva-centro' },
  { name: 'promociones', path: '/promociones' },
  { name: 'sucursales', path: '/sucursales' },
  { name: 'sucursal-detalle', path: '/sucursales/brasa-viva-centro' },
  { name: 'nosotros', path: '/nosotros' },
  { name: 'contacto', path: '/contacto' },
  { name: 'admin-login', path: '/admin/login' },
  { name: 'admin-restablecer', path: '/admin/restablecer' }
];

const adminSession = JSON.stringify({
  accessToken: 'test-token',
  refreshToken: 'test-refresh',
  expiresAt: Date.now() + 3600000
});

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const issues = [];

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'es-BO',
    timezoneId: 'America/La_Paz'
  });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      issues.push({
        viewport: viewport.name,
        type: message.type(),
        text: message.text(),
        url: page.url()
      });
    }
  });
  page.on('pageerror', (error) => {
    issues.push({
      viewport: viewport.name,
      type: 'pageerror',
      text: String(error),
      url: page.url()
    });
  });

  const capture = async (name) => {
    await page.screenshot({
      path: path.join(outDir, `${tag}${viewport.name}-${name}.jpg`),
      fullPage: true,
      type: 'jpeg',
      quality: 80
    });
  };

  for (const target of pages) {
    await page.goto(`${baseURL}${target.path}`, { waitUntil: 'load', timeout: 90_000 });
    await page.waitForTimeout(600);
    await capture(target.name);
  }

  // Carrito y checkout con un producto agregado.
  await page.goto(`${baseURL}/menu?branch=brasa-viva-centro`, { waitUntil: 'load' });
  await page
    .getByRole('button', { name: /añadir al carrito/i })
    .first()
    .click();
  await page.waitForTimeout(500);
  await page.goto(`${baseURL}/carrito`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await capture('carrito');
  await page.goto(`${baseURL}/pedido`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await capture('pedido');

  // Panel administrativo con sesión sintética.
  const adminContext = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    locale: 'es-BO',
    timezoneId: 'America/La_Paz'
  });
  await adminContext.addInitScript(
    (session) => localStorage.setItem('brasa-viva.admin-session.v1', session),
    adminSession
  );
  const adminPage = await adminContext.newPage();
  adminPage.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      issues.push({
        viewport: viewport.name,
        type: message.type(),
        text: message.text(),
        url: adminPage.url()
      });
    }
  });
  adminPage.on('pageerror', (error) => {
    issues.push({
      viewport: viewport.name,
      type: 'pageerror',
      text: String(error),
      url: adminPage.url()
    });
  });
  await adminPage.goto(`${baseURL}/admin`, { waitUntil: 'load', timeout: 90_000 });
  await adminPage.waitForTimeout(900);
  await adminPage.screenshot({
    path: path.join(outDir, `${tag}${viewport.name}-admin-dashboard.jpg`),
    fullPage: true,
    type: 'jpeg',
    quality: 80
  });
  await adminPage.goto(`${baseURL}/admin/pedidos`, { waitUntil: 'load' });
  await adminPage.waitForTimeout(600);
  await adminPage.screenshot({
    path: path.join(outDir, `${tag}${viewport.name}-admin-pedidos.jpg`),
    fullPage: true,
    type: 'jpeg',
    quality: 80
  });
  await adminContext.close();
  await context.close();
}

await browser.close();
await writeFile(path.join(outDir, `${tag}console-issues.json`), JSON.stringify(issues, null, 2));
console.log(`Capturas en ${outDir}`);
console.log(`Incidencias de consola: ${issues.length}`);
