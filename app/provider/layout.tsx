import RoleGuard from '@/components/layout/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['provider']}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
