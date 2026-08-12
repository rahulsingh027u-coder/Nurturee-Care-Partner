'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCheck,
  Briefcase,
  CreditCard,
  Shield,
  Info,
  Clock,
} from 'lucide-react';
import { mockNotifications, type Notification } from '@/lib/care-partner-data';
import { formatDistanceToNow } from 'date-fns';

type FilterTab = 'All' | 'Unread' | 'Assignments' | 'Payments' | 'Verification';

const filterTabs: FilterTab[] = [
  'All',
  'Unread',
  'Assignments',
  'Payments',
  'Verification',
];

function getTypeIcon(type: Notification['type']) {
  switch (type) {
    case 'assignment':
      return {
        icon: Briefcase,
        containerClass: 'bg-blue-50',
        iconClass: 'text-blue-600',
      };
    case 'status':
      return {
        icon: Clock,
        containerClass: 'bg-emerald-50',
        iconClass: 'text-emerald-600',
      };
    case 'payment':
      return {
        icon: CreditCard,
        containerClass: 'bg-violet-50',
        iconClass: 'text-violet-600',
      };
    case 'verification':
      return {
        icon: Shield,
        containerClass: 'bg-amber-50',
        iconClass: 'text-amber-600',
      };
    case 'info':
      return {
        icon: Info,
        containerClass: 'bg-gray-50',
        iconClass: 'text-gray-500',
      };
  }
}

function filterNotifications(
  notifications: Notification[],
  tab: FilterTab
): Notification[] {
  switch (tab) {
    case 'Unread':
      return notifications.filter((n) => !n.isRead);
    case 'Assignments':
      return notifications.filter((n) => n.type === 'assignment');
    case 'Payments':
      return notifications.filter((n) => n.type === 'payment');
    case 'Verification':
      return notifications.filter((n) => n.type === 'verification');
    case 'All':
    default:
      return notifications;
  }
}

export default function NotificationsView() {
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState<FilterTab>('All');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = filterNotifications(notifications, activeTab);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  return (
    <div className="space-y-6">
      {/* Section 1: Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bell className="size-5 text-gray-700" />
            Notifications
          </h2>
          {unreadCount > 0 && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs font-medium border-0"
            >
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 font-medium flex items-center gap-1.5 hover:text-blue-700 transition-colors"
          >
            <CheckCheck className="size-4" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* Section 2: Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer ${
              activeTab === tab
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Section 3: Notification List */}
      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((notification) => {
            const { icon: TypeIcon, containerClass, iconClass } = getTypeIcon(
              notification.type
            );

            return (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                }}
                className={`rounded-xl border border-gray-100 bg-white p-4 transition-colors cursor-pointer ${
                  notification.isRead
                    ? 'bg-white'
                    : 'border-l-4 border-l-blue-500 bg-blue-50/30'
                } hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  {/* Type Icon */}
                  <div
                    className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${containerClass}`}
                  >
                    <TypeIcon className={`size-5 ${iconClass}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className="text-sm font-semibold text-gray-900"
                      >
                        {notification.title}
                      </h4>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="text-xs text-blue-600 font-medium mt-2 hover:text-blue-700 transition-colors"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* Section 4: Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Bell className="size-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No notifications</p>
            <p className="text-xs text-gray-500 mt-1">
              {activeTab === 'Unread'
                ? 'You\'re all caught up! No unread notifications.'
                : activeTab === 'Assignments'
                  ? 'No assignment notifications yet.'
                  : activeTab === 'Payments'
                    ? 'No payment notifications at this time.'
                    : activeTab === 'Verification'
                      ? 'No verification updates to show.'
                      : 'Notifications about your shifts, payments, and updates will appear here.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
