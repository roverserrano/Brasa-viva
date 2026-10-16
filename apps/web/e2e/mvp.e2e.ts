import { test, expect } from '@playwright/test';

test('a customer finds a product, persists the cart and gets WhatsApp only after confirmation', async ({
  page
}) => {
  await page.goto('/menu?branch=brasa-viva-centro');
  await page.getByPlaceholder('Busca pollo, hamburguesas, bebidas…').fill('broaster');
  await page.getByRole('button', { name: 'Añadir al carrito' }).click();
  await Promise.all([
    page.waitForURL('**/carrito'),
    page.getByRole('link', { name: 'Ver mi carrito' }).click()
  ]);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Broaster clásico' })).toBeVisible();
  await page.getByRole('link', { name: 'Continuar con el pedido' }).click();
  await page.getByLabel('Nombre completo').fill('Cliente de prueba');
  await page.getByLabel('Teléfono o WhatsApp').fill('70000000');
  await expect(page.getByRole('link', { name: 'Continuar por WhatsApp' })).toHaveCount(0);
  await page.route('**/api/v1/orders', async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    expect(body).not.toHaveProperty('total');
    expect(body).toMatchObject({ branchSlug: 'brasa-viva-centro', items: [{ quantity: 1 }] });
    await route.fulfill({
      status: 201,
      json: {
        orderCode: 'BV-000001',
        status: 'RECEIVED',
        branch: { id: '00000000-0000-4000-8000-000000000001', name: 'Brasa Viva Centro' },
        orderType: 'PICKUP',
        items: [
          {
            productId: '00000000-0000-4000-8000-000000000003',
            productName: 'Broaster clásico',
            quantity: 1,
            unitPrice: '32.00',
            discountAmount: '0.00',
            lineTotal: '32.00',
            appliedPromotionId: null
          }
        ],
        subtotal: '32.00',
        discountTotal: '0.00',
        deliveryFee: '0.00',
        total: '32.00',
        whatsappUrl: 'https://wa.me/59170000001?text=BV-000001'
      }
    });
  });
  await page.getByLabel('Teléfono o WhatsApp').fill('hola1234');
  await page.getByRole('button', { name: 'Confirmar y registrar pedido' }).click();
  await expect(page.getByLabel('Teléfono o WhatsApp')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByLabel('Teléfono o WhatsApp')).toBeFocused();
  await expect(page.getByRole('link', { name: 'Continuar por WhatsApp' })).toHaveCount(0);
  await page.getByLabel('Teléfono o WhatsApp').fill('70000000');
  await page.getByRole('button', { name: 'Confirmar y registrar pedido' }).click();
  await expect(page.getByRole('heading', { name: /BV-000001/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continuar por WhatsApp' })).toHaveAttribute(
    'href',
    /wa\.me/
  );
});

test('the operator sees useful details and only valid next order states', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'brasa-viva.admin-session.v1',
      JSON.stringify({
        accessToken: 'test-token',
        refreshToken: 'test-refresh',
        expiresAt: Date.now() + 3_600_000
      })
    )
  );
  await page.goto('/admin/pedidos');
  await expect(page.getByRole('heading', { name: 'Pedidos', exact: true })).toBeVisible();
  const actions = page.getByLabel('Nuevo estado de BV-000001');
  await expect(actions.locator('option')).toHaveText([
    'Elige una acción',
    'Confirmado',
    'Cancelado'
  ]);
  await page.getByText('Ver productos y entrega').click();
  await expect(page.getByText('Notas: Sin ají')).toBeVisible();
});

for (const width of [375, 430, 768, 1440]) {
  test(`menu and administrative login fit a ${width}px screen`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of [
      '/',
      '/menu?branch=brasa-viva-centro',
      '/promociones',
      '/sucursales',
      '/sucursales/brasa-viva-centro',
      '/nosotros',
      '/contacto',
      '/menu/broaster-clasico?branch=brasa-viva-centro',
      '/carrito',
      '/pedido',
      '/admin/login'
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
      ).toBe(true);
    }
  });
}

test('mobile navigation exposes the current page and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Abrir navegación' });
  await toggle.click();
  await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('link', { name: 'Sucursales', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Cochabamba');
  await page.getByRole('button', { name: 'Abrir navegación' }).click();
  await expect(
    page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Sucursales', exact: true })
  ).toHaveAttribute('aria-current', 'page');
});

