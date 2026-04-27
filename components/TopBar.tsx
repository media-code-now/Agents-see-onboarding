'use client';

import NotificationBell from '@/components/NotificationBell';

export default function TopBar({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-2xl px-6 py-4">
      <div className="relative flex items-center justify-between gap-4">
        <h1 className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight text-white truncate md:static md:left-auto md:translate-x-0 md:text-3xl">{title}</h1>
        <div className="md:hidden" />
        <NotificationBell />
      </div>
    </div>
  );
}
