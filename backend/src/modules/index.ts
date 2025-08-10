import { FastifyInstance } from 'fastify';
import authModule from './auth';
import jobsModule from './jobs';
import aiModule from './ai';
import notificationsModule from './notifications';
import metricsModule from './metrics';
import healthModule from './health';
import ingestModule from './ingest';
import usersModule from './users';

export default async function registerModules(fastify: FastifyInstance) {
 // Register all modules
 await fastify.register(authModule);
 await fastify.register(jobsModule);
 await fastify.register(aiModule);
 await fastify.register(notificationsModule);
 await fastify.register(metricsModule);
 await fastify.register(healthModule);
 await fastify.register(ingestModule);
 await fastify.register(usersModule);
}
