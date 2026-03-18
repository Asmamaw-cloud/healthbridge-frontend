import RoleGuard from '@/components/layout/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['pharmacy']}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
