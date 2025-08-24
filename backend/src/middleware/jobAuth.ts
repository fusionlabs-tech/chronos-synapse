import { FastifyReply } from 'fastify';
import { redisService } from '../services/RedisService';
import { AuthenticatedRequest } from './auth';
import { JobData } from '../services/RedisService';

export interface AuthenticatedJobRequest extends AuthenticatedRequest {
 job: JobData;
}

export async function requireJobOwnership(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 const { id, jobId } = request.params as { id?: string; jobId?: string };
 const actualJobId = id || jobId;

 if (!actualJobId) {
  return reply.status(400).send({
   error: 'Bad Request',
   message: 'Job ID is required',
  });
 }

 try {
  const job = await redisService.getJob(actualJobId);

  if (!job) {
   return reply.status(404).send({
    error: 'Not Found',
    message: 'Job not found',
   });
  }

  // Normalize user IDs for comparison (remove hyphens for consistency)
  const jobUserId = job.userId.replace(/-/g, '');
  const requestUserId = request.user!.id.replace(/-/g, '');

  if (jobUserId !== requestUserId) {
   return reply.status(403).send({
    error: 'Forbidden',
    message: 'Access denied',
   });
  }

  // Attach the job to the request for use in route handlers
  (request as AuthenticatedJobRequest).job = job;
 } catch (error) {
  return reply.status(500).send({
   error: 'Internal Server Error',
   message: 'Failed to verify job ownership',
  });
 }
}
