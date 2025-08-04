import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function AIInsightsLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <DashboardLayout>{children}</DashboardLayout>;
}
