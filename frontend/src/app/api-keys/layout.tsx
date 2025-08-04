import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function ApiKeysLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return <DashboardLayout>{children}</DashboardLayout>;
}
