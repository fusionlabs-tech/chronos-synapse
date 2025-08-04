import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function JobsLayoutPage({
 children,
}: {
 children: React.ReactNode;
}) {
 return <DashboardLayout>{children}</DashboardLayout>;
}
