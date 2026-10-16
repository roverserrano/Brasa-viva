import { Inject, Injectable } from '@nestjs/common';
import { Prisma, UserStatus } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type { SupabaseIdentity } from '../domain/admin-principal';
import type { AdminPrincipal, AdminRoleCode } from '../domain/admin-policy';

const principalSelect = {
  id: true,
  authUserId: true,
  email: true,
  fullName: true,
  status: true,
  roles: {
    where: {
      deletedAt: null,
      role: { deletedAt: null }
    },
    select: {
      role: {
        select: { code: true }
      }
    }
  },
  branches: {
    where: {
      deletedAt: null,
      branch: { deletedAt: null }
    },
    select: { branchId: true }
  }
} satisfies Prisma.UserSelect;

type PersistedPrincipal = Prisma.UserGetPayload<{ select: typeof principalSelect }>;

@Injectable()
export class AuthRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findByAuthUserId(authUserId: string): Promise<PersistedPrincipal | null> {
    return this.prisma.user.findFirst({
      where: { authUserId, deletedAt: null },
      select: principalSelect
    });
  }

  async findByEmail(email: string): Promise<PersistedPrincipal | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: principalSelect
    });
  }

  async syncKnownUser(userId: string, identity: SupabaseIdentity): Promise<PersistedPrincipal> {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        authUserId: identity.authUserId,
        email: identity.email,
        fullName: identity.fullName,
        lastLoginAt: new Date()
      },
      select: principalSelect
    });
  }

  async createBootstrapOwner(identity: SupabaseIdentity): Promise<PersistedPrincipal | null> {
    const result = await this.prisma.$transaction(
      async (transaction) => {
        const existingOwner = await transaction.userRole.findFirst({
          where: {
            deletedAt: null,
            user: { deletedAt: null, status: UserStatus.ACTIVE },
            role: { code: 'OWNER', deletedAt: null }
          },
          select: { id: true }
        });

        if (existingOwner) {
          return null;
        }

        const ownerRole = await transaction.role.findFirst({
          where: { code: 'OWNER', deletedAt: null },
          select: { id: true }
        });

        if (!ownerRole) {
          throw new Error('El rol OWNER no está disponible. Ejecuta el seed de roles antes de configurar acceso.');
        }

        const existingUser = await transaction.user.findFirst({
          where: {
            deletedAt: null,
            OR: [{ authUserId: identity.authUserId }, { email: identity.email }]
          },
          select: { id: true }
        });

        const user = existingUser
          ? await transaction.user.update({
              where: { id: existingUser.id },
              data: {
                authUserId: identity.authUserId,
                email: identity.email,
                fullName: identity.fullName,
                status: UserStatus.ACTIVE,
                lastLoginAt: new Date()
              },
              select: { id: true }
            })
          : await transaction.user.create({
              data: {
                authUserId: identity.authUserId,
                email: identity.email,
                fullName: identity.fullName,
                status: UserStatus.ACTIVE,
                lastLoginAt: new Date()
              },
              select: { id: true }
            });

        await transaction.userRole.upsert({
          where: {
            userId_roleId: {
              userId: user.id,
              roleId: ownerRole.id
            }
          },
          update: { deletedAt: null },
          create: { userId: user.id, roleId: ownerRole.id }
        });

        return transaction.user.findUnique({
          where: { id: user.id },
          select: principalSelect
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return result;
  }

  toPrincipal(user: PersistedPrincipal): AdminPrincipal {
    if (!user.authUserId) {
      throw new Error('El usuario administrativo no está vinculado con una identidad de Supabase.');
    }

    return {
      userId: user.id,
      authUserId: user.authUserId,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles
        .map(({ role }) => role.code)
        .filter((code): code is AdminRoleCode =>
          ['OWNER', 'ADMIN', 'BRANCH_MANAGER', 'EDITOR', 'OPERATOR'].includes(code)
        ),
      branchIds: user.branches.map(({ branchId }) => branchId)
    };
  }
}
