import { logger } from '../utils/logger';
import { redisService, JobData, JobExecution } from './RedisService';
import { aiKeyService } from './AIKeyService';

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
  // Try BYOK adapter
  try {
   const ownerId = String((job as any)?.userId || '').replace(/-/g, '');
   const adapter = ownerId
    ? await aiKeyService.buildAdapterForUser(ownerId)
    : null;
   if (adapter) {
    const executions = await redisService.getJobExecutions(job.id, 50);
    const lang = (execution as any)?.codeLanguage || 'plaintext';
    const snippet = (execution as any)?.codeSnippet
     ? String((execution as any).codeSnippet).slice(0, 4000)
     : '';
    const codeBlock = snippet
     ? `\nCode Snippet (${lang}):\n\n\`\`\`${lang}\n${snippet}\`\`\`\n`
     : '';
    const prompt = `You are a DevOps anomaly detection expert analyzing job execution patterns to identify potential issues.

JOB DETAILS:
- Name: "${job.name}"
- Schedule: ${job.schedule || 'One-time execution'}
- Description: ${(job as any)?.description || 'No description provided'}

CURRENT EXECUTION ANALYSIS:
- Status: ${execution.status}
- Duration: ${execution.duration}ms (baseline avg: ${baseline.avgDuration}ms)
- Exit Code: ${execution.exitCode}
- Started: ${execution.startedAt}
- Error Message: ${execution.error || 'None'}
${codeBlock}

HISTORICAL CONTEXT (${executions.length} executions):
- Baseline Success Rate: ${(baseline.successRate * 100).toFixed(1)}%
- Performance Patterns: ${this.getPerformanceWindows(executions)}
- System Load Context: ${this.getLoadPatterns(executions)}
- Failure Correlations: ${this.getFailureCorrelations(executions)}

DETECTED ANOMALIES:
${anomalies.map((a) => `- ${a}`).join('\n') || '- No automatic anomalies detected'}

Provide a comprehensive anomaly analysis that:
1. Determines if this execution represents a true anomaly requiring attention
2. Assesses confidence level based on historical patterns and deviation magnitude
3. Identifies root cause categories (performance, infrastructure, code, timing)
4. Prioritizes severity based on business impact and frequency
5. Suggests specific, actionable remediation steps

Return JSON: {
  "isAnomaly": boolean,
  "confidence": number_0_to_1,
  "reason": "detailed_analysis_with_context",
  "severity": "low|medium|high",
  "suggestions": ["specific_actionable_recommendations"]
}`;
    const json = await adapter.chatJSON(prompt);
    if (json && typeof json === 'object') {
     return {
      isAnomaly: Boolean(json.isAnomaly),
      confidence: Number(json.confidence ?? 0.5),
      reason: String(
       json.reason || anomalies.join(', ') || 'No specific anomalies detected'
      ),
      severity: ['low', 'medium', 'high'].includes(String(json.severity))
       ? (String(json.severity) as any)
       : 'medium',
      suggestions: Array.isArray(json.suggestions)
       ? json.suggestions.map(String)
       : ['Monitor job execution patterns'],
     } as AnomalyDetectionResult;
    }
   }
  } catch {}
  const executions = await redisService.getJobExecutions(job.id, 50);
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
- Description: ${(job as any)?.description || 'No description provided'}

Current Execution Analysis:
- Status: ${execution.status}
- Duration: ${execution.duration}ms
- Exit Code: ${execution.exitCode}
- Started: ${execution.startedAt}
- Error: ${execution.error || 'None'}
${codeBlock}

Historical Context:
- Baseline Average Duration: ${baseline.avgDuration}ms
- Historical Success Rate: ${(baseline.successRate * 100).toFixed(1)}%
- Performance Windows: ${this.getPerformanceWindows(executions)}
- Load Patterns: ${this.getLoadPatterns(executions)}
- Failure Correlations: ${this.getFailureCorrelations(executions)}

Detected Anomalies:
${anomalies.map((a) => `- ${a}`).join('\n') || '- No automatic anomalies detected'}

Analyze this execution considering:
1. Statistical deviation from baseline performance
2. Historical failure patterns and correlations
3. Timing and load context
4. Error categorization and impact assessment
5. Business continuity implications

Provide actionable insights for:
- Immediate response requirements
- Root cause investigation steps
- Prevention strategies
- Monitoring improvements

