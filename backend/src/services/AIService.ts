import { logger } from '../utils/logger';
import { redisService, JobData, JobExecution } from './RedisService';

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

export class AIService {
 constructor() {}

 /**
  * Analyze job execution for anomalies
  */
 async detectAnomalies(
  jobId: string,
  execution: JobExecution
 ): Promise<AnomalyDetectionResult> {
  try {
   // Get job history for analysis
   const job = await redisService.getJob(jobId);
   if (!job) {
    throw new Error('Job not found');
   }

   const executions = await redisService.getJobExecutions(jobId, 50);

   // Calculate baseline metrics
   const baselineMetrics = this.calculateBaselineMetrics(executions);

   // Check for anomalies
   const anomalies = this.checkForAnomalies(execution, baselineMetrics, job);

   // Use AI to analyze and provide insights
   const aiAnalysis = await this.analyzeAnomaliesWithAI(
    job,
    execution,
    anomalies,
    baselineMetrics
   );

   return aiAnalysis;
  } catch (error) {
   logger.error('Anomaly detection failed:', error);
   return {
    isAnomaly: false,
    confidence: 0,
    reason: 'Analysis failed',
    severity: 'low',
    suggestions: ['Check system logs for more details'],
   };
  }
 }

 /**
  * Suggest optimal schedule based on historical data
  */
 async suggestOptimalSchedule(
  jobId: string
 ): Promise<PredictiveScheduleResult> {
  try {
   const job = await redisService.getJob(jobId);
   if (!job) {
    throw new Error('Job not found');
   }

   const executions = await redisService.getJobExecutions(jobId, 100);

   if (executions.length < 10) {
    return {
     suggestedSchedule: job.schedule,
     confidence: 0.3,
     reasoning: 'Insufficient historical data for reliable prediction',
     expectedImprovement: 'Collect more execution data for better suggestions',
    };
   }

   // Analyze execution patterns
   const patterns = this.analyzeExecutionPatterns(executions);

   // Use AI to suggest optimal schedule
   const aiSuggestion = await this.suggestScheduleWithAI(
    job,
    patterns,
    executions
   );

   return aiSuggestion;
  } catch (error) {
   logger.error('Predictive scheduling failed:', error);
   return {
    suggestedSchedule: '0 * * * *', // Default hourly
    confidence: 0,
    reasoning: 'Analysis failed',
    expectedImprovement: 'Unable to provide suggestions',
   };
  }
 }

 /**
  * Determine smart retry strategy
  */
 async determineRetryStrategy(
  jobId: string,
  execution: JobExecution,
  attempt: number
 ): Promise<SmartRetryResult> {
  try {
   const job = await redisService.getJob(jobId);
   if (!job) {
    throw new Error('Job not found');
   }

   const executions = await redisService.getJobExecutions(jobId, 50);
   const failurePatterns = this.analyzeFailurePatterns(executions);

   // Use AI to determine retry strategy
   const aiStrategy = await this.determineRetryWithAI(
    job,
    execution,
    attempt,
    failurePatterns
   );

   return aiStrategy;
  } catch (error) {
   logger.error('Smart retry analysis failed:', error);
   return {
    shouldRetry: attempt < 3,
    retryDelay: Math.pow(2, attempt) * 1000, // Exponential backoff
    maxRetries: 3,
    reasoning: 'Fallback to default retry strategy',
    strategy: 'exponential_backoff',
   };
  }
 }

 /**
  * Analyze job performance and suggest optimizations
  */
 async analyzePerformance(
  jobId: string
 ): Promise<PerformanceOptimizationResult> {
  try {
   const job = await redisService.getJob(jobId);
   if (!job) {
    throw new Error('Job not found');
   }

   const executions = await redisService.getJobExecutions(jobId, 50);

   // Analyze performance metrics
   const performanceMetrics = this.analyzePerformanceMetrics(job, executions);

   // Use AI to suggest optimizations
   const aiOptimization = await this.optimizePerformanceWithAI(
    job,
    performanceMetrics,
    executions
   );

   return aiOptimization;
  } catch (error) {
   logger.error('Performance analysis failed:', error);
   return {
    score: 0,
    issues: ['Analysis failed'],
    suggestions: ['Check system logs for more details'],
    estimatedImprovement: 'Unable to provide suggestions',
   };
  }
 }

