import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const storageKey = 'brasa-viva.admin-session.v1';
let values: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://auth.example.test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'test-key');
  values = new Map([
    [
      storageKey,
      JSON.stringify({
        accessToken: 'old-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() - 1
      })
    ]
  ]);
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key)
    }
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('administrative session renewal', () => {
  it('refreshes once when parallel requests need the same expired session', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          access_token: 'new-token',
          refresh_token: 'new-refresh',
          expires_in: 3600
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetch);
    const { getAccessToken } = await import('./supabase-auth');
    expect(await Promise.all([getAccessToken(), getAccessToken()])).toEqual([
      'new-token',
      'new-token'
    ]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('preserves the local session on a temporary failure but clears an invalid refresh', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { getAccessToken } = await import('./supabase-auth');
    await expect(getAccessToken()).rejects.toThrow();
    expect(values.has(storageKey)).toBe(true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    expect(await getAccessToken()).toBeNull();
    expect(values.has(storageKey)).toBe(false);
  });

  it('closes local access even when remote sign-out cannot refresh the token', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { signOut } = await import('./supabase-auth');
    await expect(signOut()).rejects.toThrow();
    expect(values.has(storageKey)).toBe(false);
  });
});
