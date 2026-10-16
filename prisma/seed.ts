import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../apps/api/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required to seed the database.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const roles = [
  { code: 'OWNER', name: 'Propietario', description: 'Acceso completo.' },
  { code: 'ADMIN', name: 'Administrador', description: 'Administración operativa.' },
  { code: 'BRANCH_MANAGER', name: 'Gerente de sucursal', description: 'Operación de sucursal.' },
  { code: 'EDITOR', name: 'Editor', description: 'Gestión de catálogo y promociones.' },
  { code: 'OPERATOR', name: 'Operador', description: 'Gestión de pedidos.' }
];

const categories = [
  ['Broaster', 'broaster', 10],
  ['Spiedo', 'spiedo', 20],
  ['Combos', 'combos', 30],
  ['Hamburguesas', 'hamburguesas', 40],
  ['Salchipapas', 'salchipapas', 50],
  ['Platos', 'platos', 60],
  ['Bebidas', 'bebidas', 70]
] as const;

const branches = [
  {
    code: 'CBA-CENTRO',
    name: 'Brasa Viva Centro',
    slug: 'brasa-viva-centro',
    addressLine: 'Av. Heroínas, Cochabamba',
    whatsapp: '59170000001'
  },
  {
    code: 'CBA-NORTE',
    name: 'Brasa Viva Norte',
    slug: 'brasa-viva-norte',
    addressLine: 'Av. América, Cochabamba',
    whatsapp: '59170000002'
  }
] as const;

const products = [
  {
    name: 'Broaster clásico',
    slug: 'broaster-clasico',
    categorySlug: 'broaster',
    description: 'Pollo broaster crujiente acompañado de papas fritas.',
    basePrice: '32.00',
    featured: true
  },
  {
    name: 'Pollo al spiedo',
    slug: 'pollo-al-spiedo',
    categorySlug: 'spiedo',
    description: 'Pollo al spiedo con sabor intenso y papas fritas.',
    basePrice: '38.00',
    featured: true
  },
  {
    name: 'Combo familiar',
    slug: 'combo-familiar',
    categorySlug: 'combos',
    description: 'Una selección para compartir en familia.',
    basePrice: '86.00',
    featured: true
  },
  {
    name: 'Hamburguesa Brasa',
    slug: 'hamburguesa-brasa',
    categorySlug: 'hamburguesas',
    description: 'Hamburguesa con pollo crocante y salsa de la casa.',
    basePrice: '29.00',
    featured: false
  }
] as const;

