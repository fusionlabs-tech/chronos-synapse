import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { ToastProvider } from '@/components/ui/toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { PubSubProvider } from '@/contexts/PubSubContext';
import { SessionExpiredModal } from '@/components/SessionExpiredModal';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({
 subsets: ['latin'],
 weight: ['400', '600', '700', '800', '900'],
 variable: '--font-poppins',
});

export const metadata: Metadata = {
 title: 'Chronos - AI-Driven Cron Management',
 description:
  'AI-powered cron job management with real-time monitoring and predictive analytics',
 authors: [{ name: 'Chronos Team' }],
 creator: 'Chronos',
 publisher: 'Chronos',
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
     inter.className,
     poppins.variable
    )}
   >
    <ThemeProvider>
     <ToastProvider>
      <AuthProvider>
       <NotificationProvider>
        <PubSubProvider>
         {children}
         <SessionExpiredModal />
        </PubSubProvider>
       </NotificationProvider>
      </AuthProvider>
     </ToastProvider>
    </ThemeProvider>
   </body>
  </html>
 );
}
