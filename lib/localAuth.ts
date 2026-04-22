import fs from 'fs';
import path from 'path';

interface LocalUser {
  id: string;
  name: string;
  email: string;
  password: string; // bcrypt hash
  isMasterAdmin: boolean;
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), 'data', 'users.local.json');

export function readLocalUsers(): LocalUser[] {
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) as LocalUser[];
  } catch {
    return [];
  }
}

export function findLocalUser(email: string): LocalUser | null {
  return readLocalUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function isDbConfigured(): boolean {
  const url = process.env.DATABASE_URL ?? '';
  return url.length > 0 && !url.includes('your-neon-db');
}

// kept for any legacy references
export const isSupabaseConfigured = isDbConfigured;
