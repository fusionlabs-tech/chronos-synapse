import { createClient, RedisClientType, SchemaFieldTypes } from 'redis';
import { logger } from '../utils/logger';

export interface JobData {
 id: string;
 name: string;
 description?: string;
 schedule: string; // Cron expression
 command: string;
 enabled: boolean;
 timeout: number;
 retries: number;
 userId: string;
 teamId?: string;
 tags: string[];
 environment?: Record<string, string>;
 createdAt: string;
 updatedAt: string;
 lastRun?: string;
 nextRun?: string;
}

export interface JobExecution {
 id: string;
 jobId: string;
 status: 'running' | 'success' | 'failed' | 'timeout' | 'cancelled';
 startedAt: string;
 finishedAt?: string;
 duration?: number;
 exitCode?: number;
 output?: string;
 error?: string;
 retryCount?: number;
 maxRetries?: number;
 lastError?: string;
 errorCount?: number;
}

export class RedisService {
 private client: RedisClientType;
 private isConnected = false;

 // Public getter for Redis client (for rate limiting and other services)
 get redis(): RedisClientType {
  return this.client;
 }

 constructor() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Log Redis connection (hide credentials)
  logger.info(
   'Connecting to Redis:',
   redisUrl.replace(/\/\/[^@]+@/, '//***:***@')
  );

  // For Redis Cloud URLs that include password, don't set separate password field
  const clientConfig: any = { url: redisUrl };

  // Only add separate password if URL doesn't contain credentials and REDIS_PASSWORD is set
  if (!redisUrl.includes('@') && process.env.REDIS_PASSWORD) {
   clientConfig.password = process.env.REDIS_PASSWORD;
  }

  this.client = createClient(clientConfig);

  this.client.on('error', (err) => {
   logger.error('Redis Client Error:', err);
  });

  this.client.on('connect', () => {
   logger.info('Connected to Redis successfully');
   this.isConnected = true;
  });

