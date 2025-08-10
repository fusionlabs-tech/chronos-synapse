'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
 TrendingUp,
 TrendingDown,
 Minus,
 Clock,
 CheckCircle,
 XCircle,
 AlertTriangle,
 Activity,
 BarChart3,
 Target,
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { JobPerformanceMetrics, SystemPerformanceMetrics } from '@/types';
import { useRealtime } from '@/contexts/PubSubContext';

interface PerformanceDashboardProps {
 jobId?: string;
}

export default function PerformanceDashboard({
 jobId,
}: PerformanceDashboardProps) {
 const { pubSubConnected } = useRealtime();
 const [systemMetrics, setSystemMetrics] =
  useState<SystemPerformanceMetrics | null>(null);
 const [jobMetrics, setJobMetrics] = useState<JobPerformanceMetrics | null>(
  null
 );
 const [loading, setLoading] = useState(true);
 const [timeRange, setTimeRange] = useState(30);

 useEffect(() => {
  const fetchMetrics = async () => {
   try {
    setLoading(true);
    const [systemData, jobData] = await Promise.all([
     apiClient.getSystemPerformanceMetrics(timeRange),
     jobId ? apiClient.getJobPerformanceMetrics(jobId, timeRange) : null,
    ]);

    setSystemMetrics(systemData);
    if (jobData) setJobMetrics(jobData);
   } catch (error) {
    console.error('Failed to fetch performance metrics:', error);
   } finally {
    setLoading(false);
   }
  };

  // Only fetch if Pub/Sub is connected (initial load)
  if (pubSubConnected) {
   fetchMetrics();
  }
 }, [jobId, timeRange, pubSubConnected]);

 const getTrendIcon = (trend: 'improving' | 'declining' | 'stable') => {
  switch (trend) {
   case 'improving':
    return <TrendingUp className='w-4 h-4 text-green-500' />;
   case 'declining':
    return <TrendingDown className='w-4 h-4 text-red-500' />;
   default:
    return <Minus className='w-4 h-4 text-gray-500' />;
  }
 };

 const getStatusColor = (successRate: number) => {
  if (successRate >= 90) return 'text-green-600';
  if (successRate >= 70) return 'text-yellow-600';
  return 'text-red-600';
 };

 const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
 };

 if (loading) {
  return (
   <div className='space-y-6'>
    <div className='animate-pulse'>
     <div className='h-8 bg-gray-200 rounded w-1/4 mb-4'></div>
     <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {[...Array(4)].map((_, i) => (
       <div key={i} className='h-32 bg-gray-200 rounded'></div>
      ))}
     </div>
    </div>
   </div>
  );
 }

 return (
  <div className='space-y-6'>
   {/* Time Range Selector */}
   <div className='flex items-center justify-between'>
    <h2 className='text-2xl font-bold text-gray-900'>Performance Analytics</h2>
    <div className='flex items-center gap-2'>
     <span className='text-sm text-gray-600'>Time Range:</span>
     <select
      value={timeRange}
      onChange={(e) => setTimeRange(Number(e.target.value))}
      className='border border-gray-300 rounded-md px-3 py-1 text-sm'
     >
      <option value={7}>Last 7 days</option>
      <option value={30}>Last 30 days</option>
      <option value={90}>Last 90 days</option>
     </select>
    </div>
   </div>

   <Tabs defaultValue='system' className='space-y-4'>
    <TabsList>
     <TabsTrigger value='system'>System Overview</TabsTrigger>
     {jobId && <TabsTrigger value='job'>Job Performance</TabsTrigger>}
    </TabsList>

    <TabsContent value='system' className='space-y-6'>
     {systemMetrics && (
      <>
       {/* System Overview Cards */}
       <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
         <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total Jobs</CardTitle>
          <Activity className='h-4 w-4 text-muted-foreground' />
         </CardHeader>
         <CardContent>
          <div className='text-2xl font-bold'>{systemMetrics.totalJobs}</div>
          <p className='text-xs text-muted-foreground'>
           {systemMetrics.activeJobs} active
          </p>
         </CardContent>
        </Card>

        <Card>
         <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
          <Target className='h-4 w-4 text-muted-foreground' />
         </CardHeader>
         <CardContent>
          <div
           className={`text-2xl font-bold ${getStatusColor(
            systemMetrics.systemSuccessRate
           )}`}
          >
           {systemMetrics.systemSuccessRate.toFixed(1)}%
          </div>
          <Progress value={systemMetrics.systemSuccessRate} className='mt-2' />
         </CardContent>
        </Card>

        <Card>
         <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Avg Duration</CardTitle>
          <Clock className='h-4 w-4 text-muted-foreground' />
         </CardHeader>
         <CardContent>
          <div className='text-2xl font-bold'>
           {formatDuration(systemMetrics.averageJobDuration)}
          </div>
          <p className='text-xs text-muted-foreground'>
           {systemMetrics.totalExecutions} executions
          </p>
         </CardContent>
        </Card>

        <Card>
         <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Recent Failures</CardTitle>
          <AlertTriangle className='h-4 w-4 text-muted-foreground' />
         </CardHeader>
         <CardContent>
          <div className='text-2xl font-bold text-red-600'>
           {systemMetrics.recentFailures.length}
          </div>
          <p className='text-xs text-muted-foreground'>Last 10 failures</p>
         </CardContent>
        </Card>
       </div>

       {/* Top Performing Jobs */}
       <Card>
        <CardHeader>
         <CardTitle className='flex items-center gap-2'>
          <TrendingUp className='h-5 w-5 text-green-600' />
          Top Performing Jobs
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className='space-y-3'>
          {systemMetrics.topPerformingJobs.map((job) => (
           <div
            key={job.jobId}
            className='flex items-center justify-between p-3 border rounded-lg'
           >
            <div>
             <h4 className='font-medium'>{job.jobName}</h4>
             <p className='text-sm text-gray-600'>
              ID: {job.jobId.slice(0, 8)}...
             </p>
            </div>
            <div className='text-right'>
             <div
              className={`font-semibold ${getStatusColor(job.successRate)}`}
             >
              {job.successRate.toFixed(1)}%
             </div>
             <div className='text-sm text-gray-600'>
              {formatDuration(job.averageDuration)}
             </div>
            </div>
           </div>
          ))}
         </div>
        </CardContent>
       </Card>

       {/* Underperforming Jobs */}
       <Card>
        <CardHeader>
         <CardTitle className='flex items-center gap-2'>
          <TrendingDown className='h-5 w-5 text-red-600' />
          Underperforming Jobs
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className='space-y-3'>
          {systemMetrics.underperformingJobs.map((job) => (
           <div
            key={job.jobId}
            className='flex items-center justify-between p-3 border rounded-lg'
           >
            <div>
             <h4 className='font-medium'>{job.jobName}</h4>
             <p className='text-sm text-gray-600'>
              ID: {job.jobId.slice(0, 8)}...
             </p>
            </div>
            <div className='text-right'>
             <div
              className={`font-semibold ${getStatusColor(job.successRate)}`}
             >
              {job.successRate.toFixed(1)}%
             </div>
             <div className='text-sm text-red-600'>{job.errorCount} errors</div>
            </div>
           </div>
          ))}
         </div>
        </CardContent>
       </Card>

       {/* Recent Failures */}
       <Card>
        <CardHeader>
         <CardTitle className='flex items-center gap-2'>
          <XCircle className='h-5 w-5 text-red-600' />
          Recent Failures
         </CardTitle>
        </CardHeader>
        <CardContent>
         <div className='space-y-3'>
          {systemMetrics.recentFailures.slice(0, 5).map((failure, index) => (
           <div
            key={index}
            className='flex items-center justify-between p-3 border rounded-lg'
           >
            <div className='flex-1'>
             <h4 className='font-medium'>{failure.jobName}</h4>
             <p className='text-sm text-gray-600'>{failure.error}</p>
             <p className='text-xs text-gray-500'>
              {new Date(failure.timestamp).toLocaleString()}
             </p>
            </div>
            <div className='text-right'>
             <div className='text-sm text-gray-600'>
              {formatDuration(failure.duration)}
             </div>
            </div>
           </div>
          ))}
         </div>
        </CardContent>
       </Card>
      </>
     )}
    </TabsContent>

    {jobId && (
     <TabsContent value='job' className='space-y-6'>
      {jobMetrics && (
       <>
        {/* Job Performance Overview */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
         <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
           <CardTitle className='text-sm font-medium'>Success Rate</CardTitle>
           <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
           <div
            className={`text-2xl font-bold ${getStatusColor(
             jobMetrics.successRate
            )}`}
           >
            {jobMetrics.successRate.toFixed(1)}%
           </div>
           <Progress value={jobMetrics.successRate} className='mt-2' />
          </CardContent>
         </Card>

         <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
           <CardTitle className='text-sm font-medium'>
            Total Executions
           </CardTitle>
           <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
           <div className='text-2xl font-bold'>
            {jobMetrics.totalExecutions}
           </div>
           <p className='text-xs text-muted-foreground'>
            {jobMetrics.averageExecutionsPerDay.toFixed(1)} per day
           </p>
          </CardContent>
         </Card>

         <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
           <CardTitle className='text-sm font-medium'>Avg Duration</CardTitle>
           <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
           <div className='text-2xl font-bold'>
            {formatDuration(jobMetrics.averageDuration)}
           </div>
           <p className='text-xs text-muted-foreground'>
            Min: {formatDuration(jobMetrics.minDuration)} | Max:{' '}
            {formatDuration(jobMetrics.maxDuration)}
           </p>
          </CardContent>
         </Card>

         <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
           <CardTitle className='text-sm font-medium'>Trend</CardTitle>
           {getTrendIcon(jobMetrics.trend)}
          </CardHeader>
          <CardContent>
           <div className='text-2xl font-bold capitalize'>
            {jobMetrics.trend}
           </div>
           <p className='text-xs text-muted-foreground'>Performance trend</p>
          </CardContent>
         </Card>
        </div>

        {/* Execution Breakdown */}
        <Card>
         <CardHeader>
          <CardTitle>Execution Breakdown</CardTitle>
         </CardHeader>
         <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
           <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
             {jobMetrics.successfulExecutions}
            </div>
            <div className='text-sm text-gray-600'>Successful</div>
           </div>
           <div className='text-center'>
            <div className='text-2xl font-bold text-red-600'>
             {jobMetrics.failedExecutions}
            </div>
            <div className='text-sm text-gray-600'>Failed</div>
           </div>
           <div className='text-center'>
            <div className='text-2xl font-bold text-yellow-600'>
             {jobMetrics.timeoutExecutions}
            </div>
            <div className='text-sm text-gray-600'>Timeout</div>
           </div>
           <div className='text-center'>
            <div className='text-2xl font-bold text-gray-600'>
             {jobMetrics.cancelledExecutions}
            </div>
            <div className='text-sm text-gray-600'>Cancelled</div>
           </div>
          </div>
         </CardContent>
        </Card>

        {/* Performance Timeline */}
        <Card>
         <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
         </CardHeader>
         <CardContent>
          <div className='space-y-2'>
           <div className='flex justify-between text-sm'>
            <span>First Execution:</span>
            <span>
             {jobMetrics.firstExecutionAt
              ? new Date(jobMetrics.firstExecutionAt).toLocaleString()
              : 'N/A'}
            </span>
           </div>
           <div className='flex justify-between text-sm'>
            <span>Last Execution:</span>
            <span>
             {jobMetrics.lastExecutionAt
              ? new Date(jobMetrics.lastExecutionAt).toLocaleString()
              : 'N/A'}
            </span>
           </div>
           <div className='flex justify-between text-sm'>
            <span>Total Duration:</span>
            <span>{formatDuration(jobMetrics.totalDuration)}</span>
           </div>
          </div>
         </CardContent>
        </Card>
       </>
      )}
     </TabsContent>
    )}
   </Tabs>
  </div>
 );
}
