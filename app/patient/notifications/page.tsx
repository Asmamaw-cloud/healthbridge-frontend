'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { parseConsultationIdFromNotificationMessage } from '@/lib/notification-helpers';
import {
  patientMessagesInboxPath,
  patientNonMessageNotificationPath,
} from '@/lib/patient-notification-routes';
import { Notification } from '@/types';

type MessageGroup = {
  kind: 'message';
  key: string;
  senderId: string;
  unreadCount: number;
  createdAt: Date;
};

type NonMessageGroup = {
  kind: 'non_message';
  key: string;
  type: string;
  senderId: string | null;
  ids: string[];
  sampleMessage: string;
  unreadCount: number;
  createdAt: Date;
};

type ListRow = MessageGroup | NonMessageGroup;

function buildPatientNotificationRows(notifications: Notification[]): ListRow[] {
  const nonMessage = notifications.filter((n) => n.type !== 'new_message');
  const nonGroups = new Map<string, NonMessageGroup>();

  for (const n of nonMessage) {
    const senderId = n.senderId ?? null;
    const key = `${n.type}|${senderId ?? ''}`;
    const createdAt = new Date(n.createdAt);
    const existing = nonGroups.get(key);

    if (!existing) {
      nonGroups.set(key, {
        kind: 'non_message',
        key,
        type: n.type,
        senderId,
        ids: [n.id],
        sampleMessage: n.message,
        unreadCount: n.isRead ? 0 : 1,
        createdAt,
      });
      continue;
    }

    existing.ids.push(n.id);
    if (!n.isRead) existing.unreadCount += 1;
    if (createdAt > existing.createdAt) existing.createdAt = createdAt;
  }

  const msgGroups = new Map<string, MessageGroup>();
  for (const n of notifications) {
    if (n.type !== 'new_message') continue;
    const senderId = n.senderId ?? null;
    if (!senderId) continue;

    const createdAt = new Date(n.createdAt);
    const key = `msg|${senderId}`;
    const existing = msgGroups.get(key);

    if (!existing) {
      msgGroups.set(key, {
        kind: 'message',
        key,
        senderId,
        unreadCount: n.isRead ? 0 : 1,
        createdAt,
      });
      continue;
    }

    if (!n.isRead) existing.unreadCount += 1;
    if (createdAt > existing.createdAt) existing.createdAt = createdAt;
  }

  return [...Array.from(nonGroups.values()), ...Array.from(msgGroups.values())].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

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

  useEffect(() => {
    // Clear consultation / reminder / health (non-message) sidebar + mobile badges when visiting this page.
    api
      .put('/notifications/mark-non-message-read')
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({
          queryKey: ['notifications-badge-counts'],
        });
      })
      .catch(() => {
        // best-effort
      });
  }, [queryClient]);

  const rows = useMemo(
    () => buildPatientNotificationRows(notifications),
    [notifications],
  );

  async function handleRowClick(row: ListRow) {
    if (row.kind === 'message') {
      try {
        await api.put(
          `/notifications/mark-messages-read?senderId=${row.senderId}`,
        );
      } catch {
        // best-effort
      }
      queryClient.invalidateQueries({ queryKey: ['notifications-badge-counts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-senders'] });
      router.push(patientMessagesInboxPath(row.senderId));
      return;
    }

    if (row.type === 'consultation_video_invite') {
      const cid = parseConsultationIdFromNotificationMessage(row.sampleMessage);
      if (cid) {
        try {
          await api.put(`/consultations/${cid}/patient-ack-video-invite`);
        } catch {
          // best-effort; user can retry from consultations list
        }
        queryClient.invalidateQueries({ queryKey: ['patient-consultations'] });
      }
    }

    await Promise.all(
      row.ids.map((id) => api.put(`/notifications/${id}/read`)),
    ).catch(() => {
      // best-effort
    });

    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({
      queryKey: ['notifications-badge-counts'],
    });
    queryClient.invalidateQueries({ queryKey: ['notifications-list'] });

    router.push(patientNonMessageNotificationPath(row.type));
  }

  function rowLabel(row: ListRow): string {
    if (row.kind === 'message') return 'new_message';
    return row.type;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Notifications
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consultation updates, reminders, messages, and health alerts. Tap a row
          to open the related page (same as the bell menu).
        </p>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-500">
          Failed to load notifications.
        </div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-gray-500">
          No notifications yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {rows.map((row) => (
              <li
                key={row.key}
                className={`p-5 ${
                  row.unreadCount > 0 ? 'bg-blue-50/50' : 'bg-white'
                }`}
              >
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-4 text-left"
                  onClick={() => void handleRowClick(row)}
                >
                  <div>
                    <div className="text-sm text-gray-900 font-medium">
                      {rowLabel(row)}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {row.createdAt.toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {row.unreadCount > 2 && (
                      <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-blue-600 text-white text-xs font-semibold">
                        {row.unreadCount}
                      </span>
                    )}

                    {row.unreadCount > 0 && row.unreadCount <= 2 && (
                      <span className="text-xs font-medium text-blue-700">
                        New
                      </span>
                    )}

                    {row.unreadCount === 0 && (
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
