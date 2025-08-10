import { FastifyRequest, FastifyReply } from 'fastify';

import { redisService } from '../../../services/RedisService';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { requireJobOwnership } from '../../../middleware/jobAuth';
import {
 CreateJobDto,
 UpdateJobDto,
 JobQueryDto,
 JobExecutionQueryDto,
 ExecuteJobDto,
} from '../dtos';

export class JobsController {
 static async getJobs(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const {
    search,
    enabled,
    teamId,
    page = '1',
    limit = '20',
    view = 'list',
   } = request.query as JobQueryDto;

   const filters: Record<string, any> = {};
   if (enabled !== undefined) filters.enabled = enabled;
   if (teamId) filters.teamId = teamId;

   const pageNum = parseInt(page);
   const limitNum = parseInt(limit);
   const offset = (pageNum - 1) * limitNum;

   const jobs = await redisService.searchJobs(
    search || '*',
    filters,
    limitNum,
    offset
   );
   const totalJobs = await redisService.getJobsCount(search || '*', filters);

   return reply.send({
    success: true,
    data: {
     jobs,
     pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalJobs,
      totalPages: Math.ceil(totalJobs / limitNum),
      hasNext: pageNum < Math.ceil(totalJobs / limitNum),
      hasPrev: pageNum > 1,
     },
     view,
    },
   });
  } catch (error) {
   request.log.error('Failed to get jobs:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get jobs' });
  }
 }

 static async getJob(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { id } = request.params as { id: string };
   const normalizedId = decodeURIComponent(id);
   const job = await redisService.getJob(normalizedId);

   if (!job) {
    // Try fallback: if incoming id had "job:" prefix removed or present
    const altId = normalizedId.startsWith('job:')
     ? normalizedId.replace(/^job:/, '')
     : `job:${normalizedId}`;
    const altJob = await redisService.getJob(altId);
    if (!altJob) {
     return reply.status(404).send({ success: false, error: 'Job not found' });
    }
    return reply.send({ success: true, data: altJob });
   }

   return reply.send({ success: true, data: job });
  } catch (error) {
   request.log.error('Failed to get job:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get job' });
  }
 }

 static async createJob(_request: AuthenticatedRequest, reply: FastifyReply) {
  return reply.status(410).send({
   success: false,
   error:
    'This endpoint has been removed. Use the SDK to define jobs in your app.',
  });
 }

 static async updateJob(_request: AuthenticatedRequest, reply: FastifyReply) {
  return reply.status(410).send({
   success: false,
   error:
    'This endpoint has been removed. Jobs are defined in application code via the SDK.',
  });
 }

 static async deleteJob(_request: AuthenticatedRequest, reply: FastifyReply) {
  return reply.status(410).send({
   success: false,
   error: 'This endpoint has been removed. Manage jobs via application code.',
  });
 }

 static async executeJob(_request: AuthenticatedRequest, reply: FastifyReply) {
  return reply.status(410).send({
   success: false,
   error:
    'This endpoint has been removed. Executions occur within your application via the SDK.',
  });
 }

 static async getJobExecutions(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  try {
   const { id } = request.params as { id: string };
   const { limit = '10' } = request.query as JobExecutionQueryDto;

   const executions = await redisService.getJobExecutions(id, parseInt(limit));

   return reply.send({ success: true, data: executions });
  } catch (error) {
   request.log.error('Failed to get job executions:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get job executions' });
  }
 }

 static async getJobExecution(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  try {
   const { id, executionId } = request.params as {
    id: string;
    executionId: string;
   };

   const execution = await redisService.getExecutionById(executionId);

   if (!execution) {
    return reply
     .status(404)
     .send({ success: false, error: 'Execution not found' });
   }

   return reply.send({ success: true, data: execution });
  } catch (error) {
   request.log.error('Failed to get job execution:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get job execution' });
  }
 }

 static async getJobStatus(
  _request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  return reply.status(410).send({
   success: false,
   error: 'Job status is managed within your application.',
  });
 }

 static async getJobPerformance(
  _request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  return reply.status(410).send({
   success: false,
   error: 'Job performance metrics are reported by the SDK.',
  });
 }
}
