'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Notification } from '@/types';

export default function PatientNotifications() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: notifications = [],
    isLoading,
    error,
  } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    },
  });

  const grouped = useMemo(() => {
    type Group = {
      key: string;
      type: string;
      senderId: string | null;
      ids: string[];
      unreadCount: number;
      createdAt: Date;
    };

    const nonMessage = notifications.filter((n) => n.type !== 'new_message');
    const groups = new Map<string, Group>();

    for (const n of nonMessage) {
      const senderId = n.senderId ?? null;
      const key = `${n.type}|${senderId ?? ''}`;

      const createdAt = new Date(n.createdAt);
      const existing = groups.get(key);

      if (!existing) {
        groups.set(key, {
          key,
          type: n.type,
          senderId,
          ids: [n.id],
          unreadCount: n.isRead ? 0 : 1,
          createdAt,
        });
        continue;
      }

      existing.ids.push(n.id);
      if (!n.isRead) existing.unreadCount += 1;
      if (createdAt > existing.createdAt) existing.createdAt = createdAt;
    }

    return Array.from(groups.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [notifications]);

  const routeForType = (type: string) => {
    if (type === 'abnormal_reading') return '/patient/health-tracker';
    if (type === 'prescription_added') return '/patient/prescriptions';
    return '/patient/consultations';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consultation updates, reminders, and health alerts.
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">
          Failed to load notifications.
        </div>
      ) : grouped.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No notifications yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {grouped.map((g) => (
              <li
                key={g.key}
                className={`p-5 ${
                  g.unreadCount > 0 ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-4 text-left"
                  onClick={async () => {
                    // Mark the whole group as read, then redirect.
                    await Promise.all(
                      g.ids.map((id) => api.put(`/notifications/${id}/read`)),
                    ).catch(() => {
                      // best-effort
                    });

                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                    queryClient.invalidateQueries({
                      queryKey: ['notifications-badge-counts'],
                    });

                    router.push(routeForType(g.type));
                  }}
                >
                  <div>
                    <div className="text-sm text-gray-900 font-medium">
                      {g.type}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {g.createdAt.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {g.unreadCount > 2 && (
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-semibold">
                        {g.unreadCount}
                      </span>
                    )}

                    {g.unreadCount === 0 && (
                      <span className="text-xs text-gray-400">Read</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

