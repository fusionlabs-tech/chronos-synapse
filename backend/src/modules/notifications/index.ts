import { FastifyInstance } from 'fastify';
import notificationsRoutes from './routes/notificationsRoutes';

export default async function notificationsModule(fastify: FastifyInstance) {
 fastify.register(notificationsRoutes, { prefix: '/api/notifications' });
}
