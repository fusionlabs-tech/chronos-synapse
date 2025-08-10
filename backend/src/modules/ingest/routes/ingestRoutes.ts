import { FastifyInstance } from 'fastify';
import { redisService } from '../../../services/RedisService';
import { requireApiKey, ApiKeyRequest } from '../../../middleware/auth';

export default async function ingestRoutes(fastify: FastifyInstance) {
 // Register jobs (idempotent upsert of signatures)
 fastify.post(
  '/jobs/register',
  { preHandler: requireApiKey },
  async (request, reply) => {
   try {
    const body = request.body as any;
    const jobs = Array.isArray(body?.jobs) ? body.jobs : [];
    const apiUserId = (request as ApiKeyRequest).apiUser!.id;
    const apiUsername =
     (request as ApiKeyRequest).apiUser &&
     ((request as ApiKeyRequest).apiUser as any).username;
    const normUserId = apiUserId.replace(/-/g, '');
    const suffix = normUserId.slice(-6);
    const base = String(apiUsername || 'user')
     .toLowerCase()
     .replace(/[^a-z0-9]+/g, '-')
     .replace(/^-+|-+$/g, '');
    const derivedOrgId = `${base}-org-${suffix}`;
    const derivedAppId = `${base}-app-${suffix}`;
    for (const job of jobs) {
     const existing = await redisService.getJob(job.id);
     if (existing) {
      const updates: any = {};
      let scheduleChanged = false;
      let runModeChanged = false;
      if (job.name !== undefined) updates.name = job.name;
      if (job.description !== undefined) updates.description = job.description;
      if (job.schedule !== undefined) {
       updates.schedule = job.schedule;
       scheduleChanged = true;
      }
      if (job.runMode !== undefined) {
       updates.runMode = job.runMode;
       runModeChanged = true;
      }
      if (job.runAt !== undefined) {
       const v = job.runAt;
       updates.runAt =
        typeof v === 'number' ? new Date(v).toISOString() : String(v);
      }
      if (job.version !== undefined) updates.version = job.version;
      if (job.signatureHash !== undefined)
       updates.signatureHash = job.signatureHash;
      if (job.appId !== undefined) updates.appId = job.appId;
      if (job.orgId !== undefined) updates.orgId = job.orgId;
      // Always ensure userId stays aligned with API key owner
      updates.userId = apiUserId.replace(/-/g, '');
      // Auto-fill org/app id if missing on existing record
      if (!existing || !(existing as any).orgId)
       updates.orgId = updates.orgId || derivedOrgId;
      if (!existing || !(existing as any).appId)
       updates.appId = updates.appId || derivedAppId;
      updates.updatedAt = new Date().toISOString();
      await redisService.updateJob(job.id, updates);
      // If runMode or schedule changed, clear one-time trigger marker so it can fire once again under new config
      if (scheduleChanged || runModeChanged) {
       try {
        const jobKey = String(job.id).replace(/^job:/, '');
        const onceKey = `trigger:once:${jobKey}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (redisService as any).redis.del(onceKey);
       } catch {}
      }
     } else {
      await redisService.createJob({
       id: job.id,
       name: job.name ?? job.id,
       description: job.description ?? '',
       schedule: job.schedule ?? '',
       enabled: true,
       userId: apiUserId.replace(/-/g, ''),
       tags: Array.isArray(job.tags) ? job.tags : [],
       createdAt: new Date().toISOString(),
       updatedAt: new Date().toISOString(),
       runMode: job.runMode ?? (job.schedule ? 'recurring' : 'once'),
       ...(job.runAt
        ? {
           runAt:
            typeof job.runAt === 'number'
             ? new Date(job.runAt).toISOString()
             : String(job.runAt),
          }
        : {}),
       ...(job.version ? { version: job.version } : {}),
       ...(job.signatureHash ? { signatureHash: job.signatureHash } : {}),
       appId: job.appId || derivedAppId,
       orgId: job.orgId || derivedOrgId,
      } as any);
     }
    }
    // Notify frontend to refresh jobs list
    try {
     await redisService.publishNotification('jobs_update', {
      reason: 'register',
     });
    } catch {}
    return reply.send({ success: true });
   } catch (error: any) {
    request.log.error('Ingest job register failed:', error);
    return reply
     .status(400)
     .send({ success: false, error: String(error?.message || 'Bad request') });
   }
  }
 );

 // Batch ingestion of execution events
 fastify.post(
  '/executions/batch',
  { preHandler: requireApiKey },
  async (request, reply) => {
   try {
    const body = request.body as any;
    const executions = Array.isArray(body?.executions) ? body.executions : [];
    for (const e of executions) {
     const doc = {
      id: e.execId,
      jobId: String(e.jobId || '').replace(/-/g, ''),
      status: e.status,
      startedAt: e.startedAt,
      finishedAt: e.finishedAt,
      duration: e.durationMs,
      exitCode: e.exitCode,
      error: e.errorMessage,
      isCompleted: e.status === 'success' || e.status === 'failed',
      // richer telemetry (optional)
      errorType: e.errorType,
      errorStack: e.errorStack,
      stdout: e.stdout,
      stderr: e.stderr,
      attempt: e.attempt,
      labels: Array.isArray(e.labels) ? e.labels : undefined,
      metadata: typeof e.metadata === 'object' ? e.metadata : undefined,
      jobVersion: e.jobVersion,
      appVersion: e.appVersion,
      codeSnippet:
       typeof e.codeSnippet === 'string' ? e.codeSnippet : undefined,
      codeLanguage:
       typeof e.codeLanguage === 'string' ? e.codeLanguage : undefined,
     } as any;
     await redisService.createExecution(doc);
     await redisService.recordMetric('ts:jobs:executions', 1);
     if (e.status === 'success')
      await redisService.recordMetric('ts:jobs:success', 1);
     if (e.status === 'failed')
      await redisService.recordMetric('ts:jobs:failed', 1);
     if (typeof e.durationMs === 'number')
      await redisService.recordMetric('ts:jobs:duration_ms', e.durationMs);
     // Publish realtime event (lightweight)
     await redisService.publishJobExecution('ingested', {
      jobId: e.jobId,
      execId: e.execId,
      status: e.status,
      startedAt: e.startedAt,
      finishedAt: e.finishedAt,
      durationMs: e.durationMs,
      exitCode: e.exitCode,
     });
    }
    return reply.send({ success: true, ingested: executions.length });
   } catch (error) {
    request.log.error('Ingest executions failed:', error);
    return reply.status(400).send({ success: false, error: 'Bad request' });
   }
  }
 );
}
