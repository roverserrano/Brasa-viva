import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAuthService } from './application/admin-auth.service';
import { requiredAdminCapabilitiesMetadata } from './auth.decorators';
import { hasCapability, type AdminCapability, type AdminPrincipal } from './domain/admin-policy';

type AdminRequest = {
  headers: { authorization?: string };
  adminPrincipal?: AdminPrincipal;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(@Inject(AdminAuthService) private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const accessToken = extractBearerToken(request.headers.authorization);

    if (!accessToken) {
      throw new UnauthorizedException({
        code: 'ADMIN_AUTH_REQUIRED',
        message: 'Debes iniciar sesión para acceder al panel administrativo.'
      });
    }

    request.adminPrincipal = await this.adminAuthService.authenticate(accessToken);
    return true;
  }
}

@Injectable()
export class AdminAuthorizationGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCapabilities = this.reflector.getAllAndOverride<AdminCapability[]>(
      requiredAdminCapabilitiesMetadata,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredCapabilities || requiredCapabilities.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AdminRequest>();
    const principal = request.adminPrincipal;
    const allowed = principal && requiredCapabilities.every((capability) => hasCapability(principal, capability));

    if (!allowed) {
      throw new ForbiddenException({
        code: 'ADMIN_PERMISSION_DENIED',
        message: 'No tienes permiso para realizar esta acción.'
      });
    }

    return true;
  }
}

function extractBearerToken(authorization: string | undefined): string | null {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}
