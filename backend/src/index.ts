// Load environment variables FIRST - before any other imports!
import 'dotenv/config';

// Now import everything else
import Fastify from 'fastify';
import cors from '@fastify/cors';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from './utils/logger';
import { redisService } from './services/RedisService';
import { jobScheduler } from './services/JobScheduler';
import { pubSubService } from './services/PubSubService';
import { aiService } from './services/AIService';
import { userService } from './services/UserService';
import {
 requireAuth,
 requireAdmin,
 AuthenticatedRequest,
} from './middleware/auth';
import { requireJobOwnership } from './middleware/jobAuth';
import {
 passwordResetRateLimit,
 loginRateLimit,
 registrationRateLimit,
} from './middleware/rateLimit';
import { validatePassword } from './utils/passwordValidation';
import { RateLimitUtils } from './utils/rateLimitUtils';
import notificationRoutes from './routes/notifications';

// Initialize Anthropic
const anthropic = new Anthropic({
 apiKey: process.env.ANTHROPIC_API_KEY,
});

// Create Fastify instance
const fastify = Fastify({
 logger: {
  level: 'info',
  ...(process.env.NODE_ENV === 'development' && {
   transport: {
    target: 'pino-pretty',
   },
  }),
 },
});

// Register plugins
fastify.register(cors, {
 origin: process.env.FRONTEND_URL || 'http://localhost:3000',
 credentials: true,
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 allowedHeaders: ['Content-Type', 'Authorization'],
});

// Health check endpoint
fastify.get('/health', async () => {
 try {
  // Check Redis connection
  const redisHealthy = await redisService.ping();

  return {
   status: 'healthy',
   timestamp: new Date().toISOString(),
   services: {
    redis: redisHealthy ? 'connected' : 'disconnected',
    scheduler: 'running',
   },
   stats: {
    scheduledJobs: jobScheduler.getScheduledJobsCount(),
    runningExecutions: jobScheduler.getRunningExecutionsCount(),
   },
  };
 } catch (error) {
  fastify.log.error('Health check failed:', error);
  return {
   status: 'unhealthy',
   timestamp: new Date().toISOString(),
   error: error instanceof Error ? error.message : 'Unknown error',
  };
 }
});

