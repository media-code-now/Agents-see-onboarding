import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '@/lib/auth';
import { findLocalUser, isDbConfigured } from '@/lib/localAuth';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter an email and password');
        }

        // ── Neon/Postgres auth (production) ───────────────────────────────
        if (isDbConfigured()) {
          const { getDb } = await import('@/lib/db');
          const sql = getDb();

          const rows = await sql`
            SELECT id, email, name, password, is_master_admin
            FROM users
            WHERE email = ${credentials.email}
            LIMIT 1
          `;
          const user = rows[0];
          if (!user) throw new Error('No user found with this email');

          const isValid = await verifyPassword(credentials.password, user.password);
          if (!isValid) throw new Error('Invalid password');

          await sql`UPDATE users SET last_login = NOW() WHERE id = ${user.id}`;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            isMasterAdmin: user.is_master_admin,
          };
        }

        // ── Local file auth fallback (dev without DB) ─────────────────────
        const user = findLocalUser(credentials.email);
        if (!user) throw new Error('No user found with this email');

        const isValid = await verifyPassword(credentials.password, user.password);
        if (!isValid) throw new Error('Invalid password');

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isMasterAdmin: user.isMasterAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isMasterAdmin = user.isMasterAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isMasterAdmin = token.isMasterAdmin as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
