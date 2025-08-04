import { FastifyReply } from 'fastify';
import { jobScheduler } from '../services/JobScheduler';
import { AuthenticatedRequest } from './auth';
import { JobData } from '../services/RedisService';

export interface AuthenticatedJobRequest extends AuthenticatedRequest {
 job: JobData;
}

export async function requireJobOwnership(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 const { id } = request.params as { id: string };

 try {
  const job = await jobScheduler.getJob(id);

  if (!job) {
   return reply.status(404).send({
    error: 'Not Found',
    message: 'Job not found',
   });
  }

  if (job.userId !== request.user!.id.replace(/-/g, '')) {
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
