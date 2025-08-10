import { FastifyInstance } from 'fastify';
import { HealthController } from '../controllers/HealthController';

export default async function healthRoutes(fastify: FastifyInstance) {
 // Health check
 fastify.get('/', {
  handler: HealthController.getHealth,
 });

 // Redis health check
 fastify.get('/redis', {
  handler: HealthController.getRedisHealth,
 });
}
