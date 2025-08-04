import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { redisService, JobData, JobExecution } from './RedisService';
import { pubSubService } from './PubSubService';
import { logger } from '../utils/logger';

interface ScheduledJob {
 jobData: JobData;
 cronTask: cron.ScheduledTask;
 currentExecution?: JobExecution;
}

export class JobScheduler {
 private scheduledJobs = new Map<string, ScheduledJob>();
 private isRunning = false;

 constructor() {
  // Graceful shutdown handlers
  process.on('SIGTERM', () => this.shutdown());
  process.on('SIGINT', () => this.shutdown());
 }

 async start(): Promise<void> {
  if (this.isRunning) {
   logger.warn('Job scheduler is already running');
   return;
  }

  try {
   await redisService.connect();
   await this.loadExistingJobs();
   this.isRunning = true;
   logger.info('Job scheduler started successfully');
  } catch (error) {
   logger.error('Failed to start job scheduler:', error);
   throw error;
  }
 }

 async shutdown(): Promise<void> {
  if (!this.isRunning) return;

  logger.info('Shutting down job scheduler...');

  // Stop all scheduled jobs
  for (const [jobId, scheduledJob] of this.scheduledJobs) {
   scheduledJob.cronTask.stop();

   // Cancel any running executions
   if (scheduledJob.currentExecution?.status === 'running') {
    await this.cancelExecution(scheduledJob.currentExecution.id);
   }
  }

  this.scheduledJobs.clear();
  await redisService.disconnect();
  this.isRunning = false;

  logger.info('Job scheduler shut down completed');
 }

 private async loadExistingJobs(): Promise<void> {
  try {
   // Get all enabled jobs directly (bypassing search for system startup)
   const jobs = await redisService.getAllEnabledJobs();

   for (const job of jobs) {
    await this.scheduleJob(job);
   }

   logger.info(`Loaded ${jobs.length} existing jobs`);
  } catch (error) {
   logger.error('Failed to load existing jobs:', error);
  }
 }

 async createJob(
  jobData: Omit<JobData, 'id' | 'createdAt' | 'updatedAt'>
 ): Promise<JobData> {
  const job: JobData = {
   ...jobData,
   id: uuidv4(),
   createdAt: new Date().toISOString(),
   updatedAt: new Date().toISOString(),
   nextRun: this.getNextRunTime(jobData.schedule),
  };

  // Validate cron expression
  if (!this.isValidCronExpression(job.schedule)) {
   throw new Error(`Invalid cron expression: ${job.schedule}`);
  }

  // Save to Redis
  await redisService.createJob(job);

  // Schedule if enabled
  if (job.enabled) {
   await this.scheduleJob(job);
  }

  // Broadcast job creation via Pub/Sub
  await redisService.publishJobEvent('job_created', { jobId: job.id, job });
  await redisService.publishJobEvent('jobs_update', {});

  // Publish event
  await redisService.publishJobEvent('job_created', {
   jobId: job.id,
   name: job.name,
  });

  logger.info(`Job created and scheduled: ${job.name} (${job.id})`);
  return job;
 }

 async updateJob(jobId: string, updates: Partial<JobData>): Promise<JobData> {
  const existingJob = await redisService.getJob(jobId);
  if (!existingJob) {
   throw new Error(`Job not found: ${jobId}`);
  }

  // Unschedule if it was scheduled
  await this.unscheduleJob(jobId);

  // Validate cron expression if updated
  if (updates.schedule && !this.isValidCronExpression(updates.schedule)) {
   throw new Error(`Invalid cron expression: ${updates.schedule}`);
  }

  // Update in Redis
  const updatedJob = {
   ...existingJob,
   ...updates,
   updatedAt: new Date().toISOString(),
  };

  if (updates.schedule) {
   updatedJob.nextRun = this.getNextRunTime(updates.schedule);
  }

  await redisService.updateJob(jobId, updatedJob);

  // Reschedule if enabled
  if (updatedJob.enabled) {
   await this.scheduleJob(updatedJob);
  }

  // Publish event
  await redisService.publishJobEvent('job_updated', { jobId, updates });

  // Broadcast job update via Pub/Sub
  await redisService.publishJobEvent('job_updated', { jobId, job: updatedJob });
  await redisService.publishJobEvent('jobs_update', {});

  logger.info(`Job updated: ${updatedJob.name} (${jobId})`);
  return updatedJob;
 }

