import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseIdentity } from '../domain/admin-principal';
import type { AdminPrincipal } from '../domain/admin-policy';
import { AuthRepository } from '../infrastructure/auth.repository';
import { AdminAuthService } from './admin-auth.service';
import { SupabaseTokenVerifierService } from './supabase-token-verifier.service';

const identity: SupabaseIdentity = {
  authUserId: '00000000-0000-4000-8000-000000000002',
  email: 'owner@brasaviva.bo',
  fullName: 'Owner Brasa Viva'
};

const principal: AdminPrincipal = {
  userId: '00000000-0000-4000-8000-000000000001',
  authUserId: identity.authUserId,
  email: identity.email,
  fullName: identity.fullName,
  roles: ['OWNER'],
  branchIds: []
};

function createRepository() {
  return {
    findByAuthUserId: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    syncKnownUser: vi.fn(),
    createBootstrapOwner: vi.fn().mockResolvedValue({ status: 'ACTIVE' }),
    toPrincipal: vi.fn().mockReturnValue(principal)
  };
}

describe('AdminAuthService', () => {
  it('bootstraps only the configured first owner', async () => {
    const repository = createRepository();
    const service = new AdminAuthService(
      { verify: vi.fn().mockResolvedValue(identity) } as unknown as SupabaseTokenVerifierService,
      repository as unknown as AuthRepository,
      { get: vi.fn().mockReturnValue(identity.email) } as never
    );

    await expect(service.authenticate('access-token')).resolves.toEqual(principal);
    expect(repository.createBootstrapOwner).toHaveBeenCalledWith(identity);
  });

  it('does not bootstrap an arbitrary Supabase user', async () => {
    const repository = createRepository();
    const service = new AdminAuthService(
      { verify: vi.fn().mockResolvedValue(identity) } as unknown as SupabaseTokenVerifierService,
      repository as unknown as AuthRepository,
      { get: vi.fn().mockReturnValue('otra-persona@brasaviva.bo') } as never
    );

    await expect(service.authenticate('access-token')).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.createBootstrapOwner).not.toHaveBeenCalled();
  });
});
