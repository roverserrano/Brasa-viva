import { Module } from '@nestjs/common';
import { AdminAuthService } from './application/admin-auth.service';
import { SupabaseTokenVerifierService } from './application/supabase-token-verifier.service';
import { AdminAuthGuard, AdminAuthorizationGuard } from './auth.guards';
import { AuthRepository } from './infrastructure/auth.repository';

@Module({
  providers: [
    AdminAuthService,
    SupabaseTokenVerifierService,
    AuthRepository,
    AdminAuthGuard,
    AdminAuthorizationGuard
  ],
  exports: [AdminAuthService, AuthRepository, AdminAuthGuard, AdminAuthorizationGuard]
})
export class AuthModule {}
