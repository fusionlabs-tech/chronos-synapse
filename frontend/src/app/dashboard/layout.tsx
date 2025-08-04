import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardLayoutPage({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
  <ProtectedRoute>
   <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
 );
}
