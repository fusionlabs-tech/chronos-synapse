import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AnalyticsLayoutPage({
 children,
}: {
 children: React.ReactNode;
}) {
 return <DashboardLayout>{children}</DashboardLayout>;
}
