'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { MetricsData, JobExecution } from '@/types';
import { useRealtime } from '@/contexts/PubSubContext';
import {
 TrendingUp,
 Clock,
 CheckCircle,
 AlertTriangle,
 Activity,
 Zap,
 Target,
} from 'lucide-react';
import {
 ComposedChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 Bar,
 PieChart,
 Pie,
 Cell,
} from 'recharts';

export default function AnalyticsPage() {
 const { dashboardStats, jobs, recentExecutions } = useRealtime();
 const [loading, setLoading] = useState(true);
 const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
 const [trendData, setTrendData] = useState<
  Array<{ date: string; executions: number; success: number; failed: number }>
 >([]);
 const [recentList, setRecentList] = useState<JobExecution[]>([]);

 useEffect(() => {
  fetchExecutionTrends();
 }, [timeRange]);

 // Real-time updates for analytics
 useEffect(() => {
  if (dashboardStats) {
   fetchExecutionTrends();
  }
 }, [dashboardStats]);

 // Ensure we have recent executions (fallback to backend if realtime empty)
 useEffect(() => {
  const loadRecent = async () => {
   const days = timeRange === '7d' ? 1 : timeRange === '30d' ? 7 : 30;
   try {
    if (recentExecutions.length > 0) {
     setRecentList(recentExecutions);
    } else {
     const data = await apiClient.getRecentExecutions(days, 10);
     setRecentList(data);
    }
   } catch {
    setRecentList([]);
   }
  };
  void loadRecent();
 }, [recentExecutions, timeRange]);

 // No separate system metrics fetch; we rely on user-scoped timeseries and dashboard stats

 const fetchExecutionTrends = async () => {
  try {
   const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
   const to = Date.now();
   const from = to - days * 24 * 60 * 60 * 1000;
   // Use backend user-scoped timeseries (already per-day counts)
   const userSeries = await apiClient.getUserTimeseries(days);
   const execs = userSeries.executions;
   const succ = userSeries.success;
   const fail = userSeries.failed;

   // Bucket raw points by day (YYYY-MM-DD)
   const dayBuckets: Record<
    string,
    { dateObj: Date; executions: number; success: number; failed: number }
   > = {};
   const addToDay = (
    arr: MetricsData[],
    key: 'executions' | 'success' | 'failed'
   ) => {
    arr.forEach((p) => {
     const d = new Date(p.timestamp);
     const dayKey = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
     if (!dayBuckets[dayKey])
      dayBuckets[dayKey] = {
       dateObj: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
       executions: 0,
       success: 0,
       failed: 0,
      };
     dayBuckets[dayKey][key] += Number(p.value || 0);
    });
   };
   addToDay(execs, 'executions');
   addToDay(succ, 'success');
   addToDay(fail, 'failed');

   let data: Array<{
    date: string;
    executions: number;
    success: number;
    failed: number;
   }> = [];
   if (days === 7) {
    // 7 distinct days, oldest -> newest
    const points: Array<{ key: string; dateObj: Date }> = [];
    for (let i = days - 1; i >= 0; i--) {
     const d = new Date(to - i * 24 * 60 * 60 * 1000);
     const key = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
     points.push({ key, dateObj: d });
    }
    data = points.map(({ key, dateObj }) => ({
     date: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
     executions: dayBuckets[key]?.executions || 0,
     success: dayBuckets[key]?.success || 0,
     failed: dayBuckets[key]?.failed || 0,
    }));
   } else if (days === 30) {
    // 4 weekly buckets over last 30 days, oldest -> newest
    const weekBuckets = [
     { label: 'Week 1', executions: 0, success: 0, failed: 0 },
     { label: 'Week 2', executions: 0, success: 0, failed: 0 },
     { label: 'Week 3', executions: 0, success: 0, failed: 0 },
     { label: 'Week 4', executions: 0, success: 0, failed: 0 },
    ];
    const dayMs = 24 * 60 * 60 * 1000;
    Object.values(dayBuckets).forEach(
     ({ dateObj, executions, success, failed }) => {
      const diff = Math.max(
       0,
       Math.min(29, Math.floor((dateObj.getTime() - from) / dayMs))
      );
      const idx = Math.min(3, Math.floor(diff / 7)); // 0..3
      weekBuckets[idx].executions += executions;
      weekBuckets[idx].success += success;
      weekBuckets[idx].failed += failed;
     }
    );
    data = weekBuckets.map((w) => ({
     date: w.label,
     executions: w.executions,
     success: w.success,
     failed: w.failed,
    }));
   } else {
    // Last 3 months (fill missing months with zeros), oldest -> newest
    const monthMap: Record<
     string,
     {
      label: string;
      order: number;
      executions: number;
      success: number;
      failed: number;
     }
    > = {};
    Object.values(dayBuckets).forEach(
     ({ dateObj, executions, success, failed }) => {
      const year = dateObj.getFullYear();
      const m = dateObj.getMonth();
      const key = `${year}-${(m + 1).toString().padStart(2, '0')}`;
      if (!monthMap[key])
       monthMap[key] = {
        label: new Date(year, m, 1).toLocaleString('en-US', { month: 'short' }),
        order: year * 12 + m,
        executions: 0,
        success: 0,
        failed: 0,
       };
      monthMap[key].executions += executions;
      monthMap[key].success += success;
      monthMap[key].failed += failed;
     }
    );
    const end = new Date(to);
    const monthsKeys: Array<{ key: string; label: string; order: number }> = [];
    for (let i = 2; i >= 0; i--) {
     const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
     const key = `${d.getFullYear()}-${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
     monthsKeys.push({
      key,
      label: d.toLocaleString('en-US', { month: 'short' }),
      order: d.getFullYear() * 12 + d.getMonth(),
     });
    }
    data = monthsKeys.map(({ key, label }) => ({
     date: label,
     executions: monthMap[key]?.executions || 0,
     success: monthMap[key]?.success || 0,
     failed: monthMap[key]?.failed || 0,
    }));
   }

   // Update state once calculated
   setTrendData(data);
  } catch (error) {
   console.error('Failed to fetch execution trends:', error);
  }
 };

 // Set loading based on data availability
 useEffect(() => {
  if (dashboardStats && jobs.length >= 0) {
   setLoading(false);
  }
 }, [dashboardStats, jobs]);

 // Set a timeout to stop loading even if data doesn't come
 useEffect(() => {
  const timeout = setTimeout(() => {
   setLoading(false);
  }, 5000); // 5 second timeout

  return () => clearTimeout(timeout);
 }, []);

 // Generate real success data based on actual stats
 const generateSuccessData = () => {
  const successRate = dashboardStats?.successRate || 0;
  const totalExecutions = dashboardStats?.recentExecutions || 0;
  const successfulExecutions = Math.round(
   (successRate / 100) * totalExecutions
  );
  const failedExecutions = totalExecutions - successfulExecutions;

  return [
   { name: 'Success', value: successfulExecutions, color: '#10b981' },
   { name: 'Failed', value: failedExecutions, color: '#ef4444' },
  ];
 };

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 const executionTrends = trendData;
 const successData = generateSuccessData();
 const normalizeId = (id: string) => id.replace(/^job:/, '').replace(/-/g, '');
 const lastRunByJob: Record<string, string> = recentList.reduce((acc, ex) => {
  const key = normalizeId(ex.jobId);
  const ts = new Date(ex.startedAt).getTime();
  if (!acc[key] || ts > new Date(acc[key]).getTime()) {
   acc[key] = ex.startedAt;
  }
  return acc;
 }, {} as Record<string, string>);

 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-2'>
    <h1 className='page-header-title'>Analytics</h1>
    <p className='text-neutral-600 text-lg'>
     System-wide metrics, trends, and performance from ingested executions
    </p>
   </div>

   {/* Time Range Selector */}
   <Card className='card-primary'>
    <CardContent className='p-6'>
     <div className='flex items-center justify-between'>
      <h2 className='text-lg font-semibold text-neutral-900'>Time Range</h2>
      <div className='flex gap-2'>
       <Button
        variant={timeRange === '7d' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setTimeRange('7d')}
        className={timeRange === '7d' ? 'btn-primary' : 'btn-secondary'}
       >
        7 Days
       </Button>
       <Button
        variant={timeRange === '30d' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setTimeRange('30d')}
        className={timeRange === '30d' ? 'btn-primary' : 'btn-secondary'}
       >
        30 Days
       </Button>
       <Button
        variant={timeRange === '90d' ? 'default' : 'outline'}
        size='sm'
        onClick={() => setTimeRange('90d')}
        className={timeRange === '90d' ? 'btn-primary' : 'btn-secondary'}
       >
        90 Days
       </Button>
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Key Metrics */}
   <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
    <Card className='card-gradient-blue'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-blue'>
        <Activity className='h-5 w-5' />
       </div>
       Total Jobs
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-blue mb-2'>
       {dashboardStats?.totalJobs || 0}
      </div>
      <div className='flex items-center gap-2 text-sm'>
       <span className='text-neutral-600'>
        {dashboardStats?.activeJobs || 0} active jobs
       </span>
      </div>
     </CardContent>
    </Card>

    <Card className='card-gradient-green'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-green'>
        <CheckCircle className='h-5 w-5' />
       </div>
       Success Rate
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-green mb-2'>
       {dashboardStats?.successRate
        ? `${dashboardStats.successRate.toFixed(1)}%`
        : '0%'}
      </div>
      <div className='flex items-center gap-2 text-sm'>
       <span className='text-neutral-600'>Based on recent executions</span>
      </div>
     </CardContent>
    </Card>

    <Card className='card-gradient-primary'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-primary'>
        <Clock className='h-5 w-5' />
       </div>
       Avg Duration
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-primary mb-2'>
       {dashboardStats?.avgDuration
        ? `${(dashboardStats.avgDuration / 1000).toFixed(1)}s`
        : '0s'}
      </div>
      <div className='flex items-center gap-2 text-sm'>
       <span className='text-neutral-600'>Average job runtime</span>
      </div>
     </CardContent>
    </Card>

    <Card className='card-gradient-orange'>
     <CardHeader className='pb-4'>
      <CardTitle className='flex items-center gap-3 text-lg'>
       <div className='icon-container-orange'>
        <AlertTriangle className='h-5 w-5' />
       </div>
       Recent Executions
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='text-3xl font-bold gradient-text-green mb-2'>
       {dashboardStats?.recentExecutions || 0}
      </div>
      <div className='flex items-center gap-2 text-sm'>
       <span className='text-neutral-600'>Last 24 hours</span>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Charts Section */}
   <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
    {/* Execution Trends */}
    <Card className='card-primary'>
     <CardHeader className='pb-6'>
      <CardTitle className='flex items-center gap-3 text-xl'>
       <div className='icon-container-blue'>
        <TrendingUp className='h-5 w-5' />
       </div>
       Execution Trends
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='h-80'>
       <ResponsiveContainer width='100%' height='100%'>
        <ComposedChart data={executionTrends}>
         <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
         <XAxis dataKey='date' stroke='#6b7280' fontSize={12} />
         <YAxis stroke='#6b7280' fontSize={12} />
         <Tooltip
          contentStyle={{
           backgroundColor: 'white',
           border: '1px solid #e5e7eb',
           borderRadius: '8px',
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
         />
         <Bar dataKey='failed' stackId='a' fill='#ef4444' barSize={18} />
         <Bar dataKey='success' stackId='a' fill='#10b981' barSize={18} />
         <Line
          type='stepAfter'
          dataKey='executions'
          stroke='#3b82f6'
          strokeWidth={2}
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
         />
        </ComposedChart>
       </ResponsiveContainer>
      </div>
     </CardContent>
    </Card>

    {/* Success Rate Distribution */}
    <Card className='card-primary'>
     <CardHeader className='pb-6'>
      <CardTitle className='flex items-center gap-3 text-xl'>
       <div className='icon-container-green'>
        <Target className='h-5 w-5' />
       </div>
       Success Rate Distribution
      </CardTitle>
     </CardHeader>
     <CardContent>
      <div className='h-80'>
       <ResponsiveContainer width='100%' height='100%'>
        <PieChart>
         <Pie
          data={successData}
          cx='50%'
          cy='50%'
          outerRadius={80}
          dataKey='value'
          label={({ name, percent }) =>
           `${name} ${(percent * 100).toFixed(0)}%`
          }
         >
          {successData.map((entry, index) => (
           <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
         </Pie>
         <Tooltip
          contentStyle={{
           backgroundColor: 'white',
           border: '1px solid #e5e7eb',
           borderRadius: '8px',
           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
         />
        </PieChart>
       </ResponsiveContainer>
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Performance Metrics */}
   <div className='grid grid-cols-1 gap-8'>
    {/* Active Jobs expanded full width */}
    <Card className='card-primary'>
     <CardHeader className='pb-6'>
      <div className='flex items-center justify-between'>
       <CardTitle className='flex items-center gap-3 text-xl'>
        <div className='icon-container-green'>
         <Zap className='h-5 w-5' />
        </div>
        Active Jobs
       </CardTitle>
       <Link href='/jobs?enabled=true'>
        <Button variant='outline' size='sm'>
         See more
        </Button>
       </Link>
      </div>
     </CardHeader>
     <CardContent>
      <div className='space-y-4'>
       {jobs
        .filter((job) => job.enabled)
        .slice(0, 5)
        .map((job, index) => (
         <div
          key={job.id}
          className='flex items-center justify-between p-4 bg-neutral-50 rounded-lg'
         >
          <div className='flex items-center gap-3'>
           <div className='w-8 h-8 bg-accent-green-100 rounded-full flex items-center justify-center'>
            <span className='text-sm font-bold text-accent-green-600'>
             {index + 1}
            </span>
           </div>
           <div>
            <h4 className='font-medium text-neutral-900'>{job.name}</h4>
            <p className='text-sm text-neutral-600'>{job.schedule}</p>
           </div>
          </div>
          <div className='text-right'>
           <div className='text-sm font-medium text-neutral-900'>
            {lastRunByJob[normalizeId(job.id)]
             ? new Date(lastRunByJob[normalizeId(job.id)]).toLocaleString()
             : job.lastRun
             ? new Date(job.lastRun).toLocaleString()
             : 'Never'}
           </div>
           <div className='text-sm text-neutral-600'>Last run</div>
          </div>
         </div>
        ))}
      </div>
     </CardContent>
    </Card>
   </div>

   {/* Recent Executions */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-orange'>
       <Activity className='h-5 w-5' />
      </div>
      Recent Executions
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className='space-y-4'>
      {recentList.slice(0, 5).map((ex) => {
       const normalize = (id: string) =>
        id.replace(/^job:/, '').replace(/-/g, '');
       const job = jobs.find((j) => normalize(j.id) === normalize(ex.jobId));
       const statusColor =
        ex.status === 'success'
         ? 'text-accent-green-600'
         : ex.status === 'failed'
         ? 'text-accent-red-600'
         : 'text-neutral-600';
       return (
        <div
         key={ex.id}
         className='flex items-center justify-between p-4 bg-neutral-50 rounded-lg'
        >
         <div className='flex items-center gap-3'>
          <div
           className={`w-2.5 h-2.5 rounded-full ${
            ex.status === 'success'
             ? 'bg-accent-green-500'
             : ex.status === 'failed'
             ? 'bg-accent-red-500'
             : 'bg-neutral-400'
           }`}
          ></div>
          <div>
           <p className='font-medium text-neutral-900'>
            {job?.name || ex.jobId}
           </p>
           <p className={`text-sm ${statusColor}`}>{ex.status}</p>
          </div>
         </div>
         <div className='text-sm text-neutral-500'>
          {new Date(ex.startedAt).toLocaleString()}
         </div>
        </div>
       );
      })}
      {recentList.length === 0 && (
       <div className='text-center text-neutral-500 py-6'>
        No recent executions
       </div>
      )}
     </div>
    </CardContent>
   </Card>
  </div>
 );
}
