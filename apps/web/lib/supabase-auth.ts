'use client';

import { z } from 'zod';

const storageKey = 'brasa-viva.admin-session.v1';

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive()
});

const authResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.number().int().positive()
});

export class SupabaseAuthError extends Error {
  constructor(
    message: string,
    readonly status?: number
  ) {
    super(message);
  }
}

type AdminSession = z.infer<typeof sessionSchema>;
let refreshing: Promise<string | null> | null = null;

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const response = await authRequest('/auth/v1/token?grant_type=password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const session = await parseAuthResponse(response);
  storeSession(session);
}

export async function getAccessToken(): Promise<string | null> {
  const session = readSession();
  if (!session) {
    return null;
  }

  if (session.expiresAt > Date.now() + 60_000) {
    return session.accessToken;
  }

  if (refreshing) return refreshing;
  refreshing = refreshSession(session);
  try {
    return await refreshing;
  } finally {
    refreshing = null;
  }
}

async function refreshSession(session: AdminSession): Promise<string | null> {
  try {
    const response = await authRequest('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refreshToken })
    });
    const refreshedSession = await parseAuthResponse(response);
    storeSession(refreshedSession);
    return refreshedSession.access_token;
  } catch (error) {
    if (error instanceof SupabaseAuthError && [400, 401, 403].includes(error.status ?? 0)) {
      clearSession();
      return null;
    }
    throw error;
  }
}

export async function signOut(): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    if (accessToken) {
      await authRequest('/auth/v1/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    }
  } finally {
    clearSession();
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = `${window.location.origin}/admin/restablecer`;
  const response = await authRequest(
    `/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }
  );
  if (!response.ok) {
    throw new SupabaseAuthError('No fue posible solicitar el restablecimiento.', response.status);
  }
}

export async function updateRecoveredPassword(password: string): Promise<void> {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('access_token');
  if (!token || params.get('type') !== 'recovery') {
    throw new SupabaseAuthError(
      'El enlace no es válido. Solicita otro desde la pantalla de ingreso.'
    );
  }
  const response = await authRequest('/auth/v1/user', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!response.ok)
    throw new SupabaseAuthError(
      'No pudimos cambiar la contraseña. El enlace puede haber expirado o la contraseña no cumple los requisitos.',
      response.status
    );
  window.history.replaceState(null, '', window.location.pathname);
  clearSession();
}

export function clearSession(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(storageKey);
  }
}

function readSession(): AdminSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const rawSession = window.localStorage.getItem(storageKey);
  if (!rawSession) {
    return null;
  }
  let rawValue: unknown;
  try {
    rawValue = JSON.parse(rawSession);
  } catch {
    clearSession();
    return null;
  }
  const parsed = sessionSchema.safeParse(rawValue);
  if (!parsed.success) {
    clearSession();
    return null;
  }
  return parsed.data;
}

function storeSession(response: z.infer<typeof authResponseSchema>): void {
  const session: AdminSession = {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + response.expires_in * 1_000
  };
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

async function parseAuthResponse(response: Response): Promise<z.infer<typeof authResponseSchema>> {
  if (!response.ok) {
    throw new SupabaseAuthError(
      'No fue posible iniciar sesión. Revisa tus credenciales.',
      response.status
    );
  }

  return authResponseSchema.parse(await response.json());
}

async function authRequest(path: string, init: RequestInit): Promise<Response> {
  const { url, publishableKey } = getSupabasePublicConfig();
  let response: Response;
  try {
    response = await fetch(`${url}${path}`, {
      signal: AbortSignal.timeout(15_000),
      ...init,
      headers: {
        apikey: publishableKey,
        Accept: 'application/json',
        ...init.headers
      }
    });
  } catch {
    throw new SupabaseAuthError(
      'No fue posible conectar con la autenticación. Intenta nuevamente.'
    );
  }

  return response;
}

function getSupabasePublicConfig(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    throw new SupabaseAuthError('La autenticación administrativa no está configurada.');
  }

  return { url, publishableKey };
}