 /**
  * Comprehensive AI analysis for a job
  */
 async performComprehensiveAnalysis(jobId: string): Promise<AIAnalysisResult> {
  try {
   const job = await redisService.getJob(jobId);
   if (!job) {
    throw new Error('Job not found');
   }

   const executions = await redisService.getJobExecutions(jobId, 50);
   const latestExecution = executions[0];

   const [
    anomalyDetection,
    predictiveSchedule,
    smartRetry,
    performanceOptimization,
   ] = await Promise.all([
    latestExecution ? this.detectAnomalies(jobId, latestExecution) : null,
    this.suggestOptimalSchedule(jobId),
    latestExecution
     ? this.determineRetryStrategy(jobId, latestExecution, 1)
     : null,
    this.analyzePerformance(jobId),
   ]);

   const result: AIAnalysisResult = {
    jobId,
    timestamp: new Date().toISOString(),
    predictiveSchedule,
    performanceOptimization,
   };

   if (anomalyDetection) {
    result.anomalyDetection = anomalyDetection;
   }

   if (smartRetry) {
    result.smartRetry = smartRetry;
   }

   // Store analysis result
   await redisService.storeAIAnalysis(jobId, result);

   return result;
  } catch (error) {
   logger.error('Comprehensive AI analysis failed:', error);
   throw error;
  }
 }

 // Private helper methods

 private calculateBaselineMetrics(executions: JobExecution[]) {
  const successfulExecutions = executions.filter((e) => e.status === 'success');

  if (successfulExecutions.length === 0) {
   return {
    avgDuration: 0,
    avgExitCode: 0,
    successRate: 0,
    failureRate: 1,
   };
  }

  const durations = successfulExecutions.map((e) => e.duration || 0);
  const avgDuration =
   durations.reduce((sum, d) => sum + d, 0) / durations.length;

  const successRate = successfulExecutions.length / executions.length;
  const failureRate = 1 - successRate;

  return {
   avgDuration,
   avgExitCode: 0,
   successRate,
   failureRate,
  };
 }

 private checkForAnomalies(
  execution: JobExecution,
  baseline: any,
  job: JobData
 ) {
  const anomalies: string[] = [];

  // Check duration anomalies
  if (execution.duration && baseline.avgDuration > 0) {
   const durationRatio = execution.duration / baseline.avgDuration;
   if (durationRatio > 2) {
    anomalies.push(
     `Execution time is ${durationRatio.toFixed(1)}x longer than average`
    );
   }
  }

  // Check status anomalies
  if (execution.status === 'failed' && baseline.successRate > 0.8) {
   anomalies.push('Job failed despite high historical success rate');
  }

  // Check timeout anomalies
  if (
   execution.duration &&
   job.timeout &&
   execution.duration > job.timeout * 0.8
  ) {
   anomalies.push('Job execution approaching timeout limit');
  }

  return anomalies;
 }

 private analyzeExecutionPatterns(executions: JobExecution[]) {
  const patterns = {
   timeOfDay: new Array(24).fill(0),
   dayOfWeek: new Array(7).fill(0),
   durationTrend: [] as number[],
   successTrend: [] as boolean[],
  };

  executions.forEach((execution) => {
   const date = new Date(execution.startedAt);
   patterns.timeOfDay[date.getHours()]++;
   patterns.dayOfWeek[date.getDay()]++;

   if (execution.duration) {
    patterns.durationTrend.push(execution.duration);
   }

   patterns.successTrend.push(execution.status === 'success');
  });

  return patterns;
 }

 private analyzeFailurePatterns(executions: JobExecution[]) {
  const failures = executions.filter((e) => e.status === 'failed');

  return {
   totalFailures: failures.length,
   failureRate: failures.length / executions.length,
   commonErrorPatterns: this.extractErrorPatterns(failures),
   retrySuccessRate: this.calculateRetrySuccessRate(executions),
  };
 }

