'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, AlertTriangle, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { Notification, NotificationPriority } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_ICON: Record<NotificationPriority, React.ReactNode> = {
  critical: <AlertTriangle className="h-4 w-4 text-red-500" />,
  high: <AlertCircle className="h-4 w-4 text-orange-500" />,
  medium: <Clock className="h-4 w-4 text-yellow-500" />,
  low: <CheckCircle className="h-4 w-4 text-blue-400" />,
};

const PRIORITY_DOT: Record<NotificationPriority, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
};

function NotificationItem({
  notification,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div
      className={`group relative px-4 py-3.5 transition-colors hover:bg-white/5 ${
        !notification.is_read ? 'bg-blue-500/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">{PRIORITY_ICON[notification.priority]}</div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold leading-tight text-white">{notification.title}</p>
            {!notification.is_read && (
              <span className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${PRIORITY_DOT[notification.priority]}`} />
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-gray-400">{notification.message}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-600">
              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
            </span>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!notification.is_read && (
                <button
                  onClick={() => onRead(notification.id)}
                  title="Mark as read"
                  className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                title="Dismiss"
                className="rounded-lg p-1 text-gray-500 transition-colors hover:bg-white/10 hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {notification.link && (
            <a
              href={notification.link}
              onClick={() => { if (!notification.is_read) onRead(notification.id); }}
              className="mt-1.5 inline-block text-xs text-blue-400 hover:text-blue-300"
            >
              View details →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const { data, markNotificationRead, markAllNotificationsRead, deleteNotification, runNotificationCheck } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('unread');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const all = data.notifications;
  const unread = all.filter((n) => !n.is_read);
  const displayed = activeTab === 'unread' ? unread : all;
  const unreadCount = unread.length;

  // Debug: Log notifications
  useEffect(() => {
    console.log('NotificationBell - notifications total:', all.length, 'unread:', unread.length, all);
  }, [all, unread]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-white backdrop-blur-xl transition-all hover:bg-white/10"
        aria-label="Notifications"
      >
        <Bell className={`h-5 w-5 ${unreadCount > 0 ? 'animate-[ring_1s_ease-in-out]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-3xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur-2xl">
          {/* Header */}
          <div className="sticky top-0 z-10 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={runNotificationCheck}
                  title="Refresh"
                  className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    title="Mark all read"
                    className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-2.5 flex gap-1">
              {(['unread', 'all'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors capitalize ${
                    activeTab === tab
                      ? 'bg-white/15 text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab} {tab === 'unread' && unreadCount > 0 ? `(${unreadCount})` : tab === 'all' ? `(${all.length})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[480px] divide-y divide-white/5 overflow-y-auto">
            {displayed.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="mx-auto mb-3 h-8 w-8 text-gray-700" />
                <p className="text-sm text-gray-500">
                  {activeTab === 'unread' ? 'All caught up!' : 'No notifications yet'}
                </p>
              </div>
            ) : (
              displayed.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markNotificationRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {all.length > 0 && (
            <div className="border-t border-white/10 px-4 py-2.5 text-center">
              <span className="text-xs text-gray-600">
                {all.length} total · {unreadCount} unread
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
