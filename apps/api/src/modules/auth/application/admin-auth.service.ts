import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { SupabaseIdentity } from '../domain/admin-principal';
import type { AdminPrincipal } from '../domain/admin-policy';
import { AuthRepository } from '../infrastructure/auth.repository';
import { SupabaseTokenVerifierService } from './supabase-token-verifier.service';

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(SupabaseTokenVerifierService)
    private readonly tokenVerifier: SupabaseTokenVerifierService,
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  async authenticate(accessToken: string): Promise<AdminPrincipal> {
    const identity = await this.tokenVerifier.verify(accessToken);
    const user = await this.findOrBootstrapUser(identity);

    if (!user || user.status !== 'ACTIVE') {
      throw new ForbiddenException({
        code: 'ADMIN_ACCESS_DENIED',
        message: 'Tu cuenta no tiene acceso al panel administrativo.'
      });
    }

    const principal = this.authRepository.toPrincipal(user);
    if (principal.roles.length === 0) {
      throw new ForbiddenException({
        code: 'ADMIN_ACCESS_DENIED',
        message: 'Tu cuenta no tiene un rol administrativo activo.'
      });
    }

    return principal;
  }

  private async findOrBootstrapUser(identity: SupabaseIdentity) {
    const [byAuthUserId, byEmail] = await Promise.all([
      this.authRepository.findByAuthUserId(identity.authUserId),
      this.authRepository.findByEmail(identity.email)
    ]);

    if (byAuthUserId && byEmail && byAuthUserId.id !== byEmail.id) {
      throw new ForbiddenException({
        code: 'ADMIN_IDENTITY_CONFLICT',
        message: 'La identidad administrativa no puede vincularse de forma segura.'
      });
    }

    const knownUser = byAuthUserId ?? byEmail;
    if (knownUser) {
      if (knownUser.authUserId && knownUser.authUserId !== identity.authUserId) {
        throw new ForbiddenException({
          code: 'ADMIN_IDENTITY_CONFLICT',
          message: 'La identidad administrativa no puede vincularse de forma segura.'
        });
      }
      return this.authRepository.syncKnownUser(knownUser.id, identity);
    }

    const bootstrapEmail = this.configService
      .get<string>('ADMIN_BOOTSTRAP_EMAIL')
      ?.trim()
      .toLowerCase();

    if (!bootstrapEmail || bootstrapEmail !== identity.email) {
      return null;
    }

    return this.authRepository.createBootstrapOwner(identity);
  }
}