// API routes
fastify.register(async function (fastify) {
 // Jobs CRUD API
 fastify.get(
  '/api/jobs',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest) => {
   const {
    search,
    enabled,
    teamId,
    page = '1',
    limit = '20',
    view = 'list',
   } = request.query as any;

   const filters: Record<string, any> = {};
   if (enabled !== undefined) filters.enabled = enabled;
   // Always filter by the authenticated user's ID
   filters.userId = request.user!.id.replace(/-/g, '');
   if (teamId) filters.teamId = teamId;

   const pageNum = parseInt(page) || 1;
   const limitNum = parseInt(limit) || 20;
   const offset = (pageNum - 1) * limitNum;

   const jobs = await jobScheduler.searchJobs(
    search,
    filters,
    limitNum,
    offset
   );
   const totalJobs = await jobScheduler.getJobsCount(search, filters);

   return {
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
   };
  }
 );

 fastify.get(
  '/api/jobs/:id',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { id } = request.params as { id: string };
   const job = await jobScheduler.getJob(id);

   return { job };
  }
 );

 fastify.post(
  '/api/jobs',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest) => {
   const jobData = request.body as any; // TODO: Add proper validation with Zod

   // Set the authenticated user's ID
   jobData.userId = request.user!.id.replace(/-/g, '');

   const job = await jobScheduler.createJob(jobData);
   return { job };
  }
 );

 fastify.put(
  '/api/jobs/:id',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { id } = request.params as { id: string };
   const updates = request.body as any;

   const job = await jobScheduler.updateJob(id, updates);
   return { job };
  }
 );

 fastify.delete(
  '/api/jobs/:id',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { id } = request.params as { id: string };

   await jobScheduler.deleteJob(id);
   return { success: true };
  }
 );

 // Execute job manually
 fastify.post(
  '/api/jobs/:id/execute',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { id } = request.params as { id: string };

   await jobScheduler.executeJobManually(id);

   return { success: true, message: 'Job execution started' };
  }
 );

 // Job Executions API
 fastify.get(
  '/api/jobs/:id/executions',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { id } = request.params as { id: string };
   const { limit = '10' } = request.query as any;

   const executions = await jobScheduler.getJobExecutions(id, parseInt(limit));
   return { executions };
  }
 );

 // Get specific execution by ID
 fastify.get(
  '/api/jobs/:id/executions/:executionId',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { executionId } = request.params as { executionId: string };
   const execution = await redisService.getExecutionById(executionId);
   if (!execution) {
    throw new Error('Execution not found');
   }
   return execution;
  }
 );

 // Get job status with real-time information
 fastify.get(
  '/api/jobs/:id/status',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { id } = request.params as { id: string };

   try {
    const status = await jobScheduler.getJobStatus(id);
    return status;
   } catch (error) {
    fastify.log.error('Failed to get job status:', error);
    throw new Error('Failed to get job status');
   }
  }
 );

 // Get job performance metrics
 fastify.get(
  '/api/jobs/:id/performance',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { id } = request.params as { id: string };
   const { days = '30' } = request.query as { days?: string };

   try {
    const metrics = await jobScheduler.getJobPerformanceMetrics(
     id,
     parseInt(days)
    );
    return metrics;
   } catch (error) {
    fastify.log.error('Failed to get job performance metrics:', error);
    throw new Error('Failed to get job performance metrics');
   }
  }
 );

 // Get system performance metrics
 fastify.get(
  '/api/analytics/performance',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   const { days = '30' } = request.query as { days?: string };
   const userId = request.user!.id.replace(/-/g, '');

   try {
    const metrics = await jobScheduler.getSystemPerformanceMetrics(
     userId,
     parseInt(days)
    );
    return metrics;
   } catch (error) {
    fastify.log.error('Failed to get system performance metrics:', error);
    throw new Error('Failed to get system performance metrics');
   }
  }
 );

 // User Profile Management
 fastify.put(
  '/api/users/profile',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   const userId = request.user!.id;
   const profileData = request.body as {
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string;
   };

   try {
    const updatedUser = await userService.updateUser(userId, profileData);
    if (!updatedUser) {
     throw new Error('Failed to update profile');
    }
    return updatedUser;
   } catch (error) {
    fastify.log.error('Failed to update user profile:', error);
    throw error;
   }
  }
 );

 fastify.post(
  '/api/users/change-password',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   const userId = request.user!.id;
   const { currentPassword, newPassword } = request.body as {
    currentPassword: string;
    newPassword: string;
   };

   try {
    const success = await userService.changePassword(
     userId,
     currentPassword,
     newPassword
    );
    if (!success) {
     throw new Error('Invalid current password');
    }
    return { success: true };
   } catch (error) {
    fastify.log.error('Failed to change password:', error);
    throw error;
   }
  }
 );

 // API Key Management
 fastify.get(
  '/api/users/api-keys',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   const userId = request.user!.id;

   try {
    const apiKeys = await userService.getUserApiKeys(userId);
    return { keys: apiKeys };
   } catch (error) {
    fastify.log.error('Failed to get API keys:', error);
    throw error;
   }
  }
 );

 fastify.post(
  '/api/users/api-keys',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   const userId = request.user!.id;
   const { name, permissions } = request.body as {
    name: string;
    permissions: string[];
   };

   try {
    const apiKey = await userService.createApiKey(userId, name, permissions);
    return apiKey;
   } catch (error) {
    fastify.log.error('Failed to create API key:', error);
    throw error;
   }
  }
 );

 fastify.delete(
  '/api/users/api-keys/:apiKeyId',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   const userId = request.user!.id;
   const { apiKeyId } = request.params as { apiKeyId: string };

   try {
    const success = await userService.deleteApiKey(apiKeyId, userId);
    if (!success) {
     throw new Error('Failed to delete API key');
    }
    return { success: true };
   } catch (error) {
    fastify.log.error('Failed to delete API key:', error);
    throw error;
   }
  }
 );

 // Admin Management Endpoints
 fastify.get(
  '/api/admin/users',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   // Check if user is admin
   if (request.user!.role !== 'ADMIN') {
    throw new Error('Admin access required');
   }

   try {
    const users = await userService.getAllUsers();
    return { users };
   } catch (error) {
    fastify.log.error('Failed to get users:', error);
    throw error;
   }
  }
 );

 fastify.get(
  '/api/admin/system-stats',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   // Check if user is admin
   if (request.user!.role !== 'ADMIN') {
    throw new Error('Admin access required');
   }

   try {
    const users = await userService.getAllUsers();
    const activeUsers = users.filter((user) => user.isActive).length;

    // Get system-wide job statistics
    const allJobs = await jobScheduler.searchJobs('*', {});
    const activeJobs = allJobs.filter((job) => job.enabled).length;

    // Calculate total executions across all users
    let totalExecutions = 0;
    for (const job of allJobs) {
     const executions = await jobScheduler.getJobExecutions(job.id, 1000);
     totalExecutions += executions.length;
    }

    // Calculate system success rate
    let successfulExecutions = 0;
    for (const job of allJobs) {
     const executions = await jobScheduler.getJobExecutions(job.id, 1000);
     successfulExecutions += executions.filter(
      (exec) => exec.status === 'success'
     ).length;
    }

    const systemSuccessRate =
     totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    // Mock recent activity (in a real system, this would come from an activity log)
    const recentActivity = [
     {
      type: 'user_login',
      description: 'User logged in',
      timestamp: new Date().toISOString(),
      userId: request.user!.id,
     },
     {
      type: 'job_created',
      description: 'New job created',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      userId: request.user!.id,
     },
    ];

    return {
     totalUsers: users.length,
     activeUsers,
     totalJobs: allJobs.length,
     activeJobs,
     totalExecutions,
     systemSuccessRate,
     recentActivity,
    };
   } catch (error) {
    fastify.log.error('Failed to get system stats:', error);
    throw error;
   }
  }
 );

 fastify.put(
  '/api/admin/users/:userId/status',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   // Check if user is admin
   if (request.user!.role !== 'ADMIN') {
    throw new Error('Admin access required');
   }

   const { userId } = request.params as { userId: string };
   const { isActive } = request.body as { isActive: boolean };

   try {
    const updatedUser = await userService.updateUser(userId, { isActive });
    if (!updatedUser) {
     throw new Error('Failed to update user status');
    }
    return { success: true };
   } catch (error) {
    fastify.log.error('Failed to update user status:', error);
    throw error;
   }
  }
 );

 fastify.delete(
  '/api/admin/users/:userId',
  { preHandler: [requireAuth] },
  async (request: AuthenticatedRequest) => {
   // Check if user is admin
   if (request.user!.role !== 'ADMIN') {
    throw new Error('Admin access required');
   }

   const { userId } = request.params as { userId: string };

   try {
    const success = await userService.deleteUser(userId);
    if (!success) {
     throw new Error('Failed to delete user');
    }
    return { success: true };
   } catch (error) {
    fastify.log.error('Failed to delete user:', error);
    throw error;
   }
  }
 );

 // User Management API
 fastify.post(
  '/api/auth/register',
  {
   preHandler: registrationRateLimit,
  },
  async (request) => {
   const userData = request.body as any;

   // Validate password strength
   const passwordValidation = validatePassword(userData.password);
   if (!passwordValidation.isValid) {
    throw new Error(
     `Password validation failed: ${passwordValidation.errors.join(', ')}`
    );
   }

   try {
    const user = await userService.createUser(userData);
    return { user };
   } catch (error) {
    fastify.log.error('Failed to register user:', error);
    throw new Error(
     error instanceof Error ? error.message : 'Failed to register user'
    );
   }
  }
 );

 fastify.post(
  '/api/auth/login',
  {
   preHandler: loginRateLimit,
  },
  async (request) => {
   const loginData = request.body as any;

   try {
    const result = await userService.login(loginData);
    if (!result) {
     throw new Error('Invalid credentials');
    }
    return result;
   } catch (error) {
    fastify.log.error('Failed to login user:', error);
    throw new Error(
     error instanceof Error ? error.message : 'Failed to login user'
    );
   }
  }
 );

 fastify.get(
  '/api/auth/me',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest) => {
   try {
    const user = await userService.getUserById(request.user!.id);
    if (!user) {
     throw new Error('User not found');
    }
    return { user };
   } catch (error) {
    fastify.log.error('Failed to get current user:', error);
    throw new Error('Failed to get current user');
   }
  }
 );

 fastify.post(
  '/api/auth/change-password',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest) => {
   const { currentPassword, newPassword } = request.body as any;

   try {
    const success = await userService.changePassword(
     request.user!.id,
     currentPassword,
     newPassword
    );
    if (!success) {
     throw new Error('Invalid current password');
    }
    return { success: true, message: 'Password changed successfully' };
   } catch (error) {
    fastify.log.error('Failed to change password:', error);
    throw new Error(
     error instanceof Error ? error.message : 'Failed to change password'
    );
   }
  }
 );

 // Password Reset API
 fastify.post(
  '/api/auth/reset-password',
  {
   preHandler: passwordResetRateLimit,
  },
  async (request) => {
   const { email } = request.body as any;

   try {
    const success = await userService.requestPasswordReset(email);
    if (success) {
     return { success: true, message: 'Password reset email sent' };
    } else {
     throw new Error('User not found or email not verified');
    }
   } catch (error) {
    fastify.log.error('Failed to request password reset:', error);
    throw new Error(
     error instanceof Error ? error.message : 'Failed to request password reset'
    );
   }
  }
 );

 fastify.post('/api/auth/reset-password/confirm', async (request) => {
  const { token, newPassword } = request.body as any;

  // Validate password strength
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
   throw new Error(
    `Password validation failed: ${passwordValidation.errors.join(', ')}`
   );
  }

  try {
   const success = await userService.confirmPasswordReset(token, newPassword);
   if (success) {
    return { success: true, message: 'Password reset successfully' };
   } else {
    throw new Error('Invalid or expired reset token');
   }
  } catch (error) {
   fastify.log.error('Failed to confirm password reset:', error);
   throw new Error(
    error instanceof Error ? error.message : 'Failed to confirm password reset'
   );
  }
 });

 // Job Logs API - Get detailed execution logs
 fastify.get(
  '/api/jobs/:id/executions/:executionId/logs',
  { preHandler: [requireAuth, requireJobOwnership] },
  async (request: AuthenticatedRequest) => {
   const { executionId } = request.params as {
    executionId: string;
   };
   const { limit = '100' } = request.query as any;

   try {
    const logs = await redisService.getExecutionLogs(
     executionId,
     parseInt(limit)
    );
    return { logs };
   } catch (error) {
    fastify.log.error(
     `Failed to fetch logs for execution ${executionId}:`,
     error
    );
    throw new Error('Failed to fetch execution logs');
   }
  }
 );

 // Metrics API
 fastify.get('/api/metrics', async (request) => {
  const { from, to } = request.query as any;

  const fromTimestamp = from
   ? parseInt(from)
   : Date.now() - 24 * 60 * 60 * 1000; // 24h ago
  const toTimestamp = to ? parseInt(to) : Date.now();

  const metrics = await jobScheduler.getMetrics(fromTimestamp, toTimestamp);
  return { metrics };
 });

 // Real-time metrics endpoint - now handled by WebSocket service

 // Redis TimeSeries endpoint
 fastify.get('/api/metrics/timeseries/:metric', async (request) => {
  const { metric } = request.params as { metric: string };
  const { from, to } = request.query as any;

  try {
   const fromTimestamp = from
    ? parseInt(from)
    : Date.now() - 24 * 60 * 60 * 1000;
   const toTimestamp = to ? parseInt(to) : Date.now();

   const data = await redisService.getMetricRange(
    `ts:jobs:${metric}`,
    fromTimestamp,
    toTimestamp
   );

   return { metric, data };
  } catch (error) {
   fastify.log.error(`Failed to fetch timeseries for ${metric}:`, error);
   throw new Error('Failed to fetch metrics');
  }
 });

 // AI Error Analysis endpoint
 fastify.post('/api/ai/analyze-error', async (request) => {
  const { error, jobId } = request.body as { error: string; jobId: string };

  try {
   // Use Claude for error analysis
   const response = await anthropic.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1000,
    messages: [
     {
      role: 'user',
      content: `Analyze this cron job error and provide structured insights:

Error: ${error}
Job ID: ${jobId}

Please provide:
1. Error category (timeout, permission, syntax, network, etc.)
2. Severity level (low, medium, high, critical)
3. 3-5 specific actionable suggestions to fix this error
4. Brief explanation of the root cause

Format your response as a JSON object with: category, severity, suggestions (array), explanation`,
     },
    ],
   });

   const analysisText =
    response.content[0].type === 'text' ? response.content[0].text : '';

   // Try to parse as JSON, fallback to structured response if needed
   let analysis;
   try {
    analysis = JSON.parse(analysisText);
   } catch {
    // Fallback structured response
    analysis = {
     category: 'parsing_error',
     severity: 'medium',
     suggestions: [
      'Review the error message format',
      'Check job configuration syntax',
      'Verify environment variables',
     ],
     explanation: 'Claude response could not be parsed as JSON',
     rawResponse: analysisText,
    };
   }

   // Add mock similar errors for demo (in real implementation, use Redis vector search)
   analysis.similarErrors = [
    {
     jobId: 'job-123',
     similarity: 0.85,
     message: 'Similar error pattern detected',
    },
    {
     jobId: 'job-456',
     similarity: 0.72,
     message: 'Related configuration issue',
    },
   ];

   return { analysis };
  } catch (error) {
   fastify.log.error('Claude analysis failed:', error);

   // Fallback response if Claude API fails
   return {
    analysis: {
     category: 'unknown',
     severity: 'medium',
     suggestions: [
      'Check error logs for more details',
      'Verify job configuration',
      'Review system resources',
     ],
     explanation: 'AI analysis temporarily unavailable',
     error: error instanceof Error ? error.message : 'Unknown error',
    },
   };
  }
 });

 // Comprehensive AI Analysis
 fastify.post('/api/ai/analyze-job/:id', async (request) => {
  const { id } = request.params as { id: string };

  try {
   const analysis = await aiService.performComprehensiveAnalysis(id);
   return analysis;
  } catch (error) {
   fastify.log.error('Comprehensive AI analysis failed:', error);
   throw new Error('Failed to perform AI analysis');
  }
 });

 // Anomaly Detection
 fastify.post('/api/ai/detect-anomalies/:jobId', async (request) => {
  const { jobId } = request.params as { jobId: string };
  const { executionId } = request.body as { executionId: string };

  try {
   const executions = await redisService.getJobExecutions(jobId, 1);
   if (executions.length === 0) {
    throw new Error('No executions found for job');
   }

   const latestExecution = executions[0];
   const anomalies = await aiService.detectAnomalies(jobId, latestExecution);
   return anomalies;
  } catch (error) {
   fastify.log.error('Anomaly detection failed:', error);
   throw new Error('Failed to detect anomalies');
  }
 });

 // Predictive Scheduling
 fastify.get('/api/ai/suggest-schedule/:jobId', async (request) => {
  const { jobId } = request.params as { jobId: string };

  try {
   const suggestion = await aiService.suggestOptimalSchedule(jobId);
   return suggestion;
  } catch (error) {
   fastify.log.error('Predictive scheduling failed:', error);
   throw new Error('Failed to suggest schedule');
  }
 });

 // Smart Retry Logic
 fastify.post('/api/ai/retry-strategy/:jobId', async (request) => {
  const { jobId } = request.params as { jobId: string };
  const { executionId, attempt } = request.body as {
   executionId: string;
   attempt: number;
  };

  try {
   const executions = await redisService.getJobExecutions(jobId, 1);
   if (executions.length === 0) {
    throw new Error('No executions found for job');
   }

   const latestExecution = executions[0];
   const strategy = await aiService.determineRetryStrategy(
    jobId,
    latestExecution,
    attempt
   );
   return strategy;
  } catch (error) {
   fastify.log.error('Smart retry analysis failed:', error);
   throw new Error('Failed to determine retry strategy');
  }
 });

 // Performance Optimization
 fastify.get('/api/ai/optimize-performance/:jobId', async (request) => {
  const { jobId } = request.params as { jobId: string };

  try {
   const optimization = await aiService.analyzePerformance(jobId);
   return optimization;
  } catch (error) {
   fastify.log.error('Performance optimization failed:', error);
   throw new Error('Failed to optimize performance');
  }
 });

 // Get AI Analysis History
 fastify.get('/api/ai/analysis/:jobId', async (request) => {
  const { jobId } = request.params as { jobId: string };

  try {
   const analysis = await redisService.getAIAnalysis(jobId);
   return { analysis };
  } catch (error) {
   fastify.log.error('Failed to get AI analysis:', error);
   throw new Error('Failed to get AI analysis');
  }
 });

 // Get All AI Analyses
 fastify.get('/api/ai/analyses', async () => {
  try {
   const analyses = await redisService.getAllAIAnalyses();
   return { analyses };
  } catch (error) {
   fastify.log.error('Failed to get all AI analyses:', error);
   throw new Error('Failed to get AI analyses');
  }
 });

 // User-specific dashboard stats endpoint
 fastify.get(
  '/api/analytics/dashboard',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest) => {
   try {
    const userId = request.user!.id.replace(/-/g, ''); // Use UUID without hyphens

    // Get user's jobs
    const userJobs = await redisService.searchJobs('*', { userId });
    const enabledJobs = userJobs.filter((job) => job.enabled);

    // Get user's job executions (recent)
    const userExecutions = [];
    for (const job of userJobs) {
     const executions = await redisService.getJobExecutions(job.id, 5);
     userExecutions.push(...executions);
    }

    // Calculate stats
    const totalJobs = userJobs.length;
    const activeJobs = enabledJobs.length;
    const recentExecutions = userExecutions.length;
    const successfulExecutions = userExecutions.filter(
     (exec) => exec.status === 'success'
    ).length;
    const failedExecutions = userExecutions.filter(
     (exec) => exec.status === 'failed'
    ).length;

    // Calculate success rate
    const successRate =
     recentExecutions > 0 ? (successfulExecutions / recentExecutions) * 100 : 0;

    // Calculate average duration from executions
    const totalDuration = userExecutions.reduce(
     (sum, exec) => sum + (exec.duration || 0),
     0
    );
    const avgDuration =
     userExecutions.length > 0 ? totalDuration / userExecutions.length : 0;

    return {
     totalJobs,
     activeJobs,
     recentExecutions,
     successRate: Math.round(successRate * 100) / 100,
     avgDuration: Math.round(avgDuration),
    };
   } catch (error) {
    fastify.log.error('Failed to get dashboard stats:', error);
    throw new Error('Failed to get dashboard stats');
   }
  }
 );

 // Health check endpoint for Redis and job statistics
 fastify.get('/api/health/redis', async () => {
  return await redisService.getDebugInfo();
 });

 // Debug endpoint for RedisSearch
 fastify.get('/api/debug/redis-search', async () => {
  return await redisService.getRedisSearchDebugInfo();
 });

 // Clear database endpoint (for development/testing)
 fastify.get('/api/debug/clear-database', async () => {
  try {
   await redisService.clearDatabase();
   return { message: 'Database cleared successfully' };
  } catch (error) {
   fastify.log.error('Failed to clear database:', error);
   throw new Error('Failed to clear database');
  }
 });

 fastify.get(
  '/api/debug/test-search',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest) => {
   const userId = request.user!.id.replace(/-/g, '');
   const query = `@userId:${userId}`;

   try {
    const results = await redisService.getRedisSearchDebugInfo();
    return {
     userId,
     query,
     debugInfo: results,
    };
   } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
   }
  }
 );

 // Demo endpoints for testing
 fastify.post('/api/demo/create-sample-jobs', async () => {
  const sampleJobs = [
   {
    name: 'Daily Backup',
    description: 'Backup database every day at 2 AM',
    schedule: '0 2 * * *',
    command: 'echo "Running daily backup..."',
    enabled: true,
    timeout: 300,
    retries: 3,
    userId: 'demo-user',
    tags: ['backup', 'daily'],
    environment: { BACKUP_PATH: '/backups' },
   },
   {
    name: 'System Health Check',
    description: 'Check system health every 5 minutes',
    schedule: '*/5 * * * *',
    command: 'echo "System health: OK"',
    enabled: true,
    timeout: 60,
    retries: 1,
    userId: 'demo-user',
    tags: ['monitoring', 'health'],
   },
   {
    name: 'Log Cleanup',
    description: 'Clean old logs weekly',
    schedule: '0 3 * * 0',
    command: 'echo "Cleaning logs..."',
    enabled: false,
    timeout: 600,
    retries: 2,
    userId: 'demo-user',
    tags: ['cleanup', 'weekly'],
   },
  ];

  const createdJobs = [];
  for (const jobData of sampleJobs) {
   const job = await jobScheduler.createJob(jobData);
   createdJobs.push(job);
  }

  return {
   message: 'Sample jobs created successfully',
   jobs: createdJobs,
  };
 });

 // Notification routes
 fastify.register(notificationRoutes, { prefix: '/api' });

 // Rate Limiting Admin Routes (Admin only)
 fastify.get(
  '/api/admin/rate-limits/stats',
  {
   preHandler: requireAuth,
  },
  async (request: AuthenticatedRequest, reply) => {
   try {
    // Check if user is admin
    if (request.user!.role !== 'ADMIN') {
     return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
     });
    }

    const stats = await RateLimitUtils.getRateLimitStats();
    return { stats };
   } catch (error) {
    fastify.log.error('Failed to get rate limit stats:', error);
    throw new Error('Failed to get rate limit statistics');
   }
  }
 );

 fastify.get(
  '/api/admin/rate-limits/keys',
  {
   preHandler: requireAuth,
  },
  async (request: AuthenticatedRequest, reply) => {
   try {
    // Check if user is admin
    if (request.user!.role !== 'ADMIN') {
     return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
     });
    }

    const { pattern = '*' } = request.query as any;
    const keys = await RateLimitUtils.getRateLimitKeys(pattern);

    // Get detailed info for each key
    const keyDetails = await Promise.all(
     keys.map(async (key) => {
      const info = await RateLimitUtils.getRateLimitInfo(key);
      return { key, info };
     })
    );

    return { keys: keyDetails };
   } catch (error) {
    fastify.log.error('Failed to get rate limit keys:', error);
    throw new Error('Failed to get rate limit keys');
   }
  }
 );

 fastify.delete(
  '/api/admin/rate-limits/clear/:key',
  {
   preHandler: requireAuth,
  },
  async (request: AuthenticatedRequest, reply) => {
   try {
    // Check if user is admin
    if (request.user!.role !== 'ADMIN') {
     return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
     });
    }

    const { key } = request.params as any;
    const success = await RateLimitUtils.clearRateLimit(key);

    if (success) {
     return { success: true, message: `Rate limit cleared for ${key}` };
    } else {
     throw new Error('Failed to clear rate limit');
    }
   } catch (error) {
    fastify.log.error('Failed to clear rate limit:', error);
    throw new Error('Failed to clear rate limit');
   }
  }
 );

 fastify.delete(
  '/api/admin/rate-limits/clear-all',
  {
   preHandler: requireAuth,
  },
  async (request: AuthenticatedRequest, reply) => {
   try {
    // Check if user is admin
    if (request.user!.role !== 'ADMIN') {
     return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
     });
    }

    const clearedCount = await RateLimitUtils.clearAllRateLimits();
    return {
     success: true,
     message: `Cleared ${clearedCount} rate limit keys`,
     clearedCount,
    };
   } catch (error) {
    fastify.log.error('Failed to clear all rate limits:', error);
    throw new Error('Failed to clear all rate limits');
   }
  }
 );
});

// Start server
const start = async () => {
 try {
  // Connect to Redis
  await redisService.connect();

  // Initialize Pub/Sub service
  await pubSubService.initialize(fastify);
  logger.info('Pub/Sub service initialized');

  // Create default admin user
  await userService.createDefaultAdmin();
  logger.info('Default admin user created/verified');

  // Start job scheduler
  await jobScheduler.start();
  logger.info('Job scheduler started');

  // Start server
  const port = parseInt(process.env.PORT || '3001');
  await fastify.listen({ port, host: '0.0.0.0' });
  logger.info(`Server listening on port ${port}`);
 } catch (error) {
  logger.error('Failed to start server:', error);
  process.exit(1);
 }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
 logger.info('Received SIGTERM, shutting down gracefully');
 await jobScheduler.shutdown();
 await fastify.close();
 process.exit(0);
});

start();
