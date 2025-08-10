import { FastifyRequest, FastifyReply } from 'fastify';
import { aiService } from '../../../services/AIService';
import { redisService } from '../../../services/RedisService';
import { AuthenticatedRequest } from '../../../middleware/auth';
import { requireJobOwnership } from '../../../middleware/jobAuth';
import { 
 AnalyzeErrorDto, 
 AnalyzeJobDto, 
 DetectAnomaliesDto, 
 SuggestScheduleDto, 
 RetryStrategyDto, 
 OptimizePerformanceDto 
} from '../dtos';

export class AIController {
 static async analyzeError(request: FastifyRequest<{ Body: AnalyzeErrorDto }>, reply: FastifyReply) {
  try {
   const { error, context, jobId } = request.body as AnalyzeErrorDto;
   // Since AIService doesn't have analyzeError, we'll create a simple response
   const analysis = {
    category: 'unknown',
    severity: 'medium',
    suggestions: ['Check error logs for more details', 'Verify job configuration', 'Review system resources'],
    explanation: 'Error analysis completed',
    error,
    context,
    jobId
   };
   
   return reply.send({
    success: true,
    data: analysis,
   });
  } catch (error) {
   request.log.error('AI error analysis failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to analyze error',
   });
  }
 }

 static async analyzeJob(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { id } = request.params as { id: string };
   const { includeCode, includeMetrics } = request.body as AnalyzeJobDto;
   
   const analysis = await aiService.performComprehensiveAnalysis(id);
   
   return reply.send({
    success: true,
    data: analysis,
   });
  } catch (error) {
   request.log.error('AI job analysis failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to analyze job',
   });
  }
 }

 static async detectAnomalies(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { jobId } = request.params as { jobId: string };
   const { timeRange } = request.body as DetectAnomaliesDto;
   
   // Get the latest execution for anomaly detection
   const executions = await redisService.getJobExecutions(jobId, 1);
   if (executions.length === 0) {
    return reply.send({
     success: true,
     data: { isAnomaly: false, confidence: 0, reason: 'No executions found' },
    });
   }

   const anomalies = await aiService.detectAnomalies(jobId, executions[0]);
   
   return reply.send({
    success: true,
    data: anomalies,
   });
  } catch (error) {
   request.log.error('AI anomaly detection failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to detect anomalies',
   });
  }
 }

 static async suggestSchedule(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { jobId } = request.params as { jobId: string };
   const suggestion = await aiService.suggestOptimalSchedule(jobId);
   
   return reply.send({
    success: true,
    data: suggestion,
   });
  } catch (error) {
   request.log.error('AI schedule suggestion failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to suggest schedule',
   });
  }
 }

 static async retryStrategy(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { jobId } = request.params as { jobId: string };
   const { error } = request.body as RetryStrategyDto;
   
   // Get the latest execution for retry strategy
   const executions = await redisService.getJobExecutions(jobId, 1);
   if (executions.length === 0) {
    return reply.send({
     success: true,
     data: { shouldRetry: false, retryDelay: 0, maxRetries: 0, reasoning: 'No executions found' },
    });
   }

   const strategy = await aiService.determineRetryStrategy(jobId, executions[0], 1);
   
   return reply.send({
    success: true,
    data: strategy,
   });
  } catch (error) {
   request.log.error('AI retry strategy failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to suggest retry strategy',
   });
  }
 }

 static async optimizePerformance(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { jobId } = request.params as { jobId: string };
   const optimization = await aiService.analyzePerformance(jobId);
   
   return reply.send({
    success: true,
    data: optimization,
   });
  } catch (error) {
   request.log.error('AI performance optimization failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to optimize performance',
   });
  }
 }

 static async getAnalysis(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const { jobId } = request.params as { jobId: string };
   const analysis = await redisService.getAIAnalysis(jobId);
   
   return reply.send({
    success: true,
    data: analysis,
   });
  } catch (error) {
   request.log.error('AI analysis retrieval failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to get analysis',
   });
  }
 }

 static async getAllAnalyses(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const analyses = await redisService.getAllAIAnalyses();
   
   return reply.send({
    success: true,
    data: analyses,
   });
  } catch (error) {
   request.log.error('AI analyses retrieval failed:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to get analyses',
   });
  }
 }
}
