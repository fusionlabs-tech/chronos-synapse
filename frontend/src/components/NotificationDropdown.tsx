'use client';

import { useState, useEffect, useRef } from 'react';
import {
 Bell,
 Check,
 Trash2,
 X,
 CheckCircle,
 XCircle,
 AlertTriangle,
 Clock,
 Settings,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { Notification } from '@/types';
import { useToast } from '@/components/ui/toast';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationDropdown() {
 const { unreadCount, markAsRead, markAllAsRead, deleteNotification } =
  useNotifications();
 const [isOpen, setIsOpen] = useState(false);
 const [notifications, setNotifications] = useState<Notification[]>([]);
 const [loading, setLoading] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);
 const { showToast } = useToast();

 useEffect(() => {
  if (isOpen) {
   fetchNotifications();
  }
 }, [isOpen]);

 useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
   if (
    dropdownRef.current &&
    !dropdownRef.current.contains(event.target as Node)
   ) {
    setIsOpen(false);
   }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 const fetchNotifications = async () => {
  try {
   setLoading(true);
   const response = await apiClient.getNotifications(10, 0);
   setNotifications(response.notifications);
  } catch (error) {
   console.error('Failed to fetch notifications:', error);
   showToast('Failed to load notifications', 'error');
  } finally {
   setLoading(false);
  }
 };

 const handleMarkAsRead = async (notificationId: string) => {
  try {
   await markAsRead(notificationId);
   setNotifications((prev) =>
    prev.map((notification) =>
     notification.id === notificationId
      ? { ...notification, isRead: true, readAt: new Date().toISOString() }
      : notification
    )
   );
  } catch (error) {
   console.error('Failed to mark notification as read:', error);
   showToast('Failed to mark notification as read', 'error');
  }
 };

 const handleMarkAllAsRead = async () => {
  try {
   await markAllAsRead();
   setNotifications((prev) =>
    prev.map((notification) => ({
     ...notification,
     isRead: true,
     readAt: new Date().toISOString(),
    }))
   );
   showToast('All notifications marked as read', 'success');
  } catch (error) {
   console.error('Failed to mark all notifications as read:', error);
   showToast('Failed to mark all notifications as read', 'error');
  }
 };

 const handleDeleteNotification = async (notificationId: string) => {
  try {
   await deleteNotification(notificationId);
   const notification = notifications.find((n) => n.id === notificationId);
   setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
   showToast('Notification deleted', 'success');
  } catch (error) {
   console.error('Failed to delete notification:', error);
   showToast('Failed to delete notification', 'error');
  }
 };

 const getNotificationIcon = (type: string) => {
  switch (type) {
   case 'job_success':
    return <CheckCircle className='h-4 w-4 text-green-600' />;
   case 'job_failed':
    return <XCircle className='h-4 w-4 text-red-600' />;
   case 'job_timeout':
    return <Clock className='h-4 w-4 text-yellow-600' />;
   case 'system_alert':
    return <AlertTriangle className='h-4 w-4 text-orange-600' />;
   case 'job_created':
   case 'job_updated':
   case 'job_deleted':
    return <Settings className='h-4 w-4 text-blue-600' />;
   default:
    return <Bell className='h-4 w-4 text-gray-600' />;
  }
 };

 const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
   (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
 };

 return (
  <div className='relative' ref={dropdownRef}>
   <button
    onClick={() => setIsOpen(!isOpen)}
    className='p-2 rounded-lg hover:bg-neutral-100 transition-colors relative'
   >
    <Bell className='h-5 w-5 text-neutral-600' />
    {unreadCount > 0 && (
     <span className='absolute -top-1 -right-1 h-4 w-4 bg-accent-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold shadow-lg'>
      {unreadCount > 99 ? '99+' : unreadCount}
     </span>
    )}
   </button>

   {isOpen && (
    <div className='absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-lg shadow-xl py-2 z-50'>
     {/* Header */}
     <div className='px-4 py-3 border-b border-neutral-100 flex items-center justify-between'>
      <h3 className='text-sm font-semibold text-neutral-900'>Notifications</h3>
      <div className='flex items-center gap-2'>
       {unreadCount > 0 && (
        <button
         onClick={handleMarkAllAsRead}
         className='text-xs text-blue-600 hover:text-blue-800 font-medium'
        >
         Mark all read
        </button>
       )}
       <button
        onClick={() => setIsOpen(false)}
        className='text-neutral-400 hover:text-neutral-600'
       >
        <X className='h-4 w-4' />
       </button>
      </div>
     </div>

     {/* Notifications List */}
     <div className='max-h-96 overflow-y-auto'>
      {loading ? (
       <div className='px-4 py-8 text-center'>
        <div className='loading-spinner h-6 w-6 mx-auto'></div>
        <p className='text-sm text-neutral-500 mt-2'>
         Loading notifications...
        </p>
       </div>
      ) : notifications.length === 0 ? (
       <div className='px-4 py-8 text-center'>
        <Bell className='h-8 w-8 text-neutral-400 mx-auto mb-2' />
        <p className='text-sm text-neutral-500'>No notifications</p>
       </div>
      ) : (
       <div className='space-y-1'>
        {notifications.map((notification) => (
         <div
          key={notification.id}
          className={`px-4 py-3 hover:bg-neutral-50 transition-colors ${
           !notification.isRead ? 'bg-blue-50' : ''
          }`}
         >
          <div className='flex items-start gap-3'>
           <div className='flex-shrink-0 mt-0.5'>
            {getNotificationIcon(notification.type)}
           </div>
           <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2'>
             <div className='flex-1'>
              <p
               className={`text-sm font-medium ${
                !notification.isRead ? 'text-neutral-900' : 'text-neutral-700'
               }`}
              >
               {notification.title}
              </p>
              <p className='text-xs text-neutral-600 mt-1 line-clamp-2'>
               {notification.message}
              </p>
              <p className='text-xs text-neutral-400 mt-1'>
               {formatTimeAgo(notification.createdAt)}
              </p>
             </div>
             <div className='flex items-center gap-1'>
              {!notification.isRead && (
               <button
                onClick={() => handleMarkAsRead(notification.id)}
                className='p-1 text-neutral-400 hover:text-green-600 transition-colors'
                title='Mark as read'
               >
                <Check className='h-3 w-3' />
               </button>
              )}
              <button
               onClick={() => handleDeleteNotification(notification.id)}
               className='p-1 text-neutral-400 hover:text-red-600 transition-colors'
               title='Delete notification'
              >
               <Trash2 className='h-3 w-3' />
              </button>
             </div>
            </div>
           </div>
          </div>
         </div>
        ))}
       </div>
      )}
     </div>

     {/* Footer */}
     {notifications.length > 0 && (
      <div className='px-4 py-2 border-t border-neutral-100'>
       <button
        onClick={() => {
         /* TODO: Navigate to notifications page */
        }}
        className='text-xs text-blue-600 hover:text-blue-800 font-medium w-full text-center'
       >
        View all notifications
       </button>
      </div>
     )}
    </div>
   )}
  </div>
 );
}
