'use client';

import {
 createContext,
 useContext,
 ReactNode,
 useState,
 useEffect,
} from 'react';
import { apiClient } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationContextType {
 unreadCount: number;
 setUnreadCount: (count: number) => void;
 refreshNotifications: () => Promise<void>;
 markAsRead: (notificationId: string) => Promise<void>;
 markAllAsRead: () => Promise<void>;
 deleteNotification: (notificationId: string) => Promise<void>;
 sseConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
 undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
 const [unreadCount, setUnreadCount] = useState(0);
 const { showToast } = useToast();
 const { user, token } = useAuth();

 // WebSocket connection for real-time notifications
 const { connected: wsConnected } = useWebSocket({
  onNotification: (data) => {
   // Handle real-time notification updates
   if (data.type === 'notification_count') {
    setUnreadCount(data.count as number);
   } else if (data.type === 'new_notification') {
    // Increment unread count for new notifications
    setUnreadCount((prev) => prev + 1);

    // Show toast for new notifications
    if (data.message && data.level) {
     showToast(
      data.message as string,
      data.level as 'success' | 'error' | 'warning' | 'info'
     );
    }
   }
  },
  autoReconnect: true,
  reconnectInterval: 5000,
 });

 // Fetch initial notification count on mount - only when authenticated
 useEffect(() => {
  if (user && token) {
   refreshNotifications();
  }
 }, [user, token]);

 const refreshNotifications = async () => {
  try {
   const response = await apiClient.getNotifications(1, 0); // Just get count, not actual notifications
   setUnreadCount(response.unreadCount);
  } catch (error) {
   console.error('Failed to fetch notification count:', error);
   // Don't set count to 0 on error, keep previous value
  }
 };

 const markAsRead = async (notificationId: string) => {
  try {
   await apiClient.markNotificationAsRead(notificationId);
   setUnreadCount((prev) => Math.max(0, prev - 1));
  } catch (error) {
   console.error('Failed to mark notification as read:', error);
  }
 };

 const markAllAsRead = async () => {
  try {
   await apiClient.markAllNotificationsAsRead();
   setUnreadCount(0);
  } catch (error) {
   console.error('Failed to mark all notifications as read:', error);
  }
 };

 const deleteNotification = async (notificationId: string) => {
  try {
   await apiClient.deleteNotification(notificationId);
   // Note: We don't decrease count here because we don't know if it was read
   // The count will be refreshed when the dropdown is opened
  } catch (error) {
   console.error('Failed to delete notification:', error);
  }
 };

 const value: NotificationContextType = {
  unreadCount,
  setUnreadCount,
  refreshNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sseConnected: wsConnected,
 };

 return (
  <NotificationContext.Provider value={value}>
   {children}
  </NotificationContext.Provider>
 );
}

export function useNotifications() {
 const context = useContext(NotificationContext);
 if (context === undefined) {
  throw new Error(
   'useNotifications must be used within a NotificationProvider'
  );
 }
 return context;
}
