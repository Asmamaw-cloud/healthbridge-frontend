'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  Home, 
  Users, 
  Calendar, 
  Search, 
  Activity, 
  MessageSquare, 
  Settings, 
  Pill,
  PieChart,
  ShieldCheck,
  Building
} from 'lucide-react';

const roleLinks = {
  patient: [
    { name: 'Dashboard', href: '/patient/dashboard', icon: Home },
    { name: 'Find Providers', href: '/patient/providers', icon: Search },
    { name: 'Consultations', href: '/patient/consultations', icon: Calendar },
    { name: 'Drug Finder', href: '/patient/drug-finder', icon: Pill },
    { name: 'Health Tracker', href: '/patient/health-tracker', icon: Activity },
    { name: 'Messages', href: '/patient/messages', icon: MessageSquare },
  ],
  provider: [
    { name: 'Dashboard', href: '/provider/dashboard', icon: Home },
    { name: 'Schedule', href: '/provider/schedule', icon: Calendar },
    { name: 'Consultations', href: '/provider/consultations', icon: Users },
    { name: 'Prescriptions', href: '/provider/prescriptions', icon: Pill },
    { name: 'Patient Readings', href: '/provider/health-readings', icon: Activity },
    { name: 'Messages', href: '/provider/messages', icon: MessageSquare },
  ],
  pharmacy: [
    { name: 'Dashboard', href: '/pharmacy/dashboard', icon: Home },
    { name: 'Inventory', href: '/pharmacy/medicines', icon: Pill },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin/dashboard', icon: PieChart },
    { name: 'Providers Approval', href: '/admin/providers', icon: ShieldCheck },
    { name: 'Pharmacies Approval', href: '/admin/pharmacies', icon: Building },
  ]
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  if (!user) return null;

  const links = roleLinks[user.role as keyof typeof roleLinks] || [];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-gray-900 border-r border-gray-800">
        <div className="flex flex-col flex-1 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center flex-shrink-0 h-16 px-4 bg-gray-900">
            <span className="text-xl font-bold text-white">HealthBridge</span>
          </div>
          <nav className="flex-1 px-2 mt-5 space-y-1 bg-gray-900">
            {links.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${isActive 
                      ? 'bg-gray-800 text-white' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <item.icon
                    className={`
                      mr-3 flex-shrink-0 h-5 w-5
                      ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'}
                    `}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-shrink-0 p-4 bg-gray-800">
          <div className="flex-shrink-0 block w-full group">
            <div className="flex items-center">
              <div>
                <div className="inline-block w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {user.fullName.charAt(0)}
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{user.fullName}</p>
                <p className="text-xs font-medium text-gray-300 group-hover:text-gray-200 capitalize">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
