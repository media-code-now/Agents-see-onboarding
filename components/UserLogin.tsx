'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { User, LogOut, Shield } from 'lucide-react';

export default function UserLogin() {
  const { data: session, status } = useSession();

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center gap-3 px-4">
        <div className="h-10 w-10 animate-pulse rounded-full bg-white/10" />
        <div className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
          <span className="text-sm font-bold">
            {session.user.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div className="flex-1 text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <p className="text-sm font-medium text-white">{session.user.name}</p>
            {session.user.isMasterAdmin && (
              <Shield className="h-3.5 w-3.5 text-blue-400" aria-label="Master Admin" />
            )}
          </div>
          <p className="text-xs text-gray-400">{session.user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-full p-2 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/auth/signin"
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20"
    >
      <User className="h-4 w-4" />
      Sign In
    </Link>
  );
}
