'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRealtime } from '@/contexts/PubSubContext';
import {
 LogOut,
 User,
 Settings,
 Key,
 ChevronDown,
 Bell,
 Search,
 Brain,
 Activity,
 Clock,
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';

interface DashboardLayoutProps {
 children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
 const [userMenuOpen, setUserMenuOpen] = useState(false);
 const pathname = usePathname();
 const { user, logout } = useAuth();
 const userMenuRef = useRef<HTMLDivElement>(null);
 const { pubSubConnected } = useRealtime();

 // Close user menu when clicking outside
 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (
    userMenuRef.current &&
    !userMenuRef.current.contains(event.target as Node)
   ) {
    setUserMenuOpen(false);
   }
  };

  if (userMenuOpen) {
   document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
   document.removeEventListener('mousedown', handleClickOutside);
  };
 }, [userMenuOpen]);

 return (
  <div className='min-h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50'>
   {/* Top Header Bar with brand, nav and status */}
   <header className='h-16 card-primary border-b border-neutral-200/50 flex items-center px-6 shadow-lg'>
    {/* Left: Logo */}
    <Link href='/dashboard' className='flex items-center space-x-2 hover:opacity-80 transition-opacity'>
     <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center'>
      <Clock className='w-5 h-5 text-white' />
     </div>
     <span className='text-xl font-bold gradient-text-primary'>Chronos</span>
    </Link>

    {/* Center: Navigation - flex-1 and centered */}
    <nav className='flex-1 flex items-center justify-center'>
     <div className='flex items-center gap-4'>
      {NAVIGATION.map((item) => {
       if (item.adminOnly && user?.role !== 'ADMIN') return null;
       const isActive =
        pathname === item.href || pathname.startsWith(item.href);
       return (
        <Link
         key={item.name}
         href={item.href}
         className={cn(
          'text-sm font-medium px-3 py-2 rounded-lg transition-colors',
          isActive
           ? 'bg-neutral-100 text-primary-700'
           : 'text-neutral-700 hover:bg-neutral-100'
         )}
        >
         {item.name}
        </Link>
       );
      })}
     </div>
    </nav>

    {/* Right: Status + Notifications + User */}
    <div className='flex items-center gap-4'>
     <div className='hidden md:flex items-center space-x-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200/50'>
      <div
       className={`w-2.5 h-2.5 rounded-full ${
        pubSubConnected ? 'bg-accent-green-500' : 'bg-red-500'
       }`}
      ></div>
      <span className='text-xs text-neutral-700'>
       {pubSubConnected ? 'Connected' : 'Disconnected'}
      </span>
     </div>

     <NotificationDropdown />

     {/* User Menu */}
     <div className='relative' ref={userMenuRef}>
      <button
       onClick={() => setUserMenuOpen(!userMenuOpen)}
       className='flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 transition-colors'
      >
       {/* Avatar or initials */}
       {user?.avatar ? (
        <img
         src={user.avatar}
         alt='avatar'
         className='w-9 h-9 rounded-full object-cover shadow-lg'
        />
       ) : (
        <div className='w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg'>
         <span className='text-white text-sm font-bold'>
          {user?.firstName && user?.lastName
           ? `${user.firstName[0]?.toUpperCase() || ''}${
              user.lastName[0]?.toUpperCase() || ''
             }`
           : user?.firstName
           ? user.firstName[0]?.toUpperCase()
           : (user?.username?.[0] || 'U').toUpperCase()}
         </span>
        </div>
       )}
       <div className='hidden md:block text-left'>
        <div className='text-sm font-semibold text-neutral-900'>
         {user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : user?.firstName
          ? user.firstName
          : user?.username || 'User'}
        </div>
        <div className='text-xs text-neutral-500'>{user?.email}</div>
       </div>
       <ChevronDown
        className={`h-4 w-4 text-neutral-400 transition-transform ${
         userMenuOpen ? 'rotate-180' : ''
        }`}
       />
      </button>

      {/* User Dropdown Menu */}
      {userMenuOpen && (
       <div className='absolute right-0 mt-2 w-56 card-primary border border-neutral-200 py-2 z-50'>
        <div className='px-4 py-3 border-b border-neutral-100'>
         <div className='text-sm font-semibold text-neutral-900'>
          {user?.firstName && user?.lastName
           ? `${user.firstName} ${user.lastName}`
           : user?.firstName
           ? user.firstName
           : user?.username || 'User'}
         </div>
         <div className='text-xs text-neutral-500'>{user?.email}</div>
        </div>

        <Link
         href='/profile'
         className='flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
         onClick={() => setUserMenuOpen(false)}
        >
         <User className='h-4 w-4 mr-3' />
         Profile Settings
        </Link>

        <Link
         href='/api-keys'
         className='flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
         onClick={() => setUserMenuOpen(false)}
        >
         <Key className='h-4 w-4 mr-3' />
         API Keys
        </Link>

        {user?.role === 'ADMIN' && (
         <Link
          href='/dashboard/admin'
          className='flex items-center px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors'
          onClick={() => setUserMenuOpen(false)}
         >
          <Settings className='h-4 w-4 mr-3' />
          Admin Dashboard
         </Link>
        )}

        <div className='border-t border-neutral-100 mt-2 pt-2'>
         <button
          onClick={() => {
           logout();
           setUserMenuOpen(false);
          }}
          className='flex items-center w-full px-4 py-2.5 text-sm text-accent-red-600 hover:bg-accent-red-50 transition-colors'
         >
          <LogOut className='h-4 w-4 mr-3' />
          Sign Out
         </button>
        </div>
       </div>
      )}
     </div>
    </div>
   </header>

   {/* Page Content */}
   <main className='flex-1 overflow-y-auto p-6'>{children}</main>
  </div>
 );
}
