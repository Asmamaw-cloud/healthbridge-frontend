'use client';

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { api } from '@/lib/api';
import { usePathname } from 'next/navigation';
import { isMessagesPath } from '@/lib/pathname';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const { data: badgeCounts } = useQuery<{
    messageCount: number;
    consultationUpdatesCount: number;
    remindersCount: number;
    healthAlertsCount: number;
    prescriptionCount: number;
  }>({
    queryKey: ['notifications-badge-counts'],
    queryFn: async () => {
      const res = await api.get('/notifications/badge-counts');
      return res.data;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
  });

  const isMessagesRoute = isMessagesPath(pathname);
  const mobileMessageBadgeCount = isMessagesRoute
    ? 0
    : badgeCounts?.messageCount ?? 0;

  const consultationUpdatesInclPrescriptions =
    (badgeCounts?.consultationUpdatesCount ?? 0) +
    (badgeCounts?.prescriptionCount ?? 0);

  const mobileBellBadgeTotal =
    mobileMessageBadgeCount +
    consultationUpdatesInclPrescriptions +
    (badgeCounts?.remindersCount ?? 0) +
    (badgeCounts?.healthAlertsCount ?? 0);

  const mobileBellTitle = badgeCounts
    ? `Messages: ${mobileMessageBadgeCount}, Consultation updates: ${consultationUpdatesInclPrescriptions}, Reminders: ${badgeCounts.remindersCount}, Health alerts: ${badgeCounts.healthAlertsCount}`
    : undefined;

  useEffect(() => {
    if (!user) return;

    socketService.connect();
    const socket = socketService.getSocket();
    if (!socket) return;

    const handler = (notification: any) => {
      const text = notification?.message ?? 'New notification';
      toast.info(text);
      queryClient.invalidateQueries({ queryKey: ['notifications-badge-counts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-senders'] });
    };

    socket.on('notification:new', handler);

    return () => {
      socket.off('notification:new', handler);
    };
  }, [user?.id, queryClient]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay + slide-in sidebar */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <Navbar
          onMenuClick={() => setSidebarOpen(true)}
          showMobileBell={!sidebarOpen}
          mobileBellBadgeTotal={mobileBellBadgeTotal}
          mobileBellTitle={mobileBellTitle}
        />
        <main className="relative flex-1 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