test('product navigation restores the menu filters and the cart branch is resumed', async ({
  page
}) => {
  await page.goto('/menu?q=clasico');
  await page
    .getByRole('navigation', { name: 'Seleccionar sucursal' })
    .getByRole('link', { name: 'Brasa Viva Centro' })
    .click();
  await expect(page.getByPlaceholder('Busca pollo, hamburguesas, bebidas…')).toHaveValue('clasico');
  await page.getByRole('button', { name: 'Pollos', exact: true }).click();
  await page.getByRole('link', { name: 'Ver Broaster clásico', exact: true }).click();
  await page.getByRole('link', { name: 'Volver al menú de Brasa Viva Centro' }).click();
  await expect(page.getByPlaceholder('Busca pollo, hamburguesas, bebidas…')).toHaveValue('clasico');
  await expect(page.getByRole('button', { name: 'Pollos', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.getByRole('button', { name: 'Añadir al carrito' }).click();
  await page.getByRole('link', { name: 'Ir al inicio de Brasa Viva' }).first().click();
  await page.getByRole('link', { name: 'Tengo un antojo' }).click();
  await expect(page).toHaveURL(/branch=brasa-viva-centro/);
});

test('mobile cart action sits above the navigation dock', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/menu?branch=brasa-viva-centro');
  await page.getByRole('button', { name: 'Añadir al carrito' }).click();
  const dock = page.getByRole('navigation', { name: 'Accesos rápidos' });
  await expect(dock).toBeVisible();
  const dockBox = await dock.boundingBox();
  const cartBox = await page.locator('.cart-quick-action').boundingBox();
  expect(dockBox).not.toBeNull();
  expect(cartBox).not.toBeNull();
  expect(cartBox!.y + cartBox!.height).toBeLessThanOrEqual(dockBox!.y);
  await expect(dock.getByRole('link', { name: /Carrito/ })).toContainText('1');
});

test('catalog filters survive reload, sorting and browser history without losing spaces', async ({
  page
}) => {
  await page.goto('/menu?branch=brasa-viva-centro');
  const search = page.getByPlaceholder('Busca pollo, hamburguesas, bebidas…');
  await search.pressSequentially('Broaster clásico');
  await page.getByRole('combobox', { name: 'Ordenar' }).selectOption('price-asc');
  await expect(search).toHaveValue('Broaster clásico');
  await expect(page).toHaveURL(/sort=price-asc/);
  await page.reload();
  await expect(search).toHaveValue('Broaster clásico');
  await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('price-asc');
  await page.getByRole('link', { name: 'Ver Broaster clásico', exact: true }).click();
  await expect(page).toHaveTitle('Broaster clásico · Brasa Viva Centro | Brasa Viva');
  await page.goBack();
  await expect(search).toHaveValue('Broaster clásico');
  await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('price-asc');
  await page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click();
  await expect(search).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Ordenar' })).toHaveValue('');
  await expect(page).toHaveURL(/\/menu\?branch=brasa-viva-centro$/);
});

test('a missing branch still allows recovery through the branch selector', async ({ page }) => {
  await page.goto('/menu?branch=no-existe');
  await expect(page.getByRole('alert').filter({ hasText: 'No pudimos cargar' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Seleccionar sucursal' })
    .getByRole('link', { name: 'Brasa Viva Centro' })
    .click();
  await expect(
    page.getByRole('button', { name: 'Añadir al carrito: Broaster clásico', exact: true })
  ).toBeVisible();
});

test('skip link bypasses navigation and checkout has noindex metadata', async ({ page }) => {
  await page.goto('/menu?branch=brasa-viva-centro');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();
  await page
    .getByRole('button', { name: 'Añadir al carrito: Broaster clásico', exact: true })
    .click();
  await page.getByRole('link', { name: 'Ver mi carrito' }).click();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(
    page.getByRole('navigation', { name: 'Progreso del pedido' }).locator('[aria-current="step"]')
  ).toContainText('Carrito');
  await page.getByRole('link', { name: 'Continuar con el pedido' }).click();
  await expect(page.getByLabel('Nombre completo')).toHaveAttribute('autocomplete', 'name');
  await expect(page.getByLabel('Teléfono o WhatsApp')).toHaveAttribute('autocomplete', 'tel');
});
