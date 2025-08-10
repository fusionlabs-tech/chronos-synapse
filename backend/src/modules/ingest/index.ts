import { FastifyInstance } from 'fastify';
import ingestRoutes from './routes/ingestRoutes';

export default async function ingestModule(fastify: FastifyInstance) {
 fastify.register(ingestRoutes, { prefix: '/api/ingest' });
}
