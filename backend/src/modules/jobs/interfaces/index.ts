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

export interface JobFilters {
 enabled?: boolean;
 userId?: string;
 teamId?: string;
 tags?: string[];
 search?: string;
}

export interface JobFormData {
 name: string;
 description?: string;
 schedule: string;
 command: string;
 enabled: boolean;
 timeout: number;
 retries?: number;
 tags: string[];
 environment?: Record<string, string>;
 code?: string;
 language?: string;
 filename?: string;
 allowNetwork?: boolean;
}
