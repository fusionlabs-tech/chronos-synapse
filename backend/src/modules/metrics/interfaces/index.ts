export interface MetricsData {
 timestamp: number;
 value: number;
}

export interface SystemMetrics {
 totalJobs: number;
 activeJobs: number;
 totalExecutions: number;
 systemSuccessRate: number;
 averageJobDuration: number;
}

export interface JobMetrics {
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

export interface MetricsQueryDto {
 fromTimestamp?: string;
 toTimestamp?: string;
 metric?: string;
}
