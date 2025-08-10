import { FastifyInstance } from 'fastify';
import metricsRoutes from './routes/metricsRoutes';

export default async function metricsModule(fastify: FastifyInstance) {
 // Register metrics routes
 fastify.register(metricsRoutes, { prefix: '/api/metrics' });

 // Register analytics routes (aliases for frontend compatibility)
 fastify.register(metricsRoutes, { prefix: '/api/analytics' });
}