 async deleteJob(jobId: string): Promise<void> {
  const job = await redisService.getJob(jobId);
  if (!job) {
   throw new Error(`Job not found: ${jobId}`);
  }

  // Unschedule and remove
  await this.unscheduleJob(jobId);
  await redisService.deleteJob(jobId);

  // Publish event
  await redisService.publishJobEvent('job_deleted', { jobId, name: job.name });

  // Broadcast job deletion via Pub/Sub
  await redisService.publishJobEvent('job_deleted', { jobId, job });
  await redisService.publishJobEvent('jobs_update', {});

  logger.info(`Job deleted: ${job.name} (${jobId})`);
 }

 async scheduleJob(job: JobData): Promise<void> {
  if (this.scheduledJobs.has(job.id)) {
   logger.warn(`Job ${job.id} is already scheduled`);
   return;
  }

  try {
   const cronTask = cron.schedule(
    job.schedule,
    async () => {
     await this.executeJob(job);
    },
    {
     scheduled: false, // Don't start immediately
     timezone: 'UTC',
    }
   );

   cronTask.start();

   this.scheduledJobs.set(job.id, {
    jobData: job,
    cronTask,
   });

   logger.info(
    `Job scheduled: ${job.name} (${job.id}) with schedule: ${job.schedule}`
   );
  } catch (error) {
   logger.error(`Failed to schedule job ${job.id}:`, error);
   throw error;
  }
 }

 async unscheduleJob(jobId: string): Promise<void> {
  const scheduledJob = this.scheduledJobs.get(jobId);
  if (!scheduledJob) {
   return; // Job wasn't scheduled
  }

  // Stop the cron task
  scheduledJob.cronTask.stop();

  // Cancel current execution if running
  if (scheduledJob.currentExecution?.status === 'running') {
   await this.cancelExecution(scheduledJob.currentExecution.id);
  }

  this.scheduledJobs.delete(jobId);
  logger.info(`Job unscheduled: ${jobId}`);
 }

