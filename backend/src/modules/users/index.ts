import { FastifyInstance } from 'fastify';
import userRoutes from './routes/userRoutes';
import aiKeyRoutes from './routes/aiKeyRoutes';

export default async function usersModule(fastify: FastifyInstance) {
 fastify.register(async (f) => {
  f.register(userRoutes, { prefix: '/api/users' });
  f.register(aiKeyRoutes, { prefix: '/api/users' });
 });
}
