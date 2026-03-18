'use client';

import { LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { socketService } from '@/lib/socket';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    socketService.disconnect();
    router.push('/login');
  };

  return (
    <div className="flex z-10 flex-shrink-0 h-16 bg-white border-b border-gray-200">
      <button
        type="button"
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
