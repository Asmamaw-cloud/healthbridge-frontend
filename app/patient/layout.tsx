import RoleGuard from '@/components/layout/RoleGuard';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['patient']}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </RoleGuard>
  );
}
