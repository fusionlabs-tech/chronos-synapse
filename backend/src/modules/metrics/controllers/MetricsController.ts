import { FastifyRequest, FastifyReply } from 'fastify';
import { redisService } from '../../../services/RedisService';
import { AuthenticatedRequest } from '../../../middleware/auth';

export class MetricsController {
 static async getMetrics(request: FastifyRequest, reply: FastifyReply) {
  try {
   const { fromTimestamp, toTimestamp } = request.query as any;

   const fromTimestampNum = fromTimestamp
    ? parseInt(fromTimestamp)
    : Date.now() - 24 * 60 * 60 * 1000;
   const toTimestampNum = toTimestamp ? parseInt(toTimestamp) : Date.now();

   // Simple aggregate using TimeSeries keys
   const total = await redisService.getMetricRange(
    'ts:jobs:executions',
    fromTimestampNum,
    toTimestampNum
   );
   const success = await redisService.getMetricRange(
    'ts:jobs:success',
    fromTimestampNum,
    toTimestampNum
   );
   const failed = await redisService.getMetricRange(
    'ts:jobs:failed',
    fromTimestampNum,
    toTimestampNum
   );

   const totalExecutions = total.reduce((acc, [, v]) => acc + v, 0);
   const successfulExecutions = success.reduce((acc, [, v]) => acc + v, 0);
   const failedExecutions = failed.reduce((acc, [, v]) => acc + v, 0);
   const successRate =
    totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

   return reply.send({
    success: true,
    data: {
     metrics: {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate,
     },
    },
   });
  } catch (error) {
   request.log.error('Failed to get metrics:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get metrics' });
  }
 }

 static async getTimeseriesMetrics(
  request: FastifyRequest,
  reply: FastifyReply
 ) {
  try {
   const { metric } = request.params as any;
   const { fromTimestamp, toTimestamp } = request.query as any;

   const fromTimestampNum = fromTimestamp
    ? parseInt(fromTimestamp)
    : Date.now() - 24 * 60 * 60 * 1000;
   const toTimestampNum = toTimestamp ? parseInt(toTimestamp) : Date.now();

   const data = await redisService.getMetricRange(
    `ts:jobs:${metric}`,
    fromTimestampNum,
    toTimestampNum
   );

   return reply.send({ success: true, data });
  } catch (error) {
   request.log.error(
    `Failed to fetch timeseries for ${(request.params as any).metric}:`,
    error
   );
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to fetch metrics' });
  }
 }

 static async getPerformance(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  try {
   const { days = '30' } = request.query as any;
   const daysNum = parseInt(days);
   const windowMs = daysNum * 24 * 60 * 60 * 1000;
   const fromTimestampNum = Date.now() - windowMs;
   const toTimestampNum = Date.now();

   const total = await redisService.getMetricRange(
    'ts:jobs:executions',
    fromTimestampNum,
    toTimestampNum
   );
   const success = await redisService.getMetricRange(
    'ts:jobs:success',
    fromTimestampNum,
    toTimestampNum
   );
   const failed = await redisService.getMetricRange(
    'ts:jobs:failed',
    fromTimestampNum,
    toTimestampNum
   );
   const duration = await redisService.getMetricRange(
    'ts:jobs:duration_ms',
    fromTimestampNum,
    toTimestampNum
   );

   const totalExecutions = total.reduce((acc, [, v]) => acc + v, 0);
   const successfulExecutions = success.reduce((acc, [, v]) => acc + v, 0);
   const failedExecutions = failed.reduce((acc, [, v]) => acc + v, 0);
   const avgDuration =
    duration.length > 0
     ? Math.round(duration.reduce((acc, [, v]) => acc + v, 0) / duration.length)
     : 0;
   const successRate =
    totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

   const performanceMetrics = {
    timestamp: Date.now(),
    successRate: Math.round(successRate * 100) / 100,
    averageExecutionTime: avgDuration,
    totalExecutions,
    failedExecutions,
    activeJobs: 0,
    trend:
     successRate >= 90
      ? 'improving'
      : successRate >= 70
        ? 'stable'
        : 'declining',
   };

   return reply.send({ success: true, data: performanceMetrics });
  } catch (error) {
   request.log.error('Failed to get performance metrics:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get performance metrics' });
  }
 }

 static async getDashboard(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { days = '30' } = request.query as any;
   const daysNum = parseInt(days);
   const windowMs = daysNum * 24 * 60 * 60 * 1000;
   const fromTimestampNum = Date.now() - windowMs;
   const toTimestampNum = Date.now();

   // Determine user scope (normalize UUID without hyphens)
   const userId = (request.user?.id || '').replace(/-/g, '');

   // Resolve jobIds for this user to scope metrics
   const userJobs = await redisService.searchJobs('*', { userId });
   const jobIds = userJobs.map((j: any) =>
    String(j.id).replace(/^job:/, '').replace(/-/g, '')
   );

   // Aggregate time series scoped to user's jobs if we can from executions index
   // Fallback to global series if no jobs found
   let totalExecutions = 0;
   let successfulExecutions = 0;
   let failedExecutions = 0;
   let avgDuration = 0;

   if (jobIds.length > 0) {
    // Query executions index for these jobs using TAG OR syntax
    // Build OR list inside a single TAG braces: @jobId:{id1|id2|id3}
    const tagSet = jobIds.join('|');
    const query = `@jobId:{${tagSet}}`;
    const results = await (redisService as any).client.ft.search(
     'idx:executions',
     query,
     {
      LIMIT: { from: 0, size: 1000 },
      SORTBY: { BY: 'startedAt', DIRECTION: 'DESC' },
     }
    );
    if (results && typeof results === 'object' && 'documents' in results) {
     const docs = (results as any).documents as Array<{ value: any }>;
     const filtered = docs
      .map((d) => d.value)
      .filter((e) => {
       const ts = new Date(e.startedAt).getTime();
       return ts >= fromTimestampNum && ts <= toTimestampNum;
      });
     totalExecutions = filtered.length;
     successfulExecutions = filtered.filter(
      (e) => e.status === 'success'
     ).length;
     failedExecutions = filtered.filter((e) => e.status === 'failed').length;
     const durations = filtered
      .map((e) => Number(e.duration || 0))
      .filter((n) => !isNaN(n) && n > 0);
     avgDuration =
      durations.length > 0
       ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
       : 0;
    }
   } else {
    // No user jobs: return zeros (do not show global totals)
    totalExecutions = 0;
    successfulExecutions = 0;
    failedExecutions = 0;
    avgDuration = 0;
   }

   const successRate =
    totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

   // Derive total/active jobs for this user
   const totalJobs = await redisService.getJobsCount('*', { userId });
   const activeJobs = await redisService.getJobsCount('*', {
    userId,
    enabled: true,
   });

   const dashboardStats = {
    totalJobs,
    activeJobs,
    recentExecutions: totalExecutions,
    completedJobs: successfulExecutions,
    failedJobs: failedExecutions,
    averageExecutionTime: avgDuration,
    successRate: Math.round(successRate * 100) / 100,
   };

   return reply.send({ success: true, data: dashboardStats });
  } catch (error) {
   request.log.error('Failed to get dashboard stats:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get dashboard stats' });
  }
 }

 static async getUserTimeseries(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  try {
   const { days = '30' } = request.query as any;
   const daysNum = parseInt(days);
   const windowMs = daysNum * 24 * 60 * 60 * 1000;
   const toTs = Date.now();
   const fromTs = toTs - windowMs;

   const userId = (request.user?.id || '').replace(/-/g, '');
   const jobs = await redisService.searchJobs('*', { userId });
   const jobIds = jobs.map((j: any) =>
    String(j.id).replace(/^job:/, '').replace(/-/g, '')
   );

   if (jobIds.length === 0) {
    return reply.send({
     success: true,
     data: { executions: [], success: [], failed: [] },
    });
   }

   const tagSet = jobIds.join('|');
   const query = `@jobId:{${tagSet}}`;
   const results = await (redisService as any).client.ft.search(
    'idx:executions',
    query,
    {
     LIMIT: { from: 0, size: 2000 },
     SORTBY: { BY: 'startedAt', DIRECTION: 'DESC' },
    }
   );

   const docs: any[] =
    results && typeof results === 'object' && 'documents' in results
     ? (results as any).documents.map((d: any) => d.value)
     : [];

   // Aggregate per day
   const dayKey = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
   const execMap = new Map<number, number>();
   const succMap = new Map<number, number>();
   const failMap = new Map<number, number>();

   for (const e of docs) {
    const ts = new Date(e.startedAt).getTime();
    if (isNaN(ts) || ts < fromTs || ts > toTs) continue;
    const key = dayKey(new Date(ts));
    execMap.set(key, (execMap.get(key) || 0) + 1);
    if (e.status === 'success') succMap.set(key, (succMap.get(key) || 0) + 1);
    if (e.status === 'failed') failMap.set(key, (failMap.get(key) || 0) + 1);
   }

   // Emit arrays sorted by day
   const keys = Array.from(
    new Set<number>([...execMap.keys(), ...succMap.keys(), ...failMap.keys()])
   ).sort((a, b) => a - b);
   const executions: Array<[number, number]> = keys.map((k) => [
    k,
    execMap.get(k) || 0,
   ]);
   const success: Array<[number, number]> = keys.map((k) => [
    k,
    succMap.get(k) || 0,
   ]);
   const failed: Array<[number, number]> = keys.map((k) => [
    k,
    failMap.get(k) || 0,
   ]);

   return reply.send({ success: true, data: { executions, success, failed } });
  } catch (error) {
   request.log.error('Failed to get user timeseries:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get user timeseries' });
  }
 }

 static async getRecentExecutionsUser(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  try {
   const { limit = '10', days = '1' } = request.query as any;
   const max = Math.min(100, parseInt(limit));
   const windowMs = parseInt(days) * 24 * 60 * 60 * 1000;
   const now = Date.now();
   const fromTs = now - windowMs;

   const userId = (request.user?.id || '').replace(/-/g, '');
   const jobs = await redisService.searchJobs('*', { userId });
   const jobIds = jobs.map((j: any) =>
    String(j.id).replace(/^job:/, '').replace(/-/g, '')
   );
   if (jobIds.length === 0) return reply.send({ success: true, data: [] });

   const tagSet = jobIds.join('|');
   const query = `@jobId:{${tagSet}}`;
   const results = await (redisService as any).client.ft.search(
    'idx:executions',
    query,
    {
     LIMIT: { from: 0, size: max * 2 },
     SORTBY: { BY: 'startedAt', DIRECTION: 'DESC' },
    }
   );
   const docs: any[] =
    results && typeof results === 'object' && 'documents' in results
     ? (results as any).documents.map((d: any) => d.value)
     : [];
   const filtered = docs
    .filter((e) => {
     const ts = new Date(e.startedAt).getTime();
     return !isNaN(ts) && ts >= fromTs;
    })
    .slice(0, max);
   return reply.send({ success: true, data: filtered });
  } catch (error) {
   request.log.error('Failed to get recent executions:', error);
   return reply
    .status(500)
    .send({ success: false, error: 'Failed to get recent executions' });
  }
 }
}
