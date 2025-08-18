'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Target,
  RefreshCw,
  BarChart3,
  Lightbulb,
  AlertCircle,
  Activity
} from 'lucide-react';

interface AnomalyDetection {
  isAnomaly: boolean;
  confidence: number;
  reason: string;
  severity: 'low' | 'medium' | 'high';
  suggestions: string[];
}

interface PredictiveSchedule {
  suggestedSchedule: string;
  confidence: number;
  reasoning: string;
  expectedImprovement: string;
}

interface SmartRetry {
  shouldRetry: boolean;
  retryDelay: number;
  maxRetries: number;
  reasoning: string;
  strategy: string;
}

interface PerformanceOptimization {
  score: number;
  issues: string[];
  suggestions: string[];
  estimatedImprovement: string;
}

interface AIAnalysis {
  jobId: string;
  timestamp: string;
  anomalyDetection?: AnomalyDetection;
  predictiveSchedule?: PredictiveSchedule;
  smartRetry?: SmartRetry;
  performanceOptimization?: PerformanceOptimization;
}

interface AIAnalysisDisplayProps {
  analysis: AIAnalysis | null;
  loading: boolean;
}

export function AIAnalysisDisplay({ analysis, loading }: AIAnalysisDisplayProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <Card className="border-dashed border-2 border-gray-300">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Analysis Available</h3>
          <p className="text-gray-600 text-center max-w-md">
            Run an AI analysis to get intelligent insights about job performance, 
            scheduling optimization, and anomaly detection.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-purple-900">AI Analysis Report</CardTitle>
                <p className="text-purple-700 text-sm">
                  Generated on {formatDateTime(analysis.timestamp)}
                </p>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
              Job ID: {analysis.jobId.slice(-8)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Anomaly Detection */}
        {analysis.anomalyDetection && (
          <Card className="border-l-4 border-l-orange-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Anomaly Status</span>
                <Badge className={
                  analysis.anomalyDetection.isAnomaly 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-green-100 text-green-800'
                }>
                  {analysis.anomalyDetection.isAnomaly ? 'Anomaly Detected' : 'Normal'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence</span>
                  <span className={`font-bold ${getConfidenceColor(analysis.anomalyDetection.confidence)}`}>
                    {(analysis.anomalyDetection.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={analysis.anomalyDetection.confidence * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Severity</span>
                <Badge className={getSeverityColor(analysis.anomalyDetection.severity)}>
                  {analysis.anomalyDetection.severity.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Analysis</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {analysis.anomalyDetection.reason}
                </p>
              </div>

              {analysis.anomalyDetection.suggestions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Lightbulb className="w-4 h-4" />
                    Recommendations
                  </span>
                  <ul className="space-y-1">
                    {analysis.anomalyDetection.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-3 h-3 text-green-500 mt-1 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Performance Optimization */}
        {analysis.performanceOptimization && (
          <Card className="border-l-4 border-l-blue-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Performance Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getPerformanceScoreColor(analysis.performanceOptimization.score)}`}>
                  {analysis.performanceOptimization.score}
                </div>
                <div className="text-sm text-gray-600">Performance Score</div>
                <Progress 
                  value={analysis.performanceOptimization.score} 
                  className="h-3 mt-2"
                />
              </div>

              {analysis.performanceOptimization.issues.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    Issues Identified
                  </span>
                  <ul className="space-y-1">
                    {analysis.performanceOptimization.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 text-red-500 mt-1 flex-shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.performanceOptimization.suggestions.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Target className="w-4 h-4 text-blue-500" />
                    Optimization Suggestions
                  </span>
                  <ul className="space-y-1">
                    {analysis.performanceOptimization.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-blue-700 flex items-start gap-2">
                        <Zap className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Expected Improvement</span>
                <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-md">
                  {analysis.performanceOptimization.estimatedImprovement}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Predictive Scheduling */}
        {analysis.predictiveSchedule && (
          <Card className="border-l-4 border-l-green-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                Schedule Optimization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">Suggested Schedule</span>
                <div className="bg-green-50 p-3 rounded-md">
                  <code className="text-green-800 font-mono text-sm">
                    {analysis.predictiveSchedule.suggestedSchedule}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Confidence</span>
                  <span className={`font-bold ${getConfidenceColor(analysis.predictiveSchedule.confidence)}`}>
                    {(analysis.predictiveSchedule.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={analysis.predictiveSchedule.confidence * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Analysis</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {analysis.predictiveSchedule.reasoning}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium">Expected Benefits</span>
                <p className="text-sm text-green-700 bg-green-50 p-3 rounded-md">
                  {analysis.predictiveSchedule.expectedImprovement}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Smart Retry Strategy */}
        {analysis.smartRetry && (
          <Card className="border-l-4 border-l-purple-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-500" />
                Retry Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retry Recommendation</span>
                <Badge className={
                  analysis.smartRetry.shouldRetry 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }>
                  {analysis.smartRetry.shouldRetry ? 'Retry Recommended' : 'Skip Retry'}
                </Badge>
              </div>

              {analysis.smartRetry.shouldRetry && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Retry Delay</span>
                      <p className="text-lg font-bold text-purple-600">
                        {(analysis.smartRetry.retryDelay / 1000).toFixed(1)}s
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Max Retries</span>
                      <p className="text-lg font-bold text-purple-600">
                        {analysis.smartRetry.maxRetries}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-medium">Strategy</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {analysis.smartRetry.strategy.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <span className="text-sm font-medium">Analysis</span>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  {analysis.smartRetry.reasoning}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {analysis.anomalyDetection?.isAnomaly ? '1' : '0'}
              </div>
              <div className="text-sm text-gray-600">Anomalies Detected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {analysis.performanceOptimization?.score || 0}
              </div>
              <div className="text-sm text-gray-600">Performance Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {(((analysis.anomalyDetection?.confidence || 0) + 
                   (analysis.predictiveSchedule?.confidence || 0) + 
                   (analysis.performanceOptimization ? 0.8 : 0)) / 3 * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Overall Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}