Respond in JSON format:
{
  "isAnomaly": boolean,
  "confidence": number,
  "reason": "detailed_explanation",
  "severity": "low|medium|high",
  "suggestions": ["actionable_recommendations"]
}`;

  try {
   // Enhanced heuristic analysis
   const severityLevel = anomalies.length > 2 ? 'high' : anomalies.length > 0 ? 'medium' : 'low';
   const confidenceScore = anomalies.length > 0 ? Math.min(0.8, 0.4 + (anomalies.length * 0.2)) : 0.3;
   
   return {
    isAnomaly: anomalies.length > 0,
    confidence: confidenceScore,
    reason: anomalies.length > 0 
     ? `Detected ${anomalies.length} anomalies: ${anomalies.join(', ')}`
     : 'Execution appears within normal parameters based on historical baseline',
    severity: severityLevel,
    suggestions: anomalies.length > 0 
     ? ['Review job logs for error details', 'Check system resource utilization', 'Analyze timing patterns', 'Consider infrastructure scaling']
     : ['Continue monitoring execution patterns', 'Maintain current operational procedures'],
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
  try {
   const ownerId = String((job as any)?.userId || '').replace(/-/g, '');
   const adapter = ownerId
    ? await aiKeyService.buildAdapterForUser(ownerId)
    : null;
   if (adapter) {
    const prompt = `You are a DevOps optimization expert analyzing job execution patterns to suggest optimal scheduling.

JOB DETAILS:
- Name: "${job.name}"
- Current Schedule: ${job.schedule || 'One-time execution'}
- Description: ${(job as any)?.description || 'No description provided'}

EXECUTION ANALYSIS (${executions.length} executions):
- Success Rate: ${((patterns.successTrend?.filter(Boolean).length || 0) / Math.max(1, patterns.successTrend?.length || 1) * 100).toFixed(1)}%
- Time Distribution: ${Object.entries(patterns.timeOfDay || {}).map(([hour, count]) => `${hour}h:${count}`).join(', ')}
- Day Distribution: ${Object.entries(patterns.dayOfWeek || {}).map(([day, count]) => `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][parseInt(day)]}:${count}`).join(', ')}

PERFORMANCE INSIGHTS:
- Peak Performance Windows: ${this.getPerformanceWindows(executions)}
- System Load Patterns: ${this.getLoadPatterns(executions)}
- Failure Correlation: ${this.getFailureCorrelations(executions)}

Provide an optimal cron schedule recommendation that:
1. Maximizes success probability based on historical patterns
2. Avoids high-load periods
3. Considers business hours and dependencies
4. Optimizes for system resource utilization

