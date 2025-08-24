'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/toasts';
import { 
  Play, 
  Pause, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Brain,
  Zap,
  Activity,
  Settings
} from 'lucide-react';
import { AIAnalysisDisplay } from '@/components/ai/AIAnalysisDisplay';

interface JobDetail {
  id: string;
  name: string;
  description?: string;
  schedule: string;
  isActive?: boolean;
  nextRun?: string;
  lastRun?: string;
  status?: 'active' | 'paused' | 'error';
  totalExecutions?: number;
  successRate?: number;
  avgDuration?: number;
  createdAt: string;
  updatedAt: string;
}

interface JobExecutionLocal {
  id: string;
  status: 'success' | 'failed' | 'running' | 'timeout' | 'cancelled';
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  exitCode?: number;
  error?: string;
  output?: string;
}

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { showToast } = useToast();
  
  const [job, setJob] = useState<JobDetail | null>(null);
  const [executions, setExecutions] = useState<JobExecutionLocal[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load job data
  useEffect(() => {
    const loadJob = async () => {
      try {
        setLoading(true);
        const [jobRes, executionsRes, analysisRes] = await Promise.allSettled([
          apiClient.getJob(jobId),
          apiClient.getJobExecutions(jobId),
          apiClient.getAIAnalysis(jobId)
        ]);

        if (jobRes.status === 'fulfilled') {
          const jobData = jobRes.value.job || jobRes.value;
          setJob({
            ...jobData,
            isActive: (jobData as any).isActive ?? true,
            status: (jobData as any).status ?? 'active',
            totalExecutions: (jobData as any).totalExecutions ?? 0,
            successRate: (jobData as any).successRate ?? 0,
            avgDuration: (jobData as any).avgDuration ?? 0
          });
        }
        
        if (executionsRes.status === 'fulfilled') {
          setExecutions((executionsRes.value as JobExecutionLocal[]) || []);
        }
        
        if (analysisRes.status === 'fulfilled' && analysisRes.value) {
          setAiAnalysis(analysisRes.value);
        }
      } catch (error) {
        console.error('Failed to load job:', error);
        showToast('Failed to load job details', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      loadJob();
    }
  }, [jobId, showToast]);

  const handleRunAIAnalysis = async () => {
    try {
      setLoadingAI(true);
      const result = await apiClient.runAIAnalysis(jobId);
      setAiAnalysis(result);
      showToast('AI analysis completed', 'success');
    } catch (error) {
      console.error('AI analysis failed:', error);
      showToast('AI analysis failed', 'error');
    } finally {
      setLoadingAI(false);
    }
  };

  const handleToggleJob = async () => {
    if (!job) return;
    
    try {
      const action = job.isActive ? 'pause' : 'resume';
      await apiClient.updateJob(jobId, { isActive: !job.isActive } as any);
      setJob({ ...job, isActive: !job.isActive });
      showToast(`Job ${action}d successfully`, 'success');
    } catch (error) {
      console.error('Failed to toggle job:', error);
      showToast('Failed to update job', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.round(minutes / 60);
    return `${hours}h`;
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'Never';
    return new Date(iso).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner h-12 w-12"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h2>
        <p className="text-gray-600">The requested job could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
          {job.description && (
            <p className="text-gray-600 mt-1">{job.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(job.status || 'active')}>
            {job.status || 'active'}
          </Badge>
          <Button
            onClick={handleToggleJob}
            variant="outline"
            size="sm"
          >
            {job.isActive ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {(job.successRate || 0).toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDuration(job.avgDuration || 0)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Runs</p>
                <p className="text-2xl font-bold text-purple-600">
                  {job.totalExecutions || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Next Run</p>
                <p className="text-sm font-bold text-gray-900">
                  {job.nextRun ? formatDateTime(job.nextRun) : 'Not scheduled'}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="executions">Executions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Job Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Schedule</label>
                  <p className="text-lg font-medium text-gray-900">{job.schedule}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg font-medium text-gray-900">
                    {job.isActive ? 'Active' : 'Paused'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDateTime(job.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-lg font-medium text-gray-900">
                    {formatDateTime(job.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Executions Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {executions.slice(0, 5).map((execution) => (
                    <div key={execution.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {execution.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : execution.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {formatDateTime(execution.startedAt)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDuration(execution.duration)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          execution.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : execution.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {execution.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Analysis</h2>
              <p className="text-gray-600">
                Intelligent insights and recommendations for job optimization
              </p>
            </div>
            <Button
              onClick={handleRunAIAnalysis}
              disabled={loadingAI}
              className="btn-primary"
            >
              {loadingAI ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run Analysis
                </>
              )}
            </Button>
          </div>

          <AIAnalysisDisplay analysis={aiAnalysis} loading={loadingAI} />
        </TabsContent>

        <TabsContent value="executions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {executions.map((execution) => (
                  <div key={execution.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {execution.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : execution.status === 'failed' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{formatDateTime(execution.startedAt)}</p>
                          <p className="text-sm text-gray-500">
                            Duration: {formatDuration(execution.duration)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        className={
                          execution.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : execution.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {execution.status}
                      </Badge>
                    </div>
                    
                    {execution.error && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-800">{execution.error}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Job configuration settings will be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}