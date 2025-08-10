import { FastifyRequest, FastifyReply } from 'fastify';
import { notificationService } from '../../../services/NotificationService';
import { AuthenticatedRequest } from '../../../middleware/auth';

export class NotificationsController {
 static async getNotifications(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
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
 }

 static async markAsRead(request: AuthenticatedRequest, reply: FastifyReply) {
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
 }

 static async markAllAsRead(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
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
 }

 static async deleteNotification(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
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
 }
}
