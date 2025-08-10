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
 code?: string; // Job code for IDE
 language?: string; // Programming language
 filename?: string; // File name for the job code
 allowNetwork?: boolean; // Allow outbound network during execution
 dockerImage?: string; // Docker image for job execution
 createdAt: string;
 updatedAt: string;
 lastRun?: string;
 nextRun?: string;
 runMode?: 'once' | 'recurring';
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
 isCompleted?: boolean; // New field to track completion status
 // Optional richer telemetry captured from SDK
 stdout?: string;
 stderr?: string;
 codeSnippet?: string;
 codeLanguage?: string;
}

export class RedisService {
 private client: RedisClientType;
 private isConnected = false;
 private connectionPromise: Promise<void> | null = null;
 private reconnectAttempts = 0;
 private maxReconnectAttempts = 10;
 private isShuttingDown = false;

 // Public getter for Redis client (for rate limiting and other services)
 get redis(): RedisClientType {
  if (!this.isConnected && !this.isShuttingDown) {
   logger.warn('Redis not connected, attempting to connect...');
   this.connect().catch((err) => {
    logger.error('Failed to connect to Redis:', err);
   });
  }
  return this.client;
 }

 // Method to check if Redis is connected and ready
 async ensureConnection(): Promise<void> {
  if (this.isShuttingDown) {
   throw new Error('Redis service is shutting down');
  }

  if (!this.isConnected) {
   await this.connect();
  }

  // Double-check with a ping
  try {
   await this.client.ping();
  } catch (error) {
   logger.error('Redis ping failed, reconnecting...');
   this.isConnected = false;
   if (!this.isShuttingDown) {
    await this.connect();
   }
  }
 }

 constructor() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  // Log Redis connection (hide credentials)
  logger.info(
   'Connecting to Redis:',
   redisUrl.replace(/\/\/[^@]+@/, '//***:***@')
  );

  // For Redis Cloud URLs that include password, don't set separate password field
  const clientConfig: any = {
   url: redisUrl,
   socket: {
    connectTimeout: 30000, // 30 seconds
    lazyConnect: true, // Use lazy connect for better control
    keepAlive: 30000, // keep TCP connection alive
    noDelay: true,
    reconnectStrategy: (retries: number) => {
     if (retries > this.maxReconnectAttempts) {
      logger.error(
       `Redis reconnection failed after ${this.maxReconnectAttempts} attempts`
      );
      return new Error('Redis reconnection failed');
     }
     const attempt = retries + 1; // avoid 0ms delay on first retry
     const delay = Math.min(attempt * 1000, 10000);
     logger.info(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
     return delay;
    },
   },
   // node-redis specific options; unknown props are ignored
   retry_unfulfilled_commands: true,
   disable_offline_queue: false,
  };

  // Only add separate password if URL doesn't contain credentials and REDIS_PASSWORD is set
  if (!redisUrl.includes('@') && process.env.REDIS_PASSWORD) {
   clientConfig.password = process.env.REDIS_PASSWORD;
  }

  this.client = createClient(clientConfig);

  // Set up event listeners before connecting
  this.client.on('error', (err) => {
   logger.error('Redis Client Error:', err);
   this.isConnected = false;
   if (!this.isShuttingDown) {
    this.handleReconnect();
   }
  });

  this.client.on('connect', () => {
   logger.info('Connected to Redis successfully');
   this.isConnected = true;
   this.reconnectAttempts = 0;
  });

  this.client.on('disconnect', () => {
   logger.warn('Disconnected from Redis');
   this.isConnected = false;
   if (!this.isShuttingDown) {
    this.handleReconnect();
   }
  });

  this.client.on('reconnecting', () => {
   logger.info('Redis reconnecting...');
  });

  this.client.on('ready', () => {
   logger.info('Redis client ready');
   this.isConnected = true;
   this.reconnectAttempts = 0;
   // Start periodic health checks
   this.startHealthCheck();
  });

  this.client.on('end', () => {
   logger.warn('Redis connection ended');
   this.isConnected = false;
   if (!this.isShuttingDown) {
    this.handleReconnect();
   }
  });

  // Additional debug hooks
  this.client.on('close', () => {
   logger.warn('Redis connection closed');
   this.isConnected = false;
  });

  this.client.on('timeout', () => {
   logger.warn('Redis connection timeout');
   this.isConnected = false;
  });

  // Handle process termination gracefully
  process.on('SIGINT', () => {
   this.isShuttingDown = true;
   this.disconnect().catch((err) => {
    logger.error('Error during Redis disconnect:', err);
   });
  });

  process.on('SIGTERM', () => {
   this.isShuttingDown = true;
   this.disconnect().catch((err) => {
    logger.error('Error during Redis disconnect:', err);
   });
  });
 }

