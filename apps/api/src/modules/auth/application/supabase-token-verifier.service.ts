import {
  Inject,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { SupabaseIdentity } from '../domain/admin-principal';

const supabaseUserSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  user_metadata: z.record(z.string(), z.unknown()).optional()
});

@Injectable()
export class SupabaseTokenVerifierService {
  constructor(@Inject(ConfigService) private readonly configService: ConfigService) {}

  async verify(accessToken: string): Promise<SupabaseIdentity> {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL')?.replace(/\/$/, '');
    const publishableKey =
      this.configService.get<string>('SUPABASE_PUBLISHABLE_KEY') ??
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') ??
      this.configService.get<string>('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !publishableKey) {
      throw new ServiceUnavailableException({
        code: 'ADMIN_AUTH_NOT_CONFIGURED',
        message: 'La autenticación administrativa no está configurada.'
      });
    }

    let response: Response;
    try {
      response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${accessToken}`
        },
        signal: AbortSignal.timeout(7_000)
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'ADMIN_AUTH_UNAVAILABLE',
        message: 'No fue posible validar la sesión administrativa. Intenta nuevamente.'
      });
    }

    if (!response.ok) {
      if (response.status >= 500 || response.status === 429) {
        throw new ServiceUnavailableException({
          code: 'ADMIN_AUTH_UNAVAILABLE',
          message: 'La autenticación está temporalmente ocupada. Intenta nuevamente.'
        });
      }
      throw new UnauthorizedException({
        code: 'ADMIN_SESSION_INVALID',
        message: 'La sesión administrativa no es válida o expiró.'
      });
    }

    const parsedUser = supabaseUserSchema.safeParse(await response.json());
    if (!parsedUser.success) {
      throw new UnauthorizedException({
        code: 'ADMIN_SESSION_INVALID',
        message: 'La identidad administrativa no es válida.'
      });
    }

    return {
      authUserId: parsedUser.data.id,
      email: parsedUser.data.email.trim().toLowerCase(),
      fullName: resolveFullName(parsedUser.data.email, parsedUser.data.user_metadata)
    };
  }
}

function resolveFullName(email: string, metadata: Record<string, unknown> | undefined): string {
  const candidate = [metadata?.full_name, metadata?.name].find(
    (value): value is string => typeof value === 'string' && value.trim().length > 0
  );
  const fallback = email.split('@')[0] ?? 'Administrador';

  return (candidate ?? fallback).trim().slice(0, 160);
}
