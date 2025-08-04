'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Job, JobExecution } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BackButton from '@/components/BackButton';
import {
 formatDateTime,
 formatDuration,
 getStatusColor,
 getStatusIcon,
} from '@/lib/utils';
import {
 Play,
 Pause,
 Edit,
 Clock,
 Calendar,
 Zap,
 Activity,
 Eye,
 CheckCircle,
 XCircle,
 AlertTriangle,
 Minus,
} from 'lucide-react';

export default function JobExecutionsPage() {
 const params = useParams();
 const router = useRouter();
 const { showToast } = useToast();
 const jobId = params.id as string;

 const [job, setJob] = useState<Job | null>(null);
 const [executions, setExecutions] = useState<JobExecution[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
  const fetchData = async () => {
   try {
    setLoading(true);

    // Fetch job details and executions
    const [jobData, executionsData] = await Promise.all([
     apiClient.getJob(jobId),
     apiClient.getJobExecutions(jobId, 50), // Get more executions
    ]);

    setJob(jobData);
    console.log('Job data:', jobData);
    console.log('Executions data:', executionsData);
    setExecutions(Array.isArray(executionsData) ? executionsData : []);
   } catch (err) {
    setError('Failed to load job executions');
    console.error('Failed to fetch job executions:', err);
    showToast('Failed to load job executions', 'error');
   } finally {
    setLoading(false);
   }
  };

  if (jobId) {
   fetchData();
  }
 }, [jobId, showToast]);

 if (loading) {
  return (
   <div className='flex items-center justify-center h-64'>
    <div className='loading-spinner h-12 w-12'></div>
   </div>
  );
 }

 if (error || !job) {
  return (
   <div className='max-w-4xl mx-auto'>
    <div className='text-center py-12'>
     <div className='page-header-icon'>
      <Activity className='h-10 w-10 text-white' />
     </div>
     <h2 className='page-header-title mb-4'>Job Not Found</h2>
     <p className='text-neutral-600 mb-8 text-lg'>
      {error || 'The requested job could not be found.'}
     </p>
     <button
      onClick={() => router.push('/jobs')}
      className='btn-primary px-8 py-3'
     >
      Back to Jobs
     </button>
    </div>
   </div>
  );
 }

 return (
  <div className='max-w-7xl mx-auto space-y-8'>
   {/* Page Header */}
   <div className='text-center space-y-4'>
    <div className='page-header-icon'>
     <Activity className='h-10 w-10 text-white' />
    </div>
    <div>
     <h1 className='page-header-title'>Job Executions</h1>
     <p className='text-neutral-600 mt-2 text-lg'>
      {job.name} - Execution history and monitoring
     </p>
    </div>
   </div>

   {/* Back Button */}
   <div className='flex justify-start'>
    <BackButton href='/jobs' label='Back to Jobs' />
   </div>

   {/* Job Info Card */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-blue'>
       <Zap className='h-5 w-5' />
      </div>
      Job Information
     </CardTitle>
    </CardHeader>
    <CardContent>
     <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <div className='w-2 h-2 rounded-full bg-accent-green-500'></div>
        Status
       </div>
       <span
        className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
         job.enabled ? 'badge-success' : 'badge-warning'
        }`}
       >
        {job.enabled ? 'Active' : 'Disabled'}
       </span>
      </div>

      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <Clock className='h-4 w-4' />
        Schedule
       </div>
       <p className='text-sm text-neutral-900 font-mono bg-neutral-50 px-3 py-1 rounded border'>
        {job.schedule}
       </p>
      </div>

      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <Calendar className='h-4 w-4' />
        Last Run
       </div>
       <p className='text-sm text-neutral-900'>
        {job.lastRun ? formatDateTime(job.lastRun) : 'Never'}
       </p>
      </div>

      <div className='space-y-2'>
       <div className='flex items-center gap-2 text-sm font-medium text-neutral-500'>
        <Clock className='h-4 w-4' />
        Timeout
       </div>
       <p className='text-sm text-neutral-900'>{job.timeout}ms</p>
      </div>
     </div>

     {job.description && (
      <div className='mt-6 pt-6 border-t border-neutral-200'>
       <div className='text-sm font-medium text-neutral-500 mb-2'>
        Description
       </div>
       <p className='text-sm text-neutral-700'>{job.description}</p>
      </div>
     )}
    </CardContent>
   </Card>

   {/* Action Buttons */}
   <Card className='card-primary'>
    <CardContent className='p-6'>
     <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
      <div className='flex items-center gap-4'>
       <Link href={`/jobs/${job.id}/edit`}>
        <Button variant='outline' className='btn-secondary'>
         <Edit className='h-4 w-4 mr-2' />
         Edit Job
        </Button>
       </Link>
      </div>

      <div className='flex items-center gap-3'>
       {job.enabled ? (
        <Button
         onClick={async () => {
          try {
           await apiClient.toggleJob(job.id, false);
           // Refresh job data after disabling
           const updatedJob = await apiClient.getJob(job.id);
           setJob(updatedJob);
           showToast('Job disabled successfully', 'success');
          } catch (error) {
           console.error('Failed to disable job:', error);
           showToast('Failed to disable job', 'error');
          }
         }}
         className='btn-danger'
        >
         <Pause className='h-4 w-4 mr-2' />
         Disable
        </Button>
       ) : (
        <>
         <Button
          onClick={async () => {
           try {
            await apiClient.toggleJob(job.id, true);
            // Refresh job data after enabling
            const updatedJob = await apiClient.getJob(job.id);
            setJob(updatedJob);
            showToast('Job enabled successfully', 'success');
           } catch (error) {
            console.error('Failed to enable job:', error);
            showToast('Failed to enable job', 'error');
           }
          }}
          className='btn-success'
         >
          <Play className='h-4 w-4 mr-2' />
          Enable
         </Button>
         <Button
          onClick={async () => {
           try {
            await apiClient.executeJob(job.id);
            // Refresh executions after manual execution
            const newExecutions = await apiClient.getJobExecutions(job.id, 50);
            setExecutions(newExecutions);
            showToast('Job execution started!', 'success');
            // Refresh job data to show updated timestamps
            const updatedJob = await apiClient.getJob(job.id);
            setJob(updatedJob);
           } catch (error) {
            console.error('Failed to execute job:', error);
            const errorMessage =
             error instanceof Error ? error.message : 'Failed to execute job';
            showToast(errorMessage, 'error');
           }
          }}
          className='btn-primary'
         >
          <Play className='h-4 w-4 mr-2' />
          Execute Now
         </Button>
        </>
       )}
      </div>
     </div>
    </CardContent>
   </Card>

   {/* Executions List */}
   <Card className='card-primary'>
    <CardHeader className='pb-6'>
     <CardTitle className='flex items-center gap-3 text-xl'>
      <div className='icon-container-primary'>
       <Activity className='h-5 w-5' />
      </div>
      Execution History ({executions.length})
     </CardTitle>
    </CardHeader>
    <CardContent>
     {executions.length === 0 ? (
      <div className='text-center py-12'>
       <div className='w-16 h-16 mx-auto bg-neutral-100 rounded-full flex items-center justify-center mb-4'>
        <Activity className='h-8 w-8 text-neutral-400' />
       </div>
       <h3 className='text-lg font-medium text-neutral-900 mb-2'>
        No Executions Found
       </h3>
       <p className='text-neutral-600 mb-6'>
        Execute the job manually or wait for the next scheduled run.
       </p>
       <Button
        onClick={async () => {
         try {
          await apiClient.executeJob(job.id);
          const newExecutions = await apiClient.getJobExecutions(job.id, 50);
          setExecutions(newExecutions);
          showToast('Job execution started!', 'success');
          const updatedJob = await apiClient.getJob(job.id);
          setJob(updatedJob);
         } catch (error) {
          console.error('Failed to execute job:', error);
          showToast('Failed to execute job', 'error');
         }
        }}
        className='btn-primary'
       >
        <Play className='h-4 w-4 mr-2' />
        Execute Now
       </Button>
      </div>
     ) : (
      <div className='space-y-4'>
       {executions.map((execution) => (
        <div
         key={execution.id}
         className='p-6 bg-neutral-50 rounded-lg border border-neutral-200 hover:shadow-md transition-all duration-200'
        >
         <div className='flex items-center justify-between'>
          <div className='flex-1'>
           <div className='flex items-center space-x-4'>
            <div
             className={`p-2 rounded-full ${getStatusColor(execution.status)}`}
            >
             {getStatusIcon(execution.status) === '✓' && (
              <CheckCircle className='h-5 w-5 text-green-600' />
             )}
             {getStatusIcon(execution.status) === '✗' && (
              <XCircle className='h-5 w-5 text-red-600' />
             )}
             {getStatusIcon(execution.status) === '⚠' && (
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
             )}
             {getStatusIcon(execution.status) === '○' && (
              <Minus className='h-5 w-5 text-neutral-600' />
             )}
            </div>
            <div>
             <h3 className='font-medium text-neutral-900'>
              Execution {execution.id.slice(0, 8)}
             </h3>
             <p className='text-sm text-neutral-500'>
              Started: {formatDateTime(execution.startedAt)}
             </p>
            </div>
           </div>

           {execution.finishedAt && (
            <div className='mt-3 flex items-center gap-4 text-sm text-neutral-600'>
             <span className='flex items-center gap-1'>
              <Clock className='h-3 w-3' />
              {formatDuration(execution.duration || 0)}
             </span>
             {execution.exitCode !== undefined && (
              <span className='flex items-center gap-1'>
               <span className='font-mono'>Exit: {execution.exitCode}</span>
              </span>
             )}
            </div>
           )}

           {execution.error && (
            <div className='mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200'>
             <div className='font-medium mb-1'>Error:</div>
             {execution.error}
            </div>
           )}
          </div>

          <div className='flex items-center space-x-2'>
           <Link href={`/jobs/${job.id}/executions/${execution.id}`}>
            <Button variant='outline' size='sm' className='btn-secondary'>
             <Eye className='h-4 w-4 mr-2' />
             View Details
            </Button>
           </Link>
          </div>
         </div>
        </div>
       ))}
      </div>
     )}
    </CardContent>
   </Card>
  </div>
 );
}
