'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import UserLogin from '@/components/UserLogin';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Shield,
  UserCog,
  Settings,
  KanbanSquare,
  History
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Kanban Board', href: '/kanban', icon: KanbanSquare },
  { name: 'Weekly Plans', href: '/weekly-plans', icon: Calendar },
  { name: 'Security Reviews', href: '/security', icon: Shield },
  { name: 'Team Access', href: '/team-access', icon: UserCog },
  { name: 'Activity Log', href: '/activity', icon: History },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isMasterAdmin } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Filter navigation based on master admin access
  const visibleNavigation = navigation.filter(
    (item) => item.name !== 'Team Access' || isMasterAdmin
  );

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button - Fixed at top left */}
      <div className="fixed left-0 top-0 z-50 lg:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="m-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3 text-white transition-all hover:bg-white/10"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-72 bg-black/40 backdrop-blur-2xl shadow-2xl border-r border-white/10
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center border-b border-white/10 px-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-14 w-auto object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
            {/* Fallback text if logo fails */}
            <div className="text-lg font-bold text-white">AGENTS</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {visibleNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white/20 text-white shadow-lg backdrop-blur-xl'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Login */}
          <div className="border-t border-white/10 p-4">
            <UserLogin />
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 p-6">
            <p className="text-xs font-medium text-gray-500">
              SEO Agency Management System
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
