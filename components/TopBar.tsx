'use client';

export default function TopBar({ title }: { title: string }) {
  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-2xl px-6 py-4">
      <div className="flex items-center justify-center lg:justify-start gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white truncate">{title}</h1>
      </div>
    </div>
  );
}
