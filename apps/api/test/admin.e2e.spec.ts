import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { AdminController } from '../src/modules/admin/admin.controller';
import { DashboardService } from '../src/modules/admin/application/dashboard.service';
import { AdminService } from '../src/modules/admin/application/admin.service';
import { AdminAuthService } from '../src/modules/auth/application/admin-auth.service';
import { AdminAuthGuard, AdminAuthorizationGuard } from '../src/modules/auth/auth.guards';

describe('administrative HTTP authorization', () => {
  let app: INestApplication;
  const authenticate = vi.fn();
  const createProduct = vi.fn();
  const getInsights = vi.fn();
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        AdminAuthGuard,
        AdminAuthorizationGuard,
        { provide: AdminAuthService, useValue: { authenticate } },
        { provide: AdminService, useValue: { createProduct } },
        { provide: DashboardService, useValue: { getInsights } }
      ]
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('blocks requests without a bearer token before reaching the service', async () => {
    await request(app.getHttpServer()).post('/api/v1/admin/products').send({}).expect(401);
    expect(authenticate).not.toHaveBeenCalled();
    expect(createProduct).not.toHaveBeenCalled();
  });
  it('blocks an operator from changing the catalog', async () => {
    authenticate.mockResolvedValueOnce({ userId: 'operator', roles: ['OPERATOR'], branchIds: [] });
    await request(app.getHttpServer())
      .post('/api/v1/admin/products')
      .set('Authorization', 'Bearer test-token')
      .send({})
      .expect(403);
    expect(createProduct).not.toHaveBeenCalled();
  });
  it('rejects an editor from executive reporting', async () => {
    authenticate.mockResolvedValueOnce({ userId: 'editor', roles: ['EDITOR'], branchIds: [] });
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/insights')
      .set('Authorization', 'Bearer test-token')
      .expect(403);
    expect(getInsights).not.toHaveBeenCalled();
  });
  it('validates reporting filters before reaching the service', async () => {
    authenticate.mockResolvedValueOnce({ userId: 'owner', roles: ['OWNER'], branchIds: [] });
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard/insights?days=10000')
      .set('Authorization', 'Bearer test-token')
      .expect(400);
    expect(getInsights).not.toHaveBeenCalled();
  });
});
