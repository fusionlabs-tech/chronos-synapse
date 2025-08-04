'use client';

import { ReactNode, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import {
 LogOut,
 User,
 Settings,
 Key,
 ChevronDown,
 Bell,
 Search,
} from 'lucide-react';
import NotificationDropdown from '@/components/NotificationDropdown';

interface DashboardLayoutProps {
 children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [userMenuOpen, setUserMenuOpen] = useState(false);
 const pathname = usePathname();
 const { user, logout } = useAuth();
 const userMenuRef = useRef<HTMLDivElement>(null);
 const { sseConnected, sseError } = useRealtime();

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
  <div className='h-screen flex bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50'>
   {/* Mobile sidebar overlay */}
   {sidebarOpen && (
    <div
     className='fixed inset-0 z-40 bg-neutral-600 bg-opacity-75 lg:hidden backdrop-blur-sm'
     onClick={() => setSidebarOpen(false)}
    />
   )}

   {/* Sidebar - Fixed */}
   <aside
    className={cn(
     'fixed inset-y-0 left-0 z-50 w-64 card-primary border-r border-neutral-200/50 shadow-2xl transform lg:relative lg:translate-x-0',
     sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    )}
   >
    <div className='flex flex-col h-full'>
     {/* Logo */}
     <div className='flex items-center justify-between h-16 px-6 border-b border-neutral-200/50'>
      <div className='flex items-center space-x-3'>
       <div className='w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center shadow-lg'>
        <span className='text-white text-lg font-bold'>⚡</span>
       </div>
       <div>
        <h1 className='text-xl font-bold text-neutral-900'>Chronos</h1>
        <p className='text-xs text-neutral-500 font-medium'>Synapse</p>
       </div>
      </div>
      <button
       className='lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors'
       onClick={() => setSidebarOpen(false)}
      >
       <span className='text-neutral-400 text-xl'>&times;</span>
      </button>
     </div>

     {/* Navigation */}
     <nav className='flex-1 px-4 py-6 space-y-2'>
      {NAVIGATION.map((item) => {
       // Skip admin-only items for non-admin users
       if (item.adminOnly && user?.role !== 'ADMIN') {
        return null;
       }

       const isActive =
        pathname === item.href || pathname.startsWith(item.href);

       return (
        <Link
         key={item.name}
         href={item.href}
         className={cn(
          'flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
          isActive
           ? 'bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700 border border-primary-200/50 shadow-lg'
           : 'text-neutral-700 hover:bg-neutral-100/80 hover:shadow-md'
         )}
         onClick={() => setSidebarOpen(false)}
        >
         <span className='text-lg'>{item.icon}</span>
         <span>{item.name}</span>
        </Link>
       );
      })}
     </nav>

     {/* System Status */}
     <div className='p-4 border-t border-neutral-200/50'>
      <div className='flex items-center space-x-3 p-3 rounded-xl bg-neutral-50'>
       <div
        className={`w-3 h-3 rounded-full shadow-lg ${
         sseConnected ? 'bg-accent-green-500 animate-pulse' : 'bg-red-500'
        }`}
       ></div>
       <span className='text-sm font-medium text-neutral-700'>
        {sseConnected ? 'System Online' : 'System Disconnected'}
       </span>
      </div>
     </div>
    </div>
   </aside>

   {/* Main Content Area */}
   <div className='flex-1 flex flex-col overflow-hidden'>
    {/* Top Header Bar */}
    <header className='h-16 card-primary border-b border-neutral-200/50 flex items-center justify-between px-6 shadow-lg'>
     {/* Mobile menu button */}
     <button
      className='lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors'
      onClick={() => setSidebarOpen(true)}
     >
      <span className='text-neutral-600 text-xl'>☰</span>
     </button>

     {/* Search Bar */}
     <div className='hidden md:flex items-center flex-1 max-w-md mx-8'>
      <div className='relative w-full'>
       <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400' />
       <input
        type='text'
        placeholder='Search jobs, analytics...'
        className='input-primary w-full pl-10 pr-4 py-2.5 rounded-full'
       />
      </div>
     </div>

     {/* Header content */}
     <div className='flex items-center space-x-3'>
      {/* Notifications */}
      <NotificationDropdown />

      {/* User Menu */}
      <div className='relative' ref={userMenuRef}>
       <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className='flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-100 transition-colors'
       >
        <div className='w-9 h-9 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg'>
         <span className='text-white text-sm font-bold'>
          {user?.firstName?.[0]}
          {user?.lastName?.[0] || user?.username?.[0]}
         </span>
        </div>
        <div className='hidden md:block text-left'>
         <div className='text-sm font-semibold text-neutral-900'>
          {user?.firstName} {user?.lastName}
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
           {user?.firstName} {user?.lastName}
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
  </div>
 );
}