Return JSON: {
  "suggestedSchedule": "valid_cron_expression",
  "confidence": number_0_to_1,
  "reasoning": "detailed_explanation_of_recommendation",
  "expectedImprovement": "specific_benefits_description"
}`;
    const json = await adapter.chatJSON(prompt);
    if (
     json &&
     typeof json === 'object' &&
     typeof json.suggestedSchedule === 'string'
    ) {
     return {
      suggestedSchedule: String(
       json.suggestedSchedule || job.schedule || '0 * * * *'
      ),
      confidence: Number(json.confidence ?? 0.5),
      reasoning: String(json.reasoning || 'AI-assisted suggestion'),
      expectedImprovement: String(
       json.expectedImprovement || 'Potential improvements'
      ),
     };
    }
   }
  } catch {}
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
  try {
   const ownerId = String((job as any)?.userId || '').replace(/-/g, '');
   const adapter = ownerId
    ? await aiKeyService.buildAdapterForUser(ownerId)
    : null;
   if (adapter) {
    const executions = await redisService.getJobExecutions(job.id, 50);
    const lang = (execution as any)?.codeLanguage || 'plaintext';
    const snippet = (execution as any)?.codeSnippet
     ? String((execution as any).codeSnippet).slice(0, 4000)
     : '';
    const codeBlock = snippet
     ? `\nCode Snippet (${lang}):\n\n\`\`\`${lang}\n${snippet}\`\`\`\n`
     : '';
    const prompt = `You are a DevOps reliability expert determining intelligent retry strategies for failed job executions.

JOB DETAILS:
- Name: "${job.name}"
- Schedule: ${job.schedule || 'One-time execution'}
- Max Retries Config: ${(job as any)?.retries ?? 'System default (3)'}
- Description: ${(job as any)?.description || 'No description provided'}

CURRENT FAILURE ANALYSIS:
- Attempt Number: ${attempt}
- Execution Status: ${execution.status}
- Duration Before Failure: ${execution.duration}ms
- Exit Code: ${execution.exitCode}
- Error Message: ${execution.error || 'No error message'}
- Error Stack: ${(execution as any)?.errorStack || 'Not available'}
- Started At: ${execution.startedAt}
${codeBlock}

FAILURE PATTERN ANALYSIS (${executions.length} recent executions):
- Historical Failure Rate: ${(failurePatterns.failureRate * 100).toFixed(1)}%
- Total Recent Failures: ${failurePatterns.totalFailures}
- Error Categories: ${Object.entries(failurePatterns.commonErrorPatterns).map(([type, count]) => `${type}(${count})`).join(', ')}
- Retry Success Likelihood: ${(failurePatterns.retrySuccessRate * 100).toFixed(1)}%
- Failure Time Correlations: ${this.analyzeTimeCorrelations(executions.filter(e => e.status === 'failed'))}

SYSTEM CONTEXT:
- Performance Windows: ${this.getPerformanceWindows(executions)}
- Load Patterns: ${this.getLoadPatterns(executions)}
- Infrastructure Insights: ${this.getFailureCorrelations(executions)}

Determine optimal retry strategy considering:
1. Error type classification (transient vs persistent)
2. Historical success probability for similar failures
3. System load and resource availability patterns
4. Cost vs benefit of retry attempts
5. Business impact of delayed execution
6. Risk of cascading failures

Recommend strategy that optimizes for:
- Maximum success probability
- Minimal resource waste
- Appropriate backoff timing
- Graceful degradation

Return JSON: {
  "shouldRetry": boolean,
  "retryDelay": number_milliseconds,
  "maxRetries": number,
  "reasoning": "detailed_strategy_explanation",
  "strategy": "strategy_name_and_parameters"
}`;
    const json = await adapter.chatJSON(prompt);
    if (json && typeof json === 'object') {
     return {
      shouldRetry: Boolean(
       json.shouldRetry ?? attempt < ((job as any)?.retries ?? 3)
      ),
      retryDelay: Number(json.retryDelay ?? Math.pow(2, attempt) * 1000),
      maxRetries: Number(json.maxRetries ?? (job as any)?.retries ?? 3),
      reasoning: String(json.reasoning || 'AI-assisted suggestion'),
      strategy: String(json.strategy || 'exponential_backoff'),
     };
    }
   }
  } catch {}
  const executions = await redisService.getJobExecutions(job.id, 50);
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
- Schedule: ${job.schedule || 'One-time/unspecified'}
- Configured Max Retries: ${(job as any)?.retries ?? 'System default'}
- Description: ${(job as any)?.description || 'No description provided'}

Current Failure Context:
- Attempt Number: ${attempt}
- Execution Status: ${execution.status}
- Failure Duration: ${execution.duration}ms
- Exit Code: ${execution.exitCode}
- Error Message: ${execution.error || 'No error message'}
- Error Stack: ${(execution as any)?.errorStack || 'Not available'}
- Timestamp: ${execution.startedAt}
${codeBlock}

Failure Pattern Intelligence:
- Historical Failure Rate: ${(failurePatterns.failureRate * 100).toFixed(1)}%
- Recent Failure Count: ${failurePatterns.totalFailures}
- Error Type Distribution: ${Object.entries(failurePatterns.commonErrorPatterns).map(([type, count]) => `${type}(${count})`).join(', ')}
- Retry Success Probability: ${(failurePatterns.retrySuccessRate * 100).toFixed(1)}%
- Time-based Failure Patterns: ${this.analyzeTimeCorrelations(executions.filter(e => e.status === 'failed'))}

System Performance Context:
- Peak Performance Windows: ${this.getPerformanceWindows(executions)}
- Load Distribution: ${this.getLoadPatterns(executions)}
- Failure Correlations: ${this.getFailureCorrelations(executions)}

Analyze and determine retry strategy based on:
1. Error classification (transient network issues, resource constraints, code bugs, timeouts)
2. Statistical likelihood of retry success based on historical patterns
3. System load and optimal retry timing
4. Resource cost vs potential success benefit
5. Business continuity requirements
6. Risk mitigation for cascading failures

