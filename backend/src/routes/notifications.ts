import { FastifyInstance } from 'fastify';
import { notificationService } from '../services/NotificationService';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

export default async function notificationRoutes(fastify: FastifyInstance) {
 // Get user notifications
 fastify.get('/notifications', {
  preHandler: requireAuth,
  handler: async (request: AuthenticatedRequest, reply) => {
   try {
    const user = request.user!;
    const { limit = '20', offset = '0' } = request.query as any;

    const result = await notificationService.getUserNotifications(
     user.id,
     parseInt(limit),
     parseInt(offset)
    );

    return reply.send({
     success: true,
     data: result,
    });
   } catch (error) {
    request.log.error('Failed to get notifications:', error);
    return reply.status(500).send({
     success: false,
     error: 'Failed to get notifications',
    });
   }
  },
 });

 // Mark notification as read
 fastify.put('/notifications/:id/read', {
  preHandler: requireAuth,
  handler: async (request: AuthenticatedRequest, reply) => {
   try {
    const user = request.user!;
    const { id } = request.params as any;

    await notificationService.markAsRead(id, user.id);

    return reply.send({
     success: true,
     message: 'Notification marked as read',
    });
   } catch (error) {
    request.log.error('Failed to mark notification as read:', error);
    return reply.status(500).send({
     success: false,
     error: 'Failed to mark notification as read',
    });
   }
  },
 });

 // Mark all notifications as read
 fastify.put('/notifications/read-all', {
  preHandler: requireAuth,
  handler: async (request: AuthenticatedRequest, reply) => {
   try {
    const user = request.user!;

    await notificationService.markAllAsRead(user.id);

    return reply.send({
     success: true,
     message: 'All notifications marked as read',
    });
   } catch (error) {
    request.log.error('Failed to mark all notifications as read:', error);
    return reply.status(500).send({
     success: false,
     error: 'Failed to mark all notifications as read',
    });
   }
  },
 });

 // Delete notification
 fastify.delete('/notifications/:id', {
  preHandler: requireAuth,
  handler: async (request: AuthenticatedRequest, reply) => {
   try {
    const user = request.user!;
    const { id } = request.params as any;

    await notificationService.deleteNotification(id, user.id);

    return reply.send({
     success: true,
     message: 'Notification deleted',
    });
   } catch (error) {
    request.log.error('Failed to delete notification:', error);
    return reply.status(500).send({
     success: false,
     error: 'Failed to delete notification',
    });
   }
  },
 });
}