 private async executeJob(job: JobData): Promise<void> {
  const executionId = uuidv4();
  const execution: JobExecution = {
   id: executionId,
   jobId: job.id,
   status: 'running',
   startedAt: new Date().toISOString(),
   retryCount: 0,
   maxRetries: job.retries,
   errorCount: 0,
  };

  try {
   // Update scheduled job with current execution
   const scheduledJob = this.scheduledJobs.get(job.id);
   if (scheduledJob) {
    scheduledJob.currentExecution = execution;
   }

   // Create execution record
   await redisService.createExecution(execution);

   // Update job's last run time
   await redisService.updateJob(job.id, {
    lastRun: execution.startedAt,
    nextRun: this.getNextRunTime(job.schedule),
   });

   // Publish start event
   await redisService.publishJobEvent('execution_started', {
    jobId: job.id,
    executionId,
    jobName: job.name,
   });

   // Broadcast Pub/Sub event
   await redisService.publishJobExecution('execution_started', {
    ...execution,
    jobName: job.name,
    status: 'running',
   });

   logger.info(`Executing job: ${job.name} (${job.id})`);

   // Execute the command
   const startTime = Date.now();
   const result = await this.runCommand(
    job.command,
    job.environment,
    job.timeout,
    executionId
   );
   const duration = Date.now() - startTime;

   // Update execution with success
   const updates: Partial<JobExecution> = {
    status: 'success',
    finishedAt: new Date().toISOString(),
    duration,
    exitCode: 0,
    output: result.stdout || '',
   };

   await redisService.updateExecution(executionId, updates);

   // Publish success event
   await redisService.publishJobEvent('execution_completed', {
    jobId: job.id,
    executionId,
    jobName: job.name,
    status: 'success',
    duration,
   });

   // Broadcast Pub/Sub event
   await redisService.publishJobExecution('execution_completed', {
    ...execution,
    ...updates,
    jobName: job.name,
   });

   logger.info(
    `Job completed successfully: ${job.name} (${job.id}) in ${duration}ms`
   );
  } catch (error) {
   const duration = Date.now() - new Date(execution.startedAt).getTime();
   const errorMessage =
    error instanceof Error ? error.message : 'Unknown error';

   // Determine error type
   const isTimeout = (error as Error)?.message?.includes('timeout');
   const isCancelled = (error as Error)?.message?.includes('cancelled');

   const status = isTimeout ? 'timeout' : isCancelled ? 'cancelled' : 'failed';

   // Update execution with enhanced error information
   const updates: Partial<JobExecution> = {
    status,
    finishedAt: new Date().toISOString(),
    duration,
    exitCode: status === 'timeout' ? 124 : status === 'cancelled' ? 130 : 1,
    error: errorMessage,
    lastError: errorMessage,
    errorCount: (execution.errorCount || 0) + 1,
   };

   await redisService.updateExecution(executionId, updates);

   // Publish detailed failure event
   await redisService.publishJobEvent('execution_failed', {
    jobId: job.id,
    executionId,
    jobName: job.name,
    status,
    error: errorMessage,
    duration,
    errorType: isTimeout
     ? 'timeout'
     : isCancelled
     ? 'cancelled'
     : 'execution_error',
    timestamp: new Date().toISOString(),
   });

   // Broadcast Pub/Sub event with enhanced data
   await redisService.publishJobExecution('execution_failed', {
    ...execution,
    ...updates,
    jobName: job.name,
    errorType: isTimeout
     ? 'timeout'
     : isCancelled
     ? 'cancelled'
     : 'execution_error',
   });

   logger.error(`Job failed: ${job.name} (${job.id}): ${errorMessage}`, {
    jobId: job.id,
    executionId,
    status,
    duration,
    errorType: isTimeout
     ? 'timeout'
     : isCancelled
     ? 'cancelled'
     : 'execution_error',
   });

   // Implement retry logic if configured and not cancelled
   if (status !== 'cancelled') {
    await this.handleJobRetry(job, execution, errorMessage);
   }
  } finally {
   // Clear current execution from scheduled job
   const scheduledJob = this.scheduledJobs.get(job.id);
   if (scheduledJob) {
    scheduledJob.currentExecution = undefined;
   }
  }
 }

 private async runCommand(
  command: string,
  environment?: Record<string, string>,
  timeoutMs = 300000,
  executionId?: string
 ): Promise<{ stdout: string; stderr: string }> {
  const env = {
   ...process.env,
   ...environment,
  };

  return new Promise((resolve, reject) => {
   const timeoutId = setTimeout(() => {
    reject(new Error(`Command timeout after ${timeoutMs}ms`));
   }, timeoutMs);

   // Use spawn for real-time output streaming
   const [cmd, ...args] = command.split(' ');
   const child = spawn(cmd, args, {
    env,
    stdio: ['pipe', 'pipe', 'pipe'],
   });

   let stdout = '';
   let stderr = '';

   // Stream stdout in real-time
   child.stdout?.on('data', async (data) => {
    const output = data.toString();
    stdout += output;

    // Broadcast real-time output if executionId is provided
    if (executionId) {
     const logEntry = {
      executionId,
      type: 'log',
      stream: 'stdout',
      output: output.trim(),
      timestamp: new Date().toISOString(),
     };

     // Store log in Redis
     await redisService.addExecutionLog(executionId, logEntry);

     // Broadcast via Pub/Sub
     await redisService.publishJobExecution('log_entry', logEntry);
    }
   });

   // Stream stderr in real-time
   child.stderr?.on('data', async (data) => {
    const output = data.toString();
    stderr += output;

    // Broadcast real-time output if executionId is provided
    if (executionId) {
     const logEntry = {
      executionId,
      type: 'log',
      stream: 'stderr',
      output: output.trim(),
      timestamp: new Date().toISOString(),
     };

     // Store log in Redis
     await redisService.addExecutionLog(executionId, logEntry);

     // Broadcast via Pub/Sub
     await redisService.publishJobExecution('log_entry', logEntry);
    }
   });

   child.on('close', (code) => {
    clearTimeout(timeoutId);
    resolve({ stdout, stderr });
   });

   child.on('error', (error) => {
    clearTimeout(timeoutId);
    reject(error);
   });
  });
 }

