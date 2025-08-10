import { FastifyRequest, FastifyReply } from 'fastify';
import { redisService } from '../../../services/RedisService';

export class HealthController {
 static async getHealth(request: FastifyRequest, reply: FastifyReply) {
  try {
   // Check Redis connection
   const redisHealthy = await redisService.ping();

   return reply.send({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
     redis: redisHealthy ? 'connected' : 'disconnected',
     scheduler: 'removed',
    },
    stats: {
     scheduledJobs: 0,
     runningExecutions: 0,
    },
   });
  } catch (error) {
   request.log.error('Health check failed:', error);
   return reply.status(503).send({
    status: 'unhealthy',
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? error.message : 'Unknown error',
   });
  }
 }

 static async getRedisHealth(request: FastifyRequest, reply: FastifyReply) {
  try {
   const debugInfo = await redisService.getDebugInfo();

   return reply.send({
    success: true,
    data: debugInfo,
   });
  } catch (error) {
   request.log.error('Redis health check failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to get Redis health info',
   });
  }
 }
}
