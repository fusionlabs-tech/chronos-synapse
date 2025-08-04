// User-related types
export interface User {
 id: string;
 email: string;
 username: string;
 firstName?: string;
 lastName?: string;
 role: 'USER' | 'ADMIN';
 isActive: boolean;
 lastLoginAt?: string;
 createdAt: string;
 updatedAt: string;
}

// Notification types
export interface Notification {
 id: string;
 userId: string;
 type:
  | 'job_success'
  | 'job_failed'
  | 'job_timeout'
  | 'system_alert'
  | 'job_created'
  | 'job_updated'
  | 'job_deleted';
 title: string;
 message: string;
 data?: Record<string, any>;
 isRead: boolean;
 createdAt: string;
 readAt?: string;
}

export interface NotificationResponse {
 notifications: Notification[];
 unreadCount: number;
 pagination?: PaginationInfo;
}

// Job-related types
export interface Job {
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

export interface JobPerformanceMetrics {
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
}

export interface SystemPerformanceMetrics {
 totalJobs: number;
 activeJobs: number;
 totalExecutions: number;
 systemSuccessRate: number;
 averageJobDuration: number;
 topPerformingJobs: JobPerformanceMetrics[];
 underperformingJobs: JobPerformanceMetrics[];
 recentFailures: Array<{
  jobId: string;
  jobName: string;
  error: string;
  timestamp: string;
  duration: number;
 }>;
}

// API Response types
export interface ApiResponse<T> {
 success: boolean;
 data?: T;
 error?: string;
 message?: string;
}

export interface PaginationInfo {
 page: number;
 limit: number;
 total: number;
 totalPages: number;
 hasNext: boolean;
 hasPrev: boolean;
}

export interface JobsResponse {
 jobs: Job[];
 pagination?: PaginationInfo;
 view?: 'list' | 'grid';
}

export interface MetricsData {
 timestamp: number;
 value: number;
}

export interface SystemHealth {
 redis: 'connected' | 'error';
 totalKeys: number;
 jobCount: number;
 executionCount: number;
}

// Dashboard types
export interface DashboardStats {
 totalJobs: number;
 activeJobs: number;
 recentExecutions: number;
 successRate: number;
 avgDuration: number;
}

// SSE types
export interface SSEMessage {
 type: 'job_status' | 'job_execution' | 'system_metrics' | 'notification';
 data: Record<string, unknown>;
 timestamp: string;
}

// AI Analysis types
export interface AnomalyDetectionResult {
 isAnomaly: boolean;
 confidence: number;
 reason: string;
 severity: 'low' | 'medium' | 'high';
 suggestions: string[];
}

export interface PredictiveScheduleResult {
 suggestedSchedule: string;
 confidence: number;
 reasoning: string;
 expectedImprovement: string;
}

export interface SmartRetryResult {
 shouldRetry: boolean;
 retryDelay: number;
 maxRetries: number;
 reasoning: string;
 strategy: string;
}

export interface PerformanceOptimizationResult {
 score: number;
 issues: string[];
 suggestions: string[];
 estimatedImprovement: string;
}

export interface AIAnalysisResult {
 jobId: string;
 timestamp: string;
 anomalyDetection?: AnomalyDetectionResult;
 predictiveSchedule?: PredictiveScheduleResult;
 smartRetry?: SmartRetryResult;
 performanceOptimization?: PerformanceOptimizationResult;
}

// Form types
export interface JobFormData {
 name: string;
 description?: string;
 schedule: string;
 command: string;
 enabled: boolean;
 timeout: number;
 retries: number;
 tags: string[];
 environment?: Record<string, string>;
}

// Filter and search types
export interface JobFilters {
 enabled?: boolean;
 userId?: string;
 teamId?: string;
 tags?: string[];
 search?: string;
}

export interface SortOption {
 field: keyof Job;
 direction: 'asc' | 'desc';
}

// Chart types
export interface ChartDataPoint {
 timestamp: number;
 value: number;
 label?: string;
}

export interface ChartConfig {
 title: string;
 type: 'line' | 'bar' | 'area';
 dataKey: string;
 color: string;
}
