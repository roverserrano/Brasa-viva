import { dashboardFixture } from './dashboard-fixture';
import { dashboardQuerySchema } from '@brasa-viva/contracts';
import { createServer } from 'node:http';

const id = (suffix: string) => `00000000-0000-4000-8000-${suffix.padStart(12, '0')}`;
const branch = {
  id: id('1'),
  name: 'Brasa Viva Centro',
  slug: 'brasa-viva-centro',
  address: 'Av. Central',
  whatsapp: '59170000001',
  active: true
};
const category = { id: id('2'), name: 'Pollos', slug: 'pollos', description: null };
const product = {
  id: id('3'),
  categoryId: category.id,
  name: 'Broaster clásico',
  slug: 'broaster-clasico',
  description: 'Pollo y papas',
  price: '32.00',
  available: true,
  featured: true,
  imageUrl: null
};
const order = {
  id: id('4'),
  orderCode: 'BV-000001',
  branchId: branch.id,
  branchName: branch.name,
  status: 'RECEIVED',
  orderType: 'PICKUP',
  customerName: 'Cliente de prueba',
  customerPhone: '70000000',
  deliveryAddress: null,
  notes: 'Sin ají',
  subtotal: '32.00',
  discountTotal: '0.00',
  deliveryFee: '0.00',
  total: '32.00',
  items: [
    {
      id: id('5'),
      productName: product.name,
      quantity: 1,
      unitPrice: '32.00',
      discountAmount: '0.00',
      lineTotal: '32.00'
    }
  ],
  createdAt: '2026-10-06T12:00:00.000Z',
  updatedAt: '2026-10-06T12:00:00.000Z'
};

createServer((request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  response.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:3100');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, OPTIONS');
  response.setHeader('Content-Type', 'application/json');
  if (request.method === 'OPTIONS') {
    response.writeHead(204).end();
    return;
  }
  let payload: unknown;
  switch (url.pathname) {
    case '/api/v1/health':
      payload = { status: 'ok' };
      break;
    case '/api/v1/branches':
      payload = [branch];
      break;
    case '/api/v1/categories':
      payload = [category];
      break;
    case '/api/v1/branches/brasa-viva-centro':
      payload = {
        ...branch,
        phone: null,
        city: 'Cochabamba',
        services: ['PICKUP'],
        businessHours: []
      };
      break;
    case '/api/v1/branches/brasa-viva-centro/menu':
      payload = { branch, products: [product] };
      break;
    case '/api/v1/branches/brasa-viva-centro/menu/broaster-clasico':
      payload = { ...product, branch, category };
      break;
    case '/api/v1/promotions':
      payload = [];
      break;
    case '/api/v1/admin/me':
      payload = {
        id: id('6'),
        email: 'owner@example.test',
        fullName: 'Equipo Brasa Viva',
        roles: ['OWNER'],
        branchIds: []
      };
      break;
    case '/api/v1/admin/dashboard/insights': {
      const query = dashboardQuerySchema.parse(Object.fromEntries(url.searchParams));
      payload = dashboardFixture(query.days, query.branchId ?? null);
      break;
    }
    case '/api/v1/admin/orders':
      payload = { items: [order], pagination: { page: 1, pageSize: 25, total: 1 } };
      break;
    default:
      response.writeHead(404);
      payload = { code: 'NOT_FOUND', message: 'Ruta de prueba no disponible.' };
  }
  response.end(JSON.stringify(payload));
}).listen(4101, '127.0.0.1');
