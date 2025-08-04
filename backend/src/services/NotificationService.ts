import { logger } from '../utils/logger';
import prisma from '../lib/prisma';
import { pubSubService } from './PubSubService';

export interface CreateNotificationData {
 userId: string;
 type:
  | 'job_success'
  | 'job_failed'
  | 'job_timeout'
  | 'system_alert'
  | 'job_created'
  | 'job_updated'
  | 'job_deleted';
 title: string;
 message: string;
 data?: Record<string, any>;
}

export class NotificationService {
 constructor() {
  logger.info('NotificationService initialized with shared Prisma client');
 }

 async createNotification(data: CreateNotificationData) {
  try {
   const notification = await prisma.notification.create({
    data: {
     userId: data.userId,
     type: data.type,
     title: data.title,
     message: data.message,
     data: data.data || {},
     isRead: false,
    },
   });

   logger.info(`Notification created: ${data.type} for user ${data.userId}`);

   // Broadcast real-time notification update
   // Broadcast notification via Pub/Sub
   await pubSubService.publish('notifications', {
    type: 'new_notification',
    data: {
     message: data.message,
     level:
      data.type.includes('failed') || data.type.includes('timeout')
       ? 'error'
       : 'success',
    },
    timestamp: new Date().toISOString(),
   });

   return notification;
  } catch (error) {
   logger.error('Failed to create notification:', error);
   throw error;
  }
 }

 async getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
 ) {
  try {
   logger.info(
    `Getting notifications for user: ${userId}, limit: ${limit}, offset: ${offset}`
   );
   logger.info(`Prisma client available: ${!!prisma}`);

   if (!prisma) {
    throw new Error('Prisma client is not initialized');
   }

   const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
     where: { userId },
     orderBy: { createdAt: 'desc' },
     take: limit,
     skip: offset,
    }),
    prisma.notification.count({
     where: { userId },
    }),
    prisma.notification.count({
     where: { userId, isRead: false },
    }),
   ]);

   return {
    notifications,
    unreadCount,
    pagination: {
     page: Math.floor(offset / limit) + 1,
     limit,
     total: totalCount,
     totalPages: Math.ceil(totalCount / limit),
     hasNext: offset + limit < totalCount,
     hasPrev: offset > 0,
    },
   };
  } catch (error) {
   logger.error('Failed to get user notifications:', error);
   throw error;
  }
 }

 async markAsRead(notificationId: string, userId: string) {
  try {
   const notification = await prisma.notification.updateMany({
    where: {
     id: notificationId,
     userId: userId,
    },
    data: {
     isRead: true,
     readAt: new Date(),
    },
   });

   logger.info(`Notification marked as read: ${notificationId}`);

   // Get updated unread count and broadcast
   const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
   });

   // Broadcast notification count via Pub/Sub
   await pubSubService.publish('notifications', {
    type: 'notification_count',
    data: {
     count: unreadCount,
    },
    timestamp: new Date().toISOString(),
   });

   return notification;
  } catch (error) {
   logger.error('Failed to mark notification as read:', error);
   throw error;
  }
 }

 async markAllAsRead(userId: string) {
  try {
   const result = await prisma.notification.updateMany({
    where: {
     userId: userId,
     isRead: false,
    },
    data: {
     isRead: true,
     readAt: new Date(),
    },
   });

   logger.info(`All notifications marked as read for user: ${userId}`);

   // Broadcast zero unread count
   // Broadcast notification count via Pub/Sub
   await pubSubService.publish('notifications', {
    type: 'notification_count',
    data: {
     count: 0,
    },
    timestamp: new Date().toISOString(),
   });

   return result;
  } catch (error) {
   logger.error('Failed to mark all notifications as read:', error);
   throw error;
  }
 }

 async deleteNotification(notificationId: string, userId: string) {
  try {
   const notification = await prisma.notification.deleteMany({
    where: {
     id: notificationId,
     userId: userId,
    },
   });

   logger.info(`Notification deleted: ${notificationId}`);
   return notification;
  } catch (error) {
   logger.error('Failed to delete notification:', error);
   throw error;
  }
 }

 // Helper methods for creating specific types of notifications
 async notifyJobSuccess(
  userId: string,
  jobName: string,
  executionId: string,
  duration: number
 ) {
  return this.createNotification({
   userId,
   type: 'job_success',
   title: 'Job Completed Successfully',
   message: `Job "${jobName}" completed successfully in ${duration}ms`,
   data: { jobName, executionId, duration },
  });
 }

 async notifyJobFailed(
  userId: string,
  jobName: string,
  executionId: string,
  error: string
 ) {
  return this.createNotification({
   userId,
   type: 'job_failed',
   title: 'Job Failed',
   message: `Job "${jobName}" failed: ${error}`,
   data: { jobName, executionId, error },
  });
 }

 async notifyJobTimeout(
  userId: string,
  jobName: string,
  executionId: string,
  timeout: number
 ) {
  return this.createNotification({
   userId,
   type: 'job_timeout',
   title: 'Job Timed Out',
   message: `Job "${jobName}" timed out after ${timeout}ms`,
   data: { jobName, executionId, timeout },
  });
 }

 async notifySystemAlert(userId: string, title: string, message: string) {
  return this.createNotification({
   userId,
   type: 'system_alert',
   title,
   message,
  });
 }

 async notifyJobCreated(userId: string, jobName: string) {
  return this.createNotification({
   userId,
   type: 'job_created',
   title: 'Job Created',
   message: `Job "${jobName}" has been created successfully`,
   data: { jobName },
  });
 }

 async notifyJobUpdated(userId: string, jobName: string) {
  return this.createNotification({
   userId,
   type: 'job_updated',
   title: 'Job Updated',
   message: `Job "${jobName}" has been updated`,
   data: { jobName },
  });
 }

 async notifyJobDeleted(userId: string, jobName: string) {
  return this.createNotification({
   userId,
   type: 'job_deleted',
   title: 'Job Deleted',
   message: `Job "${jobName}" has been deleted`,
   data: { jobName },
  });
 }
}

// Create and export notification service instance
export const notificationService = new NotificationService();
