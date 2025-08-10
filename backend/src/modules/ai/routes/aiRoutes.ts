import { FastifyInstance } from 'fastify';
import { AIController } from '../controllers/AIController';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { requireJobOwnership } from '../../../middleware/jobAuth';

export default async function aiRoutes(fastify: FastifyInstance) {
 // Analyze error
 fastify.post('/analyze-error', AIController.analyzeError);

 // Analyze job
 fastify.post(
  '/analyze-job/:id',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  AIController.analyzeJob
 );

 // Detect anomalies
 fastify.post(
  '/detect-anomalies/:jobId',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  AIController.detectAnomalies
 );

 // Suggest schedule
 fastify.get(
  '/suggest-schedule/:jobId',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  AIController.suggestSchedule
 );

 // Retry strategy
 fastify.post(
  '/retry-strategy/:jobId',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  AIController.retryStrategy
 );

 // Optimize performance
 fastify.get(
  '/optimize-performance/:jobId',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  AIController.optimizePerformance
 );

 // Get analysis
 fastify.get(
  '/analysis/:jobId',
  {
   preHandler: [requireAuth, requireJobOwnership],
  },
  AIController.getAnalysis
 );

 // Get all analyses
 fastify.get(
  '/analyses',
  {
   preHandler: requireAuth,
  },
  AIController.getAllAnalyses
 );
}