 private analyzePerformanceMetrics(job: JobData, executions: JobExecution[]) {
  const successfulExecutions = executions.filter((e) => e.status === 'success');
  const snippetSource = executions.find(
   (e) => typeof e.codeSnippet === 'string' && e.codeSnippet.length > 0
  );
  const codeSnippet = snippetSource?.codeSnippet || '';

  return {
   avgDuration:
    successfulExecutions.length > 0
     ? successfulExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) /
       successfulExecutions.length
     : 0,
   successRate:
    executions.length > 0 ? successfulExecutions.length / executions.length : 0,
   resourceUsage: this.estimateResourceUsage(job, codeSnippet),
   commandComplexity: this.analyzeCommandComplexity(
    codeSnippet || String((job as any)?.command || '')
   ),
  };
 }

 private extractErrorPatterns(failures: JobExecution[]) {
  const patterns: Record<string, number> = {};

  failures.forEach((failure) => {
   if (failure.error) {
    const errorType = this.categorizeError(failure.error);
    patterns[errorType] = (patterns[errorType] || 0) + 1;
   }
  });

  return patterns;
 }

 private categorizeError(error: string): string {
  if (error.includes('timeout')) return 'timeout';
  if (error.includes('permission')) return 'permission';
  if (error.includes('not found')) return 'not_found';
  if (error.includes('connection')) return 'connection';
  return 'unknown';
 }

 private calculateRetrySuccessRate(executions: JobExecution[]) {
  // This would need more sophisticated logic to track retry attempts
  return 0.5; // Placeholder
 }

 private estimateResourceUsage(job: JobData, codeSnippet?: string) {
  // Simple estimation based on observed code snippet (preferred) or legacy command
  const basis = String(
   codeSnippet || (job as any)?.command || ''
  ).toLowerCase();

  if (basis.includes('backup') || basis.includes('dump')) {
   return 'high';
  } else if (
   basis.includes('curl') ||
   basis.includes('wget') ||
   basis.includes('http') ||
   basis.includes('fetch')
  ) {
   return 'medium';
  } else {
   return 'low';
  }
 }

 private analyzeCommandComplexity(source: string) {
  const text = String(source || '');
  const complexity = {
   hasLoops: /\b(for|while|map|reduce|forEach)\b/.test(text),
   hasConditionals: /\b(if|switch|\?|&&|\|\|)\b/.test(text),
   hasPipes: text.includes('|'),
   hasRedirections: text.includes('>') || text.includes('<'),
   commandCount: (text.match(/;|&&/g) || []).length,
  };

  let score = 1;
  if (complexity.hasLoops) score += 2;
  if (complexity.hasConditionals) score += 1;
  if (complexity.hasPipes) score += 1;
  if (complexity.hasRedirections) score += 1;
  score += Math.min(complexity.commandCount, 3);

  return {
   score,
   level: score <= 3 ? 'simple' : score <= 6 ? 'moderate' : 'complex',
   details: complexity,
  };
 }

 // AI-powered analysis methods

 private async analyzeAnomaliesWithAI(
  job: JobData,
  execution: JobExecution,
  anomalies: string[],
  baseline: any
 ): Promise<AnomalyDetectionResult> {
  const lang = (execution as any)?.codeLanguage || 'plaintext';
  const snippet = (execution as any)?.codeSnippet
   ? String((execution as any).codeSnippet).slice(0, 4000)
   : '';
  const codeBlock = snippet
   ? `\nCode Snippet (${lang}):\n\n\`\`\`${lang}\n${snippet}\`\`\`\n`
   : '';
  const prompt = `You are analyzing job execution anomalies in a telemetry-only system (SDK ingests executions; server does not run jobs).

Job Metadata:
- Name: ${job.name}
- Schedule: ${job.schedule || 'One-time/unspecified'}

Current Execution:
- Status: ${execution.status}
- Duration: ${execution.duration}ms
- Exit Code: ${execution.exitCode}
- Error: ${execution.error || 'None'}
${codeBlock}

Baseline Metrics:
- Average Duration: ${baseline.avgDuration}ms
- Success Rate: ${(baseline.successRate * 100).toFixed(1)}%

Detected Anomalies:
${anomalies.map((a) => `- ${a}`).join('\n')}

Analyze this execution and provide:
1. Is this an anomaly? (true/false)
2. Confidence level (0-1)
3. Reason for the anomaly
4. Severity (low/medium/high)
5. Specific suggestions to address the issue

Respond in JSON format:
{
  "isAnomaly": boolean,
  "confidence": number,
  "reason": "string",
  "severity": "low|medium|high",
  "suggestions": ["string"]
}`;

  try {
   // Stubbed result without external API
   return {
    isAnomaly: anomalies.length > 0,
    confidence: anomalies.length > 0 ? 0.7 : 0.2,
    reason: anomalies.join(', ') || 'No specific anomalies detected',
    severity:
     anomalies.length > 2 ? 'high' : anomalies.length > 0 ? 'medium' : 'low',
    suggestions: ['Monitor job execution patterns', 'Check system resources'],
   };
  } catch (error) {
   logger.error('AI anomaly analysis failed:', error);
   return {
    isAnomaly: anomalies.length > 0,
    confidence: 0.5,
    reason: anomalies.join(', ') || 'No specific anomalies detected',
    severity:
     anomalies.length > 2 ? 'high' : anomalies.length > 0 ? 'medium' : 'low',
    suggestions: ['Monitor job execution patterns', 'Check system resources'],
   };
  }
 }

 private async suggestScheduleWithAI(
  job: JobData,
  patterns: any,
  executions: JobExecution[]
 ): Promise<PredictiveScheduleResult> {
  const prompt = `You are an AI system suggesting optimal cron schedules.

Job Metadata:
- Name: ${job.name}
- Current Schedule: ${job.schedule || 'One-time/unspecified'}

Execution Patterns (last ${executions.length} executions):
- Time of day distribution: ${patterns.timeOfDay
   .map((count: number, hour: number) => `${hour}:00 (${count})`)
   .join(', ')}
- Day of week distribution: ${patterns.dayOfWeek
   .map(
    (count: number, day: number) =>
     `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]} (${count})`
   )
   .join(', ')}
- Success rate: ${(
   (patterns.successTrend.filter(Boolean).length /
    patterns.successTrend.length) *
   100
  ).toFixed(1)}%

Based on this data, suggest an optimal cron schedule that:
1. Minimizes conflicts with other jobs
2. Maximizes success rate
3. Considers system load patterns
4. Maintains business requirements

Respond in JSON format:
{
  "suggestedSchedule": "cron_expression",
  "confidence": number,
  "reasoning": "string",
  "expectedImprovement": "string"
}`;

  try {
   // Stub suggestion
   return {
    suggestedSchedule: job.schedule || '0 * * * *',
    confidence: 0.4,
    reasoning: 'Heuristic suggestion without external AI',
    expectedImprovement: 'Collect more data for higher confidence',
   };
  } catch (error) {
   logger.error('AI schedule suggestion failed:', error);
   return {
    suggestedSchedule: job.schedule,
    confidence: 0.3,
    reasoning: 'Unable to analyze patterns due to insufficient data',
    expectedImprovement: 'Consider collecting more execution data',
   };
  }
 }

 private async determineRetryWithAI(
  job: JobData,
  execution: JobExecution,
  attempt: number,
  failurePatterns: any
 ): Promise<SmartRetryResult> {
  const lang = (execution as any)?.codeLanguage || 'plaintext';
  const snippet = (execution as any)?.codeSnippet
   ? String((execution as any).codeSnippet).slice(0, 4000)
   : '';
  const codeBlock = snippet
   ? `\nCode Snippet (${lang}):\n\n\`\`\`${lang}\n${snippet}\`\`\`\n`
   : '';
  const prompt = `You are determining retry strategies for a failed job in a telemetry-only system.

Job Metadata:
- Name: ${job.name}
- Retry Setting: ${(job as any)?.retries ?? 'unspecified'}

Current Failure:
- Attempt: ${attempt}
- Status: ${execution.status}
- Error: ${execution.error || 'None'}
- Duration: ${execution.duration}ms
- Error Stack: ${(execution as any)?.errorStack || 'N/A'}
${codeBlock}

Failure Patterns:
- Total Failures: ${failurePatterns.totalFailures}
- Failure Rate: ${(failurePatterns.failureRate * 100).toFixed(1)}%
- Common Error Types: ${Object.entries(failurePatterns.commonErrorPatterns)
   .map(([type, count]) => `${type} (${count})`)
   .join(', ')}

Should this job be retried? Consider:
1. Error type and likelihood of success
2. Current attempt number vs max retries
3. Historical retry success patterns
4. Resource impact of retries

Respond in JSON format:
{
  "shouldRetry": boolean,
  "retryDelay": number,
  "maxRetries": number,
  "reasoning": "string",
  "strategy": "string"
}`;

  try {
   return {
    shouldRetry: attempt < ((job as any)?.retries ?? 3),
    retryDelay: Math.pow(2, attempt) * 1000,
    maxRetries: (job as any)?.retries ?? 3,
    reasoning: 'Heuristic fallback without external AI',
    strategy: 'exponential_backoff',
   };
  } catch (error) {
   logger.error('AI retry strategy failed:', error);
   return {
    shouldRetry: attempt < job.retries,
    retryDelay: Math.pow(2, attempt) * 1000,
    maxRetries: job.retries,
    reasoning: 'Fallback to exponential backoff strategy',
    strategy: 'exponential_backoff',
   };
  }
 }

 private async optimizePerformanceWithAI(
  job: JobData,
  metrics: any,
  executions: JobExecution[]
 ): Promise<PerformanceOptimizationResult> {
  const latestWithCode = executions.find((e) => (e as any)?.codeSnippet);
  const lang = (latestWithCode as any)?.codeLanguage || 'plaintext';
  const snippet = (latestWithCode as any)?.codeSnippet
   ? String((latestWithCode as any).codeSnippet).slice(0, 4000)
   : '';
  const codeBlock = snippet
   ? `\nCode Snippet (${lang}):\n\n\`\`\`${lang}\n${snippet}\`\`\`\n`
   : '';
  const prompt = `You are optimizing job performance for a telemetry-only system.

Job Metadata:
- Name: ${job.name}
- Schedule: ${job.schedule || 'One-time/unspecified'}

Performance Metrics:
- Average Duration: ${metrics.avgDuration}ms
- Success Rate: ${(metrics.successRate * 100).toFixed(1)}%
- Resource Usage: ${metrics.resourceUsage}
- Command Complexity: ${metrics.commandComplexity.level} (score: ${
   metrics.commandComplexity.score
  })

Execution History: ${executions.length} executions
${codeBlock}

Analyze this job and provide:
1. Performance score (0-100)
2. Identified issues
3. Specific optimization suggestions
4. Estimated improvement potential

Consider:
- Code efficiency
- Resource utilization
- Error patterns
- Scheduling optimization
- Best practices

Respond in JSON format:
{
  "score": number,
  "issues": ["string"],
  "suggestions": ["string"],
  "estimatedImprovement": "string"
}`;

  try {
   // Stubbed result without external API
   return {
    score: Math.round((metrics.successRate || 0) * 100),
    issues: ['Heuristic analysis only'],
    suggestions: ['Review job code and resource usage'],
    estimatedImprovement: 'Unknown',
   };
  } catch (error) {
   logger.error('AI performance optimization failed:', error);
   return {
    score: Math.round(metrics.successRate * 100),
    issues: ['Unable to perform detailed analysis'],
    suggestions: [
     'Monitor job execution patterns',
     'Review command efficiency',
    ],
    estimatedImprovement: 'Analysis unavailable',
   };
  }
 }
}

export const aiService = new AIService();
