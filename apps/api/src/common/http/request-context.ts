import type { IncomingMessage } from 'node:http';

export interface RequestContext extends IncomingMessage {
  ip?: string;
  originalUrl?: string;
  requestId?: string;
}
