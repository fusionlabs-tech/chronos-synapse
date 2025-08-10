import { FastifyInstance } from 'fastify';
import { JobsController } from '../controllers/JobsController';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { requireJobOwnership } from '../../../middleware/jobAuth';

export default async function jobsRoutes(fastify: FastifyInstance) {
 // Get all jobs
 fastify.get(
  '/',
  {
   preHandler: requireAuth,
  },
  JobsController.getJobs
 );

 // Get job by ID
 fastify.get(
  '/:id',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  JobsController.getJob
 );

   // Create job (removed in SDK architecture)
  fastify.post('/', { preHandler: requireAuth }, async (_req, reply) => {
   return reply.status(410).send({
    success: false,
    error: 'This endpoint has been removed. Use the SDK to define jobs in your app.',
   });
  });

  // Update job (removed)
  fastify.put('/:id', { preHandler: [requireAuth, requireJobOwnership] }, async (_req, reply) => {
   return reply.status(410).send({
    success: false,
    error: 'This endpoint has been removed. Jobs are defined in application code via the SDK.',
   });
  });

  // Delete job (removed)
  fastify.delete('/:id', { preHandler: [requireAuth, requireJobOwnership] }, async (_req, reply) => {
   return reply.status(410).send({
    success: false,
    error: 'This endpoint has been removed. Manage jobs via application code.',
   });
  });

  // Execute job (removed)
  fastify.post('/:id/execute', { preHandler: [requireAuth, requireJobOwnership] }, async (_req, reply) => {
   return reply.status(410).send({
    success: false,
    error: 'This endpoint has been removed. Executions occur within your application via the SDK.',
   });
  });

 // Get job executions
 fastify.get(
  '/:id/executions',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  JobsController.getJobExecutions
 );

 // Get specific job execution
 fastify.get(
  '/:id/executions/:executionId',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  JobsController.getJobExecution
 );

 // Get job status
 fastify.get(
  '/:id/status',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  JobsController.getJobStatus
 );

 // Get job performance metrics
 fastify.get(
  '/:id/performance',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  JobsController.getJobPerformance
 );
}
