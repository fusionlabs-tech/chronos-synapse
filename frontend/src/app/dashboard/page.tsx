'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRealtime } from '@/contexts/PubSubContext';
import {
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
 const {
  dashboardStats: stats,
  jobs,
  recentExecutions,
  pubSubConnected,
 } = useRealtime();
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (stats && jobs.length > 0) setLoading(false);
 }, [stats, jobs]);

 useEffect(() => {
  const timeout = setTimeout(() => setLoading(false), 5000);
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

 const formatDuration = (duration: number | undefined) =>
  duration ? `${(duration / 1000).toFixed(1)}s` : '0s';

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
   <div className='text-center space-y-2'>
    <h1 className='page-header-title'>Overview</h1>
    <p className='text-neutral-600 text-lg'>
     Real-time status and metrics from your applications
    </p>
   </div>

   {/* Stats Cards */}
   <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
    <Card className='card-gradient-primary'>
     <CardHeader className='pb-4'>
      <CardTitle className='text-lg'>Total Jobs</CardTitle>
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
      <CardTitle className='text-lg'>Recent Executions</CardTitle>
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
      <CardTitle className='text-lg'>Success Rate</CardTitle>
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
      <CardTitle className='text-lg'>Avg Duration</CardTitle>
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
      <CardTitle className='text-xl'>Quick Actions</CardTitle>
     </CardHeader>
     <CardContent>
      <Link href='/jobs' className='block'>
       <Button
        variant='outline'
        className='w-full py-3 mb-4 rounded-lg border-primary text-primary'
       >
        View Jobs
       </Button>
      </Link>
      <Link href='/analytics' className='block'>
       <Button
        variant='outline'
        className='w-full py-3 mb-4 rounded-lg border-accent-green-500 text-accent-green-600 hover:bg-green-50'
       >
        View Analytics
       </Button>
      </Link>
      <Link href='/ai-insights' className='block'>
       <Button
        variant='outline'
        className='w-full py-3 mb-1 rounded-lg border-orange-500 text-orange-600 hover:bg-orange-50'
       >
        AI Insights
       </Button>
      </Link>
     </CardContent>
    </Card>

    <Card className='card-primary'>
     <CardHeader className='pb-6'>
      <CardTitle className='text-xl'>System Status</CardTitle>
     </CardHeader>
     <CardContent className='space-y-4'>
      <div
       className={`flex items-center justify-between p-4 rounded-lg border ${
        pubSubConnected
         ? 'bg-green-50 border-green-200'
         : 'bg-red-50 border-red-200'
       }`}
      >
       <div className='flex items-center gap-3'>
        <div>
         <p
          className={`font-medium ${
           pubSubConnected ? 'text-green-900' : 'text-red-900'
          }`}
         >
          {pubSubConnected ? 'System Online' : 'System Disconnected'}
         </p>
         <p
          className={`text-sm ${
           pubSubConnected ? 'text-green-700' : 'text-red-700'
          }`}
         >
          {pubSubConnected
           ? 'All services operational'
           : 'Real-time connection lost'}
         </p>
        </div>
       </div>
       <div
        className={`w-3 h-3 rounded-full ${
         pubSubConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
       ></div>
      </div>

      <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200'>
       <div className='flex items-center gap-3'>
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

   {/* Recent Activity removed per design */}

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
       <h3 className='font-medium text-neutral-900 mb-2'>Install the SDK</h3>
       <p className='text-sm text-neutral-600'>
        Add @chronos-synapse/sdk to your application and register your jobs.
       </p>
      </div>
      <div className='text-center p-4'>
       <div className='w-12 h-12 mx-auto bg-secondary-100 rounded-full flex items-center justify-center mb-3'>
        <span className='text-xl font-bold text-secondary-600'>2</span>
       </div>
       <h3 className='font-medium text-neutral-900 mb-2'>Report Executions</h3>
       <p className='text-sm text-neutral-600'>
        Use enqueueExecution to report job runs and metrics.
       </p>
      </div>
      <div className='text-center p-4'>
       <div className='w-12 h-12 mx-auto bg-accent-green-100 rounded-full flex items-center justify-center mb-3'>
        <span className='text-xl font-bold text-accent-green-600'>3</span>
       </div>
       <h3 className='font-medium text-neutral-900 mb-2'>View Analytics</h3>
       <p className='text-sm text-neutral-600'>
        Monitor health and performance here in real-time.
       </p>
      </div>
     </div>
     <div className='mt-6 flex items-center justify-center'>
      <Link href='/api-keys'>
       <Button
        variant='outline'
        className='border-orange-500 text-orange-600 hover:bg-orange-50'
       >
        View Docs/Setup
       </Button>
      </Link>
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
