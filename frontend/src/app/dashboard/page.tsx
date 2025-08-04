'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats, Job, JobExecution } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { useRealtime } from '@/contexts/RealtimeContext';
import {
 Plus,
 Play,
 Clock,
 TrendingUp,
 Activity,
 Calendar,
 CheckCircle,
 AlertTriangle,
 Zap,
 BarChart3,
 Users,
 Settings,
 Eye,
 XCircle,
 Minus,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
 const { showToast } = useToast();
 const {
  dashboardStats: stats,
  jobs,
  recentExecutions,
  sseConnected,
  sseError,
  refreshDashboardStats,
  refreshJobs,
 } = useRealtime();

 const [loading, setLoading] = useState(true);

 // Initial load - show data when available, don't wait for WebSocket
 useEffect(() => {
  if (stats && jobs.length > 0) {
   setLoading(false);
  }
 }, [stats, jobs]);

 // Show loading state initially
 useEffect(() => {
  // Set a timeout to stop loading even if data doesn't come
  const timeout = setTimeout(() => {
   setLoading(false);
  }, 5000); // 5 second timeout

  return () => clearTimeout(timeout);
 }, []);

 const getStatusIcon = (status: string) => {
  switch (status) {
   case 'success':
    return <CheckCircle className='h-5 w-5 text-green-600' />;
   case 'failed':
    return <XCircle className='h-5 w-5 text-red-600' />;
   case 'timeout':
    return <AlertTriangle className='h-5 w-5 text-yellow-600' />;
   case 'cancelled':
    return <Minus className='h-5 w-5 text-gray-600' />;
   case 'running':
    return <Play className='h-5 w-5 text-blue-600' />;
   default:
    return <Minus className='h-5 w-5 text-gray-600' />;
  }
 };

 const getStatusColor = (status: string) => {
  switch (status) {
   case 'success':
    return 'bg-green-100';
   case 'failed':
    return 'bg-red-100';
   case 'timeout':
    return 'bg-yellow-100';
   case 'cancelled':
    return 'bg-gray-100';
   case 'running':
    return 'bg-blue-100';
   default:
    return 'bg-gray-100';
  }
 };

 const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInMinutes = Math.floor(
   (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24)
   return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
 };

 const formatDuration = (duration: number | undefined) => {
  if (!duration) return '0s';
  return `${(duration / 1000).toFixed(1)}s`;
 };

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-4'>
    <div className='page-header-icon'>
     <span className='text-white text-2xl font-bold'>⚡</span>
    </div>
    <div>
     <h1 className='page-header-title'>Dashboard</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      Monitor and manage your cron jobs with real-time insights
     </p>
    </div>
   </div>

   {/* Stats Cards */}
   <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
    <Card className='card-gradient-primary'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-primary'>
        <Settings className='h-5 w-5' />
       </div>
       Total Jobs
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-primary mb-2'>
       {stats?.totalJobs || 0}
      </div>
      <p className='text-sm text-neutral-600'>
       {stats?.activeJobs || 0} active jobs
      </p>
     </CardContent>
    </Card>

    <Card className='card-gradient-green'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-green'>
        <Play className='h-5 w-5' />
       </div>
       Recent Executions
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-green mb-2'>
       {stats?.recentExecutions || 0}
      </div>
      <p className='text-sm text-neutral-600'>Last 24 hours</p>
     </CardContent>
    </Card>

    <Card className='card-gradient-blue'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-blue'>
        <TrendingUp className='h-5 w-5' />
       </div>
       Success Rate
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-blue mb-2'>
       {stats?.successRate ? `${stats.successRate.toFixed(1)}%` : '0%'}
      </div>
      <p className='text-sm text-neutral-600'>Job execution success</p>
     </CardContent>
    </Card>

    <Card className='card-gradient-orange'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-orange'>
        <Clock className='h-5 w-5' />
       </div>
       Avg Duration
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-orange mb-2'>
       {stats?.avgDuration ? `${(stats.avgDuration / 1000).toFixed(1)}s` : '0s'}
      </div>
      <p className='text-sm text-neutral-600'>Average job runtime</p>
     </CardContent>
    </Card>
   </div>

   {/* Quick Actions */}
   <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
    <Card className='card-primary'>
     <CardHeader className='pb-6'>
      <CardTitle className='flex items-center gap-3 text-xl'>
       <div className='icon-container-primary'>
        <Plus className='h-5 w-5' />
       </div>
       Quick Actions
      </CardTitle>
     </CardHeader>
     <CardContent className='space-y-4'>
      <Link href='/jobs/new'>
       <Button className='btn-primary w-full py-3 rounded-lg flex items-center justify-center gap-2'>
        <Plus className='h-4 w-4' />
        Create New Job
       </Button>
      </Link>

      <Link href='/jobs'>
       <Button
        variant='outline'
        className='btn-secondary w-full py-3 rounded-lg flex items-center justify-center gap-2'
       >
        <Settings className='h-4 w-4' />
        Manage Jobs
       </Button>
      </Link>

      <Link href='/analytics'>
       <Button
        variant='outline'
        className='btn-secondary w-full py-3 rounded-lg flex items-center justify-center gap-2'
       >
        <BarChart3 className='h-4 w-4' />
        View Analytics
       </Button>
      </Link>

      <Link href='/ai-insights'>
       <Button
        variant='outline'
        className='btn-secondary w-full py-3 rounded-lg flex items-center justify-center gap-2'
       >
        <span className='text-lg'>🤖</span>
        AI Insights
       </Button>
      </Link>
     </CardContent>
    </Card>

    <Card className='card-primary'>
     <CardHeader className='pb-6'>
      <CardTitle className='flex items-center gap-3 text-xl'>
       <div className='icon-container-green'>
        <Activity className='h-5 w-5' />
       </div>
       System Status
      </CardTitle>
     </CardHeader>
     <CardContent className='space-y-4'>
      <div
       className={`flex items-center justify-between p-4 rounded-lg border ${
        sseConnected
         ? 'bg-green-50 border-green-200'
         : 'bg-red-50 border-red-200'
       }`}
      >
       <div className='flex items-center gap-3'>
        {sseConnected ? (
         <CheckCircle className='h-5 w-5 text-green-600' />
        ) : (
         <XCircle className='h-5 w-5 text-red-600' />
        )}
        <div>
         <p
          className={`font-medium ${
           sseConnected ? 'text-green-900' : 'text-red-900'
          }`}
         >
          {sseConnected ? 'System Online' : 'System Disconnected'}
         </p>
         <p
          className={`text-sm ${
           sseConnected ? 'text-green-700' : 'text-red-700'
          }`}
         >
          {sseConnected
           ? 'All services operational'
           : 'Real-time connection lost'}
         </p>
        </div>
       </div>
       <div
        className={`w-3 h-3 rounded-full ${
         sseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
       ></div>
      </div>

      <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200'>
       <div className='flex items-center gap-3'>
        <Calendar className='h-5 w-5 text-blue-600' />
        <div>
         <p className='font-medium text-blue-900'>Scheduled Jobs</p>
         <p className='text-sm text-blue-700'>
          {stats?.activeJobs || 0} active schedules
         </p>
        </div>
       </div>
       <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
      </div>

      <div className='flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200'>
       <div className='flex items-center gap-3'>
        <Zap className='h-5 w-5 text-purple-600' />
        <div>
         <p className='font-medium text-purple-900'>Performance</p>
         <p className='text-sm text-purple-700'>Excellent response times</p>
        </div>
       </div>
       <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Recent Activity */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-orange'>
       <Activity className='h-5 w-5' />
      </div>
      Recent Activity
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className='space-y-4'>
      {recentExecutions.length === 0 ? (
       <div className='text-center py-8'>
        <div className='w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4'>
         <Activity className='h-8 w-8 text-neutral-400' />
        </div>
        <h3 className='text-lg font-medium text-neutral-900 mb-2'>
         No Recent Activity
        </h3>
        <p className='text-neutral-600 mb-6'>
         Execute some jobs to see activity here
        </p>
        <Link href='/jobs/new'>
         <Button className='btn-primary'>
          <Plus className='h-4 w-4 mr-2' />
          Create Your First Job
         </Button>
        </Link>
       </div>
      ) : (
       recentExecutions.map((execution) => {
        const job = jobs.find((j) => j.id === execution.jobId);
        return (
         <div
          key={execution.id}
          className='flex items-center gap-4 p-4 bg-neutral-50 rounded-lg'
         >
          <div
           className={`w-10 h-10 ${getStatusColor(
            execution.status
           )} rounded-full flex items-center justify-center`}
          >
           {getStatusIcon(execution.status)}
          </div>
          <div className='flex-1'>
           <p className='font-medium text-neutral-900'>
            {job?.name || `Job ${execution.jobId.slice(0, 8)}`}{' '}
            {execution.status === 'success'
             ? 'Completed'
             : execution.status === 'failed'
             ? 'Failed'
             : execution.status === 'running'
             ? 'Started'
             : execution.status}
           </p>
           <p className='text-sm text-neutral-600'>
            {execution.duration
             ? `Duration: ${formatDuration(execution.duration)}`
             : 'Running...'}
            {execution.exitCode !== undefined &&
             ` • Exit Code: ${execution.exitCode}`}
           </p>
          </div>
          <span className='text-sm text-neutral-500'>
           {formatTimeAgo(execution.startedAt)}
          </span>
         </div>
        );
       })
      )}
     </div>
    </CardContent>
   </Card>

   {/* Getting Started */}
   <Card className='card-gradient-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-blue'>
       <Users className='h-5 w-5' />
      </div>
      Getting Started
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='text-center p-4'>
       <div className='w-12 h-12 mx-auto bg-primary-100 rounded-full flex items-center justify-center mb-3'>
        <span className='text-xl font-bold text-primary-600'>1</span>
       </div>
       <h3 className='font-medium text-neutral-900 mb-2'>
        Create Your First Job
       </h3>
       <p className='text-sm text-neutral-600'>
        Set up a cron job to automate your tasks
       </p>
      </div>

      <div className='text-center p-4'>
       <div className='w-12 h-12 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-3'>
        <span className='text-xl font-bold text-secondary-600'>2</span>
       </div>
       <h3 className='font-medium text-neutral-900 mb-2'>
        Monitor Performance
       </h3>
       <p className='text-sm text-neutral-600'>
        Track execution times and success rates
       </p>
      </div>

      <div className='text-center p-4'>
       <div className='w-12 h-12 mx-auto bg-accent-green-100 rounded-full flex items-center justify-center mb-3'>
        <span className='text-xl font-bold text-accent-green-600'>3</span>
       </div>
       <h3 className='font-medium text-neutral-900 mb-2'>Get AI Insights</h3>
       <p className='text-sm text-neutral-600'>
        Optimize your jobs with intelligent analysis
       </p>
      </div>
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