 private async handleReconnect(): Promise<void> {
  if (
   this.isShuttingDown ||
   this.reconnectAttempts >= this.maxReconnectAttempts
  ) {
   if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    logger.error('Max reconnection attempts reached, giving up');
   }
   return;
  }

  this.reconnectAttempts++;
  const delay = Math.min(this.reconnectAttempts * 1000, 10000);

  logger.info(
   `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay}ms`
  );

  setTimeout(async () => {
   try {
    if (!this.isConnected && !this.isShuttingDown) {
     logger.info(
      `Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
     );
     await this.connect();
    }
   } catch (error) {
    logger.error(
     `Reconnection attempt ${this.reconnectAttempts} failed:`,
     error
    );
    // If this attempt failed, schedule another one
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
     this.handleReconnect();
    }
   }
  }, delay);
 }

 async connect(): Promise<void> {
  if (this.isShuttingDown) {
   throw new Error('Redis service is shutting down');
  }

  if (this.connectionPromise) {
   return this.connectionPromise;
  }

  if (this.isConnected) {
   return;
  }

  this.connectionPromise = this._connect();
  return this.connectionPromise;
 }

 private async _connect(): Promise<void> {
  try {
   await this.client.connect();
   await this.initializeSchemas();
   this.isConnected = true;
   this.reconnectAttempts = 0;
   logger.info('Redis connection established successfully');
  } catch (error) {
   logger.error('Failed to connect to Redis:', error);
   this.isConnected = false;
   throw error;
  } finally {
   this.connectionPromise = null;
  }
 }

 async disconnect(): Promise<void> {
  this.isShuttingDown = true;
  if (this.isConnected) {
   try {
    await this.client.disconnect();
    this.isConnected = false;
    logger.info('Redis disconnected successfully');
   } catch (error) {
    logger.error('Failed to disconnect from Redis:', error);
   }
  }
 }

 async healthCheck(): Promise<boolean> {
  try {
   if (!this.isConnected || this.isShuttingDown) {
    return false;
   }
   await this.client.ping();
   return true;
  } catch (error) {
   logger.error('Redis health check failed:', error);
   this.isConnected = false;
   return false;
  }
 }

 private startHealthCheck(): void {
  // Run health check every 20 seconds to keep connection active
  const healthCheckInterval = setInterval(async () => {
   if (this.isShuttingDown) {
    clearInterval(healthCheckInterval);
    return;
   }

   try {
    const isHealthy = await this.healthCheck();
    if (!isHealthy && this.isConnected) {
     logger.warn('Redis health check failed, connection may be unstable');
     this.isConnected = false;
    }
   } catch (error) {
    logger.error('Health check error:', error);
   }
  }, 20000);

  // Clean up interval on shutdown
  process.on('SIGINT', () => {
   clearInterval(healthCheckInterval);
  });

  process.on('SIGTERM', () => {
   clearInterval(healthCheckInterval);
  });
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
   // Drop existing index to ensure correct schema (idempotent)
   try {
    await this.client.sendCommand(['FT.DROPINDEX', 'idx:executions']);
    logger.info('Dropped existing execution index');
   } catch (_err) {
    // ignore if not exists
   }

   logger.info('Creating execution search index...');
   await this.client.ft.create(
    'idx:executions',
    {
     '$.jobId': {
      type: SchemaFieldTypes.TAG,
      AS: 'jobId',
     },
     '$.status': {
      type: SchemaFieldTypes.TAG,
      AS: 'status',
     },
     '$.startedAt': {
      type: SchemaFieldTypes.TEXT,
      AS: 'startedAt',
     },
     '$.finishedAt': {
      type: SchemaFieldTypes.TEXT,
      AS: 'finishedAt',
     },
     '$.duration': {
      type: SchemaFieldTypes.NUMERIC,
      AS: 'duration',
     },
     '$.codeLanguage': {
      type: SchemaFieldTypes.TAG,
      AS: 'codeLanguage',
     },
     '$.stdout': {
      type: SchemaFieldTypes.TEXT,
      AS: 'stdout',
     },
     '$.stderr': {
      type: SchemaFieldTypes.TEXT,
      AS: 'stderr',
     },
    },
    {
     ON: 'JSON',
     PREFIX: 'execution:',
    }
   );
  } catch (error: unknown) {
   const errorMsg = error instanceof Error ? error.message : String(error);
   if (!errorMsg.includes('Index already exists')) {
    throw error;
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
  try {
   await this.ensureConnection();
   const key = `job:${job.id}`;
   await this.client.json.set(key, '$', job as unknown as any);
   logger.info(`Job created: ${job.id}`);
  } catch (error) {
   logger.error(`Failed to create job ${job.id}:`, error);
   throw error;
  }
 }

 async getJob(jobId: string): Promise<JobData | null> {
  try {
   await this.ensureConnection();
   const key = `job:${jobId}`;
   const job = await this.client.json.get(key);
   return job as JobData | null;
  } catch (error) {
   logger.error(`Failed to get job ${jobId}:`, error);
   return null;
  }
 }

 async updateJob(jobId: string, updates: Partial<JobData>): Promise<void> {
  try {
   await this.ensureConnection();
   const key = `job:${jobId}`;

   // Update individual fields
   for (const [field, value] of Object.entries(updates)) {
    if (value === undefined || value === null) continue;
    await this.client.json.set(key, `$.${field}`, value as any);
   }

   // Update timestamp
   await this.client.json.set(key, '$.updatedAt', new Date().toISOString());

   logger.info(`Job updated: ${jobId}`);
  } catch (error) {
   logger.error(`Failed to update job ${jobId}:`, error);
   throw error;
  }
 }

 async deleteJob(jobId: string): Promise<void> {
  try {
   await this.ensureConnection();
   const key = `job:${jobId}`;
   await this.client.json.del(key);

   // Also delete related executions
   const executions = await this.getJobExecutions(jobId);
   for (const execution of executions) {
    await this.client.json.del(`execution:${execution.id}`);
   }

   logger.info(`Job deleted: ${jobId}`);
  } catch (error) {
   logger.error(`Failed to delete job ${jobId}:`, error);
   throw error;
  }
 }

 async searchJobs(
  query: string,
  filters?: Record<string, unknown>,
  limit?: number,
  offset?: number
 ): Promise<JobData[]> {
  try {
   await this.ensureConnection();
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
    if (finalQuery === '*') {
     finalQuery = filterParts.join(' ');
    } else {
     finalQuery = `${finalQuery} ${filterParts.join(' ')}`;
    }
   }

   logger.info(`Executing RedisSearch query: ${finalQuery}`);
   logger.info(`Filters:`, filters);

   const results = await this.client.ft.search('idx:jobs', finalQuery, {
    LIMIT: {
     from: offset || 0,
     size: limit || 10,
    },
    SORTBY: {
     BY: 'createdAt',
     DIRECTION: 'DESC',
    },
   });

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
  try {
   await this.ensureConnection();
   const key = `execution:${execution.id}`;

   // Clean the execution object for Redis storage
   const cleanExecution: any = {
    id: execution.id,
    jobId: execution.jobId.replace(/-/g, ''), // Normalize jobId by removing hyphens
    status: execution.status,
    startedAt: execution.startedAt,
    retryCount: execution.retryCount || 0,
    maxRetries: execution.maxRetries || 0,
    errorCount: execution.errorCount || 0,
    isCompleted: execution.isCompleted || false,
   };

   if (execution.finishedAt) cleanExecution.finishedAt = execution.finishedAt;
   if (execution.duration !== undefined)
    cleanExecution.duration = execution.duration;
   if (execution.exitCode !== undefined)
    cleanExecution.exitCode = execution.exitCode;
   if (execution.output) cleanExecution.output = execution.output;
   if (execution.error) cleanExecution.error = execution.error;
   // Optional richer telemetry
   if ((execution as any).stdout)
    (cleanExecution as any).stdout = (execution as any).stdout;
   if ((execution as any).stderr)
    (cleanExecution as any).stderr = (execution as any).stderr;
   if ((execution as any).codeSnippet)
    (cleanExecution as any).codeSnippet = (execution as any).codeSnippet;
   if ((execution as any).codeLanguage)
    (cleanExecution as any).codeLanguage = (execution as any).codeLanguage;

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
  try {
   await this.ensureConnection();
   const key = `execution:${executionId}`;

   // Update each field individually to avoid nested object issues
   for (const [field, value] of Object.entries(updates)) {
    if (value !== undefined && value !== null) {
     await this.client.json.set(key, `$.${field}`, value);
    }
   }

   // Handle isCompleted field specifically
   if (updates.status && updates.status !== 'running') {
    const isCompleted = ['success', 'failed', 'timeout', 'cancelled'].includes(
     updates.status
    );
    await this.client.json.set(key, '$.isCompleted', isCompleted);
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
   await this.ensureConnection();
   // Normalize jobId by removing optional 'job:' prefix and hyphens for consistent searching
   const normalizedJobId = jobId.replace(/^job:/, '').replace(/-/g, '');
   // jobId is indexed as TAG → use braces
   const query = `@jobId:{${normalizedJobId}}`;
   const results = await this.client.ft.search('idx:executions', query, {
    LIMIT: { from: 0, size: limit },
    SORTBY: { BY: 'startedAt', DIRECTION: 'DESC' },
   });

   const executions: JobExecution[] = [];
   if (results && typeof results === 'object' && 'documents' in results) {
    for (const doc of results.documents) {
     try {
      const execution = doc.value as unknown as JobExecution;
      executions.push(execution);
     } catch (parseError) {
      logger.error('Failed to process execution document:', parseError);
     }
    }
   }
   return executions;
  } catch (error) {
   logger.error('Failed to get job executions:', error);
   return [];
  }
 }

 async getExecutionLogs(executionId: string, limit = 100): Promise<any[]> {
  try {
   await this.ensureConnection();
   const key = `execution:${executionId}:logs`;
   const logs = await this.client.lRange(key, 0, limit - 1);
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
   await this.ensureConnection();
   const key = `execution:${executionId}:logs`;
   await this.client.lPush(key, JSON.stringify(logEntry));
   await this.client.lTrim(key, 0, 999); // Keep only last 1000 logs
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
   await this.ensureConnection();
   const tsKey = key.startsWith('ts:') ? key : `ts:${key}`;
   const ts = timestamp || Date.now();

   // Try INCRBY for counters; fallback to ADD
   try {
    await this.client.ts.incrBy(tsKey, value, { TIMESTAMP: ts });
   } catch (err: any) {
    // If series does not exist, create with DUPLICATE_POLICY LAST, then add
    try {
     await this.client.ts.create(tsKey, {
      DUPLICATE_POLICY: 'LAST',
     } as any);
    } catch (createErr: any) {
     // Ignore if already exists
     if (!String(createErr?.message || '').includes('key already exists')) {
      logger.warn(
       `Failed to create TimeSeries ${tsKey}:`,
       createErr?.message || createErr
      );
     }
    }
    // After ensuring existence, add the sample
    await this.client.ts.add(tsKey, ts, value, { ON_DUPLICATE: 'LAST' } as any);
   }
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
   await this.ensureConnection();
   const tsKey = key.startsWith('ts:') ? key : `ts:${key}`;
   const range = await this.client.ts.range(tsKey, fromTimestamp, toTimestamp);
   return range.map((point: any) => [point.timestamp, point.value]);
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
   await this.ensureConnection();
   const channel = `job:${event}`;
   const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
   });
   await this.client.publish(channel, message);
   logger.info(`Published job event: ${event}`);
  } catch (error) {
   logger.error(`Failed to publish job event ${event}:`, error);
  }
 }

 async publishJobExecution(
  event: string,
  data: Record<string, unknown>
 ): Promise<void> {
  try {
   await this.ensureConnection();
   const channel = `execution:${event}`;
   const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
   });
   await this.client.publish(channel, message);
   logger.info(`Published execution event: ${event}`);
  } catch (error) {
   logger.error(`Failed to publish execution event ${event}:`, error);
  }
 }

 async publishSystemMetrics(
  event: string,
  data: Record<string, unknown>
 ): Promise<void> {
  try {
   await this.ensureConnection();
   const channel = `metrics:${event}`;
   const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
   });
   await this.client.publish(channel, message);
   logger.info(`Published system metrics: ${event}`);
  } catch (error) {
   logger.error(`Failed to publish system metrics ${event}:`, error);
  }
 }

 async publishNotification(
  event: string,
  data: Record<string, unknown>
 ): Promise<void> {
  try {
   await this.ensureConnection();
   const channel = `notification:${event}`;
   const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
   });
   await this.client.publish(channel, message);
   logger.info(`Published notification: ${event}`);
  } catch (error) {
   logger.error(`Failed to publish notification ${event}:`, error);
  }
 }

 // Health Check
 async ping(): Promise<boolean> {
  try {
   await this.ensureConnection();
   const result = await this.client.ping();
   return result === 'PONG';
  } catch (error) {
   logger.error('Redis ping failed:', error);
   return false;
  }
 }

 // Health check method for Redis and job statistics
 async getDebugInfo(): Promise<any> {
  try {
   await this.ensureConnection();
   const info = await this.client.info();
   const keys = await this.client.dbSize();
   return {
    connected: this.isConnected,
    info: info.split('\r\n').reduce((acc: any, line: string) => {
     const [key, value] = line.split(':');
     if (key && value) {
      acc[key] = value;
     }
     return acc;
    }, {}),
    keys,
    reconnectAttempts: this.reconnectAttempts,
   };
  } catch (error) {
   logger.error('Failed to get debug info:', error);
   return {
    connected: this.isConnected,
    error: error instanceof Error ? error.message : 'Unknown error',
    reconnectAttempts: this.reconnectAttempts,
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

 // Clear all data from database (for development/testing)
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
