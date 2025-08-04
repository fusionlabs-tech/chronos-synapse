import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
 title: 'Chronos Synapse - AI-Driven Cron Management',
 description:
  'Modern cron job scheduler with AI-powered analytics, real-time monitoring, and team collaboration features.',
 keywords: ['cron', 'scheduler', 'monitoring', 'AI', 'Redis', 'automation'],
 authors: [{ name: 'Chronos Synapse Team' }],
 creator: 'Chronos Synapse',
 publisher: 'Chronos Synapse',
 formatDetection: {
  email: false,
  address: false,
  telephone: false,
 },
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
  <html lang='en' suppressHydrationWarning>
   <body
    className={cn(
     'min-h-screen bg-background font-sans antialiased',
     inter.className
    )}
   >
    <ThemeProvider>
     <ToastProvider>
      <AuthProvider>
       <NotificationProvider>
        <RealtimeProvider>{children}</RealtimeProvider>
       </NotificationProvider>
      </AuthProvider>
     </ToastProvider>
    </ThemeProvider>
   </body>
  </html>
 );
}