Consider retry strategies:
- Exponential backoff for transient issues
- Fixed delay for resource contention
- Linear backoff for gradual recovery
- No retry for persistent code/configuration issues

Respond in JSON format:
{
  "shouldRetry": boolean,
  "retryDelay": number_in_milliseconds,
  "maxRetries": number,
  "reasoning": "comprehensive_analysis_and_recommendation",
  "strategy": "strategy_type_with_parameters"
}`;

  try {
   // Enhanced heuristic retry logic
   const maxRetries = (job as any)?.retries ?? 3;
   const errorType = this.categorizeError(execution.error || '');
   
   // Intelligent retry decision based on error type and patterns
   let shouldRetry = attempt < maxRetries;
   let retryDelay = Math.pow(2, attempt) * 1000; // Default exponential backoff
   let strategy = 'exponential_backoff';
   let reasoning = `Default exponential backoff strategy (attempt ${attempt}/${maxRetries})`;
   
   // Adjust based on error patterns
   if (errorType === 'timeout' && failurePatterns.failureRate < 0.5) {
    retryDelay = Math.min(30000, retryDelay * 1.5); // Longer delay for timeouts
    strategy = 'extended_backoff';
    reasoning = `Extended backoff for timeout errors with ${(failurePatterns.failureRate * 100).toFixed(1)}% failure rate`;
   } else if (errorType === 'connection' && attempt < 2) {
    retryDelay = 5000; // Quick retry for connection issues
    strategy = 'quick_retry';
    reasoning = `Quick retry for connection errors, low attempt count`;
   } else if (failurePatterns.failureRate > 0.8) {
    shouldRetry = false; // Don't retry if failure rate is very high
    reasoning = `Skipping retry due to high failure rate (${(failurePatterns.failureRate * 100).toFixed(1)}%)`;
   }
   
   return {
    shouldRetry,
    retryDelay,
    maxRetries,
    reasoning,
    strategy,
   };
  } catch (error) {
   logger.error('AI retry strategy failed:', error);
   return {
    shouldRetry: attempt < ((job as any)?.retries ?? 3),
    retryDelay: Math.pow(2, attempt) * 1000,
    maxRetries: (job as any)?.retries ?? 3,
    reasoning: 'Fallback to exponential backoff strategy due to analysis error',
    strategy: 'exponential_backoff',
   };
  }
 }

 private async optimizePerformanceWithAI(
  job: JobData,
  metrics: any,
  executions: JobExecution[]
 ): Promise<PerformanceOptimizationResult> {
  try {
   const ownerId = String((job as any)?.userId || '').replace(/-/g, '');
   const adapter = ownerId
    ? await aiKeyService.buildAdapterForUser(ownerId)
    : null;
   if (adapter) {
    const latestWithCode = executions.find((e) => (e as any)?.codeSnippet);
    const lang = (latestWithCode as any)?.codeLanguage || 'plaintext';
    const snippet = (latestWithCode as any)?.codeSnippet
     ? String((latestWithCode as any).codeSnippet).slice(0, 4000)
     : '';
    const codeBlock = snippet
     ? `\nCode Analysis (${lang}):\n\n\`\`\`${lang}\n${snippet}\`\`\`\n`
     : '';
    const prompt = `You are a DevOps performance optimization expert analyzing job execution efficiency and reliability.

JOB PROFILE:
- Name: "${job.name}"
- Schedule: ${job.schedule || 'One-time execution'}
- Description: ${(job as any)?.description || 'No description provided'}
- Timeout Setting: ${(job as any)?.timeout || 'Not configured'}ms

PERFORMANCE METRICS ANALYSIS:
- Average Execution Duration: ${metrics.avgDuration}ms
- Success Rate: ${(metrics.successRate * 100).toFixed(1)}%
- Resource Usage Classification: ${metrics.resourceUsage}
- Code Complexity Assessment: ${metrics.commandComplexity.level} (score: ${metrics.commandComplexity.score})
- Complexity Details: ${JSON.stringify(metrics.commandComplexity.details)}

EXECUTION INTELLIGENCE (${executions.length} executions):
- Performance Windows: ${this.getPerformanceWindows(executions)}
- Load Distribution Patterns: ${this.getLoadPatterns(executions)}
- Failure Analysis: ${this.getFailureCorrelations(executions)}
- Duration Trend: ${executions.slice(0, 10).map(e => `${e.duration}ms`).join(', ')}
- Status Distribution: ${executions.slice(0, 20).reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {} as Record<string, number>)}
${codeBlock}

Provide comprehensive performance optimization analysis focusing on:

1. PERFORMANCE SCORING (0-100):
   - Execution efficiency relative to complexity
   - Reliability and consistency metrics
   - Resource utilization effectiveness
   - Scheduling optimization potential

2. ISSUE IDENTIFICATION:
   - Performance bottlenecks and inefficiencies
   - Resource waste or over-utilization
   - Reliability concerns and failure patterns
   - Scalability limitations
   - Code quality and best practice violations

3. OPTIMIZATION RECOMMENDATIONS:
   - Specific code improvements and refactoring
   - Resource allocation adjustments
   - Infrastructure and environment optimizations
   - Scheduling and timing improvements
   - Monitoring and alerting enhancements

4. IMPACT ESTIMATION:
   - Quantified performance improvements
   - Cost savings and efficiency gains
   - Reliability and uptime improvements
   - Development and maintenance benefits

Return JSON: {
  "score": number_0_to_100,
  "issues": ["specific_performance_issues_identified"],
  "suggestions": ["actionable_optimization_recommendations"],
  "estimatedImprovement": "quantified_benefits_and_expected_outcomes"
}`;
    const json = await adapter.chatJSON(prompt);
    if (json && typeof json === 'object') {
     return {
      score: Number(json.score ?? Math.round((metrics.successRate || 0) * 100)),
      issues: Array.isArray(json.issues)
       ? json.issues.map(String)
       : ['AI analysis completed'],
      suggestions: Array.isArray(json.suggestions)
       ? json.suggestions.map(String)
       : ['Review job code and resource usage'],
      estimatedImprovement: String(json.estimatedImprovement || 'Analysis complete'),
     };
    }
   }
  } catch {}
  const latestWithCode = executions.find((e) => (e as any)?.codeSnippet);
  const lang = (latestWithCode as any)?.codeLanguage || 'plaintext';
  const snippet = (latestWithCode as any)?.codeSnippet
   ? String((latestWithCode as any).codeSnippet).slice(0, 4000)
   : '';
  const codeBlock = snippet
   ? `\nCode Analysis (${lang}):\n\n\`\`\`${lang}\n${snippet}\`\`\`\n`
   : '';
  // Fallback heuristic performance analysis without external AI
  logger.debug('Using heuristic performance analysis');

  try {
   // Enhanced heuristic performance analysis
   const baseScore = Math.round((metrics.successRate || 0) * 100);
   let performanceScore = baseScore;
   
   // Adjust score based on complexity and duration
   if (metrics.commandComplexity?.level === 'simple' && metrics.avgDuration < 5000) {
    performanceScore = Math.min(100, baseScore + 10);
   } else if (metrics.commandComplexity?.level === 'complex' && metrics.avgDuration > 30000) {
    performanceScore = Math.max(0, baseScore - 15);
   }
   
   // Identify issues based on metrics
   const issues = [];
   const suggestions = [];
   
   if (metrics.successRate < 0.9) {
    issues.push(`Low success rate (${(metrics.successRate * 100).toFixed(1)}%)`);
    suggestions.push('Investigate failure patterns and improve error handling');
   }
   
   if (metrics.avgDuration > 60000) {
    issues.push(`Long average duration (${metrics.avgDuration}ms)`);
    suggestions.push('Optimize code performance and consider breaking into smaller tasks');
   }
   
   if (metrics.commandComplexity?.level === 'complex') {
    issues.push('High code complexity detected');
    suggestions.push('Refactor complex logic and improve code modularity');
   }
   
   if (metrics.resourceUsage === 'high') {
    issues.push('High resource usage classification');
    suggestions.push('Review resource requirements and optimize for efficiency');
   }
   
   // Default suggestions if none identified
   if (suggestions.length === 0) {
    suggestions.push('Monitor execution patterns for optimization opportunities');
    suggestions.push('Consider implementing performance benchmarks');
   }
   
   return {
    score: performanceScore,
    issues: issues.length > 0 ? issues : ['No significant performance issues detected'],
    suggestions,
    estimatedImprovement: issues.length > 0 
     ? `Addressing identified issues could improve success rate by 5-15% and reduce execution time by 10-30%`
     : 'Job performance appears optimized for current requirements',
   };
  } catch (error) {
   logger.error('AI performance optimization failed:', error);
   return {
    score: Math.round((metrics.successRate || 0) * 100),
    issues: ['Unable to perform detailed analysis due to system error'],
    suggestions: [
     'Monitor job execution patterns',
     'Review command efficiency and resource usage',
     'Implement proper error handling and logging',
    ],
    estimatedImprovement: 'Analysis unavailable due to system limitations',
   };
  }
 }

 // Helper methods for enhanced AI analysis
 private getPerformanceWindows(executions: JobExecution[]): string {
  const hourlyPerformance: Record<number, { total: number; success: number }> = {};
  
  executions.forEach(execution => {
   const hour = new Date(execution.startedAt).getHours();
   if (!hourlyPerformance[hour]) {
    hourlyPerformance[hour] = { total: 0, success: 0 };
   }
   hourlyPerformance[hour].total++;
   if (execution.status === 'success') {
    hourlyPerformance[hour].success++;
   }
  });

  const bestWindows = Object.entries(hourlyPerformance)
   .map(([hour, data]) => ({
    hour: parseInt(hour),
    successRate: data.success / data.total,
    count: data.total
   }))
   .filter(window => window.count >= 2)
   .sort((a, b) => b.successRate - a.successRate)
   .slice(0, 3)
   .map(w => `${w.hour}:00 (${(w.successRate * 100).toFixed(0)}% success)`)
   .join(', ');

  return bestWindows || 'Insufficient data';
 }

 private getLoadPatterns(executions: JobExecution[]): string {
  const avgDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length;
  const peakDuration = Math.max(...executions.map(e => e.duration || 0));
  const concurrent = this.estimateConcurrentJobs(executions);
  
  return `Avg: ${avgDuration.toFixed(0)}ms, Peak: ${peakDuration}ms, Est. concurrent: ${concurrent}`;
 }

 private getFailureCorrelations(executions: JobExecution[]): string {
  const failures = executions.filter(e => e.status === 'failed');
  if (failures.length === 0) return 'No failures to analyze';
  
  const timeCorrelations = this.analyzeTimeCorrelations(failures);
  const errorCorrelations = this.analyzeErrorCorrelations(failures);
  
  return `Time patterns: ${timeCorrelations}, Error patterns: ${errorCorrelations}`;
 }

 private estimateConcurrentJobs(executions: JobExecution[]): number {
  // Simple estimation based on overlapping execution windows
  let maxConcurrent = 0;
  executions.forEach((exec, i) => {
   let concurrent = 1;
   const execStart = new Date(exec.startedAt).getTime();
   const execEnd = exec.finishedAt ? new Date(exec.finishedAt).getTime() : execStart + (exec.duration || 0);
   
   executions.forEach((other, j) => {
    if (i !== j) {
     const otherStart = new Date(other.startedAt).getTime();
     const otherEnd = other.finishedAt ? new Date(other.finishedAt).getTime() : otherStart + (other.duration || 0);
     
     if ((otherStart <= execEnd && otherEnd >= execStart)) {
      concurrent++;
     }
    }
   });
   
   maxConcurrent = Math.max(maxConcurrent, concurrent);
  });
  
  return maxConcurrent;
 }

 private analyzeTimeCorrelations(failures: JobExecution[]): string {
  const hourCounts: Record<number, number> = {};
  failures.forEach(f => {
   const hour = new Date(f.startedAt).getHours();
   hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  
  const peakHour = Object.entries(hourCounts)
   .sort(([,a], [,b]) => b - a)[0];
  
  return peakHour ? `Peak failures at ${peakHour[0]}:00 (${peakHour[1]} failures)` : 'No pattern';
 }

 private analyzeErrorCorrelations(failures: JobExecution[]): string {
  const errorTypes: Record<string, number> = {};
  failures.forEach(f => {
   if (f.error) {
    const type = this.categorizeError(f.error);
    errorTypes[type] = (errorTypes[type] || 0) + 1;
   }
  });
  
  const topError = Object.entries(errorTypes)
   .sort(([,a], [,b]) => b - a)[0];
   
  return topError ? `Most common: ${topError[0]} (${topError[1]} occurrences)` : 'No error patterns';
 }
}

export const aiService = new AIService();
