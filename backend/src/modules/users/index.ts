import { FastifyInstance } from 'fastify';
import userRoutes from './routes/userRoutes';

export default async function usersModule(fastify: FastifyInstance) {
 await fastify.register(userRoutes, { prefix: '/api/users' });
}