 private async handleJobRetry(
  job: JobData,
  execution: JobExecution,
  error: string
 ): Promise<void> {
  const currentRetryCount = execution.retryCount || 0;
  const maxRetries = job.retries || 0;

  if (currentRetryCount >= maxRetries) {
   logger.warn(
    `Job ${job.name} (${job.id}) exceeded max retries (${maxRetries}). Marking as permanently failed.`
   );

   // Publish final failure event
   await redisService.publishJobEvent('execution_permanently_failed', {
    jobId: job.id,
    executionId: execution.id,
    jobName: job.name,
    error,
    retryCount: currentRetryCount,
    maxRetries,
   });

   return;
  }

  // Calculate exponential backoff delay (1s, 2s, 4s, 8s, etc.)
  const backoffDelay = Math.min(1000 * Math.pow(2, currentRetryCount), 30000); // Max 30s

  logger.info(
   `Scheduling retry ${currentRetryCount + 1}/${maxRetries} for job ${
    job.name
   } (${job.id}) in ${backoffDelay}ms`
  );

  // Publish retry event
  await redisService.publishJobEvent('execution_retry_scheduled', {
   jobId: job.id,
   executionId: execution.id,
   jobName: job.name,
   retryCount: currentRetryCount + 1,
   maxRetries,
   backoffDelay,
   error,
  });

  // Schedule retry with exponential backoff
  setTimeout(async () => {
   try {
    logger.info(
     `Executing retry ${currentRetryCount + 1}/${maxRetries} for job ${
      job.name
     } (${job.id})`
    );

    // Create new execution for retry
    const retryExecution: JobExecution = {
     id: uuidv4(),
     jobId: job.id,
     status: 'running',
     startedAt: new Date().toISOString(),
     retryCount: currentRetryCount + 1,
     maxRetries,
     errorCount: (execution.errorCount || 0) + 1,
    };

    // Store retry execution
    await redisService.createExecution(retryExecution);

    // Publish retry start event
    await redisService.publishJobEvent('execution_retry_started', {
     jobId: job.id,
     executionId: retryExecution.id,
     jobName: job.name,
     retryCount: currentRetryCount + 1,
     maxRetries,
    });

    // Execute the job again
    await this.executeJob(job);
   } catch (retryError) {
    logger.error(
     `Retry execution failed for job ${job.name} (${job.id}):`,
     retryError
    );

    // Handle retry failure
    await this.handleJobRetry(
     job,
     execution,
     retryError instanceof Error ? retryError.message : 'Retry failed'
    );
   }
  }, backoffDelay);
 }

 private async cancelExecution(executionId: string): Promise<void> {
  try {
   await redisService.updateExecution(executionId, {
    status: 'cancelled',
    finishedAt: new Date().toISOString(),
   });

   logger.info(`Execution cancelled: ${executionId}`);
  } catch (error) {
   logger.error(`Failed to cancel execution ${executionId}:`, error);
  }
 }

 private isValidCronExpression(expression: string): boolean {
  try {
   return cron.validate(expression);
  } catch (error) {
   return false;
  }
 }

 private getNextRunTime(schedule: string): string {
  try {
   // This is a simplified implementation
   // In a real scenario, you'd use a proper cron parser
   const now = new Date();
   const nextRun = new Date(now.getTime() + 60000); // Add 1 minute for demo
   return nextRun.toISOString();
  } catch (error) {
   return new Date().toISOString();
  }
 }

 // Public methods for job management
 async getJob(jobId: string): Promise<JobData | null> {
  return redisService.getJob(jobId);
 }

