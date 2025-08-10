import { FastifyInstance } from 'fastify';
import { NotificationsController } from '../controllers/NotificationsController';
import { requireAuth } from '../../../middleware/auth';

export default async function notificationsRoutes(fastify: FastifyInstance) {
 // Get user notifications
 fastify.get(
  '/',
  {
   preHandler: requireAuth,
  },
  NotificationsController.getNotifications
 );

 // Mark notification as read
 fastify.put(
  '/:id/read',
  {
   preHandler: requireAuth,
  },
  NotificationsController.markAsRead
 );

 // Mark all notifications as read
 fastify.put(
  '/read-all',
  {
   preHandler: requireAuth,
  },
  NotificationsController.markAllAsRead
 );

 // Delete notification
 fastify.delete(
  '/:id',
  {
   preHandler: requireAuth,
  },
  NotificationsController.deleteNotification
 );
}
