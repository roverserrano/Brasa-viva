import { type ArgumentsHost, BadRequestException, Logger } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ApiExceptionFilter } from './api-exception.filter';

function createHost() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        originalUrl: '/api/v1/admin/orders?token=private',
        requestId: 'request-test'
      }),
      getResponse: () => ({ status })
    })
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('safe API errors', () => {
  it('does not expose exception messages or query strings in responses and logs', () => {
    const log = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    try {
      const { host, status, json } = createHost();
      new ApiExceptionFilter().catch(new Error('Database credential: private-password'), host);
      expect(status).toHaveBeenCalledWith(500);
      expect(JSON.stringify(json.mock.calls)).not.toContain('private-password');
      expect(JSON.stringify(log.mock.calls)).not.toContain('private');
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'SERVICE_UNAVAILABLE', requestId: 'request-test' })
      );
    } finally {
      log.mockRestore();
    }
  });
  it('preserves actionable validation messages for client errors', () => {
    const { host, status, json } = createHost();
    new ApiExceptionFilter().catch(
      new BadRequestException({
        code: 'INVALID_ADMIN_REQUEST',
        message: 'Selecciona una categoría.'
      }),
      host
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_ADMIN_REQUEST',
        message: 'Selecciona una categoría.'
      })
    );
  });
});