  this.client.on('disconnect', () => {
   logger.warn('Disconnected from Redis');
   this.isConnected = false;
  });
 }

 async connect(): Promise<void> {
  if (!this.isConnected) {
   await this.client.connect();
   await this.initializeSchemas();
  }
 }

 async disconnect(): Promise<void> {
  if (this.isConnected) {
   await this.client.disconnect();
  }
 }

 private async initializeSchemas(): Promise<void> {
  try {
   // Create Redis Search indexes for jobs and executions
   await this.createJobSearchIndex();
   await this.createExecutionSearchIndex();

   // Initialize TimeSeries keys for metrics
   await this.initializeTimeSeries();

   logger.info('Redis schemas initialized successfully');
  } catch (error) {
   logger.error('Failed to initialize Redis schemas:', error);
  }
 }

 private async createJobSearchIndex(): Promise<void> {
  try {
   await this.client.ft.create(
    'idx:jobs',
    {
     '$.name': {
      type: SchemaFieldTypes.TEXT,
      AS: 'name',
     },
     '$.description': {
      type: SchemaFieldTypes.TEXT,
      AS: 'description',
     },
     '$.schedule': {
      type: SchemaFieldTypes.TEXT,
      AS: 'schedule',
     },
     '$.enabled': {
      type: SchemaFieldTypes.TAG,
      AS: 'enabled',
     },
     '$.userId': {
      type: SchemaFieldTypes.TEXT,
      AS: 'userId',
     },
     '$.teamId': {
      type: SchemaFieldTypes.TAG,
      AS: 'teamId',
     },
     '$.tags': {
      type: SchemaFieldTypes.TAG,
      AS: 'tags',
      SEPARATOR: ',',
     },
     '$.createdAt': {
      type: SchemaFieldTypes.TEXT,
      AS: 'createdAt',
     },
    },
    {
     ON: 'JSON',
     PREFIX: 'job:',
    }
   );
  } catch (error: unknown) {
   const errorMsg = error instanceof Error ? error.message : String(error);
   if (!errorMsg.includes('Index already exists')) {
    throw error;
   }
  }
 }

 private async createExecutionSearchIndex(): Promise<void> {
  try {
   logger.info('Creating execution search index...');
   await this.client.ft.create(
    'idx:executions',
    {
     '$.jobId': {
      type: SchemaFieldTypes.TAG,
      AS: 'jobId',
      SEPARATOR: '|',
     },
     '$.status': {
      type: SchemaFieldTypes.TAG,
      AS: 'status',
      SEPARATOR: '|',
     },
     '$.startedAt': {
      type: SchemaFieldTypes.TEXT,
      AS: 'startedAt',
     },
     '$.duration': {
      type: SchemaFieldTypes.NUMERIC,
      AS: 'duration',
     },
     '$.exitCode': {
      type: SchemaFieldTypes.NUMERIC,
      AS: 'exitCode',
     },
    },
    {
     ON: 'JSON',
     PREFIX: 'execution:',
    }
   );
   logger.info('Execution search index created successfully');
  } catch (error: unknown) {
   const errorMsg = error instanceof Error ? error.message : String(error);
   if (!errorMsg.includes('Index already exists')) {
    logger.error('Failed to create execution search index:', error);
    throw error;
   } else {
    logger.info('Execution search index already exists');
   }
  }
 }

 private async ensureExecutionIndexExists(): Promise<void> {
  try {
   // Check if index exists
   await this.client.sendCommand(['FT.INFO', 'idx:executions']);
   logger.info('Execution index already exists');
  } catch (error) {
   // Index doesn't exist, create it
   logger.info('Execution index not found, creating...');
   await this.createExecutionSearchIndex();
  }
 }

 private async initializeTimeSeries(): Promise<void> {
  const timeSeriesKeys = [
   'ts:jobs:total',
   'ts:jobs:active',
   'ts:jobs:success_rate',
   'ts:jobs:avg_duration',
   'ts:jobs:failed_count',
   'ts:system:cpu_usage',
   'ts:system:memory_usage',
  ];

  for (const key of timeSeriesKeys) {
   try {
    // Try to delete existing TimeSeries if it has wrong policy
    try {
     await this.client.del(key);
    } catch (deleteError) {
     // Ignore delete errors
    }

    // Create with correct duplicate policy
    await this.client.ts.create(key, {
     RETENTION: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
     LABELS: { type: 'metric' },
     DUPLICATE_POLICY: 'LAST' as any, // Allow updates by using LAST policy
    });
   } catch (error: any) {
    if (!error.message?.includes('TSDB: key already exists')) {
     logger.warn(`Failed to create TimeSeries ${key}:`, error.message);
    }
   }
  }
 }

 // Job Management Methods
 async createJob(job: JobData): Promise<void> {
  const key = `job:${job.id}`;

  // Convert boolean enabled to string for RedisSearch compatibility
  const jobForRedis = {
   ...job,
   enabled: job.enabled.toString(), // Convert boolean to string
  };

  await this.client.json.set(
   key,
   '$',
   jobForRedis as unknown as Parameters<typeof this.client.json.set>[2]
  );

  // Track job creation in TimeSeries
  await this.recordMetric('ts:jobs:total', 1);

  logger.info(`Job created: ${job.id}`);
 }

 async getJob(jobId: string): Promise<JobData | null> {
  const key = `job:${jobId}`;
  const job = await this.client.json.get(key);
  return job as JobData | null;
 }

 async updateJob(jobId: string, updates: Partial<JobData>): Promise<void> {
  const key = `job:${jobId}`;

  // Update individual fields
  for (const [field, value] of Object.entries(updates)) {
   await this.client.json.set(key, `$.${field}`, value);
  }

  // Update timestamp
  await this.client.json.set(key, '$.updatedAt', new Date().toISOString());

  logger.info(`Job updated: ${jobId}`);
 }

 async deleteJob(jobId: string): Promise<void> {
  const key = `job:${jobId}`;
  await this.client.json.del(key);

  // Also delete related executions
  const executions = await this.getJobExecutions(jobId);
  for (const execution of executions) {
   await this.client.json.del(`execution:${execution.id}`);
  }

  logger.info(`Job deleted: ${jobId}`);
 }

 async searchJobs(
  query: string,
  filters?: Record<string, unknown>,
  limit?: number,
  offset?: number
 ): Promise<JobData[]> {
  try {
   // Build RedisSearch query
   let searchQuery = '*'; // Default to match all

   // Apply text search if query provided
   if (query && query.trim() !== '' && query.trim() !== '*') {
    // Escape special characters and use proper RedisSearch OR syntax
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    searchQuery = `(@name:*${escapedQuery}*)|(@description:*${escapedQuery}*)`;
   }

   // Handle userId filter separately
   let userIdFilter = '';
   if (filters?.userId) {
    // Use exact match for UUID without hyphens
    userIdFilter = `@userId:${filters.userId}`;
   }

   // Add other filters to search query
   const filterParts: string[] = [];
   if (filters) {
    for (const [field, value] of Object.entries(filters)) {
     if (value !== undefined && value !== null && field !== 'userId') {
      if (field === 'enabled') {
       // Convert boolean to string for RedisSearch TAG field
       const enabledValue =
        value === 'true' || value === true ? 'true' : 'false';
       filterParts.push(`@enabled:{${enabledValue}}`);
      } else if (field === 'teamId') {
       filterParts.push(`@teamId:${value}`);
      }
     }
    }
   }

   // Combine text search with filters
   let finalQuery = searchQuery;
   if (userIdFilter) {
    if (searchQuery === '*') {
     finalQuery = userIdFilter;
    } else {
     finalQuery = `${searchQuery} ${userIdFilter}`;
    }
   }
   if (filterParts.length > 0) {
    finalQuery = `${finalQuery} ${filterParts.join(' ')}`;
   }

   // Execute RedisSearch with pagination
   logger.info(`Executing RedisSearch query: ${finalQuery}`);
   logger.info(`Filters: ${JSON.stringify(filters)}`);
   const results = await this.client.ft.search('idx:jobs', finalQuery, {
    LIMIT: {
     from: offset || 0,
     size: limit || 100,
    },
   });

   // Parse RedisSearch results
   const jobs: JobData[] = [];

   if (
    results &&
    typeof results === 'object' &&
    'total' in results &&
    'documents' in results
   ) {
    if (results.total === 0) {
     return [];
    }

    // Process documents array
    for (const doc of results.documents) {
     try {
      const job = doc.value as unknown as JobData;
      jobs.push(job);
     } catch (parseError) {
      logger.error('Failed to process job document:', parseError);
     }
    }
   } else {
    logger.error('Unexpected RedisSearch results format:', typeof results);
   }

   return jobs;
  } catch (error) {
   logger.error('RedisSearch failed:', error);
   return [];
  }
 }

 async getJobsCount(
  query: string,
  filters?: Record<string, any>
 ): Promise<number> {
  try {
   // Build RedisSearch query (same logic as searchJobs)
   let searchQuery = '*';

   if (query && query.trim() !== '' && query.trim() !== '*') {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    searchQuery = `(@name:*${escapedQuery}*)|(@description:*${escapedQuery}*)`;
   }

   // Handle userId filter separately
   let userIdFilter = '';
   if (filters?.userId) {
    // Use exact match for UUID without hyphens
    userIdFilter = `@userId:${filters.userId}`;
   }

   // Add other filters to search query
   const filterParts: string[] = [];
   if (filters) {
    for (const [field, value] of Object.entries(filters)) {
     if (value !== undefined && value !== null && field !== 'userId') {
      if (field === 'enabled') {
       const enabledValue =
        value === 'true' || value === true ? 'true' : 'false';
       filterParts.push(`@enabled:{${enabledValue}}`);
      } else if (field === 'teamId') {
       filterParts.push(`@teamId:${value}`);
      }
     }
    }
   }

   // Combine text search with filters
   let finalQuery = searchQuery;
   if (userIdFilter) {
    if (searchQuery === '*') {
     finalQuery = userIdFilter;
    } else {
     finalQuery = `${searchQuery} ${userIdFilter}`;
    }
   }
   if (filterParts.length > 0) {
    finalQuery = `${finalQuery} ${filterParts.join(' ')}`;
   }

   // Execute RedisSearch with LIMIT 0 to get only count
   const results = await this.client.ft.search('idx:jobs', finalQuery, {
    LIMIT: {
     from: 0,
     size: 0,
    },
   });

   if (results && typeof results === 'object' && 'total' in results) {
    return results.total;
   }

   return 0;
  } catch (error) {
   logger.error('RedisSearch count failed:', error);
   return 0;
  }
 }

 // Job Execution Methods
 async createExecution(execution: JobExecution): Promise<void> {
  const key = `execution:${execution.id}`;

  try {
   // Ensure execution index exists
   await this.ensureExecutionIndexExists();

   // Create a clean execution object with only defined properties
   const cleanExecution: any = {
    id: execution.id,
    jobId: execution.jobId,
    status: execution.status,
    startedAt: execution.startedAt,
   };

   // Only add optional properties if they exist
   if (execution.finishedAt) cleanExecution.finishedAt = execution.finishedAt;
   if (execution.duration !== undefined)
    cleanExecution.duration = execution.duration;
   if (execution.exitCode !== undefined)
    cleanExecution.exitCode = execution.exitCode;
   if (execution.output) cleanExecution.output = execution.output;
   if (execution.error) cleanExecution.error = execution.error;

   await this.client.json.set(key, '$', cleanExecution);

   // Track execution metrics
   await this.recordMetric('ts:jobs:active', 1);

   logger.info(
    `Execution created: ${execution.id} for job: ${execution.jobId}`
   );

   // Verify the execution was stored correctly
   const storedExecution = await this.client.json.get(key);
   if (!storedExecution) {
    logger.error(`Failed to verify execution storage for: ${execution.id}`);
   }
  } catch (error) {
   logger.error(`Failed to create execution ${execution.id}:`, error);
   throw error;
  }
 }

 async updateExecution(
  executionId: string,
  updates: Partial<JobExecution>
 ): Promise<void> {
  const key = `execution:${executionId}`;

  try {
   // Update each field individually to avoid nested object issues
   for (const [field, value] of Object.entries(updates)) {
    if (value !== undefined && value !== null) {
     await this.client.json.set(key, `$.${field}`, value);
    }
   }

   // Record completion metrics
   if (updates.status && updates.status !== 'running') {
    if (updates.status === 'success') {
     await this.recordMetric('ts:jobs:success_rate', 1);
    } else {
     await this.recordMetric('ts:jobs:failed_count', 1);
    }

    if (updates.duration) {
     await this.recordMetric('ts:jobs:avg_duration', updates.duration);
    }
   }

   logger.info(`Execution updated: ${executionId}`);
  } catch (error) {
   logger.error(`Failed to update execution ${executionId}:`, error);
   throw error;
  }
 }

 async getJobExecutions(jobId: string, limit = 10): Promise<JobExecution[]> {
  try {
   logger.info(`Searching for executions for job: ${jobId}`);

   const query = `*`;
   logger.info(`Using RedisSearch query: ${query}`);

   const results = await this.client.ft.search('idx:executions', query, {
    LIMIT: {
     from: 0,
     size: 100, // Get more results to filter
    },
    SORTBY: {
     BY: 'startedAt',
     DIRECTION: 'DESC',
    },
   });

   logger.info(`RedisSearch results for job ${jobId}:`, results);

   // Parse RedisSearch results and filter by jobId
   const executions: JobExecution[] = [];

   if (
    results &&
    typeof results === 'object' &&
    'total' in results &&
    'documents' in results
   ) {
    if (results.total === 0) {
     logger.warn(`No executions found for job ${jobId}`);
     return [];
    }

    // Process documents array and filter by jobId
    for (const doc of results.documents) {
     try {
      const execution = doc.value as unknown as JobExecution;
      if (execution.jobId === jobId) {
       executions.push(execution);
       // Stop when we have enough results
       if (executions.length >= limit) {
        break;
       }
      }
     } catch (parseError) {
      logger.error('Failed to process execution document:', parseError);
     }
    }
   } else {
    logger.error('Unexpected RedisSearch results format:', typeof results);
   }

   logger.info(`Found ${executions.length} executions for job ${jobId}`);
   return executions;
  } catch (error) {
   logger.error('Failed to get job executions:', error);
   return [];
  }
 }

 async getExecutionLogs(executionId: string, limit = 100): Promise<any[]> {
  try {
   // Get logs from Redis List (real-time logs stored during execution)
   const logsKey = `logs:${executionId}`;
   const logs = await this.client.lRange(logsKey, 0, limit - 1);

   return logs.map((log: string) => {
    try {
     return JSON.parse(log);
    } catch {
     return { message: log, timestamp: new Date().toISOString() };
    }
   });
  } catch (error) {
   logger.error('Failed to get execution logs:', error);
   return [];
  }
 }

 async addExecutionLog(executionId: string, logEntry: any): Promise<void> {
  try {
   const logsKey = `logs:${executionId}`;
   const logData = {
    ...logEntry,
    timestamp: new Date().toISOString(),
   };

   // Add to Redis List (left push to maintain order)
   await this.client.lPush(logsKey, JSON.stringify(logData));

   // Set expiration (7 days)
   await this.client.expire(logsKey, 7 * 24 * 60 * 60);
  } catch (error) {
   logger.error('Failed to add execution log:', error);
  }
 }

 // TimeSeries Methods
 async recordMetric(
  key: string,
  value: number,
  timestamp?: number
 ): Promise<void> {
  try {
   await this.client.ts.add(key, timestamp || Date.now(), value);
  } catch (error) {
   logger.error(`Failed to record metric ${key}:`, error);
  }
 }

 async getMetricRange(
  key: string,
  fromTimestamp: number,
  toTimestamp: number
 ): Promise<Array<[number, number]>> {
  try {
   const results = await this.client.ts.range(key, fromTimestamp, toTimestamp);
   // Handle the TimeSeries results properly
   if (Array.isArray(results)) {
    return results.map((item: unknown) => {
     if (Array.isArray(item) && item.length >= 2) {
      const timestamp = item[0];
      const value = item[1];
      return [Number(timestamp), parseFloat(String(value))];
     }
     return [0, 0]; // Fallback for malformed data
    });
   }
   return [];
  } catch (error) {
   logger.error(`Failed to get metric range for ${key}:`, error);
   return [];
  }
 }

 // Pub/Sub Methods for Real-time Updates
 async publishJobEvent(
  event: string,
  data: Record<string, unknown>
 ): Promise<void> {
  try {
   const message = {
    type: event,
    data,
    timestamp: new Date().toISOString(),
   };

   // Publish to Redis channel
   await this.client.publish('job_events', JSON.stringify(message));
   logger.debug(`Published job event: ${event}`);
  } catch (error) {
   logger.error('Failed to publish job event:', error);
  }
 }

 async publishJobExecution(
  event: string,
  data: Record<string, unknown>
 ): Promise<void> {
  try {
   const message = {
    type: event,
    data,
    timestamp: new Date().toISOString(),
   };

   // Publish to Redis channel
   await this.client.publish('job_execution', JSON.stringify(message));
   logger.debug(`Published job execution: ${event}`);
  } catch (error) {
   logger.error('Failed to publish job execution:', error);
  }
 }

 async publishSystemMetrics(
  event: string,
  data: Record<string, unknown>
 ): Promise<void> {
  try {
   const message = {
    type: event,
    data,
    timestamp: new Date().toISOString(),
   };

   // Publish to Redis channel
   await this.client.publish('system_metrics', JSON.stringify(message));
   logger.debug(`Published system metrics: ${event}`);
  } catch (error) {
   logger.error('Failed to publish system metrics:', error);
  }
 }

 async publishNotification(
  event: string,
  data: Record<string, unknown>
 ): Promise<void> {
  try {
   const message = {
    type: event,
    data,
    timestamp: new Date().toISOString(),
   };

   // Publish to Redis channel
   await this.client.publish('notifications', JSON.stringify(message));
   logger.debug(`Published notification: ${event}`);
  } catch (error) {
   logger.error('Failed to publish notification:', error);
  }
 }

 // Health Check
 async ping(): Promise<boolean> {
  try {
   const result = await this.client.ping();
   return result === 'PONG';
  } catch (error) {
   return false;
  }
 }

 // Health check method for Redis and job statistics
 async getDebugInfo(): Promise<any> {
  try {
   const keys = await this.client.keys('*');
   const jobKeys = keys.filter((key) => key.startsWith('job:'));
   const executionKeys = keys.filter((key) => key.startsWith('execution:'));

   return {
    totalKeys: keys.length,
    jobCount: jobKeys.length,
    executionCount: executionKeys.length,
    redis: 'connected',
   };
  } catch (error: any) {
   return {
    redis: 'error',
    error: error?.message || 'Unknown error',
   };
  }
 }

 // Debug method for RedisSearch
 async getRedisSearchDebugInfo(): Promise<any> {
  try {
   // Check if execution index exists
   let executionIndexInfo = null;
   let executionIndexExists = false;
   try {
    executionIndexInfo = await this.client.sendCommand([
     'FT.INFO',
     'idx:executions',
    ]);
    executionIndexExists = true;
   } catch (error) {
    executionIndexExists = false;
   }

   // Check if jobs index exists
   let jobsIndexInfo = null;
   let jobsIndexExists = false;
   try {
    jobsIndexInfo = await this.client.sendCommand(['FT.INFO', 'idx:jobs']);
    jobsIndexExists = true;
   } catch (error) {
    jobsIndexExists = false;
   }

   // Test a simple search on executions
   let testSearch = null;
   if (executionIndexExists) {
    testSearch = await this.client.ft.search('idx:executions', '*', {
     LIMIT: { from: 0, size: 1 },
    });
   }

   // Test a simple search on jobs
   let jobsSearch = null;
   if (jobsIndexExists) {
    jobsSearch = await this.client.ft.search('idx:jobs', '*', {
     LIMIT: { from: 0, size: 1 },
    });
   }

   // Test userId search
   let userIdSearch = null;
   if (jobsIndexExists) {
    try {
     // Use UUID without hyphens for exact matching
     const userId = '19d704fa34814f65b57ac84456f21fa0'; // UUID without hyphens
     userIdSearch = await this.client.ft.search(
      'idx:jobs',
      `@userId:${userId}`,
      {
       LIMIT: { from: 0, size: 10 },
      }
     );
    } catch (error) {
     logger.error('Failed to test userId search:', error);
    }
   }

   return {
    executionIndexExists,
    executionIndexInfo,
    jobsIndexExists,
    jobsIndexInfo,
    testSearch,
    jobsSearch,
    userIdSearch,
    totalExecutions: await this.client
     .keys('execution:*')
     .then((keys) => keys.length),
    totalJobs: await this.client.keys('job:*').then((keys) => keys.length),
   };
  } catch (error) {
   return {
    error: error instanceof Error ? error.message : String(error),
    totalExecutions: await this.client
     .keys('execution:*')
     .then((keys) => keys.length),
    totalJobs: await this.client.keys('job:*').then((keys) => keys.length),
   };
  }
 }

 // AI Analysis Methods
 async storeAIAnalysis(jobId: string, analysis: any): Promise<void> {
  try {
   const key = `ai:analysis:${jobId}`;
   await this.client.json.set(key, '$', {
    ...analysis,
    timestamp: new Date().toISOString(),
   });

   // Set expiration (30 days)
   await this.client.expire(key, 30 * 24 * 60 * 60);
  } catch (error) {
   logger.error('Failed to store AI analysis:', error);
  }
 }

 async getAIAnalysis(jobId: string): Promise<any | null> {
  try {
   const key = `ai:analysis:${jobId}`;
   const analysis = await this.client.json.get(key);
   return analysis;
  } catch (error) {
   logger.error('Failed to get AI analysis:', error);
   return null;
  }
 }

 async getAllAIAnalyses(): Promise<any[]> {
  try {
   const pattern = 'ai:analysis:*';
   const keys = await this.client.keys(pattern);

   const analyses = [];
   for (const key of keys) {
    const analysis = await this.client.json.get(key);
    if (analysis) {
     analyses.push(analysis);
    }
   }

   return analyses.sort(
    (a, b) =>
     new Date((b as any).timestamp).getTime() -
     new Date((a as any).timestamp).getTime()
   );
  } catch (error) {
   logger.error('Failed to get all AI analyses:', error);
   return [];
  }
 }

 async deleteAIAnalysis(jobId: string): Promise<void> {
  try {
   const key = `ai:analysis:${jobId}`;
   await this.client.del(key);
  } catch (error) {
   logger.error('Failed to delete AI analysis:', error);
  }
 }

 // Clear all data from database (for development/testing)
 // Get all enabled jobs (for system startup)
 async getAllEnabledJobs(): Promise<JobData[]> {
  try {
   const jobKeys = await this.client.keys('job:*');
   const jobs: JobData[] = [];

   for (const key of jobKeys) {
    try {
     const job = (await this.client.json.get(key)) as unknown as JobData;
     if (job && job.enabled) {
      jobs.push(job);
     }
    } catch (error) {
     logger.error(`Failed to load job from ${key}:`, error);
    }
   }

   return jobs;
  } catch (error) {
   logger.error('Failed to get all enabled jobs:', error);
   return [];
  }
 }

 async getExecutionById(executionId: string): Promise<JobExecution | null> {
  try {
   const execution = await this.client.json.get(`execution:${executionId}`);
   return execution as unknown as JobExecution;
  } catch (error) {
   logger.error(`Failed to get execution ${executionId}:`, error);
   return null;
  }
 }

 async getJobById(jobId: string): Promise<JobData | null> {
  try {
   const job = await this.client.json.get(`job:${jobId}`);
   return job as unknown as JobData;
  } catch (error) {
   logger.error(`Failed to get job ${jobId}:`, error);
   return null;
  }
 }

 async clearDatabase(): Promise<void> {
  try {
   logger.info('Clearing all data from Redis database...');

   // Get all keys
   const allKeys = await this.client.keys('*');
   logger.info(`Found ${allKeys.length} keys to delete`);

   if (allKeys.length > 0) {
    // Delete all keys
    await this.client.del(allKeys);
    logger.info('All keys deleted successfully');
   }

   // Drop search indexes
   try {
    await this.client.sendCommand(['FT.DROPINDEX', 'idx:jobs']);
    logger.info('Dropped jobs search index');
   } catch (error) {
    logger.info('Jobs index already dropped or does not exist');
   }

   try {
    await this.client.sendCommand(['FT.DROPINDEX', 'idx:executions']);
    logger.info('Dropped executions search index');
   } catch (error) {
    logger.info('Executions index already dropped or does not exist');
   }

   logger.info('Database cleared successfully');
  } catch (error) {
   logger.error('Failed to clear database:', error);
   throw error;
  }
 }
}

export const redisService = new RedisService();
