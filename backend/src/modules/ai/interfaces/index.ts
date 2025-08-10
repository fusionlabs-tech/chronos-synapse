export interface AIAnalysisResult {
 jobId: string;
 timestamp: string;
 anomalyDetection?: AnomalyDetectionResult;
 predictiveSchedule?: PredictiveScheduleResult;
 smartRetry?: SmartRetryResult;
 performanceOptimization?: PerformanceOptimizationResult;
}

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

export interface ErrorAnalysisRequest {
 error: string;
 context?: string;
 jobId?: string;
}

export interface JobAnalysisRequest {
 jobId: string;
 includeCode?: boolean;
 includeMetrics?: boolean;
}