async function seed(): Promise<void> {
  await Promise.all(
    roles.map((role) =>
      prisma.role.upsert({
        where: { code: role.code },
        update: role,
        create: role
      })
    )
  );

  const categoryRecords = await Promise.all(
    categories.map(([name, slug, displayOrder]) =>
      prisma.category.upsert({
        where: { slug },
        update: { name, displayOrder, active: true },
        create: { name, slug, displayOrder, active: true }
      })
    )
  );

  const categoryIdBySlug = new Map(categoryRecords.map((category) => [category.slug, category.id]));
  const branchRecords = await Promise.all(
    branches.map((branch) =>
      prisma.branch.upsert({
        where: { code: branch.code },
        update: { ...branch, status: 'ACTIVE' },
        create: { ...branch, status: 'ACTIVE' }
      })
    )
  );
  const branchIdByCode = new Map(branchRecords.map((branch) => [branch.code, branch.id]));

  const productRecords = await Promise.all(
    products.map(async (product) => {
      const categoryId = categoryIdBySlug.get(product.categorySlug);

      if (!categoryId) {
        throw new Error(`Categoría inexistente: ${product.categorySlug}`);
      }

      return prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          categoryId,
          description: product.description,
          basePrice: product.basePrice,
          active: true,
          featured: product.featured
        },
        create: {
          name: product.name,
          slug: product.slug,
          description: product.description,
          basePrice: product.basePrice,
          featured: product.featured,
          categoryId,
          active: true
        }
      });
    })
  );
  const productIdBySlug = new Map(productRecords.map((product) => [product.slug, product.id]));

  const centroId = branchIdByCode.get('CBA-CENTRO');
  const norteId = branchIdByCode.get('CBA-NORTE');
  const broasterId = productIdBySlug.get('broaster-clasico');
  const spiedoId = productIdBySlug.get('pollo-al-spiedo');
  const comboId = productIdBySlug.get('combo-familiar');
  const burgerId = productIdBySlug.get('hamburguesa-brasa');

  if (!centroId || !norteId || !broasterId || !spiedoId || !comboId || !burgerId) {
    throw new Error('No se pudo preparar la relación inicial entre productos y sucursales.');
  }

  const branchServices = [
    { branchId: centroId, serviceType: 'PICKUP' as const },
    { branchId: centroId, serviceType: 'DELIVERY' as const },
    { branchId: centroId, serviceType: 'DINE_IN' as const },
    { branchId: norteId, serviceType: 'PICKUP' as const },
    { branchId: norteId, serviceType: 'DELIVERY' as const }
  ];

  await Promise.all(
    branchServices.map((service) =>
      prisma.branchService.upsert({
        where: {
          branchId_serviceType: {
            branchId: service.branchId,
            serviceType: service.serviceType
          }
        },
        update: { enabled: true },
        create: { ...service, enabled: true }
      })
    )
  );

  const branchProducts = [
    { branchId: centroId, productId: broasterId, priceOverride: null, available: true },
    { branchId: centroId, productId: spiedoId, priceOverride: '40.00', available: true },
    { branchId: centroId, productId: comboId, priceOverride: null, available: true },
    { branchId: centroId, productId: burgerId, priceOverride: null, available: false },
    { branchId: norteId, productId: broasterId, priceOverride: '34.00', available: true },
    { branchId: norteId, productId: spiedoId, priceOverride: null, available: true },
    { branchId: norteId, productId: comboId, priceOverride: null, available: true },
    { branchId: norteId, productId: burgerId, priceOverride: null, available: true }
  ] as const;

  await Promise.all(
    branchProducts.map((branchProduct) =>
      prisma.branchProduct.upsert({
        where: {
          branchId_productId: {
            branchId: branchProduct.branchId,
            productId: branchProduct.productId
          }
        },
        update: {
          available: branchProduct.available,
          priceOverride: branchProduct.priceOverride,
          stockStatus: 'IN_STOCK'
        },
        create: { ...branchProduct, stockStatus: 'IN_STOCK' }
      })
    )
  );

  const now = new Date();
  const activePromotion = {
    name: 'Combo para compartir',
    description: 'Precio especial para disfrutar en grupo.',
    promotionType: 'FIXED_PRICE' as const,
    promoPrice: '72.00',
    startsAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    endsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    active: true
  };

  const activePromotionRecord = await prisma.promotion.upsert({
    where: { slug: 'combo-para-compartir' },
    update: activePromotion,
    create: { slug: 'combo-para-compartir', ...activePromotion }
  });

  await prisma.promotionProduct.upsert({
    where: { promotionId_productId: { promotionId: activePromotionRecord.id, productId: comboId } },
    update: { quantity: 1, deletedAt: null },
    create: { promotionId: activePromotionRecord.id, productId: comboId, quantity: 1 }
  });

  const expiredPromotion = {
    name: 'Promoción anterior',
    description: 'Ejemplo de una promoción fuera de vigencia.',
    promotionType: 'PERCENTAGE' as const,
    discountPercent: '15.00',
    startsAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    endsAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    active: true
  };

  const expiredPromotionRecord = await prisma.promotion.upsert({
    where: { slug: 'promocion-anterior' },
    update: expiredPromotion,
    create: { slug: 'promocion-anterior', ...expiredPromotion }
  });

  await prisma.promotionProduct.upsert({
    where: { promotionId_productId: { promotionId: expiredPromotionRecord.id, productId: broasterId } },
    update: { quantity: 1, deletedAt: null },
    create: { promotionId: expiredPromotionRecord.id, productId: broasterId, quantity: 1 }
  });

  await prisma.siteSetting.upsert({
    where: { settingKey: 'brand' },
    update: {
      settingValue: { name: 'Brasa Viva', currency: 'BOB', locale: 'es-BO' },
      isPublic: true
    },
    create: {
      settingKey: 'brand',
      settingValue: { name: 'Brasa Viva', currency: 'BOB', locale: 'es-BO' },
      description: 'Configuración pública básica de marca.',
      isPublic: true
    }
  });
}

seed()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
