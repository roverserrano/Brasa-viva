import { type CanActivate, type ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import type { RequestContext } from './request-context';

/** A bounded, per-instance limiter. The ingress must limit aggregate traffic when scaled. */
export class RequestBudget {
  private readonly windows = new Map<string, { count: number; expiresAt: number }>();

  constructor(private readonly capacity = 10_000) {}

  consume(key: string, limit: number, now = Date.now()): number {
    let window = this.windows.get(key);
    if (!window || window.expiresAt <= now) {
      if (this.windows.size >= this.capacity) {
        for (const [entryKey, entry] of this.windows) {
          if (entry.expiresAt <= now) this.windows.delete(entryKey);
        }
        if (this.windows.size >= this.capacity && !this.windows.has(key)) return 60;
      }
      window = { count: 0, expiresAt: now + 60_000 };
      this.windows.set(key, window);
    }
    if (window.count >= limit) return Math.max(1, Math.ceil((window.expiresAt - now) / 1_000));
    window.count += 1;
    return 0;
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly budget = new RequestBudget();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestContext>();
    const path = ((request.originalUrl ?? request.url ?? '').split('?')[0] ?? '')
      .replace(/\/+$/, '')
      .toLowerCase();
    const writing = !['GET', 'HEAD', 'OPTIONS'].includes(request.method ?? 'GET');
    const bucket =
      path === '/api/v1/orders' && writing
        ? 'orders'
        : path.startsWith('/api/v1/admin')
          ? writing
            ? 'admin-write'
            : 'admin-read'
          : 'public';
    const limits = { orders: 10, 'admin-write': 30, 'admin-read': 120, public: 300 };
    // Express derives ip from the socket unless explicitly configured with trusted proxy addresses.
    const retryAfter = this.budget.consume(
      `${bucket}:${request.ip ?? request.socket.remoteAddress ?? 'unknown'}`,
      limits[bucket]
    );
    if (retryAfter) {
      context
        .switchToHttp()
        .getResponse<{ setHeader(name: string, value: string): void }>()
        .setHeader('Retry-After', String(retryAfter));
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Realizaste varias solicitudes seguidas. Espera un minuto e intenta nuevamente.'
        },
        429
      );
    }
    return true;
  }
}
