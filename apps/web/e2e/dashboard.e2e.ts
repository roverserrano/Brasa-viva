import { test, expect } from '@playwright/test';
import { dashboardFixture } from './dashboard-fixture';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'brasa-viva.admin-session.v1',
      JSON.stringify({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 3600000
      })
    )
  );
});

test('executive filters, chart and branch drill-down use the authorized API', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Tu negocio, de un vistazo.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Evolución diaria' })).toBeVisible();
  const request = page.waitForResponse((response) =>
    response.url().includes('/dashboard/insights?days=7')
  );
  await page.getByRole('combobox', { name: 'Período' }).selectOption('7');
  await request;
  await page.getByRole('button', { name: 'Importe', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Importe', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByLabel('Explorar un día').focus();
  await page.keyboard.press('Home');
  await expect(page.getByLabel('Explorar un día')).toHaveValue('0');
  await page.getByText('Ver tabla de datos', { exact: true }).click();
  await expect(page.locator('.dashboard-data-table tbody tr')).toHaveCount(7);
  await page.getByRole('button', { name: 'Ver indicadores de Brasa Viva Norte' }).click();
  await expect(page.getByRole('combobox', { name: 'Sucursal' })).toHaveValue(
    '00000000-0000-4000-8000-000000000007'
  );
  await expect(page.locator('.dashboard-branch')).toHaveCount(1);
});

test('dashboard handles failures, retries and late responses without displaying stale metrics', async ({
  page
}) => {
  let fail = true;
  await page.route('**/admin/dashboard/insights?*', async (route) => {
    const url = new URL(route.request().url());
    if (fail) {
      await route.fulfill({ status: 503, json: { message: 'Servicio de prueba no disponible' } });
      return;
    }
    const days = Number(url.searchParams.get('days')) as 7 | 30 | 90;
    if (days === 7) await new Promise((resolve) => setTimeout(resolve, 300));
    await route.fulfill({ json: dashboardFixture(days) });
  });
  await page.goto('/admin');
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos actualizar' })).toBeVisible();
  fail = false;
  await page.getByRole('button', { name: 'Intentar nuevamente' }).click();
  await expect(page.getByRole('heading', { name: 'Evolución diaria' })).toBeVisible();
  const slowRequest = page.waitForRequest((request) =>
    request.url().includes('/dashboard/insights?days=7')
  );
  const slowResponse = page.waitForResponse((response) =>
    response.url().includes('/dashboard/insights?days=7')
  );
  await page.getByRole('combobox', { name: 'Período' }).selectOption('7');
  await slowRequest;
  await page.getByRole('combobox', { name: 'Período' }).selectOption('90');
  await expect(page.getByLabel('Explorar un día')).toHaveAttribute('max', '89');
  // Await the deliberately delayed stale response, then verify the current result remains.
  await slowResponse;
  await expect(page.getByLabel('Explorar un día')).toHaveAttribute('max', '89');
});

for (const width of [375, 768, 1440])
  test(`executive workspace fits ${width}px and offers keyboard navigation`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Evolución diaria' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    if (width === 375) {
      const toggle = page.getByRole('button', { name: 'Abrir navegación administrativa' });
      await toggle.click();
      await expect(
        page.getByRole('navigation', { name: 'Secciones administrativas' })
      ).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(toggle).toBeFocused();
    }
  });
