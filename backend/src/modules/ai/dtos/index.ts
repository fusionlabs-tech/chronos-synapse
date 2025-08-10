export interface AnalyzeErrorDto {
 error: string;
 context?: string;
 jobId?: string;
}

export interface AnalyzeJobDto {
 jobId: string;
 includeCode?: boolean;
 includeMetrics?: boolean;
}

export interface DetectAnomaliesDto {
 jobId: string;
 timeRange?: string;
}

export interface SuggestScheduleDto {
 jobId: string;
}

export interface RetryStrategyDto {
 jobId: string;
 error?: string;
}

export interface OptimizePerformanceDto {
 jobId: string;
}
