import { FastifyInstance } from 'fastify';
import authRoutes from './routes/authRoutes';

export default async function authModule(fastify: FastifyInstance) {
 fastify.register(authRoutes, { prefix: '/api/auth' });
}