 // Execute job manually
 async executeJobManually(jobId: string): Promise<void> {
  const job = await this.getJob(jobId);
  if (!job) {
   throw new Error('Job not found');
  }

  // Check if job is enabled (required for execution)
  if (!job.enabled) {
   throw new Error('Job must be enabled to execute');
  }

  // Check if job is already running
  const scheduledJob = this.scheduledJobs.get(jobId);
  if (scheduledJob?.currentExecution?.status === 'running') {
   throw new Error('Job is already running');
  }

  // For active jobs, reset lastRun and nextRun
  const now = new Date();
  const updates: Partial<JobData> = {
   lastRun: now.toISOString(),
   nextRun: this.getNextRunTime(job.schedule),
   updatedAt: now.toISOString(),
  };

  // Update the job with new timestamps
  await redisService.updateJob(jobId, updates);

  // Get the updated job data
  const updatedJob = await this.getJob(jobId);
  if (!updatedJob) {
   throw new Error('Failed to update job timestamps');
  }

  // Execute the job with updated data
  await this.executeJob(updatedJob);
 }

 async searchJobs(
  query?: string,
  filters?: Record<string, unknown>,
  limit?: number,
  offset?: number
 ): Promise<JobData[]> {
  return redisService.searchJobs(query || '*', filters, limit, offset);
 }

 async getJobsCount(
  query?: string,
  filters?: Record<string, unknown>
 ): Promise<number> {
  return redisService.getJobsCount(query || '*', filters);
 }

 async getJobExecutions(jobId: string, limit = 10): Promise<JobExecution[]> {
  return redisService.getJobExecutions(jobId, limit);
 }

 async getMetrics(
  fromTimestamp: number,
  toTimestamp: number
 ): Promise<Record<string, Array<[number, number]>>> {
  const metrics = {
   totalJobs: await redisService.getMetricRange(
    'ts:jobs:total',
    fromTimestamp,
    toTimestamp
   ),
   activeJobs: await redisService.getMetricRange(
    'ts:jobs:active',
    fromTimestamp,
    toTimestamp
   ),
   successRate: await redisService.getMetricRange(
    'ts:jobs:success_rate',
    fromTimestamp,
    toTimestamp
   ),
   avgDuration: await redisService.getMetricRange(
    'ts:jobs:avg_duration',
    fromTimestamp,
    toTimestamp
   ),
   failedCount: await redisService.getMetricRange(
    'ts:jobs:failed_count',
    fromTimestamp,
    toTimestamp
   ),
  };

  return metrics;
 }

