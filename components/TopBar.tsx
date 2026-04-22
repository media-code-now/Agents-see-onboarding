'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Bell, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TopBar({ title }: { title: string }) {
  const { data, markNotificationRead, deleteNotification } = useApp();
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);

  const unreadCount = data.notifications.filter((n) => !n.is_read).length;
  const recentNotifications = data.notifications.slice(0, 5);

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationRead(notificationId);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  return (
    <div className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-2xl px-6 py-4">
      <div className="flex items-center justify-between lg:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white truncate">{title}</h1>
        
        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationPanelOpen(!isNotificationPanelOpen)}
            className="relative p-2 rounded-xl border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10 hover:border-white/20"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {isNotificationPanelOpen && (
            <div className="absolute right-0 mt-2 w-96 max-h-[32rem] bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-500/20 border border-red-500/30 rounded-full text-red-400">
                    {unreadCount} new
                  </span>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-[28rem]">
                {recentNotifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400">
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 transition-all hover:bg-white/5 ${
                          !notification.is_read ? 'bg-white/5' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white truncate">
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(notification.created_at)}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0"
                            aria-label="Delete notification"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {!notification.is_read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="mt-2 text-xs px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-blue-400 hover:bg-blue-500/30 transition-all"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {data.notifications.length > 5 && (
                <div className="border-t border-white/10 p-3 text-center">
                  <a
                    href="/settings"
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View all notifications →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
