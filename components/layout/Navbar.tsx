'use client';

import { Bell, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { socketService } from '@/lib/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { parseConsultationIdFromNotificationMessage } from '@/lib/notification-helpers';
import { patientNonMessageNotificationPath } from '@/lib/patient-notification-routes';
import { Notification } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMemo, useState } from 'react';

export default function Navbar({
  onMenuClick,
  showMobileBell,
  mobileBellBadgeTotal,
  mobileBellTitle,
}: {
  onMenuClick?: () => void;
  showMobileBell?: boolean;
  mobileBellBadgeTotal?: number;
  mobileBellTitle?: string;
}) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const notificationsQuery = useQuery<Notification[]>({
    queryKey: ['notifications-list', open],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
    enabled: !!user?.id && showMobileBell && open,
  });

  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  );

  // notifications dropdown items are computed below

  const userRole = user?.role ?? 'patient';

  const dropdownItems = useMemo(() => {
    // Group unread message notifications by senderId (distinct sender rows).
    const messageGroups = new Map<
      string,
      { senderId: string; count: number; createdAt: Date }
    >();

    for (const n of notifications) {
      if (n.type !== 'new_message') continue;
      if (n.isRead) continue;
      const senderId = n.senderId ?? null;
      if (!senderId) continue;

      const createdAt = new Date(n.createdAt);
      const existing = messageGroups.get(senderId);
      if (!existing) {
        messageGroups.set(senderId, { senderId, count: 1, createdAt });
      } else {
        existing.count += 1;
        if (createdAt > existing.createdAt) existing.createdAt = createdAt;
      }
    }

    const messageItems = Array.from(messageGroups.values()).map((g) => ({
      kind: 'messageGroup' as const,
      senderId: g.senderId,
      count: g.count,
      createdAt: g.createdAt,
    }));

    // Group non-message notifications by (type + senderId).
    const nonMessageGroups = new Map<
      string,
      {
        type: string;
        senderId: string | null;
        unreadCount: number;
        createdAt: Date;
        unreadIds: string[];
        sampleMessage: string;
      }
    >();

    for (const n of notifications) {
      if (n.type === 'new_message') continue;

      const senderId = n.senderId ?? null;
      const key = `${n.type}|${senderId ?? ''}`;

      const createdAt = new Date(n.createdAt);
      const existing = nonMessageGroups.get(key);

      if (!existing) {
        nonMessageGroups.set(key, {
          type: n.type,
          senderId,
          unreadCount: n.isRead ? 0 : 1,
          createdAt,
          unreadIds: n.isRead ? [] : [n.id],
          sampleMessage: n.message,
        });
        continue;
      }

      existing.unreadCount += n.isRead ? 0 : 1;
      if (!n.isRead) existing.unreadIds.push(n.id);
      if (createdAt > existing.createdAt) existing.createdAt = createdAt;
    }

    const nonMessageItems = Array.from(nonMessageGroups.values()).map((g) => ({
      kind: 'nonMessageGroup' as const,
      type: g.type,
      senderId: g.senderId,
      unreadCount: g.unreadCount,
      createdAt: g.createdAt,
      unreadIds: g.unreadIds,
      sampleMessage: g.sampleMessage,
    }));

    return [...nonMessageItems, ...messageItems]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);
  }, [notifications]);

  const handleLogout = () => {
    logout();
    socketService.disconnect();
    router.push('/login');
  };

  return (
    <div className="flex z-10 shrink-0 h-16 bg-white border-b border-gray-200">
      <button
        type="button"
        onClick={onMenuClick}
        className="px-4 text-gray-500 border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="w-6 h-6" aria-hidden="true" />
      </button>
      <div className="flex justify-between flex-1 px-4">
        <div className="flex flex-1">
          {/* Search or page title can go here */}
        </div>
        <div className="flex items-center ml-4 md:ml-6 text-sm text-gray-600 font-medium">
          {showMobileBell && (
            <div className='relative'>
              <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger className="relative p-2 mr-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 md:hidden rounded-md">
                <button
                  type="button"
                  className="flex items-center"
                  aria-label="Notifications"
                  title={mobileBellTitle}
                >
                  <Bell className="w-6 h-6" aria-hidden="true" />
                  {(mobileBellBadgeTotal ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-blue-600 text-white text-[11px] font-semibold">
                      {mobileBellBadgeTotal}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className=" absolute top-10 right-0 w-md max-w-[calc(100vw-2rem)] bg-white z-999">
                {notificationsQuery.isLoading ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No notifications.
                  </div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto rounded-lg shadow-lg border border-gray-200 ">
                    {dropdownItems.map((item) => {
                      if (item.kind === 'messageGroup') {
                        return (
                          <DropdownMenuItem
                            key={`msg-${item.senderId}`}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer w-full bg-gray-200"
                            onClick={async () => {
                              setOpen(false);
                              try {
                                await api.put(
                                  `/notifications/mark-messages-read?senderId=${item.senderId}`,
                                );
                              } catch {
                                // best-effort
                              }
                              queryClient.invalidateQueries({
                                queryKey: ['notifications-badge-counts'],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ['notifications'],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ['notifications-list'],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ['unread-message-senders'],
                              });
                              router.push(
                                `/${userRole}/messages?with=${item.senderId}`,
                              );
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  new_message
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.createdAt.toLocaleString()}
                                </div>
                              </div>
                              <div className="flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-semibold">
                                {item.count}
                              </div>
                            </div>
                          </DropdownMenuItem>
                        );
                      }

                      if (item.kind === 'nonMessageGroup') {
                        const target =
                          userRole === 'patient'
                            ? patientNonMessageNotificationPath(item.type)
                            : item.type === 'abnormal_reading'
                              ? '/patient/health-tracker'
                              : item.type === 'prescription_added'
                                ? `/${userRole}/prescriptions`
                                : `/${userRole}/consultations`;

                        return (
                          <DropdownMenuItem
                            key={`nm-${item.type}-${item.senderId ?? 'none'}`}
                            className={`px-4 py-3 hover:bg-gray-100 cursor-pointer w-full ${
                              item.unreadCount > 0 ? 'bg-gray-200' : ''
                            }`}
                            onClick={async () => {
                              setOpen(false);
                              if (
                                userRole === 'patient' &&
                                item.type === 'consultation_video_invite'
                              ) {
                                const cid =
                                  parseConsultationIdFromNotificationMessage(
                                    item.sampleMessage,
                                  );
                                if (cid) {
                                  try {
                                    await api.put(
                                      `/consultations/${cid}/patient-ack-video-invite`,
                                    );
                                  } catch {
                                    // best-effort
                                  }
                                  queryClient.invalidateQueries({
                                    queryKey: ['patient-consultations'],
                                  });
                                }
                              }
                              try {
                                await Promise.all(
                                  item.unreadIds.map((id) =>
                                    api.put(`/notifications/${id}/read`),
                                  ),
                                );
                              } catch {
                                // best-effort
                              }
                              queryClient.invalidateQueries({
                                queryKey: ['notifications-badge-counts'],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ['notifications'],
                              });
                              queryClient.invalidateQueries({
                                queryKey: ['notifications-list'],
                              });
                              router.push(target);
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.type}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.createdAt.toLocaleString()}
                                </div>
                              </div>
                              {item.unreadCount > 2 ? (
                                <div className="flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-semibold">
                                  {item.unreadCount}
                                </div>
                              ) : null}
                            </div>
                          </DropdownMenuItem>
                        );
                      }

                      return null;
                    })}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
          <span className="hidden mr-4 md:block">Welcome, {user?.fullName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center p-2 text-gray-400 bg-white rounded-full hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <span className="sr-only">Log out</span>
            <LogOut className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
