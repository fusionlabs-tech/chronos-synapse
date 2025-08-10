import { FastifyInstance } from 'fastify';
import aiRoutes from './routes/aiRoutes';

export default async function aiModule(fastify: FastifyInstance) {
 fastify.register(aiRoutes, { prefix: '/api/ai' });
}