 async getJobPerformanceMetrics(
  jobId: string,
  days: number = 30
 ): Promise<{
  jobId: string;
  jobName: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  timeoutExecutions: number;
  cancelledExecutions: number;
  successRate: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDuration: number;
  lastExecutionAt?: string;
  firstExecutionAt?: string;
  averageExecutionsPerDay: number;
  trend: 'improving' | 'declining' | 'stable';
  errorCount: number;
 }> {
  try {
   const fromDate = new Date();
   fromDate.setDate(fromDate.getDate() - days);
   const fromTimestamp = fromDate.getTime();

   // Get job details
   const job = await this.getJob(jobId);
   if (!job) {
    throw new Error('Job not found');
   }

   // Get all executions for this job in the time range
   const executions = await redisService.getJobExecutions(jobId, 1000); // Get more executions to filter by date
   const filteredExecutions = executions.filter((e) => {
    const executionTime = new Date(e.startedAt).getTime();
    return executionTime >= fromTimestamp && executionTime <= Date.now();
   });

   if (executions.length === 0) {
    return {
     jobId,
     jobName: job.name,
     totalExecutions: 0,
     successfulExecutions: 0,
     failedExecutions: 0,
     timeoutExecutions: 0,
     cancelledExecutions: 0,
     successRate: 0,
     averageDuration: 0,
     minDuration: 0,
     maxDuration: 0,
     totalDuration: 0,
     averageExecutionsPerDay: 0,
     trend: 'stable',
     errorCount: 0,
    };
   }

   // Calculate metrics
   const successfulExecutions = filteredExecutions.filter(
    (e: JobExecution) => e.status === 'success'
   ).length;
   const failedExecutions = filteredExecutions.filter(
    (e: JobExecution) => e.status === 'failed'
   ).length;
   const timeoutExecutions = filteredExecutions.filter(
    (e: JobExecution) => e.status === 'timeout'
   ).length;
   const cancelledExecutions = filteredExecutions.filter(
    (e: JobExecution) => e.status === 'cancelled'
   ).length;
   const totalExecutions = filteredExecutions.length;
   const successRate =
    totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

   // Duration metrics
   const completedExecutions = filteredExecutions.filter(
    (e: JobExecution) => e.duration !== undefined
   );
   const durations = completedExecutions.map((e: JobExecution) => e.duration!);
   const totalDuration = durations.reduce(
    (sum: number, d: number) => sum + d,
    0
   );
   const averageDuration =
    durations.length > 0 ? totalDuration / durations.length : 0;
   const minDuration = durations.length > 0 ? Math.min(...durations) : 0;
   const maxDuration = durations.length > 0 ? Math.max(...durations) : 0;

   // Time metrics
   const sortedExecutions = filteredExecutions.sort(
    (a: JobExecution, b: JobExecution) =>
     new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
   );
   const firstExecutionAt = sortedExecutions[0]?.startedAt;
   const lastExecutionAt =
    sortedExecutions[sortedExecutions.length - 1]?.startedAt;
   const averageExecutionsPerDay = days > 0 ? totalExecutions / days : 0;

   // Trend calculation (comparing first half vs second half of the period)
   const midPoint = Math.floor(executions.length / 2);
   const firstHalf = executions.slice(0, midPoint);
   const secondHalf = executions.slice(midPoint);

   const firstHalfSuccessRate =
    firstHalf.length > 0
     ? (firstHalf.filter((e) => e.status === 'success').length /
        firstHalf.length) *
       100
     : 0;
   const secondHalfSuccessRate =
    secondHalf.length > 0
     ? (secondHalf.filter((e) => e.status === 'success').length /
        secondHalf.length) *
       100
     : 0;

   let trend: 'improving' | 'declining' | 'stable' = 'stable';
   if (secondHalfSuccessRate > firstHalfSuccessRate + 5) {
    trend = 'improving';
   } else if (secondHalfSuccessRate < firstHalfSuccessRate - 5) {
    trend = 'declining';
   }

   return {
    jobId,
    jobName: job.name,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    timeoutExecutions,
    cancelledExecutions,
    successRate,
    averageDuration,
    minDuration,
    maxDuration,
    totalDuration,
    lastExecutionAt,
    firstExecutionAt,
    averageExecutionsPerDay,
    trend,
    errorCount: failedExecutions + timeoutExecutions + cancelledExecutions,
   };
  } catch (error) {
   logger.error(`Failed to get performance metrics for job ${jobId}:`, error);
   throw error;
  }
 }

