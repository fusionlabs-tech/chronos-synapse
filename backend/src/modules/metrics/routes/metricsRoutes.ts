import { FastifyInstance } from 'fastify';
import { MetricsController } from '../controllers/MetricsController';
import { requireAuth } from '../../../middleware/auth';

export default async function metricsRoutes(fastify: FastifyInstance) {
 // Get metrics
 fastify.get(
  '/',
  {
   preHandler: requireAuth,
  },
  MetricsController.getMetrics
 );

 // Get timeseries metrics
 fastify.get(
  '/timeseries/:metric',
  {
   preHandler: requireAuth,
  },
  MetricsController.getTimeseriesMetrics
 );

 // Get per-user execution timeseries (by day)
 fastify.get(
  '/user-timeseries',
  {
   preHandler: requireAuth,
  },
  MetricsController.getUserTimeseries
 );

 // Get recent executions for the authenticated user
 fastify.get(
  '/recent',
  {
   preHandler: requireAuth,
  },
  MetricsController.getRecentExecutionsUser
 );

 // Get system performance metrics (analytics endpoint)
 fastify.get(
  '/performance',
  {
   preHandler: requireAuth,
  },
  MetricsController.getPerformance
 );

 // Get dashboard stats (analytics endpoint)
 fastify.get(
  '/dashboard',
  {
   preHandler: requireAuth,
  },
  MetricsController.getDashboard
 );
}
