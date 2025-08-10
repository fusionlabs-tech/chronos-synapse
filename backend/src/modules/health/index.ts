import { FastifyInstance } from 'fastify';
import healthRoutes from './routes/healthRoutes';

export default async function healthModule(fastify: FastifyInstance) {
 fastify.register(healthRoutes, { prefix: '/health' });
 fastify.register(healthRoutes, { prefix: '/api/health' });
}