 async getSystemPerformanceMetrics(
  userId: string,
  days: number = 30
 ): Promise<{
  totalJobs: number;
  activeJobs: number;
  totalExecutions: number;
  systemSuccessRate: number;
  averageJobDuration: number;
  topPerformingJobs: Array<{
   jobId: string;
   jobName: string;
   successRate: number;
   averageDuration: number;
  }>;
  underperformingJobs: Array<{
   jobId: string;
   jobName: string;
   successRate: number;
   averageDuration: number;
   errorCount: number;
  }>;
  recentFailures: Array<{
   jobId: string;
   jobName: string;
   error: string;
   timestamp: string;
   duration: number;
  }>;
 }> {
  try {
   const fromDate = new Date();
   fromDate.setDate(fromDate.getDate() - days);
   const fromTimestamp = fromDate.getTime();

   // Get user's jobs
   const jobs = await this.searchJobs('*', { userId });
   const activeJobs = jobs.filter((job) => job.enabled).length;

   // Get all executions for user's jobs
   const allExecutions: JobExecution[] = [];
   for (const job of jobs) {
    const jobExecutions = await redisService.getJobExecutions(job.id, 1000); // Get more executions to filter by date
    const filteredExecutions = jobExecutions.filter((e: JobExecution) => {
     const executionTime = new Date(e.startedAt).getTime();
     return executionTime >= fromTimestamp && executionTime <= Date.now();
    });
    allExecutions.push(...filteredExecutions);
   }

   const totalExecutions = allExecutions.length;
   const successfulExecutions = allExecutions.filter(
    (e: JobExecution) => e.status === 'success'
   ).length;
   const systemSuccessRate =
    totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

   // Calculate average job duration
   const completedExecutions = allExecutions.filter(
    (e: JobExecution) => e.duration !== undefined
   );
   const totalDuration = completedExecutions.reduce(
    (sum: number, e: JobExecution) => sum + (e.duration || 0),
    0
   );
   const averageJobDuration =
    completedExecutions.length > 0
     ? totalDuration / completedExecutions.length
     : 0;

   // Get performance metrics for each job
   const jobMetrics = await Promise.all(
    jobs.map(async (job) => {
     try {
      return await this.getJobPerformanceMetrics(job.id, days);
     } catch (error) {
      logger.error(`Failed to get metrics for job ${job.id}:`, error);
      return null;
     }
    })
   );

   const validJobMetrics = jobMetrics.filter((m) => m !== null) as any[];

   // Top performing jobs (highest success rate)
   const topPerformingJobs = validJobMetrics
    .filter((m) => m.totalExecutions >= 5) // Only jobs with sufficient data
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 5)
    .map((m) => ({
     jobId: m.jobId,
     jobName: m.jobName,
     successRate: m.successRate,
     averageDuration: m.averageDuration,
    }));

   // Underperforming jobs (low success rate or high error count)
   const underperformingJobs = validJobMetrics
    .filter((m) => m.successRate < 80 || m.failedExecutions > 3)
    .sort((a, b) => a.successRate - b.successRate)
    .slice(0, 5)
    .map((m) => ({
     jobId: m.jobId,
     jobName: m.jobName,
     successRate: m.successRate,
     averageDuration: m.averageDuration,
     errorCount:
      m.failedExecutions + m.timeoutExecutions + m.cancelledExecutions,
    }));

   // Recent failures
   const recentFailures = allExecutions
    .filter((e) => e.status !== 'success' && e.status !== 'running')
    .sort(
     (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    )
    .slice(0, 10)
    .map((e) => {
     const job = jobs.find((j) => j.id === e.jobId);
     return {
      jobId: e.jobId,
      jobName: job?.name || 'Unknown Job',
      error: e.error || e.lastError || 'Unknown error',
      timestamp: e.startedAt,
      duration: e.duration || 0,
     };
    });

   return {
    totalJobs: jobs.length,
    activeJobs,
    totalExecutions,
    systemSuccessRate,
    averageJobDuration,
    topPerformingJobs,
    underperformingJobs,
    recentFailures,
   };
  } catch (error) {
   logger.error('Failed to get system performance metrics:', error);
   throw error;
  }
 }

 // Status methods
 isJobScheduled(jobId: string): boolean {
  return this.scheduledJobs.has(jobId);
 }

 getScheduledJobsCount(): number {
  return this.scheduledJobs.size;
 }

 getRunningExecutionsCount(): number {
  let count = 0;
  for (const scheduledJob of this.scheduledJobs.values()) {
   if (scheduledJob.currentExecution?.status === 'running') {
    count++;
   }
  }
  return count;
 }

 async getJobStatus(jobId: string): Promise<{
  job: JobData | null;
  currentExecution: JobExecution | null;
  isRunning: boolean;
  lastExecution: JobExecution | null;
  nextRun: string | null;
  retryCount: number;
  errorCount: number;
 }> {
  const job = await this.getJob(jobId);
  if (!job) {
   return {
    job: null,
    currentExecution: null,
    isRunning: false,
    lastExecution: null,
    nextRun: null,
    retryCount: 0,
    errorCount: 0,
   };
  }

  const scheduledJob = this.scheduledJobs.get(jobId);
  const currentExecution = scheduledJob?.currentExecution || null;
  const isRunning = currentExecution?.status === 'running';

  // Get last execution
  const executions = await this.getJobExecutions(jobId, 1);
  const lastExecution = executions.length > 0 ? executions[0] : null;

  // Calculate retry and error counts
  const recentExecutions = await this.getJobExecutions(jobId, 10);
  const retryCount = recentExecutions.reduce(
   (sum, exec) => sum + (exec.retryCount || 0),
   0
  );
  const errorCount = recentExecutions.reduce(
   (sum, exec) => sum + (exec.errorCount || 0),
   0
  );

  return {
   job,
   currentExecution,
   isRunning,
   lastExecution,
   nextRun: job.nextRun || null,
   retryCount,
   errorCount,
  };
 }
}

export const jobScheduler = new JobScheduler();
