import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { AdminCapability, AdminPrincipal } from './domain/admin-policy';

export const requiredAdminCapabilitiesMetadata = 'requiredAdminCapabilities';

export const RequireAdminCapabilities = (...capabilities: AdminCapability[]) =>
  SetMetadata(requiredAdminCapabilitiesMetadata, capabilities);

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminPrincipal => {
    const request = context.switchToHttp().getRequest<{ adminPrincipal: AdminPrincipal }>();
    return request.adminPrincipal;
  }
);
