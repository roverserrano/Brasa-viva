import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const publicEnvironmentKeys = [
  'NEXT_PUBLIC_API_BASE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
] as const;

function getRootPublicEnvironment(): Partial<
  Record<(typeof publicEnvironmentKeys)[number], string>
> {
  try {
    const rootEnvPath = fileURLToPath(new URL('../../.env', import.meta.url));
    const rootEnv = readFileSync(rootEnvPath, 'utf8');
    const values: Partial<Record<(typeof publicEnvironmentKeys)[number], string>> = {};

    for (const key of publicEnvironmentKeys) {
      const match = rootEnv.match(new RegExp(`^${key}\\s*=\\s*(.+)\\s*$`, 'm'));
      const rawValue = match?.[1]?.trim();
      if (rawValue) {
        values[key] = rawValue.replace(/^(['"])(.*)\1$/, '$2');
      }
    }

    return values;
  } catch {
    return {};
  }
}

const rootPublicEnvironment = getRootPublicEnvironment();
const publicEnvironment = Object.fromEntries(
  publicEnvironmentKeys.flatMap((key) => {
    const value = process.env[key] ?? rootPublicEnvironment[key];
    return value ? [[key, value]] : [];
  })
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: (() => {
      const configured = publicEnvironment.NEXT_PUBLIC_SUPABASE_URL;
      if (!configured) return [];
      try {
        const url = new URL(configured);
        return url.protocol === 'https:'
          ? [
              {
                protocol: 'https' as const,
                hostname: url.hostname,
                port: url.port,
                pathname: '/storage/v1/object/public/**'
              }
            ]
          : [];
      } catch {
        return [];
      }
    })()
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'"
          },
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
            : [])
        ]
      }
    ];
  },
  ...(Object.keys(publicEnvironment).length > 0
    ? {
        env: publicEnvironment
      }
    : {})
};

export default nextConfig;
