import { FastifyInstance } from 'fastify';
import jobsRoutes from './routes/jobsRoutes';

export default async function jobsModule(fastify: FastifyInstance) {
 fastify.register(jobsRoutes, { prefix: '/api/jobs' });
}
