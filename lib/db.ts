import { neon } from '@neondatabase/serverless';

// Throws at runtime (not build time) if DATABASE_URL is missing
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  return neon(url);
}
