import { existsSync, readFileSync } from 'node:fs';

const environmentFile = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL) || /^DATABASE_URL=.+$/m.test(environmentFile);

if (!hasDatabaseUrl) {
  console.error('DATABASE_URL is required for Prisma database operations.');
  process.exit(1);
}
